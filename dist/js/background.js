/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/angular-expressions/lib/main.js":
/*!******************************************************!*\
  !*** ./node_modules/angular-expressions/lib/main.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var parse = __webpack_require__(/*! ./parse.js */ "./node_modules/angular-expressions/lib/parse.js");

var filters = {};
var Lexer = parse.Lexer;
var Parser = parse.Parser;

function addOptionDefaults(options) {
	options = options || {};
	if (options.filters) {
		options.cache = options.cache || {};
	}
	options.cache = options.cache || compile.cache;
	options.filters = options.filters || filters;
	return options;
}

function getParserOptions(options) {
	return {
		handleThis: options.handleThis != null ? options.handleThis : true,
		csp: options.csp != null ? options.csp : false, // noUnsafeEval,
		literals:
			options.literals != null
				? options.literals
				: {
						// defined at: function $ParseProvider() {
						true: true,
						false: false,
						null: null,
						/*eslint no-undefined: 0*/
						undefined: undefined,
						/* eslint: no-undefined: 1  */
					},
	};
}

/**
 * Compiles src and returns a function that executes src on a target object.
 * To speed up further calls the compiled function is cached under compile.cache[src] if options.filters is not present.
 *
 * @param {string} src
 * @param {object | undefined} options
 * @returns {function}
 */
function compile(src, options) {
	if (typeof src !== "string") {
		throw new TypeError(
			"src must be a string, instead saw '" + typeof src + "'"
		);
	}
	options = addOptionDefaults(options);
	var lexerOptions = options;
	var parserOptions = getParserOptions(options);

	var lexer = new Lexer(lexerOptions);
	var parser = new Parser(
		lexer,
		function getFilter(name) {
			return options.filters[name];
		},
		parserOptions
	);

	if (!options.cache) {
		return parser.parse(src);
	}
	delete options.src;
	var cacheKey = JSON.stringify(Object.assign({ src: src }, options));

	var cached = options.cache[cacheKey];
	if (!cached) {
		cached = options.cache[cacheKey] = parser.parse(src);
	}
	return cached;
}

/**
 * A cache containing all compiled functions. The src is used as key.
 * Set this on false to disable the cache.
 *
 * @type {object}
 */
compile.cache = Object.create(null);

exports.Lexer = Lexer;
exports.Parser = Parser;
exports.compile = compile;
exports.filters = filters;


/***/ }),

/***/ "./node_modules/angular-expressions/lib/parse.js":
/*!*******************************************************!*\
  !*** ./node_modules/angular-expressions/lib/parse.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {



/* eslint complexity: 0*/
/* eslint eqeqeq: 0*/
/* eslint func-style: 0*/
/* eslint no-warning-comments: 0*/

var window = { document: {} };

var hasOwnProperty = Object.prototype.hasOwnProperty;

var lowercase = function (string) {
	return isString(string) ? string.toLowerCase() : string;
};

/**
 * @ngdoc function
 * @name angular.isArray
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is an `Array`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is an `Array`.
 */
var isArray = Array.isArray;

var manualLowercase = function (s) {
	return isString(s)
		? s.replace(/[A-Z]/g, function (ch) {
				return String.fromCharCode(ch.charCodeAt(0) | 32);
			})
		: s;
};

// String#toLowerCase and String#toUpperCase don't produce correct results in browsers with Turkish
// locale, for this reason we need to detect this case and redefine lowercase/uppercase methods
// with correct but slower alternatives. See https://github.com/angular/angular.js/issues/11387
if ("I".toLowerCase() !== "i") {
	lowercase = manualLowercase;
}

// Run a function and disallow temporarly the use of the Function constructor
// This makes arbitrary code generation attacks way more complicated.
function runWithFunctionConstructorProtection(fn) {
	var originalFunctionConstructor = Function.prototype.constructor;
	delete Function.prototype.constructor;
	var result = fn();
	// eslint-disable-next-line no-extend-native
	Function.prototype.constructor = originalFunctionConstructor;
	return result;
}

var jqLite, // delay binding since jQuery could be loaded after us.
	toString = Object.prototype.toString,
	getPrototypeOf = Object.getPrototypeOf,
	ngMinErr = minErr("ng");

/**
 * @private
 * @param {*} obj
 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
 *                   String ...)
 */
function isArrayLike(obj) {
	// `null`, `undefined` and `window` are not array-like
	if (obj == null || isWindow(obj)) {
		return false;
	}

	// arrays, strings and jQuery/jqLite objects are array like
	// * jqLite is either the jQuery or jqLite constructor function
	// * we have to check the existence of jqLite first as this method is called
	//   via the forEach method when constructing the jqLite object in the first place
	if (isArray(obj) || isString(obj) || (jqLite && obj instanceof jqLite)) {
		return true;
	}

	// Support: iOS 8.2 (not reproducible in simulator)
	// "length" in obj used to prevent JIT error (gh-11508)
	var length = "length" in Object(obj) && obj.length;

	// NodeList objects (with `item` method) and
	// other objects with suitable length characteristics are array-like
	return (
		isNumber(length) &&
		((length >= 0 && (length - 1 in obj || obj instanceof Array)) ||
			typeof obj.item === "function")
	);
}

/**
 * @ngdoc function
 * @name angular.forEach
 * @module ng
 * @kind function
 *
 * @description
 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
 * object or an array. The `iterator` function is invoked with `iterator(value, key, obj)`, where `value`
 * is the value of an object property or an array element, `key` is the object property key or
 * array element index and obj is the `obj` itself. Specifying a `context` for the function is optional.
 *
 * It is worth noting that `.forEach` does not iterate over inherited properties because it filters
 * using the `hasOwnProperty` method.
 *
 * Unlike ES262's
 * [Array.prototype.forEach](http://www.ecma-international.org/ecma-262/5.1/#sec-15.4.4.18),
 * providing 'undefined' or 'null' values for `obj` will not throw a TypeError, but rather just
 * return the value provided.
 *
   ```js
     var values = {name: 'misko', gender: 'male'};
     var log = [];
     angular.forEach(values, function(value, key) {
       this.push(key + ': ' + value);
     }, log);
     expect(log).toEqual(['name: misko', 'gender: male']);
   ```
 *
 * @param {Object|Array} obj Object to iterate over.
 * @param {Function} iterator Iterator function.
 * @param {Object=} context Object to become context (`this`) for the iterator function.
 * @returns {Object|Array} Reference to `obj`.
 */

function forEach(obj, iterator, context) {
	var key, length;
	if (obj) {
		if (isFunction(obj)) {
			for (key in obj) {
				if (
					key !== "prototype" &&
					key !== "length" &&
					key !== "name" &&
					obj.hasOwnProperty(key)
				) {
					iterator.call(context, obj[key], key, obj);
				}
			}
		} else if (isArray(obj) || isArrayLike(obj)) {
			var isPrimitive = typeof obj !== "object";
			for (key = 0, length = obj.length; key < length; key++) {
				if (isPrimitive || key in obj) {
					iterator.call(context, obj[key], key, obj);
				}
			}
		} else if (obj.forEach && obj.forEach !== forEach) {
			obj.forEach(iterator, context, obj);
		} else if (isBlankObject(obj)) {
			// createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
			// eslint-disable-next-line guard-for-in
			for (key in obj) {
				iterator.call(context, obj[key], key, obj);
			}
		} else if (typeof obj.hasOwnProperty === "function") {
			// Slow path for objects inheriting Object.prototype, hasOwnProperty check needed
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					iterator.call(context, obj[key], key, obj);
				}
			}
		} else {
			// Slow path for objects which do not have a method `hasOwnProperty`
			for (key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					iterator.call(context, obj[key], key, obj);
				}
			}
		}
	}
	return obj;
}

/**
 * Set or clear the hashkey for an object.
 * @param obj object
 * @param h the hashkey (!truthy to delete the hashkey)
 */
function setHashKey(obj, h) {
	if (h) {
		obj.$$hashKey = h;
	} else {
		delete obj.$$hashKey;
	}
}

function noop() {}

/**
 * @ngdoc function
 * @name angular.isUndefined
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is undefined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is undefined.
 */
function isUndefined(value) {
	return typeof value === "undefined";
}

/**
 * @ngdoc function
 * @name angular.isDefined
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is defined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is defined.
 */
function isDefined(value) {
	return typeof value !== "undefined";
}

/**
 * @ngdoc function
 * @name angular.isObject
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
 * considered to be objects. Note that JavaScript arrays are objects.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is an `Object` but not `null`.
 */
function isObject(value) {
	// http://jsperf.com/isobject4
	return value !== null && typeof value === "object";
}

/**
 * Determine if a value is an object with a null prototype
 *
 * @returns {boolean} True if `value` is an `Object` with a null prototype
 */
function isBlankObject(value) {
	return value !== null && typeof value === "object" && !getPrototypeOf(value);
}

/**
 * @ngdoc function
 * @name angular.isString
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `String`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `String`.
 */
function isString(value) {
	return typeof value === "string";
}

/**
 * @ngdoc function
 * @name angular.isNumber
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Number`.
 *
 * This includes the "special" numbers `NaN`, `+Infinity` and `-Infinity`.
 *
 * If you wish to exclude these then you can use the native
 * [`isFinite'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite)
 * method.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Number`.
 */
function isNumber(value) {
	return typeof value === "number";
}

/**
 * @ngdoc function
 * @name angular.isFunction
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Function`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Function`.
 */
function isFunction(value) {
	return typeof value === "function";
}

/**
 * Checks if `obj` is a window object.
 *
 * @private
 * @param {*} obj Object to check
 * @returns {boolean} True if `obj` is a window obj.
 */
function isWindow(obj) {
	return obj && obj.window === obj;
}

function isScope(obj) {
	return obj && obj.$evalAsync && obj.$watch;
}

var TYPED_ARRAY_REGEXP =
	/^\[object (?:Uint8|Uint8Clamped|Uint16|Uint32|Int8|Int16|Int32|Float32|Float64)Array\]$/;
function isTypedArray(value) {
	return (
		value &&
		isNumber(value.length) &&
		TYPED_ARRAY_REGEXP.test(toString.call(value))
	);
}

function isArrayBuffer(obj) {
	return toString.call(obj) === "[object ArrayBuffer]";
}
/**
 * @ngdoc function
 * @name angular.copy
 * @module ng
 * @kind function
 *
 * @description
 * Creates a deep copy of `source`, which should be an object or an array.
 *
 * * If no destination is supplied, a copy of the object or array is created.
 * * If a destination is provided, all of its elements (for arrays) or properties (for objects)
 *   are deleted and then all elements/properties from the source are copied to it.
 * * If `source` is not an object or array (inc. `null` and `undefined`), `source` is returned.
 * * If `source` is identical to `destination` an exception will be thrown.
 *
 * <br />
 * <div class="alert alert-warning">
 *   Only enumerable properties are taken into account. Non-enumerable properties (both on `source`
 *   and on `destination`) will be ignored.
 * </div>
 *
 * @param {*} source The source that will be used to make a copy.
 *                   Can be any type, including primitives, `null`, and `undefined`.
 * @param {(Object|Array)=} destination Destination into which the source is copied. If
 *     provided, must be of the same type as `source`.
 * @returns {*} The copy or updated `destination`, if `destination` was specified.
 *
 * @example
  <example module="copyExample" name="angular-copy">
    <file name="index.html">
      <div ng-controller="ExampleController">
        <form novalidate class="simple-form">
          <label>Name: <input type="text" ng-model="user.name" /></label><br />
          <label>Age:  <input type="number" ng-model="user.age" /></label><br />
          Gender: <label><input type="radio" ng-model="user.gender" value="male" />male</label>
                  <label><input type="radio" ng-model="user.gender" value="female" />female</label><br />
          <button ng-click="reset()">RESET</button>
          <button ng-click="update(user)">SAVE</button>
        </form>
        <pre>form = {{user | json}}</pre>
        <pre>master = {{master | json}}</pre>
      </div>
    </file>
    <file name="script.js">
      // Module: copyExample
      angular.
        module('copyExample', []).
        controller('ExampleController', ['$scope', function($scope) {
          $scope.master = {};

          $scope.reset = function() {
            // Example with 1 argument
            $scope.user = angular.copy($scope.master);
          };

          $scope.update = function(user) {
            // Example with 2 arguments
            angular.copy(user, $scope.master);
          };

          $scope.reset();
        }]);
    </file>
  </example>
 */
function copy(source, destination) {
	var stackSource = [];
	var stackDest = [];

	if (destination) {
		if (isTypedArray(destination) || isArrayBuffer(destination)) {
			throw ngMinErr(
				"cpta",
				"Can't copy! TypedArray destination cannot be mutated."
			);
		}
		if (source === destination) {
			throw ngMinErr(
				"cpi",
				"Can't copy! Source and destination are identical."
			);
		}

		// Empty the destination object
		if (isArray(destination)) {
			destination.length = 0;
		} else {
			forEach(destination, function (value, key) {
				if (key !== "$$hashKey") {
					delete destination[key];
				}
			});
		}

		stackSource.push(source);
		stackDest.push(destination);
		return copyRecurse(source, destination);
	}

	return copyElement(source);

	function copyRecurse(source, destination) {
		var h = destination.$$hashKey;
		var key;
		if (isArray(source)) {
			for (var i = 0, ii = source.length; i < ii; i++) {
				destination.push(copyElement(source[i]));
			}
		} else if (isBlankObject(source)) {
			// createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
			// eslint-disable-next-line guard-for-in
			for (key in source) {
				destination[key] = copyElement(source[key]);
			}
		} else if (source && typeof source.hasOwnProperty === "function") {
			// Slow path, which must rely on hasOwnProperty
			for (key in source) {
				if (source.hasOwnProperty(key)) {
					destination[key] = copyElement(source[key]);
				}
			}
		} else {
			// Slowest path --- hasOwnProperty can't be called as a method
			for (key in source) {
				if (hasOwnProperty.call(source, key)) {
					destination[key] = copyElement(source[key]);
				}
			}
		}
		setHashKey(destination, h);
		return destination;
	}

	function copyElement(source) {
		// Simple values
		if (!isObject(source)) {
			return source;
		}

		// Already copied values
		var index = stackSource.indexOf(source);
		if (index !== -1) {
			return stackDest[index];
		}

		if (isWindow(source) || isScope(source)) {
			throw ngMinErr(
				"cpws",
				"Can't copy! Making copies of Window or Scope instances is not supported."
			);
		}

		var needsRecurse = false;
		var destination = copyType(source);

		if (destination === undefined) {
			destination = isArray(source)
				? []
				: Object.create(getPrototypeOf(source));
			needsRecurse = true;
		}

		stackSource.push(source);
		stackDest.push(destination);

		return needsRecurse ? copyRecurse(source, destination) : destination;
	}

	function copyType(source) {
		switch (toString.call(source)) {
			case "[object Int8Array]":
			case "[object Int16Array]":
			case "[object Int32Array]":
			case "[object Float32Array]":
			case "[object Float64Array]":
			case "[object Uint8Array]":
			case "[object Uint8ClampedArray]":
			case "[object Uint16Array]":
			case "[object Uint32Array]":
				return new source.constructor(
					copyElement(source.buffer),
					source.byteOffset,
					source.length
				);

			case "[object ArrayBuffer]":
				// Support: IE10
				if (!source.slice) {
					// If we're in this case we know the environment supports ArrayBuffer

					var copied = new ArrayBuffer(source.byteLength);
					new Uint8Array(copied).set(new Uint8Array(source));

					return copied;
				}
				return source.slice(0);

			case "[object Boolean]":
			case "[object Number]":
			case "[object String]":
			case "[object Date]":
				return new source.constructor(source.valueOf());

			case "[object RegExp]":
				var re = new RegExp(
					source.source,
					source.toString().match(/[^\/]*$/)[0]
				);
				re.lastIndex = source.lastIndex;
				return re;

			case "[object Blob]":
				return new source.constructor([source], { type: source.type });
		}

		if (isFunction(source.cloneNode)) {
			return source.cloneNode(true);
		}
	}
}

/**
 * @ngdoc function
 * @name angular.bind
 * @module ng
 * @kind function
 *
 * @description
 * Returns a function which calls function `fn` bound to `self` (`self` becomes the `this` for
 * `fn`). You can supply optional `args` that are prebound to the function. This feature is also
 * known as [partial application](http://en.wikipedia.org/wiki/Partial_application), as
 * distinguished from [function currying](http://en.wikipedia.org/wiki/Currying#Contrast_with_partial_function_application).
 *
 * @param {Object} self Context which `fn` should be evaluated in.
 * @param {function()} fn Function to be bound.
 * @param {...*} args Optional arguments to be prebound to the `fn` function call.
 * @returns {function()} Function that wraps the `fn` with all the specified bindings.
 */

function toJsonReplacer(key, value) {
	var val = value;

	if (
		typeof key === "string" &&
		key.charAt(0) === "$" &&
		key.charAt(1) === "$"
	) {
		val = undefined;
	} else if (isWindow(value)) {
		val = "$WINDOW";
	} else if (value && window.document === value) {
		val = "$DOCUMENT";
	} else if (isScope(value)) {
		val = "$SCOPE";
	}

	return val;
}

/**
 * Creates a new object without a prototype. This object is useful for lookup without having to
 * guard against prototypically inherited properties via hasOwnProperty.
 *
 * Related micro-benchmarks:
 * - http://jsperf.com/object-create2
 * - http://jsperf.com/proto-map-lookup/2
 * - http://jsperf.com/for-in-vs-object-keys2
 *
 * @returns {Object}
 */
function createMap() {
	return Object.create(null);
}

function serializeObject(obj) {
	var seen = [];

	return JSON.stringify(obj, function (key, val) {
		val = toJsonReplacer(key, val);
		if (isObject(val)) {
			if (seen.indexOf(val) >= 0) {
				return "...";
			}

			seen.push(val);
		}
		return val;
	});
}

function toDebugString(obj) {
	if (typeof obj === "function") {
		return obj.toString().replace(/ \{[\s\S]*$/, "");
	} else if (isUndefined(obj)) {
		return "undefined";
	} else if (typeof obj !== "string") {
		return serializeObject(obj);
	}
	return obj;
}

/**
 * @description
 *
 * This object provides a utility for producing rich Error messages within
 * Angular. It can be called as follows:
 *
 * var exampleMinErr = minErr('example');
 * throw exampleMinErr('one', 'This {0} is {1}', foo, bar);
 *
 * The above creates an instance of minErr in the example namespace. The
 * resulting error will have a namespaced error code of example.one.  The
 * resulting error will replace {0} with the value of foo, and {1} with the
 * value of bar. The object is not restricted in the number of arguments it can
 * take.
 *
 * If fewer arguments are specified than necessary for interpolation, the extra
 * interpolation markers will be preserved in the final string.
 *
 * Since data will be parsed statically during a build step, some restrictions
 * are applied with respect to how minErr instances are created and called.
 * Instances should have names of the form namespaceMinErr for a minErr created
 * using minErr('namespace') . Error codes, namespaces and template strings
 * should all be static strings, not variables or general expressions.
 *
 * @param {string} module The namespace to use for the new minErr instance.
 * @param {function} ErrorConstructor Custom error constructor to be instantiated when returning
 *   error from returned function, for cases when a particular type of error is useful.
 * @returns {function(code:string, template:string, ...templateArgs): Error} minErr instance
 */

function minErr(module, ErrorConstructor) {
	ErrorConstructor = ErrorConstructor || Error;
	return function () {
		var SKIP_INDEXES = 2;

		var templateArgs = arguments,
			code = templateArgs[0],
			message = "[" + (module ? module + ":" : "") + code + "] ",
			template = templateArgs[1],
			paramPrefix,
			i;

		message += template.replace(/\{\d+\}/g, function (match) {
			var index = +match.slice(1, -1),
				shiftedIndex = index + SKIP_INDEXES;

			if (shiftedIndex < templateArgs.length) {
				return toDebugString(templateArgs[shiftedIndex]);
			}

			return match;
		});

		message +=
			'\nhttp://errors.angularjs.org/"NG_VERSION_FULL"/' +
			(module ? module + "/" : "") +
			code;

		for (
			i = SKIP_INDEXES, paramPrefix = "?";
			i < templateArgs.length;
			i++, paramPrefix = "&"
		) {
			message +=
				paramPrefix +
				"p" +
				(i - SKIP_INDEXES) +
				"=" +
				encodeURIComponent(toDebugString(templateArgs[i]));
		}

		return new ErrorConstructor(message);
	};
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *     Any commits to this file should be reviewed with security in mind.  *
 *   Changes to this file can potentially create security vulnerabilities. *
 *          An approval from 2 Core members with history of modifying      *
 *                         this file is required.                          *
 *                                                                         *
 *  Does the change somehow allow for arbitrary javascript to be executed? *
 *    Or allows for someone to change the prototype of built-in objects?   *
 *     Or gives undesired access to variables likes document or window?    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $parseMinErr = minErr("$parse");

// Sandboxing Angular Expressions
// ------------------------------
// Angular expressions are no longer sandboxed. So it is now even easier to access arbitrary JS code by
// various means such as obtaining a reference to native JS functions like the Function constructor.
//
// As an example, consider the following Angular expression:
//
//   {}.toString.constructor('alert("evil JS code")')
//
// It is important to realize that if you create an expression from a string that contains user provided
// content then it is possible that your application contains a security vulnerability to an XSS style attack.
//
// See https://docs.angularjs.org/guide/security

function getStringValue(name) {
	// Property names must be strings. This means that non-string objects cannot be used
	// as keys in an object. Any non-string object, including a number, is typecasted
	// into a string via the toString method.
	// -- MDN, https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Property_accessors#Property_names
	//
	// So, to ensure that we are checking the same `name` that JavaScript would use, we cast it
	// to a string. It's not always possible. If `name` is an object and its `toString` method is
	// 'broken' (doesn't return a string, isn't a function, etc.), an error will be thrown:
	//
	// TypeError: Cannot convert object to primitive value
	//
	// For performance reasons, we don't catch this error here and allow it to propagate up the call
	// stack. Note that you'll get the same error in JavaScript if you try to access a property using
	// such a 'broken' object as a key.
	return name + "";
}

var OPERATORS = createMap();
forEach(
	"+ - * / % === !== == != < > <= >= && || ! = |".split(" "),
	function (operator) {
		OPERATORS[operator] = true;
	}
);
var ESCAPE = {
	n: "\n",
	f: "\f",
	r: "\r",
	t: "\t",
	v: "\v",
	"'": "'",
	'"': '"',
};

/////////////////////////////////////////

/**
 * @constructor
 */
function Lexer(options) {
	this.options = options || {};
}

Lexer.prototype = {
	constructor: Lexer,

	lex: function (text) {
		this.text = text;
		this.index = 0;
		this.tokens = [];

		while (this.index < this.text.length) {
			var ch = this.text.charAt(this.index);
			if (ch === '"' || ch === "'" || ch === "`") {
				this.readString(ch);
			} else if (
				this.isNumber(ch) ||
				(ch === "." && this.isNumber(this.peek()))
			) {
				this.readNumber();
			} else if (this.isIdentifierStart(this.peekMultichar())) {
				this.readIdent();
			} else if (this.is(ch, "(){}[].,;:?")) {
				this.tokens.push({ index: this.index, text: ch });
				this.index++;
			} else if (this.isWhitespace(ch)) {
				this.index++;
			} else {
				var ch2 = ch + this.peek();
				var ch3 = ch2 + this.peek(2);
				var op1 = OPERATORS[ch];
				var op2 = OPERATORS[ch2];
				var op3 = OPERATORS[ch3];
				if (op1 || op2 || op3) {
					var token = op3 ? ch3 : op2 ? ch2 : ch;
					this.tokens.push({ index: this.index, text: token, operator: true });
					this.index += token.length;
				} else {
					this.throwError(
						"Unexpected next character ",
						this.index,
						this.index + 1
					);
				}
			}
		}
		return this.tokens;
	},

	is: function (ch, chars) {
		return chars.indexOf(ch) !== -1;
	},

	peek: function (i) {
		var num = i || 1;
		return this.index + num < this.text.length
			? this.text.charAt(this.index + num)
			: false;
	},

	isNumber: function (ch) {
		return ch >= "0" && ch <= "9" && typeof ch === "string";
	},

	isWhitespace: function (ch) {
		// IE treats non-breaking space as \u00A0
		return (
			ch === " " ||
			ch === "\r" ||
			ch === "\t" ||
			ch === "\n" ||
			ch === "\v" ||
			ch === "\u00A0"
		);
	},

	isIdentifierStart: function (ch) {
		return this.options.isIdentifierStart
			? this.options.isIdentifierStart(ch, this.codePointAt(ch))
			: this.isValidIdentifierStart(ch);
	},

	isValidIdentifierStart: function (ch) {
		return (
			(ch >= "a" && ch <= "z") ||
			(ch >= "A" && ch <= "Z") ||
			ch === "_" ||
			ch === "$"
		);
	},

	isIdentifierContinue: function (ch) {
		return this.options.isIdentifierContinue
			? this.options.isIdentifierContinue(ch, this.codePointAt(ch))
			: this.isValidIdentifierContinue(ch);
	},

	isValidIdentifierContinue: function (ch, cp) {
		return this.isValidIdentifierStart(ch, cp) || this.isNumber(ch);
	},

	codePointAt: function (ch) {
		if (ch.length === 1) {
			return ch.charCodeAt(0);
		}

		return (ch.charCodeAt(0) << 10) + ch.charCodeAt(1) - 0x35fdc00;
	},

	peekMultichar: function () {
		var ch = this.text.charAt(this.index);
		var peek = this.peek();
		if (!peek) {
			return ch;
		}
		var cp1 = ch.charCodeAt(0);
		var cp2 = peek.charCodeAt(0);
		if (cp1 >= 0xd800 && cp1 <= 0xdbff && cp2 >= 0xdc00 && cp2 <= 0xdfff) {
			return ch + peek;
		}
		return ch;
	},

	isExpOperator: function (ch) {
		return ch === "-" || ch === "+" || this.isNumber(ch);
	},

	throwError: function (error, start, end) {
		end = end || this.index;
		var colStr = isDefined(start)
			? "s " +
				start +
				"-" +
				this.index +
				" [" +
				this.text.substring(start, end) +
				"]"
			: " " + end;
		throw $parseMinErr(
			"lexerr",
			"Lexer Error: {0} at column{1} in expression [{2}].",
			error,
			colStr,
			this.text
		);
	},

	readNumber: function () {
		var number = "";
		var start = this.index;
		while (this.index < this.text.length) {
			var ch = lowercase(this.text.charAt(this.index));
			if (ch === "." || this.isNumber(ch)) {
				number += ch;
			} else {
				var peekCh = this.peek();
				if (ch === "e" && this.isExpOperator(peekCh)) {
					number += ch;
				} else if (
					this.isExpOperator(ch) &&
					peekCh &&
					this.isNumber(peekCh) &&
					number.charAt(number.length - 1) === "e"
				) {
					number += ch;
				} else if (
					this.isExpOperator(ch) &&
					(!peekCh || !this.isNumber(peekCh)) &&
					number.charAt(number.length - 1) === "e"
				) {
					this.throwError("Invalid exponent");
				} else {
					break;
				}
			}
			this.index++;
		}
		this.tokens.push({
			index: start,
			text: number,
			constant: true,
			value: Number(number),
		});
	},

	readIdent: function () {
		var start = this.index;
		this.index += this.peekMultichar().length;
		while (this.index < this.text.length) {
			var ch = this.peekMultichar();
			if (!this.isIdentifierContinue(ch)) {
				break;
			}
			this.index += ch.length;
		}
		this.tokens.push({
			index: start,
			text: this.text.slice(start, this.index),
			identifier: true,
		});
	},

	readString: function (quote) {
		// quote will be ', " or `
		var start = this.index;
		this.index++;
		var string = "";
		var rawString = quote;
		var isTemplateLiteral = quote === "`";
		var escape = false;
		while (this.index < this.text.length) {
			var ch = this.text.charAt(this.index);
			if (
				isTemplateLiteral &&
				ch === "$" &&
				this.text.charAt(this.index + 1) === "{"
			) {
				this.tokens.push({
					index: start,
					text: rawString,
					constant: true,
					value: string,
				});
				var inside = this.text.indexOf("}", this.index);
				var myVariable = this.text.substr(
					this.index + 2,
					inside - this.index - 2
				);
				this.tokens.push({ index: this.index, text: "+", operator: true });
				var lexed = new Lexer(this.options).lex(myVariable);
				for (var i = 0, len = lexed.length; i < len; i++) {
					this.tokens.push(lexed[i]);
				}
				this.tokens.push({ index: this.index, text: "+", operator: true });
				this.index = inside;
				this.readString("`");
				return;
			}
			rawString += ch;
			if (escape) {
				if (ch === "u") {
					var hex = this.text.substring(this.index + 1, this.index + 5);
					if (!hex.match(/[\da-f]{4}/i)) {
						this.throwError("Invalid unicode escape [\\u" + hex + "]");
					}
					this.index += 4;
					string += String.fromCharCode(parseInt(hex, 16));
				} else {
					var rep = ESCAPE[ch];
					string = string + (rep || ch);
				}
				escape = false;
			} else if (ch === "\\") {
				escape = true;
			} else if (ch === quote) {
				// Matching closing quote
				this.index++;
				this.tokens.push({
					index: start,
					text: rawString,
					constant: true,
					value: string,
				});
				return;
			} else {
				string += ch;
			}
			this.index++;
		}
		this.throwError("Unterminated quote", start);
	},
};

function AST(lexer, options) {
	this.lexer = lexer;
	this.options = options;
}

AST.Program = "Program";
AST.ExpressionStatement = "ExpressionStatement";
AST.AssignmentExpression = "AssignmentExpression";
AST.ConditionalExpression = "ConditionalExpression";
AST.LogicalExpression = "LogicalExpression";
AST.BinaryExpression = "BinaryExpression";
AST.UnaryExpression = "UnaryExpression";
AST.CallExpression = "CallExpression";
AST.MemberExpression = "MemberExpression";
AST.Identifier = "Identifier";
AST.Literal = "Literal";
AST.ArrayExpression = "ArrayExpression";
AST.Property = "Property";
AST.ObjectExpression = "ObjectExpression";
AST.ThisExpression = "ThisExpression";
AST.LocalsExpression = "LocalsExpression";

// Internal use only
AST.NGValueParameter = "NGValueParameter";

AST.prototype = {
	ast: function (text) {
		this.text = text;
		this.tokens = this.lexer.lex(text);

		var value = this.program();

		if (this.tokens.length !== 0) {
			this.throwError("is an unexpected token", this.tokens[0]);
		}

		return value;
	},

	program: function () {
		var body = [];
		while (true) {
			if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]")) {
				body.push(this.expressionStatement());
			}
			if (!this.expect(";")) {
				return { type: AST.Program, body: body };
			}
		}
	},

	expressionStatement: function () {
		return { type: AST.ExpressionStatement, expression: this.filterChain() };
	},

	filterChain: function () {
		var left = this.expression();
		while (this.expect("|")) {
			left = this.filter(left);
		}
		return left;
	},

	expression: function () {
		return this.assignment();
	},

	assignment: function () {
		var result = this.ternary();
		if (this.expect("=")) {
			if (!isAssignable(result)) {
				throw $parseMinErr("lval", "Trying to assign a value to a non l-value");
			}

			result = {
				type: AST.AssignmentExpression,
				left: result,
				right: this.assignment(),
				operator: "=",
			};
		}
		return result;
	},

	ternary: function () {
		var test = this.logicalOR();
		var alternate;
		var consequent;
		if (this.expect("?")) {
			alternate = this.expression();
			if (this.consume(":")) {
				consequent = this.expression();
				return {
					type: AST.ConditionalExpression,
					test: test,
					alternate: alternate,
					consequent: consequent,
				};
			}
		}
		return test;
	},

	logicalOR: function () {
		var left = this.logicalAND();
		while (this.expect("||")) {
			left = {
				type: AST.LogicalExpression,
				operator: "||",
				left: left,
				right: this.logicalAND(),
			};
		}
		return left;
	},

	logicalAND: function () {
		var left = this.equality();
		while (this.expect("&&")) {
			left = {
				type: AST.LogicalExpression,
				operator: "&&",
				left: left,
				right: this.equality(),
			};
		}
		return left;
	},

	equality: function () {
		var left = this.relational();
		var token;
		while ((token = this.expect("==", "!=", "===", "!=="))) {
			left = {
				type: AST.BinaryExpression,
				operator: token.text,
				left: left,
				right: this.relational(),
			};
		}
		return left;
	},

	relational: function () {
		var left = this.additive();
		var token;
		while ((token = this.expect("<", ">", "<=", ">="))) {
			left = {
				type: AST.BinaryExpression,
				operator: token.text,
				left: left,
				right: this.additive(),
			};
		}
		return left;
	},

	additive: function () {
		var left = this.multiplicative();
		var token;
		while ((token = this.expect("+", "-"))) {
			left = {
				type: AST.BinaryExpression,
				operator: token.text,
				left: left,
				right: this.multiplicative(),
			};
		}
		return left;
	},

	multiplicative: function () {
		var left = this.unary();
		var token;
		while ((token = this.expect("*", "/", "%"))) {
			left = {
				type: AST.BinaryExpression,
				operator: token.text,
				left: left,
				right: this.unary(),
			};
		}
		return left;
	},

	unary: function () {
		var token;
		if ((token = this.expect("+", "-", "!"))) {
			return {
				type: AST.UnaryExpression,
				operator: token.text,
				prefix: true,
				argument: this.unary(),
			};
		}
		return this.primary();
	},

	primary: function () {
		var primary;
		if (this.expect("(")) {
			primary = this.filterChain();
			this.consume(")");
		} else if (this.expect("[")) {
			primary = this.arrayDeclaration();
		} else if (this.expect("{")) {
			primary = this.object();
		} else if (this.selfReferential.hasOwnProperty(this.peek().text)) {
			primary = copy(this.selfReferential[this.consume().text]);
		} else if (this.options.literals.hasOwnProperty(this.peek().text)) {
			primary = {
				type: AST.Literal,
				value: this.options.literals[this.consume().text],
			};
		} else if (this.peek().identifier) {
			primary = this.identifier();
		} else if (this.peek().constant) {
			primary = this.constant();
		} else {
			this.throwError("not a primary expression", this.peek());
		}

		var next;
		while ((next = this.expect("(", "[", "."))) {
			if (next.text === "(") {
				primary = {
					type: AST.CallExpression,
					callee: primary,
					arguments: this.parseArguments(),
				};
				this.consume(")");
			} else if (next.text === "[") {
				primary = {
					type: AST.MemberExpression,
					object: primary,
					property: this.expression(),
					computed: true,
				};
				this.consume("]");
			} else if (next.text === ".") {
				primary = {
					type: AST.MemberExpression,
					object: primary,
					property: this.identifier(),
					computed: false,
				};
			} else {
				this.throwError("IMPOSSIBLE");
			}
		}
		return primary;
	},

	filter: function (baseExpression) {
		var args = [baseExpression];
		var result = {
			type: AST.CallExpression,
			callee: this.identifier(),
			arguments: args,
			filter: true,
		};

		while (this.expect(":")) {
			args.push(this.expression());
		}

		return result;
	},

	parseArguments: function () {
		var args = [];
		if (this.peekToken().text !== ")") {
			do {
				args.push(this.filterChain());
			} while (this.expect(","));
		}
		return args;
	},

	identifier: function () {
		var token = this.consume();
		if (!token.identifier) {
			this.throwError("is not a valid identifier", token);
		}
		return { type: AST.Identifier, name: token.text };
	},

	constant: function () {
		// TODO check that it is a constant
		return { type: AST.Literal, value: this.consume().value };
	},

	arrayDeclaration: function () {
		var elements = [];
		if (this.peekToken().text !== "]") {
			do {
				if (this.peek("]")) {
					// Support trailing commas per ES5.1.
					break;
				}
				elements.push(this.expression());
			} while (this.expect(","));
		}
		this.consume("]");

		return { type: AST.ArrayExpression, elements: elements };
	},

	object: function () {
		var properties = [],
			property;
		if (this.peekToken().text !== "}") {
			do {
				if (this.peek("}")) {
					// Support trailing commas per ES5.1.
					break;
				}
				property = { type: AST.Property, kind: "init" };
				if (this.peek().constant) {
					property.key = this.constant();
					property.computed = false;
					this.consume(":");
					property.value = this.expression();
				} else if (this.peek().identifier) {
					property.key = this.identifier();
					property.computed = false;
					if (this.peek(":")) {
						this.consume(":");
						property.value = this.expression();
					} else {
						property.value = property.key;
					}
				} else if (this.peek("[")) {
					this.consume("[");
					property.key = this.expression();
					this.consume("]");
					property.computed = true;
					this.consume(":");
					property.value = this.expression();
				} else {
					this.throwError("invalid key", this.peek());
				}
				properties.push(property);
			} while (this.expect(","));
		}
		this.consume("}");

		return { type: AST.ObjectExpression, properties: properties };
	},

	throwError: function (msg, token) {
		throw $parseMinErr(
			"syntax",
			"Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].",
			token.text,
			msg,
			token.index + 1,
			this.text,
			this.text.substring(token.index)
		);
	},

	consume: function (e1) {
		if (this.tokens.length === 0) {
			throw $parseMinErr(
				"ueoe",
				"Unexpected end of expression: {0}",
				this.text
			);
		}

		var token = this.expect(e1);
		if (!token) {
			this.throwError("is unexpected, expecting [" + e1 + "]", this.peek());
		}
		return token;
	},

	peekToken: function () {
		if (this.tokens.length === 0) {
			throw $parseMinErr(
				"ueoe",
				"Unexpected end of expression: {0}",
				this.text
			);
		}
		return this.tokens[0];
	},

	peek: function (e1, e2, e3, e4) {
		return this.peekAhead(0, e1, e2, e3, e4);
	},

	peekAhead: function (i, e1, e2, e3, e4) {
		if (this.tokens.length > i) {
			var token = this.tokens[i];
			var t = token.text;
			if (
				t === e1 ||
				t === e2 ||
				t === e3 ||
				t === e4 ||
				(!e1 && !e2 && !e3 && !e4)
			) {
				return token;
			}
		}
		return false;
	},

	expect: function (e1, e2, e3, e4) {
		var token = this.peek(e1, e2, e3, e4);
		if (token) {
			this.tokens.shift();
			return token;
		}
		return false;
	},
};

function ifDefined(v, d) {
	return typeof v !== "undefined" ? v : d;
}

function plusFn(l, r) {
	if (typeof l === "undefined") {
		return r;
	}
	if (typeof r === "undefined") {
		return l;
	}
	return l + r;
}

function isStateless($filter, filterName) {
	var fn = $filter(filterName);
	if (!fn) {
		throw new Error("Filter '" + filterName + "' is not defined");
	}
	return !fn.$stateful;
}

function findConstantAndWatchExpressions(ast, $filter) {
	var allConstants;
	var argsToWatch;
	var isStatelessFilter;
	switch (ast.type) {
		case AST.Program:
			allConstants = true;
			forEach(ast.body, function (expr) {
				findConstantAndWatchExpressions(expr.expression, $filter);
				allConstants = allConstants && expr.expression.constant;
			});
			ast.constant = allConstants;
			break;
		case AST.Literal:
			ast.constant = true;
			ast.toWatch = [];
			break;
		case AST.UnaryExpression:
			findConstantAndWatchExpressions(ast.argument, $filter);
			ast.constant = ast.argument.constant;
			ast.toWatch = ast.argument.toWatch;
			break;
		case AST.BinaryExpression:
			findConstantAndWatchExpressions(ast.left, $filter);
			findConstantAndWatchExpressions(ast.right, $filter);
			ast.constant = ast.left.constant && ast.right.constant;
			ast.toWatch = ast.left.toWatch.concat(ast.right.toWatch);
			break;
		case AST.LogicalExpression:
			findConstantAndWatchExpressions(ast.left, $filter);
			findConstantAndWatchExpressions(ast.right, $filter);
			ast.constant = ast.left.constant && ast.right.constant;
			ast.toWatch = ast.constant ? [] : [ast];
			break;
		case AST.ConditionalExpression:
			findConstantAndWatchExpressions(ast.test, $filter);
			findConstantAndWatchExpressions(ast.alternate, $filter);
			findConstantAndWatchExpressions(ast.consequent, $filter);
			ast.constant =
				ast.test.constant && ast.alternate.constant && ast.consequent.constant;
			ast.toWatch = ast.constant ? [] : [ast];
			break;
		case AST.Identifier:
			ast.constant = false;
			ast.toWatch = [ast];
			break;
		case AST.MemberExpression:
			findConstantAndWatchExpressions(ast.object, $filter);
			if (ast.computed) {
				findConstantAndWatchExpressions(ast.property, $filter);
			}
			ast.constant =
				ast.object.constant && (!ast.computed || ast.property.constant);
			ast.toWatch = [ast];
			break;
		case AST.CallExpression:
			isStatelessFilter = ast.filter
				? isStateless($filter, ast.callee.name)
				: false;
			allConstants = isStatelessFilter;
			argsToWatch = [];
			forEach(ast.arguments, function (expr) {
				findConstantAndWatchExpressions(expr, $filter);
				allConstants = allConstants && expr.constant;
				if (!expr.constant) {
					argsToWatch.push.apply(argsToWatch, expr.toWatch);
				}
			});
			ast.constant = allConstants;
			ast.toWatch = isStatelessFilter ? argsToWatch : [ast];
			break;
		case AST.AssignmentExpression:
			findConstantAndWatchExpressions(ast.left, $filter);
			findConstantAndWatchExpressions(ast.right, $filter);
			ast.constant = ast.left.constant && ast.right.constant;
			ast.toWatch = [ast];
			break;
		case AST.ArrayExpression:
			allConstants = true;
			argsToWatch = [];
			forEach(ast.elements, function (expr) {
				findConstantAndWatchExpressions(expr, $filter);
				allConstants = allConstants && expr.constant;
				if (!expr.constant) {
					argsToWatch.push.apply(argsToWatch, expr.toWatch);
				}
			});
			ast.constant = allConstants;
			ast.toWatch = argsToWatch;
			break;
		case AST.ObjectExpression:
			allConstants = true;
			argsToWatch = [];
			forEach(ast.properties, function (property) {
				findConstantAndWatchExpressions(property.value, $filter);
				allConstants =
					allConstants && property.value.constant && !property.computed;
				if (!property.value.constant) {
					argsToWatch.push.apply(argsToWatch, property.value.toWatch);
				}
			});
			ast.constant = allConstants;
			ast.toWatch = argsToWatch;
			break;
		case AST.ThisExpression:
			ast.constant = false;
			ast.toWatch = [];
			break;
		case AST.LocalsExpression:
			ast.constant = false;
			ast.toWatch = [];
			break;
	}
}

function getInputs(body) {
	if (body.length !== 1) {
		return;
	}
	var lastExpression = body[0].expression;
	var candidate = lastExpression.toWatch;
	if (candidate.length !== 1) {
		return candidate;
	}
	return candidate[0] !== lastExpression ? candidate : undefined;
}

function isAssignable(ast) {
	return ast.type === AST.Identifier || ast.type === AST.MemberExpression;
}

function assignableAST(ast) {
	if (ast.body.length === 1 && isAssignable(ast.body[0].expression)) {
		return {
			type: AST.AssignmentExpression,
			left: ast.body[0].expression,
			right: { type: AST.NGValueParameter },
			operator: "=",
		};
	}
}

function isLiteral(ast) {
	return (
		ast.body.length === 0 ||
		(ast.body.length === 1 &&
			(ast.body[0].expression.type === AST.Literal ||
				ast.body[0].expression.type === AST.ArrayExpression ||
				ast.body[0].expression.type === AST.ObjectExpression))
	);
}

function isConstant(ast) {
	return ast.constant;
}

function ASTCompiler(astBuilder, $filter) {
	this.astBuilder = astBuilder;
	this.$filter = $filter;
}

ASTCompiler.prototype = {
	compile: function (expression) {
		var self = this;
		var ast = this.astBuilder.ast(expression);
		this.state = {
			nextId: 0,
			filters: {},
			fn: { vars: [], body: [], own: {} },
			assign: { vars: [], body: [], own: {} },
			inputs: [],
		};
		findConstantAndWatchExpressions(ast, self.$filter);
		var extra = "";
		var assignable;
		this.stage = "assign";
		if ((assignable = assignableAST(ast))) {
			this.state.computing = "assign";
			var result = this.nextId();
			this.recurse(assignable, result);
			this.return_(result);
			extra = "fn.assign=" + this.generateFunction("assign", "s,v,l");
		}
		var toWatch = getInputs(ast.body);
		self.stage = "inputs";
		forEach(toWatch, function (watch, key) {
			var fnKey = "fn" + key;
			self.state[fnKey] = { vars: [], body: [], own: {} };
			self.state.computing = fnKey;
			var intoId = self.nextId();
			self.recurse(watch, intoId);
			self.return_(intoId);
			self.state.inputs.push(fnKey);
			watch.watchId = key;
		});
		this.state.computing = "fn";
		this.stage = "main";
		this.recurse(ast);
		var fnString =
			// The build and minification steps remove the string "use strict" from the code, but this is done using a regex.
			// This is a workaround for this until we do a better job at only removing the prefix only when we should.
			'"' +
			this.USE +
			" " +
			this.STRICT +
			'";\n' +
			this.filterPrefix() +
			"var fn=" +
			this.generateFunction("fn", "s,l,a,i") +
			extra +
			this.watchFns() +
			"return fn;";

		// eslint-disable-next-line no-new-func
		var wrappedFn = new Function(
			"$filter",
			"getStringValue",
			"ifDefined",
			"plus",
			fnString
		)(this.$filter, getStringValue, ifDefined, plusFn);

		var fn = function (s, l, a, i) {
			return runWithFunctionConstructorProtection(function () {
				return wrappedFn(s, l, a, i);
			});
		};
		fn.assign = function (s, v, l) {
			return runWithFunctionConstructorProtection(function () {
				return wrappedFn.assign(s, v, l);
			});
		};
		fn.inputs = wrappedFn.inputs;

		this.state = this.stage = undefined;
		fn.ast = ast;
		fn.literal = isLiteral(ast);
		fn.constant = isConstant(ast);
		return fn;
	},

	USE: "use",

	STRICT: "strict",

	watchFns: function () {
		var result = [];
		var fns = this.state.inputs;
		var self = this;
		forEach(fns, function (name) {
			result.push("var " + name + "=" + self.generateFunction(name, "s"));
		});
		if (fns.length) {
			result.push("fn.inputs=[" + fns.join(",") + "];");
		}
		return result.join("");
	},

	generateFunction: function (name, params) {
		return (
			"function(" +
			params +
			"){" +
			this.varsPrefix(name) +
			this.body(name) +
			"};"
		);
	},

	filterPrefix: function () {
		var parts = [];
		var self = this;
		forEach(this.state.filters, function (id, filter) {
			parts.push(id + "=$filter(" + self.escape(filter) + ")");
		});
		if (parts.length) {
			return "var " + parts.join(",") + ";";
		}
		return "";
	},

	varsPrefix: function (section) {
		return this.state[section].vars.length
			? "var " + this.state[section].vars.join(",") + ";"
			: "";
	},

	body: function (section) {
		return this.state[section].body.join("");
	},

	recurse: function (
		ast,
		intoId,
		nameId,
		recursionFn,
		create,
		skipWatchIdCheck
	) {
		var left,
			right,
			self = this,
			args,
			expression,
			computed;
		recursionFn = recursionFn || noop;
		if (!skipWatchIdCheck && isDefined(ast.watchId)) {
			intoId = intoId || this.nextId();
			this.if_(
				"i",
				this.lazyAssign(intoId, this.unsafeComputedMember("i", ast.watchId)),
				this.lazyRecurse(ast, intoId, nameId, recursionFn, create, true)
			);
			return;
		}

		switch (ast.type) {
			case AST.Program:
				forEach(ast.body, function (expression, pos) {
					self.recurse(
						expression.expression,
						undefined,
						undefined,
						function (expr) {
							right = expr;
						}
					);
					if (pos !== ast.body.length - 1) {
						self.current().body.push(right, ";");
					} else {
						self.return_(right);
					}
				});
				break;
			case AST.Literal:
				expression = this.escape(ast.value);
				this.assign(intoId, expression);
				recursionFn(intoId || expression);
				break;
			case AST.UnaryExpression:
				this.recurse(ast.argument, undefined, undefined, function (expr) {
					right = expr;
				});
				expression = ast.operator + "(" + this.ifDefined(right, 0) + ")";
				this.assign(intoId, expression);
				recursionFn(expression);
				break;
			case AST.BinaryExpression:
				this.recurse(ast.left, undefined, undefined, function (expr) {
					left = expr;
				});
				this.recurse(ast.right, undefined, undefined, function (expr) {
					right = expr;
				});
				if (ast.operator === "+") {
					expression = this.plus(left, right);
				} else if (ast.operator === "-") {
					expression =
						this.ifDefined(left, 0) + ast.operator + this.ifDefined(right, 0);
				} else {
					expression = "(" + left + ")" + ast.operator + "(" + right + ")";
				}
				this.assign(intoId, expression);
				recursionFn(expression);
				break;
			case AST.LogicalExpression:
				intoId = intoId || this.nextId();
				self.recurse(ast.left, intoId);
				self.if_(
					ast.operator === "&&" ? intoId : self.not(intoId),
					self.lazyRecurse(ast.right, intoId)
				);
				recursionFn(intoId);
				break;
			case AST.ConditionalExpression:
				intoId = intoId || this.nextId();
				self.recurse(ast.test, intoId);
				self.if_(
					intoId,
					self.lazyRecurse(ast.alternate, intoId),
					self.lazyRecurse(ast.consequent, intoId)
				);
				recursionFn(intoId);
				break;
			case AST.Identifier:
				intoId = intoId || this.nextId();
				var inAssignment = self.current().inAssignment;
				if (nameId) {
					if (inAssignment) {
						nameId.context = this.assign(this.nextId(), "s");
					} else {
						nameId.context =
							self.stage === "inputs"
								? "s"
								: this.assign(
										this.nextId(),
										this.getHasOwnProperty("l", ast.name) + "?l:s"
									);
					}
					nameId.computed = false;
					nameId.name = ast.name;
				}
				self.if_(
					self.stage === "inputs" ||
						self.not(self.getHasOwnProperty("l", ast.name)),
					function () {
						self.if_(
							self.stage === "inputs" ||
								self.and_(
									"s",
									self.or_(
										self.isNull(self.nonComputedMember("s", ast.name)),
										self.hasOwnProperty_("s", ast.name)
									)
								),
							function () {
								if (create && create !== 1) {
									self.if_(
										self.isNull(self.nonComputedMember("s", ast.name)),
										self.lazyAssign(self.nonComputedMember("s", ast.name), "{}")
									);
								}
								self.assign(intoId, self.nonComputedMember("s", ast.name));
							}
						);
					},
					intoId &&
						function () {
							self.if_(
								self.hasOwnProperty_("l", ast.name),
								self.lazyAssign(intoId, self.nonComputedMember("l", ast.name))
							);
						}
				);
				recursionFn(intoId);
				break;
			case AST.MemberExpression:
				left = (nameId && (nameId.context = this.nextId())) || this.nextId();
				intoId = intoId || this.nextId();
				self.recurse(
					ast.object,
					left,
					undefined,
					function () {
						var member = null;
						var inAssignment = self.current().inAssignment;
						if (ast.computed) {
							right = self.nextId();
							if (inAssignment || self.state.computing === "assign") {
								member = self.unsafeComputedMember(left, right);
							} else {
								member = self.computedMember(left, right);
							}
						} else {
							if (inAssignment || self.state.computing === "assign") {
								member = self.unsafeNonComputedMember(left, ast.property.name);
							} else {
								member = self.nonComputedMember(left, ast.property.name);
							}
							right = ast.property.name;
						}

						if (ast.computed) {
							if (ast.property.type === AST.Literal) {
								self.recurse(ast.property, right);
							}
						}
						self.if_(
							self.and_(
								self.notNull(left),
								self.or_(
									self.isNull(member),
									self.hasOwnProperty_(left, right, ast.computed)
								)
							),
							function () {
								if (ast.computed) {
									if (ast.property.type !== AST.Literal) {
										self.recurse(ast.property, right);
									}
									if (create && create !== 1) {
										self.if_(self.not(member), self.lazyAssign(member, "{}"));
									}
									self.assign(intoId, member);
									if (nameId) {
										nameId.computed = true;
										nameId.name = right;
									}
								} else {
									if (create && create !== 1) {
										self.if_(
											self.isNull(member),
											self.lazyAssign(member, "{}")
										);
									}
									self.assign(intoId, member);
									if (nameId) {
										nameId.computed = false;
										nameId.name = ast.property.name;
									}
								}
							},
							function () {
								self.assign(intoId, "undefined");
							}
						);
						recursionFn(intoId);
					},
					!!create
				);
				break;
			case AST.CallExpression:
				intoId = intoId || this.nextId();
				if (ast.filter) {
					right = self.filter(ast.callee.name);
					args = [];
					forEach(ast.arguments, function (expr) {
						var argument = self.nextId();
						self.recurse(expr, argument);
						args.push(argument);
					});
					expression = right + ".call(" + right + "," + args.join(",") + ")";
					self.assign(intoId, expression);
					recursionFn(intoId);
				} else {
					right = self.nextId();
					left = {};
					args = [];
					self.recurse(ast.callee, right, left, function () {
						self.if_(
							self.notNull(right),
							function () {
								forEach(ast.arguments, function (expr) {
									self.recurse(
										expr,
										ast.constant ? undefined : self.nextId(),
										undefined,
										function (argument) {
											args.push(argument);
										}
									);
								});
								if (left.name) {
									var x = self.member(left.context, left.name, left.computed);
									expression =
										"(" +
										x +
										" === null ? null : " +
										self.unsafeMember(left.context, left.name, left.computed) +
										".call(" +
										[left.context].concat(args).join(",") +
										"))";
								} else {
									expression = right + "(" + args.join(",") + ")";
								}
								self.assign(intoId, expression);
							},
							function () {
								self.assign(intoId, "undefined");
							}
						);
						recursionFn(intoId);
					});
				}
				break;
			case AST.AssignmentExpression:
				right = this.nextId();
				left = {};
				self.current().inAssignment = true;
				this.recurse(
					ast.left,
					undefined,
					left,
					function () {
						self.if_(
							self.and_(
								self.notNull(left.context),
								self.or_(
									self.hasOwnProperty_(left.context, left.name),
									self.isNull(
										self.member(left.context, left.name, left.computed)
									)
								)
							),
							function () {
								self.recurse(ast.right, right);
								expression =
									self.member(left.context, left.name, left.computed) +
									ast.operator +
									right;
								self.assign(intoId, expression);
								recursionFn(intoId || expression);
							}
						);
						self.current().inAssignment = false;
						self.recurse(ast.right, right);
						self.current().inAssignment = true;
					},
					1
				);
				self.current().inAssignment = false;
				break;
			case AST.ArrayExpression:
				args = [];
				forEach(ast.elements, function (expr) {
					self.recurse(
						expr,
						ast.constant ? undefined : self.nextId(),
						undefined,
						function (argument) {
							args.push(argument);
						}
					);
				});
				expression = "[" + args.join(",") + "]";
				this.assign(intoId, expression);
				recursionFn(intoId || expression);
				break;
			case AST.ObjectExpression:
				args = [];
				computed = false;
				forEach(ast.properties, function (property) {
					if (property.computed) {
						computed = true;
					}
				});
				if (computed) {
					intoId = intoId || this.nextId();
					this.assign(intoId, "{}");
					forEach(ast.properties, function (property) {
						if (property.computed) {
							left = self.nextId();
							self.recurse(property.key, left);
						} else {
							left =
								property.key.type === AST.Identifier
									? property.key.name
									: "" + property.key.value;
						}
						right = self.nextId();
						self.recurse(property.value, right);
						self.assign(
							self.unsafeMember(intoId, left, property.computed),
							right
						);
					});
				} else {
					forEach(ast.properties, function (property) {
						self.recurse(
							property.value,
							ast.constant ? undefined : self.nextId(),
							undefined,
							function (expr) {
								args.push(
									self.escape(
										property.key.type === AST.Identifier
											? property.key.name
											: "" + property.key.value
									) +
										":" +
										expr
								);
							}
						);
					});
					expression = "{" + args.join(",") + "}";
					this.assign(intoId, expression);
				}
				recursionFn(intoId || expression);
				break;
			case AST.ThisExpression:
				this.assign(intoId, "s");
				recursionFn(intoId || "s");
				break;
			case AST.LocalsExpression:
				this.assign(intoId, "l");
				recursionFn(intoId || "l");
				break;
			case AST.NGValueParameter:
				this.assign(intoId, "v");
				recursionFn(intoId || "v");
				break;
		}
	},

	getHasOwnProperty: function (element, property) {
		var key = element + "." + property;
		var own = this.current().own;
		if (!own.hasOwnProperty(key)) {
			own[key] = this.nextId(
				false,
				element + "&&(" + this.escape(property) + " in " + element + ")"
			);
		}
		return own[key];
	},

	assign: function (id, value) {
		if (!id) {
			return;
		}
		this.current().body.push(id, "=", value, ";");
		return id;
	},

	filter: function (filterName) {
		if (!hasOwnProperty.call(this.state.filters, filterName)) {
			this.state.filters[filterName] = this.nextId(true);
		}
		return this.state.filters[filterName];
	},

	ifDefined: function (id, defaultValue) {
		return "ifDefined(" + id + "," + this.escape(defaultValue) + ")";
	},

	plus: function (left, right) {
		return "plus(" + left + "," + right + ")";
	},

	return_: function (id) {
		this.current().body.push("return ", id, ";");
	},

	if_: function (test, alternate, consequent) {
		if (test === true) {
			alternate();
		} else {
			var body = this.current().body;
			body.push("if(", test, "){");
			alternate();
			body.push("}");
			if (consequent) {
				body.push("else{");
				consequent();
				body.push("}");
			}
		}
	},
	or_: function (expr1, expr2) {
		return "(" + expr1 + ") || (" + expr2 + ")";
	},
	hasOwnProperty_: function (obj, prop, computed) {
		if (computed) {
			return "(Object.prototype.hasOwnProperty.call(" + obj + "," + prop + "))";
		}
		return "(Object.prototype.hasOwnProperty.call(" + obj + ",'" + prop + "'))";
	},
	and_: function (expr1, expr2) {
		return "(" + expr1 + ") && (" + expr2 + ")";
	},
	not: function (expression) {
		return "!(" + expression + ")";
	},

	isNull: function (expression) {
		return expression + "==null";
	},

	notNull: function (expression) {
		return expression + "!=null";
	},

	nonComputedMember: function (left, right) {
		var SAFE_IDENTIFIER = /^[$_a-zA-Z][$_a-zA-Z0-9]*$/;
		var UNSAFE_CHARACTERS = /[^$_a-zA-Z0-9]/g;
		var expr = "";
		if (SAFE_IDENTIFIER.test(right)) {
			expr = left + "." + right;
		} else {
			right = right.replace(UNSAFE_CHARACTERS, this.stringEscapeFn);
			expr = left + '["' + right + '"]';
		}

		return expr;
	},

	unsafeComputedMember: function (left, right) {
		return left + "[" + right + "]";
	},
	unsafeNonComputedMember: function (left, right) {
		return this.nonComputedMember(left, right);
	},

	computedMember: function (left, right) {
		if (this.state.computing === "assign") {
			return this.unsafeComputedMember(left, right);
		}
		// return left + "[" + right + "]";
		return (
			"(" +
			left +
			".hasOwnProperty(" +
			right +
			") ? " +
			left +
			"[" +
			right +
			"] : undefined)"
		);
	},

	unsafeMember: function (left, right, computed) {
		if (computed) {
			return this.unsafeComputedMember(left, right);
		}
		return this.unsafeNonComputedMember(left, right);
	},

	member: function (left, right, computed) {
		if (computed) {
			return this.computedMember(left, right);
		}
		return this.nonComputedMember(left, right);
	},

	getStringValue: function (item) {
		this.assign(item, "getStringValue(" + item + ")");
	},

	lazyRecurse: function (
		ast,
		intoId,
		nameId,
		recursionFn,
		create,
		skipWatchIdCheck
	) {
		var self = this;
		return function () {
			self.recurse(ast, intoId, nameId, recursionFn, create, skipWatchIdCheck);
		};
	},

	lazyAssign: function (id, value) {
		var self = this;
		return function () {
			self.assign(id, value);
		};
	},

	stringEscapeRegex: /[^ a-zA-Z0-9]/g,

	stringEscapeFn: function (c) {
		return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
	},

	escape: function (value) {
		if (isString(value)) {
			return (
				"'" + value.replace(this.stringEscapeRegex, this.stringEscapeFn) + "'"
			);
		}
		if (isNumber(value)) {
			return value.toString();
		}
		if (value === true) {
			return "true";
		}
		if (value === false) {
			return "false";
		}
		if (value === null) {
			return "null";
		}
		if (typeof value === "undefined") {
			return "undefined";
		}

		throw $parseMinErr("esc", "IMPOSSIBLE");
	},

	nextId: function (skip, init) {
		var id = "v" + this.state.nextId++;
		if (!skip) {
			this.current().vars.push(id + (init ? "=" + init : ""));
		}
		return id;
	},

	current: function () {
		return this.state[this.state.computing];
	},
};

function ASTInterpreter(astBuilder, $filter) {
	this.astBuilder = astBuilder;
	this.$filter = $filter;
}

ASTInterpreter.prototype = {
	compile: function (expression) {
		var self = this;
		var ast = this.astBuilder.ast(expression);
		findConstantAndWatchExpressions(ast, self.$filter);
		var assignable;
		var assign;
		if ((assignable = assignableAST(ast))) {
			assign = this.recurse(assignable);
		}
		var toWatch = getInputs(ast.body);
		var inputs;
		if (toWatch) {
			inputs = [];
			forEach(toWatch, function (watch, key) {
				var input = self.recurse(watch);
				watch.input = input;
				inputs.push(input);
				watch.watchId = key;
			});
		}
		var expressions = [];
		forEach(ast.body, function (expression) {
			expressions.push(self.recurse(expression.expression));
		});
		var wrappedFn =
			ast.body.length === 0
				? noop
				: ast.body.length === 1
					? expressions[0]
					: function (scope, locals) {
							var lastValue;
							forEach(expressions, function (exp) {
								lastValue = exp(scope, locals);
							});
							return lastValue;
						};

		if (assign) {
			wrappedFn.assign = function (scope, value, locals) {
				return assign(scope, locals, value);
			};
		}

		var fn = function (scope, locals) {
			return runWithFunctionConstructorProtection(function () {
				return wrappedFn(scope, locals);
			});
		};
		fn.assign = function (scope, value, locals) {
			return runWithFunctionConstructorProtection(function () {
				return wrappedFn.assign(scope, value, locals);
			});
		};

		if (inputs) {
			fn.inputs = inputs;
		}
		fn.ast = ast;
		fn.literal = isLiteral(ast);
		fn.constant = isConstant(ast);
		return fn;
	},

	recurse: function (ast, context, create) {
		var left,
			right,
			self = this,
			args;
		if (ast.input) {
			return this.inputs(ast.input, ast.watchId);
		}
		switch (ast.type) {
			case AST.Literal:
				return this.value(ast.value, context);
			case AST.UnaryExpression:
				right = this.recurse(ast.argument);
				return this["unary" + ast.operator](right, context);
			case AST.BinaryExpression:
				left = this.recurse(ast.left);
				right = this.recurse(ast.right);
				return this["binary" + ast.operator](left, right, context);
			case AST.LogicalExpression:
				left = this.recurse(ast.left);
				right = this.recurse(ast.right);
				return this["binary" + ast.operator](left, right, context);
			case AST.ConditionalExpression:
				return this["ternary?:"](
					this.recurse(ast.test),
					this.recurse(ast.alternate),
					this.recurse(ast.consequent),
					context
				);
			case AST.Identifier:
				return self.identifier(ast.name, context, create);
			case AST.MemberExpression:
				left = this.recurse(ast.object, false, !!create);
				if (!ast.computed) {
					right = ast.property.name;
				}
				if (ast.computed) {
					right = this.recurse(ast.property);
				}

				return ast.computed
					? this.computedMember(left, right, context, create)
					: this.nonComputedMember(left, right, context, create);
			case AST.CallExpression:
				args = [];
				forEach(ast.arguments, function (expr) {
					args.push(self.recurse(expr));
				});
				if (ast.filter) {
					right = this.$filter(ast.callee.name);
				}
				if (!ast.filter) {
					right = this.recurse(ast.callee, true);
				}
				return ast.filter
					? function (scope, locals, assign, inputs) {
							var values = [];
							for (var i = 0; i < args.length; ++i) {
								values.push(args[i](scope, locals, assign, inputs));
							}
							var value = right.apply(undefined, values, inputs);
							return context
								? { context: undefined, name: undefined, value: value }
								: value;
						}
					: function (scope, locals, assign, inputs) {
							var rhs = right(scope, locals, assign, inputs);
							var value;
							if (rhs.value != null) {
								var values = [];
								for (var i = 0; i < args.length; ++i) {
									values.push(args[i](scope, locals, assign, inputs));
								}
								value = rhs.value.apply(rhs.context, values);
							}
							return context ? { value: value } : value;
						};
			case AST.AssignmentExpression:
				left = this.recurse(ast.left, true, 1);
				right = this.recurse(ast.right);
				return function (scope, locals, assign, inputs) {
					var lhs = left(scope, false, assign, inputs);
					var rhs = right(scope, locals, assign, inputs);
					lhs.context[lhs.name] = rhs;
					return context ? { value: rhs } : rhs;
				};
			case AST.ArrayExpression:
				args = [];
				forEach(ast.elements, function (expr) {
					args.push(self.recurse(expr));
				});
				return function (scope, locals, assign, inputs) {
					var value = [];
					for (var i = 0; i < args.length; ++i) {
						value.push(args[i](scope, locals, assign, inputs));
					}
					return context ? { value: value } : value;
				};
			case AST.ObjectExpression:
				args = [];
				forEach(ast.properties, function (property) {
					if (property.computed) {
						args.push({
							key: self.recurse(property.key),
							computed: true,
							value: self.recurse(property.value),
						});
					} else {
						args.push({
							key:
								property.key.type === AST.Identifier
									? property.key.name
									: "" + property.key.value,
							computed: false,
							value: self.recurse(property.value),
						});
					}
				});
				return function (scope, locals, assign, inputs) {
					var value = {};
					for (var i = 0; i < args.length; ++i) {
						if (args[i].computed) {
							value[args[i].key(scope, locals, assign, inputs)] = args[i].value(
								scope,
								locals,
								assign,
								inputs
							);
						} else {
							value[args[i].key] = args[i].value(scope, locals, assign, inputs);
						}
					}
					return context ? { value: value } : value;
				};
			case AST.ThisExpression:
				return function (scope) {
					return context ? { value: scope } : scope;
				};
			case AST.LocalsExpression:
				return function (scope, locals) {
					return context ? { value: locals } : locals;
				};
			case AST.NGValueParameter:
				return function (scope, locals, assign) {
					return context ? { value: assign } : assign;
				};
		}
	},

	"unary+": function (argument, context) {
		return function (scope, locals, assign, inputs) {
			var arg = argument(scope, locals, assign, inputs);
			if (isDefined(arg)) {
				arg = +arg;
			} else {
				arg = 0;
			}
			return context ? { value: arg } : arg;
		};
	},
	"unary-": function (argument, context) {
		return function (scope, locals, assign, inputs) {
			var arg = argument(scope, locals, assign, inputs);
			if (isDefined(arg)) {
				arg = -arg;
			} else {
				arg = -0;
			}
			return context ? { value: arg } : arg;
		};
	},
	"unary!": function (argument, context) {
		return function (scope, locals, assign, inputs) {
			var arg = !argument(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary+": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var lhs = left(scope, locals, assign, inputs);
			var rhs = right(scope, locals, assign, inputs);
			var arg = plusFn(lhs, rhs);
			return context ? { value: arg } : arg;
		};
	},
	"binary-": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var lhs = left(scope, locals, assign, inputs);
			var rhs = right(scope, locals, assign, inputs);
			var arg = (isDefined(lhs) ? lhs : 0) - (isDefined(rhs) ? rhs : 0);
			return context ? { value: arg } : arg;
		};
	},
	"binary*": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) *
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary/": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) /
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary%": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) %
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary===": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) ===
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary!==": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) !==
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary==": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) ==
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary!=": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) !=
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary<": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) <
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary>": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) >
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary<=": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) <=
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary>=": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) >=
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary&&": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) &&
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"binary||": function (left, right, context) {
		return function (scope, locals, assign, inputs) {
			var arg =
				left(scope, locals, assign, inputs) ||
				right(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	"ternary?:": function (test, alternate, consequent, context) {
		return function (scope, locals, assign, inputs) {
			var arg = test(scope, locals, assign, inputs)
				? alternate(scope, locals, assign, inputs)
				: consequent(scope, locals, assign, inputs);
			return context ? { value: arg } : arg;
		};
	},
	value: function (value, context) {
		return function () {
			return context
				? { context: undefined, name: undefined, value: value }
				: value;
		};
	},
	identifier: function (name, context, create) {
		return function (scope, locals) {
			var base = locals && name in locals ? locals : scope;
			if (create && create !== 1 && base && base[name] == null) {
				base[name] = {};
			}
			var value;
			if (base && hasOwnProperty.call(base, name)) {
				value = base ? base[name] : undefined;
			}
			if (context) {
				return { context: base, name: name, value: value };
			}
			return value;
		};
	},
	computedMember: function (left, right, context, create) {
		return function (scope, locals, assign, inputs) {
			var lhs = left(scope, locals, assign, inputs);
			var rhs;
			var value;
			if (lhs != null) {
				rhs = right(scope, locals, assign, inputs);
				rhs = getStringValue(rhs);
				if (create && create !== 1) {
					if (lhs && !lhs[rhs]) {
						lhs[rhs] = {};
					}
				}
				if (Object.prototype.hasOwnProperty.call(lhs, rhs)) {
					value = lhs[rhs];
				}
			}
			if (context) {
				return { context: lhs, name: rhs, value: value };
			}
			return value;
		};
	},
	nonComputedMember: function (left, right, context, create) {
		return function (scope, locals, assign, inputs) {
			var lhs = left(scope, locals, assign, inputs);
			if (create && create !== 1) {
				if (lhs && lhs[right] == null) {
					lhs[right] = {};
				}
			}
			var value = undefined;
			if (lhs != null && Object.prototype.hasOwnProperty.call(lhs, right)) {
				value = lhs[right];
			}

			if (context) {
				return { context: lhs, name: right, value: value };
			}
			return value;
		};
	},
	inputs: function (input, watchId) {
		return function (scope, value, locals, inputs) {
			if (inputs) {
				return inputs[watchId];
			}
			return input(scope, value, locals);
		};
	},
};

/**
 * @constructor
 */
var Parser = function Parser(lexer, $filter, options) {
	this.lexer = lexer;
	this.$filter = $filter;
	options = options || {};
	options.handleThis = options.handleThis != null ? options.handleThis : true;
	this.options = options;
	this.ast = new AST(lexer, options);
	this.ast.selfReferential = {
		$locals: { type: AST.LocalsExpression },
	};
	if (options.handleThis) {
		this.ast.selfReferential.this = { type: AST.ThisExpression };
	}
	this.astCompiler = options.csp
		? new ASTInterpreter(this.ast, $filter)
		: new ASTCompiler(this.ast, $filter);
};

Parser.prototype = {
	constructor: Parser,

	parse: function (text) {
		return this.astCompiler.compile(text);
	},
};

exports.Lexer = Lexer;
exports.Parser = Parser;


/***/ }),

/***/ "./node_modules/marked/lib/marked.cjs":
/*!********************************************!*\
  !*** ./node_modules/marked/lib/marked.cjs ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

/**
 * marked v15.0.8 - a markdown parser
 * Copyright (c) 2011-2025, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */



/**
 * Gets the original marked default options.
 */
function _getDefaults() {
    return {
        async: false,
        breaks: false,
        extensions: null,
        gfm: true,
        hooks: null,
        pedantic: false,
        renderer: null,
        silent: false,
        tokenizer: null,
        walkTokens: null,
    };
}
exports.defaults = _getDefaults();
function changeDefaults(newDefaults) {
    exports.defaults = newDefaults;
}

const noopTest = { exec: () => null };
function edit(regex, opt = '') {
    let source = typeof regex === 'string' ? regex : regex.source;
    const obj = {
        replace: (name, val) => {
            let valSource = typeof val === 'string' ? val : val.source;
            valSource = valSource.replace(other.caret, '$1');
            source = source.replace(name, valSource);
            return obj;
        },
        getRegex: () => {
            return new RegExp(source, opt);
        },
    };
    return obj;
}
const other = {
    codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
    outputLinkReplace: /\\([\[\]])/g,
    indentCodeCompensation: /^(\s+)(?:```)/,
    beginningSpace: /^\s+/,
    endingHash: /#$/,
    startingSpaceChar: /^ /,
    endingSpaceChar: / $/,
    nonSpaceChar: /[^ ]/,
    newLineCharGlobal: /\n/g,
    tabCharGlobal: /\t/g,
    multipleSpaceGlobal: /\s+/g,
    blankLine: /^[ \t]*$/,
    doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
    blockquoteStart: /^ {0,3}>/,
    blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
    blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
    listReplaceTabs: /^\t+/,
    listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
    listIsTask: /^\[[ xX]\] /,
    listReplaceTask: /^\[[ xX]\] +/,
    anyLine: /\n.*\n/,
    hrefBrackets: /^<(.*)>$/,
    tableDelimiter: /[:|]/,
    tableAlignChars: /^\||\| *$/g,
    tableRowBlankLine: /\n[ \t]*$/,
    tableAlignRight: /^ *-+: *$/,
    tableAlignCenter: /^ *:-+: *$/,
    tableAlignLeft: /^ *:-+ *$/,
    startATag: /^<a /i,
    endATag: /^<\/a>/i,
    startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
    endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
    startAngleBracket: /^</,
    endAngleBracket: />$/,
    pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
    unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
    escapeTest: /[&<>"']/,
    escapeReplace: /[&<>"']/g,
    escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
    caret: /(^|[^\[])\^/g,
    percentDecode: /%25/g,
    findPipe: /\|/g,
    splitPipe: / \|/,
    slashPipe: /\\\|/g,
    carriageReturn: /\r\n|\r/g,
    spaceLine: /^ +$/gm,
    notSpaceStart: /^\S*/,
    endingNewline: /\n$/,
    listItemRegex: (bull) => new RegExp(`^( {0,3}${bull})((?:[\t ][^\\n]*)?(?:\\n|$))`),
    nextBulletRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`),
    hrRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
    fencesBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`),
    headingBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`),
    htmlBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}<(?:[a-z].*>|!--)`, 'i'),
};
/**
 * Block-Level Grammar
 */
const newline = /^(?:[ \t]*(?:\n|$))+/;
const blockCode = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
const fences = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
const hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
const heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
const bullet = /(?:[*+-]|\d{1,9}[.)])/;
const lheadingCore = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
const lheading = edit(lheadingCore)
    .replace(/bull/g, bullet) // lists can interrupt
    .replace(/blockCode/g, /(?: {4}| {0,3}\t)/) // indented code blocks can interrupt
    .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/) // fenced code blocks can interrupt
    .replace(/blockquote/g, / {0,3}>/) // blockquote can interrupt
    .replace(/heading/g, / {0,3}#{1,6}/) // ATX heading can interrupt
    .replace(/html/g, / {0,3}<[^\n>]+>\n/) // block html can interrupt
    .replace(/\|table/g, '') // table not in commonmark
    .getRegex();
const lheadingGfm = edit(lheadingCore)
    .replace(/bull/g, bullet) // lists can interrupt
    .replace(/blockCode/g, /(?: {4}| {0,3}\t)/) // indented code blocks can interrupt
    .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/) // fenced code blocks can interrupt
    .replace(/blockquote/g, / {0,3}>/) // blockquote can interrupt
    .replace(/heading/g, / {0,3}#{1,6}/) // ATX heading can interrupt
    .replace(/html/g, / {0,3}<[^\n>]+>\n/) // block html can interrupt
    .replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/) // table can interrupt
    .getRegex();
const _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
const blockText = /^[^\n]+/;
const _blockLabel = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
const def = edit(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/)
    .replace('label', _blockLabel)
    .replace('title', /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/)
    .getRegex();
const list = edit(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/)
    .replace(/bull/g, bullet)
    .getRegex();
const _tag = 'address|article|aside|base|basefont|blockquote|body|caption'
    + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
    + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
    + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
    + '|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title'
    + '|tr|track|ul';
const _comment = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
const html = edit('^ {0,3}(?:' // optional indentation
    + '<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
    + '|comment[^\\n]*(\\n+|$)' // (2)
    + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
    + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
    + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
    + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)' // (6)
    + '|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)' // (7) open tag
    + '|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)' // (7) closing tag
    + ')', 'i')
    .replace('comment', _comment)
    .replace('tag', _tag)
    .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
    .getRegex();
const paragraph = edit(_paragraph)
    .replace('hr', hr)
    .replace('heading', ' {0,3}#{1,6}(?:\\s|$)')
    .replace('|lheading', '') // setext headings don't interrupt commonmark paragraphs
    .replace('|table', '')
    .replace('blockquote', ' {0,3}>')
    .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
    .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
    .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
    .replace('tag', _tag) // pars can be interrupted by type (6) html blocks
    .getRegex();
const blockquote = edit(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/)
    .replace('paragraph', paragraph)
    .getRegex();
/**
 * Normal Block Grammar
 */
const blockNormal = {
    blockquote,
    code: blockCode,
    def,
    fences,
    heading,
    hr,
    html,
    lheading,
    list,
    newline,
    paragraph,
    table: noopTest,
    text: blockText,
};
/**
 * GFM Block Grammar
 */
const gfmTable = edit('^ *([^\\n ].*)\\n' // Header
    + ' {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)' // Align
    + '(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)') // Cells
    .replace('hr', hr)
    .replace('heading', ' {0,3}#{1,6}(?:\\s|$)')
    .replace('blockquote', ' {0,3}>')
    .replace('code', '(?: {4}| {0,3}\t)[^\\n]')
    .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
    .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
    .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
    .replace('tag', _tag) // tables can be interrupted by type (6) html blocks
    .getRegex();
const blockGfm = {
    ...blockNormal,
    lheading: lheadingGfm,
    table: gfmTable,
    paragraph: edit(_paragraph)
        .replace('hr', hr)
        .replace('heading', ' {0,3}#{1,6}(?:\\s|$)')
        .replace('|lheading', '') // setext headings don't interrupt commonmark paragraphs
        .replace('table', gfmTable) // interrupt paragraphs with table
        .replace('blockquote', ' {0,3}>')
        .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
        .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
        .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
        .replace('tag', _tag) // pars can be interrupted by type (6) html blocks
        .getRegex(),
};
/**
 * Pedantic grammar (original John Gruber's loose markdown specification)
 */
const blockPedantic = {
    ...blockNormal,
    html: edit('^ *(?:comment *(?:\\n|\\s*$)'
        + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
        + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
        .replace('comment', _comment)
        .replace(/tag/g, '(?!(?:'
        + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
        + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
        + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
        .getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: noopTest, // fences not supported
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: edit(_paragraph)
        .replace('hr', hr)
        .replace('heading', ' *#{1,6} *[^\n]')
        .replace('lheading', lheading)
        .replace('|table', '')
        .replace('blockquote', ' {0,3}>')
        .replace('|fences', '')
        .replace('|list', '')
        .replace('|html', '')
        .replace('|tag', '')
        .getRegex(),
};
/**
 * Inline-Level Grammar
 */
const escape$1 = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
const inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
const br = /^( {2,}|\\)\n(?!\s*$)/;
const inlineText = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
// list of unicode punctuation marks, plus any missing characters from CommonMark spec
const _punctuation = /[\p{P}\p{S}]/u;
const _punctuationOrSpace = /[\s\p{P}\p{S}]/u;
const _notPunctuationOrSpace = /[^\s\p{P}\p{S}]/u;
const punctuation = edit(/^((?![*_])punctSpace)/, 'u')
    .replace(/punctSpace/g, _punctuationOrSpace).getRegex();
// GFM allows ~ inside strong and em for strikethrough
const _punctuationGfmStrongEm = /(?!~)[\p{P}\p{S}]/u;
const _punctuationOrSpaceGfmStrongEm = /(?!~)[\s\p{P}\p{S}]/u;
const _notPunctuationOrSpaceGfmStrongEm = /(?:[^\s\p{P}\p{S}]|~)/u;
// sequences em should skip over [title](link), `code`, <html>
const blockSkip = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g;
const emStrongLDelimCore = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
const emStrongLDelim = edit(emStrongLDelimCore, 'u')
    .replace(/punct/g, _punctuation)
    .getRegex();
const emStrongLDelimGfm = edit(emStrongLDelimCore, 'u')
    .replace(/punct/g, _punctuationGfmStrongEm)
    .getRegex();
const emStrongRDelimAstCore = '^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)' // Skip orphan inside strong
    + '|[^*]+(?=[^*])' // Consume to delim
    + '|(?!\\*)punct(\\*+)(?=[\\s]|$)' // (1) #*** can only be a Right Delimiter
    + '|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)' // (2) a***#, a*** can only be a Right Delimiter
    + '|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)' // (3) #***a, ***a can only be Left Delimiter
    + '|[\\s](\\*+)(?!\\*)(?=punct)' // (4) ***# can only be Left Delimiter
    + '|(?!\\*)punct(\\*+)(?!\\*)(?=punct)' // (5) #***# can be either Left or Right Delimiter
    + '|notPunctSpace(\\*+)(?=notPunctSpace)'; // (6) a***a can be either Left or Right Delimiter
const emStrongRDelimAst = edit(emStrongRDelimAstCore, 'gu')
    .replace(/notPunctSpace/g, _notPunctuationOrSpace)
    .replace(/punctSpace/g, _punctuationOrSpace)
    .replace(/punct/g, _punctuation)
    .getRegex();
const emStrongRDelimAstGfm = edit(emStrongRDelimAstCore, 'gu')
    .replace(/notPunctSpace/g, _notPunctuationOrSpaceGfmStrongEm)
    .replace(/punctSpace/g, _punctuationOrSpaceGfmStrongEm)
    .replace(/punct/g, _punctuationGfmStrongEm)
    .getRegex();
// (6) Not allowed for _
const emStrongRDelimUnd = edit('^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)' // Skip orphan inside strong
    + '|[^_]+(?=[^_])' // Consume to delim
    + '|(?!_)punct(_+)(?=[\\s]|$)' // (1) #___ can only be a Right Delimiter
    + '|notPunctSpace(_+)(?!_)(?=punctSpace|$)' // (2) a___#, a___ can only be a Right Delimiter
    + '|(?!_)punctSpace(_+)(?=notPunctSpace)' // (3) #___a, ___a can only be Left Delimiter
    + '|[\\s](_+)(?!_)(?=punct)' // (4) ___# can only be Left Delimiter
    + '|(?!_)punct(_+)(?!_)(?=punct)', 'gu') // (5) #___# can be either Left or Right Delimiter
    .replace(/notPunctSpace/g, _notPunctuationOrSpace)
    .replace(/punctSpace/g, _punctuationOrSpace)
    .replace(/punct/g, _punctuation)
    .getRegex();
const anyPunctuation = edit(/\\(punct)/, 'gu')
    .replace(/punct/g, _punctuation)
    .getRegex();
const autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/)
    .replace('scheme', /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/)
    .replace('email', /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/)
    .getRegex();
const _inlineComment = edit(_comment).replace('(?:-->|$)', '-->').getRegex();
const tag = edit('^comment'
    + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>') // CDATA section
    .replace('comment', _inlineComment)
    .replace('attribute', /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/)
    .getRegex();
const _inlineLabel = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
const link = edit(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/)
    .replace('label', _inlineLabel)
    .replace('href', /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/)
    .replace('title', /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/)
    .getRegex();
const reflink = edit(/^!?\[(label)\]\[(ref)\]/)
    .replace('label', _inlineLabel)
    .replace('ref', _blockLabel)
    .getRegex();
const nolink = edit(/^!?\[(ref)\](?:\[\])?/)
    .replace('ref', _blockLabel)
    .getRegex();
const reflinkSearch = edit('reflink|nolink(?!\\()', 'g')
    .replace('reflink', reflink)
    .replace('nolink', nolink)
    .getRegex();
/**
 * Normal Inline Grammar
 */
const inlineNormal = {
    _backpedal: noopTest, // only used for GFM url
    anyPunctuation,
    autolink,
    blockSkip,
    br,
    code: inlineCode,
    del: noopTest,
    emStrongLDelim,
    emStrongRDelimAst,
    emStrongRDelimUnd,
    escape: escape$1,
    link,
    nolink,
    punctuation,
    reflink,
    reflinkSearch,
    tag,
    text: inlineText,
    url: noopTest,
};
/**
 * Pedantic Inline Grammar
 */
const inlinePedantic = {
    ...inlineNormal,
    link: edit(/^!?\[(label)\]\((.*?)\)/)
        .replace('label', _inlineLabel)
        .getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
        .replace('label', _inlineLabel)
        .getRegex(),
};
/**
 * GFM Inline Grammar
 */
const inlineGfm = {
    ...inlineNormal,
    emStrongRDelimAst: emStrongRDelimAstGfm,
    emStrongLDelim: emStrongLDelimGfm,
    url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, 'i')
        .replace('email', /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/)
        .getRegex(),
    _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/,
};
/**
 * GFM + Line Breaks Inline Grammar
 */
const inlineBreaks = {
    ...inlineGfm,
    br: edit(br).replace('{2,}', '*').getRegex(),
    text: edit(inlineGfm.text)
        .replace('\\b_', '\\b_| {2,}\\n')
        .replace(/\{2,\}/g, '*')
        .getRegex(),
};
/**
 * exports
 */
const block = {
    normal: blockNormal,
    gfm: blockGfm,
    pedantic: blockPedantic,
};
const inline = {
    normal: inlineNormal,
    gfm: inlineGfm,
    breaks: inlineBreaks,
    pedantic: inlinePedantic,
};

/**
 * Helpers
 */
const escapeReplacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};
const getEscapeReplacement = (ch) => escapeReplacements[ch];
function escape(html, encode) {
    if (encode) {
        if (other.escapeTest.test(html)) {
            return html.replace(other.escapeReplace, getEscapeReplacement);
        }
    }
    else {
        if (other.escapeTestNoEncode.test(html)) {
            return html.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
        }
    }
    return html;
}
function cleanUrl(href) {
    try {
        href = encodeURI(href).replace(other.percentDecode, '%');
    }
    catch {
        return null;
    }
    return href;
}
function splitCells(tableRow, count) {
    // ensure that every cell-delimiting pipe has a space
    // before it to distinguish it from an escaped pipe
    const row = tableRow.replace(other.findPipe, (match, offset, str) => {
        let escaped = false;
        let curr = offset;
        while (--curr >= 0 && str[curr] === '\\')
            escaped = !escaped;
        if (escaped) {
            // odd number of slashes means | is escaped
            // so we leave it alone
            return '|';
        }
        else {
            // add space before unescaped |
            return ' |';
        }
    }), cells = row.split(other.splitPipe);
    let i = 0;
    // First/last cell in a row cannot be empty if it has no leading/trailing pipe
    if (!cells[0].trim()) {
        cells.shift();
    }
    if (cells.length > 0 && !cells.at(-1)?.trim()) {
        cells.pop();
    }
    if (count) {
        if (cells.length > count) {
            cells.splice(count);
        }
        else {
            while (cells.length < count)
                cells.push('');
        }
    }
    for (; i < cells.length; i++) {
        // leading or trailing whitespace is ignored per the gfm spec
        cells[i] = cells[i].trim().replace(other.slashPipe, '|');
    }
    return cells;
}
/**
 * Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
 * /c*$/ is vulnerable to REDOS.
 *
 * @param str
 * @param c
 * @param invert Remove suffix of non-c chars instead. Default falsey.
 */
function rtrim(str, c, invert) {
    const l = str.length;
    if (l === 0) {
        return '';
    }
    // Length of suffix matching the invert condition.
    let suffLen = 0;
    // Step left until we fail to match the invert condition.
    while (suffLen < l) {
        const currChar = str.charAt(l - suffLen - 1);
        if (currChar === c && true) {
            suffLen++;
        }
        else {
            break;
        }
    }
    return str.slice(0, l - suffLen);
}
function findClosingBracket(str, b) {
    if (str.indexOf(b[1]) === -1) {
        return -1;
    }
    let level = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '\\') {
            i++;
        }
        else if (str[i] === b[0]) {
            level++;
        }
        else if (str[i] === b[1]) {
            level--;
            if (level < 0) {
                return i;
            }
        }
    }
    return -1;
}

function outputLink(cap, link, raw, lexer, rules) {
    const href = link.href;
    const title = link.title || null;
    const text = cap[1].replace(rules.other.outputLinkReplace, '$1');
    if (cap[0].charAt(0) !== '!') {
        lexer.state.inLink = true;
        const token = {
            type: 'link',
            raw,
            href,
            title,
            text,
            tokens: lexer.inlineTokens(text),
        };
        lexer.state.inLink = false;
        return token;
    }
    return {
        type: 'image',
        raw,
        href,
        title,
        text,
    };
}
function indentCodeCompensation(raw, text, rules) {
    const matchIndentToCode = raw.match(rules.other.indentCodeCompensation);
    if (matchIndentToCode === null) {
        return text;
    }
    const indentToCode = matchIndentToCode[1];
    return text
        .split('\n')
        .map(node => {
        const matchIndentInNode = node.match(rules.other.beginningSpace);
        if (matchIndentInNode === null) {
            return node;
        }
        const [indentInNode] = matchIndentInNode;
        if (indentInNode.length >= indentToCode.length) {
            return node.slice(indentToCode.length);
        }
        return node;
    })
        .join('\n');
}
/**
 * Tokenizer
 */
class _Tokenizer {
    options;
    rules; // set by the lexer
    lexer; // set by the lexer
    constructor(options) {
        this.options = options || exports.defaults;
    }
    space(src) {
        const cap = this.rules.block.newline.exec(src);
        if (cap && cap[0].length > 0) {
            return {
                type: 'space',
                raw: cap[0],
            };
        }
    }
    code(src) {
        const cap = this.rules.block.code.exec(src);
        if (cap) {
            const text = cap[0].replace(this.rules.other.codeRemoveIndent, '');
            return {
                type: 'code',
                raw: cap[0],
                codeBlockStyle: 'indented',
                text: !this.options.pedantic
                    ? rtrim(text, '\n')
                    : text,
            };
        }
    }
    fences(src) {
        const cap = this.rules.block.fences.exec(src);
        if (cap) {
            const raw = cap[0];
            const text = indentCodeCompensation(raw, cap[3] || '', this.rules);
            return {
                type: 'code',
                raw,
                lang: cap[2] ? cap[2].trim().replace(this.rules.inline.anyPunctuation, '$1') : cap[2],
                text,
            };
        }
    }
    heading(src) {
        const cap = this.rules.block.heading.exec(src);
        if (cap) {
            let text = cap[2].trim();
            // remove trailing #s
            if (this.rules.other.endingHash.test(text)) {
                const trimmed = rtrim(text, '#');
                if (this.options.pedantic) {
                    text = trimmed.trim();
                }
                else if (!trimmed || this.rules.other.endingSpaceChar.test(trimmed)) {
                    // CommonMark requires space before trailing #s
                    text = trimmed.trim();
                }
            }
            return {
                type: 'heading',
                raw: cap[0],
                depth: cap[1].length,
                text,
                tokens: this.lexer.inline(text),
            };
        }
    }
    hr(src) {
        const cap = this.rules.block.hr.exec(src);
        if (cap) {
            return {
                type: 'hr',
                raw: rtrim(cap[0], '\n'),
            };
        }
    }
    blockquote(src) {
        const cap = this.rules.block.blockquote.exec(src);
        if (cap) {
            let lines = rtrim(cap[0], '\n').split('\n');
            let raw = '';
            let text = '';
            const tokens = [];
            while (lines.length > 0) {
                let inBlockquote = false;
                const currentLines = [];
                let i;
                for (i = 0; i < lines.length; i++) {
                    // get lines up to a continuation
                    if (this.rules.other.blockquoteStart.test(lines[i])) {
                        currentLines.push(lines[i]);
                        inBlockquote = true;
                    }
                    else if (!inBlockquote) {
                        currentLines.push(lines[i]);
                    }
                    else {
                        break;
                    }
                }
                lines = lines.slice(i);
                const currentRaw = currentLines.join('\n');
                const currentText = currentRaw
                    // precede setext continuation with 4 spaces so it isn't a setext
                    .replace(this.rules.other.blockquoteSetextReplace, '\n    $1')
                    .replace(this.rules.other.blockquoteSetextReplace2, '');
                raw = raw ? `${raw}\n${currentRaw}` : currentRaw;
                text = text ? `${text}\n${currentText}` : currentText;
                // parse blockquote lines as top level tokens
                // merge paragraphs if this is a continuation
                const top = this.lexer.state.top;
                this.lexer.state.top = true;
                this.lexer.blockTokens(currentText, tokens, true);
                this.lexer.state.top = top;
                // if there is no continuation then we are done
                if (lines.length === 0) {
                    break;
                }
                const lastToken = tokens.at(-1);
                if (lastToken?.type === 'code') {
                    // blockquote continuation cannot be preceded by a code block
                    break;
                }
                else if (lastToken?.type === 'blockquote') {
                    // include continuation in nested blockquote
                    const oldToken = lastToken;
                    const newText = oldToken.raw + '\n' + lines.join('\n');
                    const newToken = this.blockquote(newText);
                    tokens[tokens.length - 1] = newToken;
                    raw = raw.substring(0, raw.length - oldToken.raw.length) + newToken.raw;
                    text = text.substring(0, text.length - oldToken.text.length) + newToken.text;
                    break;
                }
                else if (lastToken?.type === 'list') {
                    // include continuation in nested list
                    const oldToken = lastToken;
                    const newText = oldToken.raw + '\n' + lines.join('\n');
                    const newToken = this.list(newText);
                    tokens[tokens.length - 1] = newToken;
                    raw = raw.substring(0, raw.length - lastToken.raw.length) + newToken.raw;
                    text = text.substring(0, text.length - oldToken.raw.length) + newToken.raw;
                    lines = newText.substring(tokens.at(-1).raw.length).split('\n');
                    continue;
                }
            }
            return {
                type: 'blockquote',
                raw,
                tokens,
                text,
            };
        }
    }
    list(src) {
        let cap = this.rules.block.list.exec(src);
        if (cap) {
            let bull = cap[1].trim();
            const isordered = bull.length > 1;
            const list = {
                type: 'list',
                raw: '',
                ordered: isordered,
                start: isordered ? +bull.slice(0, -1) : '',
                loose: false,
                items: [],
            };
            bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
            if (this.options.pedantic) {
                bull = isordered ? bull : '[*+-]';
            }
            // Get next list item
            const itemRegex = this.rules.other.listItemRegex(bull);
            let endsWithBlankLine = false;
            // Check if current bullet point can start a new List Item
            while (src) {
                let endEarly = false;
                let raw = '';
                let itemContents = '';
                if (!(cap = itemRegex.exec(src))) {
                    break;
                }
                if (this.rules.block.hr.test(src)) { // End list if bullet was actually HR (possibly move into itemRegex?)
                    break;
                }
                raw = cap[0];
                src = src.substring(raw.length);
                let line = cap[2].split('\n', 1)[0].replace(this.rules.other.listReplaceTabs, (t) => ' '.repeat(3 * t.length));
                let nextLine = src.split('\n', 1)[0];
                let blankLine = !line.trim();
                let indent = 0;
                if (this.options.pedantic) {
                    indent = 2;
                    itemContents = line.trimStart();
                }
                else if (blankLine) {
                    indent = cap[1].length + 1;
                }
                else {
                    indent = cap[2].search(this.rules.other.nonSpaceChar); // Find first non-space char
                    indent = indent > 4 ? 1 : indent; // Treat indented code blocks (> 4 spaces) as having only 1 indent
                    itemContents = line.slice(indent);
                    indent += cap[1].length;
                }
                if (blankLine && this.rules.other.blankLine.test(nextLine)) { // Items begin with at most one blank line
                    raw += nextLine + '\n';
                    src = src.substring(nextLine.length + 1);
                    endEarly = true;
                }
                if (!endEarly) {
                    const nextBulletRegex = this.rules.other.nextBulletRegex(indent);
                    const hrRegex = this.rules.other.hrRegex(indent);
                    const fencesBeginRegex = this.rules.other.fencesBeginRegex(indent);
                    const headingBeginRegex = this.rules.other.headingBeginRegex(indent);
                    const htmlBeginRegex = this.rules.other.htmlBeginRegex(indent);
                    // Check if following lines should be included in List Item
                    while (src) {
                        const rawLine = src.split('\n', 1)[0];
                        let nextLineWithoutTabs;
                        nextLine = rawLine;
                        // Re-align to follow commonmark nesting rules
                        if (this.options.pedantic) {
                            nextLine = nextLine.replace(this.rules.other.listReplaceNesting, '  ');
                            nextLineWithoutTabs = nextLine;
                        }
                        else {
                            nextLineWithoutTabs = nextLine.replace(this.rules.other.tabCharGlobal, '    ');
                        }
                        // End list item if found code fences
                        if (fencesBeginRegex.test(nextLine)) {
                            break;
                        }
                        // End list item if found start of new heading
                        if (headingBeginRegex.test(nextLine)) {
                            break;
                        }
                        // End list item if found start of html block
                        if (htmlBeginRegex.test(nextLine)) {
                            break;
                        }
                        // End list item if found start of new bullet
                        if (nextBulletRegex.test(nextLine)) {
                            break;
                        }
                        // Horizontal rule found
                        if (hrRegex.test(nextLine)) {
                            break;
                        }
                        if (nextLineWithoutTabs.search(this.rules.other.nonSpaceChar) >= indent || !nextLine.trim()) { // Dedent if possible
                            itemContents += '\n' + nextLineWithoutTabs.slice(indent);
                        }
                        else {
                            // not enough indentation
                            if (blankLine) {
                                break;
                            }
                            // paragraph continuation unless last line was a different block level element
                            if (line.replace(this.rules.other.tabCharGlobal, '    ').search(this.rules.other.nonSpaceChar) >= 4) { // indented code block
                                break;
                            }
                            if (fencesBeginRegex.test(line)) {
                                break;
                            }
                            if (headingBeginRegex.test(line)) {
                                break;
                            }
                            if (hrRegex.test(line)) {
                                break;
                            }
                            itemContents += '\n' + nextLine;
                        }
                        if (!blankLine && !nextLine.trim()) { // Check if current line is blank
                            blankLine = true;
                        }
                        raw += rawLine + '\n';
                        src = src.substring(rawLine.length + 1);
                        line = nextLineWithoutTabs.slice(indent);
                    }
                }
                if (!list.loose) {
                    // If the previous item ended with a blank line, the list is loose
                    if (endsWithBlankLine) {
                        list.loose = true;
                    }
                    else if (this.rules.other.doubleBlankLine.test(raw)) {
                        endsWithBlankLine = true;
                    }
                }
                let istask = null;
                let ischecked;
                // Check for task list items
                if (this.options.gfm) {
                    istask = this.rules.other.listIsTask.exec(itemContents);
                    if (istask) {
                        ischecked = istask[0] !== '[ ] ';
                        itemContents = itemContents.replace(this.rules.other.listReplaceTask, '');
                    }
                }
                list.items.push({
                    type: 'list_item',
                    raw,
                    task: !!istask,
                    checked: ischecked,
                    loose: false,
                    text: itemContents,
                    tokens: [],
                });
                list.raw += raw;
            }
            // Do not consume newlines at end of final item. Alternatively, make itemRegex *start* with any newlines to simplify/speed up endsWithBlankLine logic
            const lastItem = list.items.at(-1);
            if (lastItem) {
                lastItem.raw = lastItem.raw.trimEnd();
                lastItem.text = lastItem.text.trimEnd();
            }
            else {
                // not a list since there were no items
                return;
            }
            list.raw = list.raw.trimEnd();
            // Item child tokens handled here at end because we needed to have the final item to trim it first
            for (let i = 0; i < list.items.length; i++) {
                this.lexer.state.top = false;
                list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);
                if (!list.loose) {
                    // Check if list should be loose
                    const spacers = list.items[i].tokens.filter(t => t.type === 'space');
                    const hasMultipleLineBreaks = spacers.length > 0 && spacers.some(t => this.rules.other.anyLine.test(t.raw));
                    list.loose = hasMultipleLineBreaks;
                }
            }
            // Set all items to loose if list is loose
            if (list.loose) {
                for (let i = 0; i < list.items.length; i++) {
                    list.items[i].loose = true;
                }
            }
            return list;
        }
    }
    html(src) {
        const cap = this.rules.block.html.exec(src);
        if (cap) {
            const token = {
                type: 'html',
                block: true,
                raw: cap[0],
                pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
                text: cap[0],
            };
            return token;
        }
    }
    def(src) {
        const cap = this.rules.block.def.exec(src);
        if (cap) {
            const tag = cap[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, ' ');
            const href = cap[2] ? cap[2].replace(this.rules.other.hrefBrackets, '$1').replace(this.rules.inline.anyPunctuation, '$1') : '';
            const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline.anyPunctuation, '$1') : cap[3];
            return {
                type: 'def',
                tag,
                raw: cap[0],
                href,
                title,
            };
        }
    }
    table(src) {
        const cap = this.rules.block.table.exec(src);
        if (!cap) {
            return;
        }
        if (!this.rules.other.tableDelimiter.test(cap[2])) {
            // delimiter row must have a pipe (|) or colon (:) otherwise it is a setext heading
            return;
        }
        const headers = splitCells(cap[1]);
        const aligns = cap[2].replace(this.rules.other.tableAlignChars, '').split('|');
        const rows = cap[3]?.trim() ? cap[3].replace(this.rules.other.tableRowBlankLine, '').split('\n') : [];
        const item = {
            type: 'table',
            raw: cap[0],
            header: [],
            align: [],
            rows: [],
        };
        if (headers.length !== aligns.length) {
            // header and align columns must be equal, rows can be different.
            return;
        }
        for (const align of aligns) {
            if (this.rules.other.tableAlignRight.test(align)) {
                item.align.push('right');
            }
            else if (this.rules.other.tableAlignCenter.test(align)) {
                item.align.push('center');
            }
            else if (this.rules.other.tableAlignLeft.test(align)) {
                item.align.push('left');
            }
            else {
                item.align.push(null);
            }
        }
        for (let i = 0; i < headers.length; i++) {
            item.header.push({
                text: headers[i],
                tokens: this.lexer.inline(headers[i]),
                header: true,
                align: item.align[i],
            });
        }
        for (const row of rows) {
            item.rows.push(splitCells(row, item.header.length).map((cell, i) => {
                return {
                    text: cell,
                    tokens: this.lexer.inline(cell),
                    header: false,
                    align: item.align[i],
                };
            }));
        }
        return item;
    }
    lheading(src) {
        const cap = this.rules.block.lheading.exec(src);
        if (cap) {
            return {
                type: 'heading',
                raw: cap[0],
                depth: cap[2].charAt(0) === '=' ? 1 : 2,
                text: cap[1],
                tokens: this.lexer.inline(cap[1]),
            };
        }
    }
    paragraph(src) {
        const cap = this.rules.block.paragraph.exec(src);
        if (cap) {
            const text = cap[1].charAt(cap[1].length - 1) === '\n'
                ? cap[1].slice(0, -1)
                : cap[1];
            return {
                type: 'paragraph',
                raw: cap[0],
                text,
                tokens: this.lexer.inline(text),
            };
        }
    }
    text(src) {
        const cap = this.rules.block.text.exec(src);
        if (cap) {
            return {
                type: 'text',
                raw: cap[0],
                text: cap[0],
                tokens: this.lexer.inline(cap[0]),
            };
        }
    }
    escape(src) {
        const cap = this.rules.inline.escape.exec(src);
        if (cap) {
            return {
                type: 'escape',
                raw: cap[0],
                text: cap[1],
            };
        }
    }
    tag(src) {
        const cap = this.rules.inline.tag.exec(src);
        if (cap) {
            if (!this.lexer.state.inLink && this.rules.other.startATag.test(cap[0])) {
                this.lexer.state.inLink = true;
            }
            else if (this.lexer.state.inLink && this.rules.other.endATag.test(cap[0])) {
                this.lexer.state.inLink = false;
            }
            if (!this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(cap[0])) {
                this.lexer.state.inRawBlock = true;
            }
            else if (this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(cap[0])) {
                this.lexer.state.inRawBlock = false;
            }
            return {
                type: 'html',
                raw: cap[0],
                inLink: this.lexer.state.inLink,
                inRawBlock: this.lexer.state.inRawBlock,
                block: false,
                text: cap[0],
            };
        }
    }
    link(src) {
        const cap = this.rules.inline.link.exec(src);
        if (cap) {
            const trimmedUrl = cap[2].trim();
            if (!this.options.pedantic && this.rules.other.startAngleBracket.test(trimmedUrl)) {
                // commonmark requires matching angle brackets
                if (!(this.rules.other.endAngleBracket.test(trimmedUrl))) {
                    return;
                }
                // ending angle bracket cannot be escaped
                const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), '\\');
                if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
                    return;
                }
            }
            else {
                // find closing parenthesis
                const lastParenIndex = findClosingBracket(cap[2], '()');
                if (lastParenIndex > -1) {
                    const start = cap[0].indexOf('!') === 0 ? 5 : 4;
                    const linkLen = start + cap[1].length + lastParenIndex;
                    cap[2] = cap[2].substring(0, lastParenIndex);
                    cap[0] = cap[0].substring(0, linkLen).trim();
                    cap[3] = '';
                }
            }
            let href = cap[2];
            let title = '';
            if (this.options.pedantic) {
                // split pedantic href and title
                const link = this.rules.other.pedanticHrefTitle.exec(href);
                if (link) {
                    href = link[1];
                    title = link[3];
                }
            }
            else {
                title = cap[3] ? cap[3].slice(1, -1) : '';
            }
            href = href.trim();
            if (this.rules.other.startAngleBracket.test(href)) {
                if (this.options.pedantic && !(this.rules.other.endAngleBracket.test(trimmedUrl))) {
                    // pedantic allows starting angle bracket without ending angle bracket
                    href = href.slice(1);
                }
                else {
                    href = href.slice(1, -1);
                }
            }
            return outputLink(cap, {
                href: href ? href.replace(this.rules.inline.anyPunctuation, '$1') : href,
                title: title ? title.replace(this.rules.inline.anyPunctuation, '$1') : title,
            }, cap[0], this.lexer, this.rules);
        }
    }
    reflink(src, links) {
        let cap;
        if ((cap = this.rules.inline.reflink.exec(src))
            || (cap = this.rules.inline.nolink.exec(src))) {
            const linkString = (cap[2] || cap[1]).replace(this.rules.other.multipleSpaceGlobal, ' ');
            const link = links[linkString.toLowerCase()];
            if (!link) {
                const text = cap[0].charAt(0);
                return {
                    type: 'text',
                    raw: text,
                    text,
                };
            }
            return outputLink(cap, link, cap[0], this.lexer, this.rules);
        }
    }
    emStrong(src, maskedSrc, prevChar = '') {
        let match = this.rules.inline.emStrongLDelim.exec(src);
        if (!match)
            return;
        // _ can't be between two alphanumerics. \p{L}\p{N} includes non-english alphabet/numbers as well
        if (match[3] && prevChar.match(this.rules.other.unicodeAlphaNumeric))
            return;
        const nextChar = match[1] || match[2] || '';
        if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
            // unicode Regex counts emoji as 1 char; spread into array for proper count (used multiple times below)
            const lLength = [...match[0]].length - 1;
            let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
            const endReg = match[0][0] === '*' ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
            endReg.lastIndex = 0;
            // Clip maskedSrc to same section of string as src (move to lexer?)
            maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
            while ((match = endReg.exec(maskedSrc)) != null) {
                rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
                if (!rDelim)
                    continue; // skip single * in __abc*abc__
                rLength = [...rDelim].length;
                if (match[3] || match[4]) { // found another Left Delim
                    delimTotal += rLength;
                    continue;
                }
                else if (match[5] || match[6]) { // either Left or Right Delim
                    if (lLength % 3 && !((lLength + rLength) % 3)) {
                        midDelimTotal += rLength;
                        continue; // CommonMark Emphasis Rules 9-10
                    }
                }
                delimTotal -= rLength;
                if (delimTotal > 0)
                    continue; // Haven't found enough closing delimiters
                // Remove extra characters. *a*** -> *a*
                rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
                // char length can be >1 for unicode characters;
                const lastCharLength = [...match[0]][0].length;
                const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
                // Create `em` if smallest delimiter has odd char count. *a***
                if (Math.min(lLength, rLength) % 2) {
                    const text = raw.slice(1, -1);
                    return {
                        type: 'em',
                        raw,
                        text,
                        tokens: this.lexer.inlineTokens(text),
                    };
                }
                // Create 'strong' if smallest delimiter has even char count. **a***
                const text = raw.slice(2, -2);
                return {
                    type: 'strong',
                    raw,
                    text,
                    tokens: this.lexer.inlineTokens(text),
                };
            }
        }
    }
    codespan(src) {
        const cap = this.rules.inline.code.exec(src);
        if (cap) {
            let text = cap[2].replace(this.rules.other.newLineCharGlobal, ' ');
            const hasNonSpaceChars = this.rules.other.nonSpaceChar.test(text);
            const hasSpaceCharsOnBothEnds = this.rules.other.startingSpaceChar.test(text) && this.rules.other.endingSpaceChar.test(text);
            if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
                text = text.substring(1, text.length - 1);
            }
            return {
                type: 'codespan',
                raw: cap[0],
                text,
            };
        }
    }
    br(src) {
        const cap = this.rules.inline.br.exec(src);
        if (cap) {
            return {
                type: 'br',
                raw: cap[0],
            };
        }
    }
    del(src) {
        const cap = this.rules.inline.del.exec(src);
        if (cap) {
            return {
                type: 'del',
                raw: cap[0],
                text: cap[2],
                tokens: this.lexer.inlineTokens(cap[2]),
            };
        }
    }
    autolink(src) {
        const cap = this.rules.inline.autolink.exec(src);
        if (cap) {
            let text, href;
            if (cap[2] === '@') {
                text = cap[1];
                href = 'mailto:' + text;
            }
            else {
                text = cap[1];
                href = text;
            }
            return {
                type: 'link',
                raw: cap[0],
                text,
                href,
                tokens: [
                    {
                        type: 'text',
                        raw: text,
                        text,
                    },
                ],
            };
        }
    }
    url(src) {
        let cap;
        if (cap = this.rules.inline.url.exec(src)) {
            let text, href;
            if (cap[2] === '@') {
                text = cap[0];
                href = 'mailto:' + text;
            }
            else {
                // do extended autolink path validation
                let prevCapZero;
                do {
                    prevCapZero = cap[0];
                    cap[0] = this.rules.inline._backpedal.exec(cap[0])?.[0] ?? '';
                } while (prevCapZero !== cap[0]);
                text = cap[0];
                if (cap[1] === 'www.') {
                    href = 'http://' + cap[0];
                }
                else {
                    href = cap[0];
                }
            }
            return {
                type: 'link',
                raw: cap[0],
                text,
                href,
                tokens: [
                    {
                        type: 'text',
                        raw: text,
                        text,
                    },
                ],
            };
        }
    }
    inlineText(src) {
        const cap = this.rules.inline.text.exec(src);
        if (cap) {
            const escaped = this.lexer.state.inRawBlock;
            return {
                type: 'text',
                raw: cap[0],
                text: cap[0],
                escaped,
            };
        }
    }
}

/**
 * Block Lexer
 */
class _Lexer {
    tokens;
    options;
    state;
    tokenizer;
    inlineQueue;
    constructor(options) {
        // TokenList cannot be created in one go
        this.tokens = [];
        this.tokens.links = Object.create(null);
        this.options = options || exports.defaults;
        this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
        this.tokenizer = this.options.tokenizer;
        this.tokenizer.options = this.options;
        this.tokenizer.lexer = this;
        this.inlineQueue = [];
        this.state = {
            inLink: false,
            inRawBlock: false,
            top: true,
        };
        const rules = {
            other,
            block: block.normal,
            inline: inline.normal,
        };
        if (this.options.pedantic) {
            rules.block = block.pedantic;
            rules.inline = inline.pedantic;
        }
        else if (this.options.gfm) {
            rules.block = block.gfm;
            if (this.options.breaks) {
                rules.inline = inline.breaks;
            }
            else {
                rules.inline = inline.gfm;
            }
        }
        this.tokenizer.rules = rules;
    }
    /**
     * Expose Rules
     */
    static get rules() {
        return {
            block,
            inline,
        };
    }
    /**
     * Static Lex Method
     */
    static lex(src, options) {
        const lexer = new _Lexer(options);
        return lexer.lex(src);
    }
    /**
     * Static Lex Inline Method
     */
    static lexInline(src, options) {
        const lexer = new _Lexer(options);
        return lexer.inlineTokens(src);
    }
    /**
     * Preprocessing
     */
    lex(src) {
        src = src.replace(other.carriageReturn, '\n');
        this.blockTokens(src, this.tokens);
        for (let i = 0; i < this.inlineQueue.length; i++) {
            const next = this.inlineQueue[i];
            this.inlineTokens(next.src, next.tokens);
        }
        this.inlineQueue = [];
        return this.tokens;
    }
    blockTokens(src, tokens = [], lastParagraphClipped = false) {
        if (this.options.pedantic) {
            src = src.replace(other.tabCharGlobal, '    ').replace(other.spaceLine, '');
        }
        while (src) {
            let token;
            if (this.options.extensions?.block?.some((extTokenizer) => {
                if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
                    src = src.substring(token.raw.length);
                    tokens.push(token);
                    return true;
                }
                return false;
            })) {
                continue;
            }
            // newline
            if (token = this.tokenizer.space(src)) {
                src = src.substring(token.raw.length);
                const lastToken = tokens.at(-1);
                if (token.raw.length === 1 && lastToken !== undefined) {
                    // if there's a single \n as a spacer, it's terminating the last line,
                    // so move it there so that we don't get unnecessary paragraph tags
                    lastToken.raw += '\n';
                }
                else {
                    tokens.push(token);
                }
                continue;
            }
            // code
            if (token = this.tokenizer.code(src)) {
                src = src.substring(token.raw.length);
                const lastToken = tokens.at(-1);
                // An indented code block cannot interrupt a paragraph.
                if (lastToken?.type === 'paragraph' || lastToken?.type === 'text') {
                    lastToken.raw += '\n' + token.raw;
                    lastToken.text += '\n' + token.text;
                    this.inlineQueue.at(-1).src = lastToken.text;
                }
                else {
                    tokens.push(token);
                }
                continue;
            }
            // fences
            if (token = this.tokenizer.fences(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // heading
            if (token = this.tokenizer.heading(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // hr
            if (token = this.tokenizer.hr(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // blockquote
            if (token = this.tokenizer.blockquote(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // list
            if (token = this.tokenizer.list(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // html
            if (token = this.tokenizer.html(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // def
            if (token = this.tokenizer.def(src)) {
                src = src.substring(token.raw.length);
                const lastToken = tokens.at(-1);
                if (lastToken?.type === 'paragraph' || lastToken?.type === 'text') {
                    lastToken.raw += '\n' + token.raw;
                    lastToken.text += '\n' + token.raw;
                    this.inlineQueue.at(-1).src = lastToken.text;
                }
                else if (!this.tokens.links[token.tag]) {
                    this.tokens.links[token.tag] = {
                        href: token.href,
                        title: token.title,
                    };
                }
                continue;
            }
            // table (gfm)
            if (token = this.tokenizer.table(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // lheading
            if (token = this.tokenizer.lheading(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // top-level paragraph
            // prevent paragraph consuming extensions by clipping 'src' to extension start
            let cutSrc = src;
            if (this.options.extensions?.startBlock) {
                let startIndex = Infinity;
                const tempSrc = src.slice(1);
                let tempStart;
                this.options.extensions.startBlock.forEach((getStartIndex) => {
                    tempStart = getStartIndex.call({ lexer: this }, tempSrc);
                    if (typeof tempStart === 'number' && tempStart >= 0) {
                        startIndex = Math.min(startIndex, tempStart);
                    }
                });
                if (startIndex < Infinity && startIndex >= 0) {
                    cutSrc = src.substring(0, startIndex + 1);
                }
            }
            if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
                const lastToken = tokens.at(-1);
                if (lastParagraphClipped && lastToken?.type === 'paragraph') {
                    lastToken.raw += '\n' + token.raw;
                    lastToken.text += '\n' + token.text;
                    this.inlineQueue.pop();
                    this.inlineQueue.at(-1).src = lastToken.text;
                }
                else {
                    tokens.push(token);
                }
                lastParagraphClipped = cutSrc.length !== src.length;
                src = src.substring(token.raw.length);
                continue;
            }
            // text
            if (token = this.tokenizer.text(src)) {
                src = src.substring(token.raw.length);
                const lastToken = tokens.at(-1);
                if (lastToken?.type === 'text') {
                    lastToken.raw += '\n' + token.raw;
                    lastToken.text += '\n' + token.text;
                    this.inlineQueue.pop();
                    this.inlineQueue.at(-1).src = lastToken.text;
                }
                else {
                    tokens.push(token);
                }
                continue;
            }
            if (src) {
                const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
                if (this.options.silent) {
                    console.error(errMsg);
                    break;
                }
                else {
                    throw new Error(errMsg);
                }
            }
        }
        this.state.top = true;
        return tokens;
    }
    inline(src, tokens = []) {
        this.inlineQueue.push({ src, tokens });
        return tokens;
    }
    /**
     * Lexing/Compiling
     */
    inlineTokens(src, tokens = []) {
        // String with links masked to avoid interference with em and strong
        let maskedSrc = src;
        let match = null;
        // Mask out reflinks
        if (this.tokens.links) {
            const links = Object.keys(this.tokens.links);
            if (links.length > 0) {
                while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
                    if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
                        maskedSrc = maskedSrc.slice(0, match.index)
                            + '[' + 'a'.repeat(match[0].length - 2) + ']'
                            + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
                    }
                }
            }
        }
        // Mask out escaped characters
        while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
            maskedSrc = maskedSrc.slice(0, match.index) + '++' + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
        }
        // Mask out other blocks
        while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
            maskedSrc = maskedSrc.slice(0, match.index) + '[' + 'a'.repeat(match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
        }
        let keepPrevChar = false;
        let prevChar = '';
        while (src) {
            if (!keepPrevChar) {
                prevChar = '';
            }
            keepPrevChar = false;
            let token;
            // extensions
            if (this.options.extensions?.inline?.some((extTokenizer) => {
                if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
                    src = src.substring(token.raw.length);
                    tokens.push(token);
                    return true;
                }
                return false;
            })) {
                continue;
            }
            // escape
            if (token = this.tokenizer.escape(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // tag
            if (token = this.tokenizer.tag(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // link
            if (token = this.tokenizer.link(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // reflink, nolink
            if (token = this.tokenizer.reflink(src, this.tokens.links)) {
                src = src.substring(token.raw.length);
                const lastToken = tokens.at(-1);
                if (token.type === 'text' && lastToken?.type === 'text') {
                    lastToken.raw += token.raw;
                    lastToken.text += token.text;
                }
                else {
                    tokens.push(token);
                }
                continue;
            }
            // em & strong
            if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // code
            if (token = this.tokenizer.codespan(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // br
            if (token = this.tokenizer.br(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // del (gfm)
            if (token = this.tokenizer.del(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // autolink
            if (token = this.tokenizer.autolink(src)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // url (gfm)
            if (!this.state.inLink && (token = this.tokenizer.url(src))) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                continue;
            }
            // text
            // prevent inlineText consuming extensions by clipping 'src' to extension start
            let cutSrc = src;
            if (this.options.extensions?.startInline) {
                let startIndex = Infinity;
                const tempSrc = src.slice(1);
                let tempStart;
                this.options.extensions.startInline.forEach((getStartIndex) => {
                    tempStart = getStartIndex.call({ lexer: this }, tempSrc);
                    if (typeof tempStart === 'number' && tempStart >= 0) {
                        startIndex = Math.min(startIndex, tempStart);
                    }
                });
                if (startIndex < Infinity && startIndex >= 0) {
                    cutSrc = src.substring(0, startIndex + 1);
                }
            }
            if (token = this.tokenizer.inlineText(cutSrc)) {
                src = src.substring(token.raw.length);
                if (token.raw.slice(-1) !== '_') { // Track prevChar before string of ____ started
                    prevChar = token.raw.slice(-1);
                }
                keepPrevChar = true;
                const lastToken = tokens.at(-1);
                if (lastToken?.type === 'text') {
                    lastToken.raw += token.raw;
                    lastToken.text += token.text;
                }
                else {
                    tokens.push(token);
                }
                continue;
            }
            if (src) {
                const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
                if (this.options.silent) {
                    console.error(errMsg);
                    break;
                }
                else {
                    throw new Error(errMsg);
                }
            }
        }
        return tokens;
    }
}

/**
 * Renderer
 */
class _Renderer {
    options;
    parser; // set by the parser
    constructor(options) {
        this.options = options || exports.defaults;
    }
    space(token) {
        return '';
    }
    code({ text, lang, escaped }) {
        const langString = (lang || '').match(other.notSpaceStart)?.[0];
        const code = text.replace(other.endingNewline, '') + '\n';
        if (!langString) {
            return '<pre><code>'
                + (escaped ? code : escape(code, true))
                + '</code></pre>\n';
        }
        return '<pre><code class="language-'
            + escape(langString)
            + '">'
            + (escaped ? code : escape(code, true))
            + '</code></pre>\n';
    }
    blockquote({ tokens }) {
        const body = this.parser.parse(tokens);
        return `<blockquote>\n${body}</blockquote>\n`;
    }
    html({ text }) {
        return text;
    }
    heading({ tokens, depth }) {
        return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>\n`;
    }
    hr(token) {
        return '<hr>\n';
    }
    list(token) {
        const ordered = token.ordered;
        const start = token.start;
        let body = '';
        for (let j = 0; j < token.items.length; j++) {
            const item = token.items[j];
            body += this.listitem(item);
        }
        const type = ordered ? 'ol' : 'ul';
        const startAttr = (ordered && start !== 1) ? (' start="' + start + '"') : '';
        return '<' + type + startAttr + '>\n' + body + '</' + type + '>\n';
    }
    listitem(item) {
        let itemBody = '';
        if (item.task) {
            const checkbox = this.checkbox({ checked: !!item.checked });
            if (item.loose) {
                if (item.tokens[0]?.type === 'paragraph') {
                    item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
                    if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                        item.tokens[0].tokens[0].text = checkbox + ' ' + escape(item.tokens[0].tokens[0].text);
                        item.tokens[0].tokens[0].escaped = true;
                    }
                }
                else {
                    item.tokens.unshift({
                        type: 'text',
                        raw: checkbox + ' ',
                        text: checkbox + ' ',
                        escaped: true,
                    });
                }
            }
            else {
                itemBody += checkbox + ' ';
            }
        }
        itemBody += this.parser.parse(item.tokens, !!item.loose);
        return `<li>${itemBody}</li>\n`;
    }
    checkbox({ checked }) {
        return '<input '
            + (checked ? 'checked="" ' : '')
            + 'disabled="" type="checkbox">';
    }
    paragraph({ tokens }) {
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
    }
    table(token) {
        let header = '';
        // header
        let cell = '';
        for (let j = 0; j < token.header.length; j++) {
            cell += this.tablecell(token.header[j]);
        }
        header += this.tablerow({ text: cell });
        let body = '';
        for (let j = 0; j < token.rows.length; j++) {
            const row = token.rows[j];
            cell = '';
            for (let k = 0; k < row.length; k++) {
                cell += this.tablecell(row[k]);
            }
            body += this.tablerow({ text: cell });
        }
        if (body)
            body = `<tbody>${body}</tbody>`;
        return '<table>\n'
            + '<thead>\n'
            + header
            + '</thead>\n'
            + body
            + '</table>\n';
    }
    tablerow({ text }) {
        return `<tr>\n${text}</tr>\n`;
    }
    tablecell(token) {
        const content = this.parser.parseInline(token.tokens);
        const type = token.header ? 'th' : 'td';
        const tag = token.align
            ? `<${type} align="${token.align}">`
            : `<${type}>`;
        return tag + content + `</${type}>\n`;
    }
    /**
     * span level renderer
     */
    strong({ tokens }) {
        return `<strong>${this.parser.parseInline(tokens)}</strong>`;
    }
    em({ tokens }) {
        return `<em>${this.parser.parseInline(tokens)}</em>`;
    }
    codespan({ text }) {
        return `<code>${escape(text, true)}</code>`;
    }
    br(token) {
        return '<br>';
    }
    del({ tokens }) {
        return `<del>${this.parser.parseInline(tokens)}</del>`;
    }
    link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const cleanHref = cleanUrl(href);
        if (cleanHref === null) {
            return text;
        }
        href = cleanHref;
        let out = '<a href="' + href + '"';
        if (title) {
            out += ' title="' + (escape(title)) + '"';
        }
        out += '>' + text + '</a>';
        return out;
    }
    image({ href, title, text }) {
        const cleanHref = cleanUrl(href);
        if (cleanHref === null) {
            return escape(text);
        }
        href = cleanHref;
        let out = `<img src="${href}" alt="${text}"`;
        if (title) {
            out += ` title="${escape(title)}"`;
        }
        out += '>';
        return out;
    }
    text(token) {
        return 'tokens' in token && token.tokens
            ? this.parser.parseInline(token.tokens)
            : ('escaped' in token && token.escaped ? token.text : escape(token.text));
    }
}

/**
 * TextRenderer
 * returns only the textual part of the token
 */
class _TextRenderer {
    // no need for block level renderers
    strong({ text }) {
        return text;
    }
    em({ text }) {
        return text;
    }
    codespan({ text }) {
        return text;
    }
    del({ text }) {
        return text;
    }
    html({ text }) {
        return text;
    }
    text({ text }) {
        return text;
    }
    link({ text }) {
        return '' + text;
    }
    image({ text }) {
        return '' + text;
    }
    br() {
        return '';
    }
}

/**
 * Parsing & Compiling
 */
class _Parser {
    options;
    renderer;
    textRenderer;
    constructor(options) {
        this.options = options || exports.defaults;
        this.options.renderer = this.options.renderer || new _Renderer();
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
        this.renderer.parser = this;
        this.textRenderer = new _TextRenderer();
    }
    /**
     * Static Parse Method
     */
    static parse(tokens, options) {
        const parser = new _Parser(options);
        return parser.parse(tokens);
    }
    /**
     * Static Parse Inline Method
     */
    static parseInline(tokens, options) {
        const parser = new _Parser(options);
        return parser.parseInline(tokens);
    }
    /**
     * Parse Loop
     */
    parse(tokens, top = true) {
        let out = '';
        for (let i = 0; i < tokens.length; i++) {
            const anyToken = tokens[i];
            // Run any renderer extensions
            if (this.options.extensions?.renderers?.[anyToken.type]) {
                const genericToken = anyToken;
                const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
                if (ret !== false || !['space', 'hr', 'heading', 'code', 'table', 'blockquote', 'list', 'html', 'paragraph', 'text'].includes(genericToken.type)) {
                    out += ret || '';
                    continue;
                }
            }
            const token = anyToken;
            switch (token.type) {
                case 'space': {
                    out += this.renderer.space(token);
                    continue;
                }
                case 'hr': {
                    out += this.renderer.hr(token);
                    continue;
                }
                case 'heading': {
                    out += this.renderer.heading(token);
                    continue;
                }
                case 'code': {
                    out += this.renderer.code(token);
                    continue;
                }
                case 'table': {
                    out += this.renderer.table(token);
                    continue;
                }
                case 'blockquote': {
                    out += this.renderer.blockquote(token);
                    continue;
                }
                case 'list': {
                    out += this.renderer.list(token);
                    continue;
                }
                case 'html': {
                    out += this.renderer.html(token);
                    continue;
                }
                case 'paragraph': {
                    out += this.renderer.paragraph(token);
                    continue;
                }
                case 'text': {
                    let textToken = token;
                    let body = this.renderer.text(textToken);
                    while (i + 1 < tokens.length && tokens[i + 1].type === 'text') {
                        textToken = tokens[++i];
                        body += '\n' + this.renderer.text(textToken);
                    }
                    if (top) {
                        out += this.renderer.paragraph({
                            type: 'paragraph',
                            raw: body,
                            text: body,
                            tokens: [{ type: 'text', raw: body, text: body, escaped: true }],
                        });
                    }
                    else {
                        out += body;
                    }
                    continue;
                }
                default: {
                    const errMsg = 'Token with "' + token.type + '" type was not found.';
                    if (this.options.silent) {
                        console.error(errMsg);
                        return '';
                    }
                    else {
                        throw new Error(errMsg);
                    }
                }
            }
        }
        return out;
    }
    /**
     * Parse Inline Tokens
     */
    parseInline(tokens, renderer = this.renderer) {
        let out = '';
        for (let i = 0; i < tokens.length; i++) {
            const anyToken = tokens[i];
            // Run any renderer extensions
            if (this.options.extensions?.renderers?.[anyToken.type]) {
                const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
                if (ret !== false || !['escape', 'html', 'link', 'image', 'strong', 'em', 'codespan', 'br', 'del', 'text'].includes(anyToken.type)) {
                    out += ret || '';
                    continue;
                }
            }
            const token = anyToken;
            switch (token.type) {
                case 'escape': {
                    out += renderer.text(token);
                    break;
                }
                case 'html': {
                    out += renderer.html(token);
                    break;
                }
                case 'link': {
                    out += renderer.link(token);
                    break;
                }
                case 'image': {
                    out += renderer.image(token);
                    break;
                }
                case 'strong': {
                    out += renderer.strong(token);
                    break;
                }
                case 'em': {
                    out += renderer.em(token);
                    break;
                }
                case 'codespan': {
                    out += renderer.codespan(token);
                    break;
                }
                case 'br': {
                    out += renderer.br(token);
                    break;
                }
                case 'del': {
                    out += renderer.del(token);
                    break;
                }
                case 'text': {
                    out += renderer.text(token);
                    break;
                }
                default: {
                    const errMsg = 'Token with "' + token.type + '" type was not found.';
                    if (this.options.silent) {
                        console.error(errMsg);
                        return '';
                    }
                    else {
                        throw new Error(errMsg);
                    }
                }
            }
        }
        return out;
    }
}

class _Hooks {
    options;
    block;
    constructor(options) {
        this.options = options || exports.defaults;
    }
    static passThroughHooks = new Set([
        'preprocess',
        'postprocess',
        'processAllTokens',
    ]);
    /**
     * Process markdown before marked
     */
    preprocess(markdown) {
        return markdown;
    }
    /**
     * Process HTML after marked is finished
     */
    postprocess(html) {
        return html;
    }
    /**
     * Process all tokens before walk tokens
     */
    processAllTokens(tokens) {
        return tokens;
    }
    /**
     * Provide function to tokenize markdown
     */
    provideLexer() {
        return this.block ? _Lexer.lex : _Lexer.lexInline;
    }
    /**
     * Provide function to parse tokens
     */
    provideParser() {
        return this.block ? _Parser.parse : _Parser.parseInline;
    }
}

class Marked {
    defaults = _getDefaults();
    options = this.setOptions;
    parse = this.parseMarkdown(true);
    parseInline = this.parseMarkdown(false);
    Parser = _Parser;
    Renderer = _Renderer;
    TextRenderer = _TextRenderer;
    Lexer = _Lexer;
    Tokenizer = _Tokenizer;
    Hooks = _Hooks;
    constructor(...args) {
        this.use(...args);
    }
    /**
     * Run callback for every token
     */
    walkTokens(tokens, callback) {
        let values = [];
        for (const token of tokens) {
            values = values.concat(callback.call(this, token));
            switch (token.type) {
                case 'table': {
                    const tableToken = token;
                    for (const cell of tableToken.header) {
                        values = values.concat(this.walkTokens(cell.tokens, callback));
                    }
                    for (const row of tableToken.rows) {
                        for (const cell of row) {
                            values = values.concat(this.walkTokens(cell.tokens, callback));
                        }
                    }
                    break;
                }
                case 'list': {
                    const listToken = token;
                    values = values.concat(this.walkTokens(listToken.items, callback));
                    break;
                }
                default: {
                    const genericToken = token;
                    if (this.defaults.extensions?.childTokens?.[genericToken.type]) {
                        this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
                            const tokens = genericToken[childTokens].flat(Infinity);
                            values = values.concat(this.walkTokens(tokens, callback));
                        });
                    }
                    else if (genericToken.tokens) {
                        values = values.concat(this.walkTokens(genericToken.tokens, callback));
                    }
                }
            }
        }
        return values;
    }
    use(...args) {
        const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
        args.forEach((pack) => {
            // copy options to new object
            const opts = { ...pack };
            // set async to true if it was set to true before
            opts.async = this.defaults.async || opts.async || false;
            // ==-- Parse "addon" extensions --== //
            if (pack.extensions) {
                pack.extensions.forEach((ext) => {
                    if (!ext.name) {
                        throw new Error('extension name required');
                    }
                    if ('renderer' in ext) { // Renderer extensions
                        const prevRenderer = extensions.renderers[ext.name];
                        if (prevRenderer) {
                            // Replace extension with func to run new extension but fall back if false
                            extensions.renderers[ext.name] = function (...args) {
                                let ret = ext.renderer.apply(this, args);
                                if (ret === false) {
                                    ret = prevRenderer.apply(this, args);
                                }
                                return ret;
                            };
                        }
                        else {
                            extensions.renderers[ext.name] = ext.renderer;
                        }
                    }
                    if ('tokenizer' in ext) { // Tokenizer Extensions
                        if (!ext.level || (ext.level !== 'block' && ext.level !== 'inline')) {
                            throw new Error("extension level must be 'block' or 'inline'");
                        }
                        const extLevel = extensions[ext.level];
                        if (extLevel) {
                            extLevel.unshift(ext.tokenizer);
                        }
                        else {
                            extensions[ext.level] = [ext.tokenizer];
                        }
                        if (ext.start) { // Function to check for start of token
                            if (ext.level === 'block') {
                                if (extensions.startBlock) {
                                    extensions.startBlock.push(ext.start);
                                }
                                else {
                                    extensions.startBlock = [ext.start];
                                }
                            }
                            else if (ext.level === 'inline') {
                                if (extensions.startInline) {
                                    extensions.startInline.push(ext.start);
                                }
                                else {
                                    extensions.startInline = [ext.start];
                                }
                            }
                        }
                    }
                    if ('childTokens' in ext && ext.childTokens) { // Child tokens to be visited by walkTokens
                        extensions.childTokens[ext.name] = ext.childTokens;
                    }
                });
                opts.extensions = extensions;
            }
            // ==-- Parse "overwrite" extensions --== //
            if (pack.renderer) {
                const renderer = this.defaults.renderer || new _Renderer(this.defaults);
                for (const prop in pack.renderer) {
                    if (!(prop in renderer)) {
                        throw new Error(`renderer '${prop}' does not exist`);
                    }
                    if (['options', 'parser'].includes(prop)) {
                        // ignore options property
                        continue;
                    }
                    const rendererProp = prop;
                    const rendererFunc = pack.renderer[rendererProp];
                    const prevRenderer = renderer[rendererProp];
                    // Replace renderer with func to run extension, but fall back if false
                    renderer[rendererProp] = (...args) => {
                        let ret = rendererFunc.apply(renderer, args);
                        if (ret === false) {
                            ret = prevRenderer.apply(renderer, args);
                        }
                        return ret || '';
                    };
                }
                opts.renderer = renderer;
            }
            if (pack.tokenizer) {
                const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
                for (const prop in pack.tokenizer) {
                    if (!(prop in tokenizer)) {
                        throw new Error(`tokenizer '${prop}' does not exist`);
                    }
                    if (['options', 'rules', 'lexer'].includes(prop)) {
                        // ignore options, rules, and lexer properties
                        continue;
                    }
                    const tokenizerProp = prop;
                    const tokenizerFunc = pack.tokenizer[tokenizerProp];
                    const prevTokenizer = tokenizer[tokenizerProp];
                    // Replace tokenizer with func to run extension, but fall back if false
                    // @ts-expect-error cannot type tokenizer function dynamically
                    tokenizer[tokenizerProp] = (...args) => {
                        let ret = tokenizerFunc.apply(tokenizer, args);
                        if (ret === false) {
                            ret = prevTokenizer.apply(tokenizer, args);
                        }
                        return ret;
                    };
                }
                opts.tokenizer = tokenizer;
            }
            // ==-- Parse Hooks extensions --== //
            if (pack.hooks) {
                const hooks = this.defaults.hooks || new _Hooks();
                for (const prop in pack.hooks) {
                    if (!(prop in hooks)) {
                        throw new Error(`hook '${prop}' does not exist`);
                    }
                    if (['options', 'block'].includes(prop)) {
                        // ignore options and block properties
                        continue;
                    }
                    const hooksProp = prop;
                    const hooksFunc = pack.hooks[hooksProp];
                    const prevHook = hooks[hooksProp];
                    if (_Hooks.passThroughHooks.has(prop)) {
                        // @ts-expect-error cannot type hook function dynamically
                        hooks[hooksProp] = (arg) => {
                            if (this.defaults.async) {
                                return Promise.resolve(hooksFunc.call(hooks, arg)).then(ret => {
                                    return prevHook.call(hooks, ret);
                                });
                            }
                            const ret = hooksFunc.call(hooks, arg);
                            return prevHook.call(hooks, ret);
                        };
                    }
                    else {
                        // @ts-expect-error cannot type hook function dynamically
                        hooks[hooksProp] = (...args) => {
                            let ret = hooksFunc.apply(hooks, args);
                            if (ret === false) {
                                ret = prevHook.apply(hooks, args);
                            }
                            return ret;
                        };
                    }
                }
                opts.hooks = hooks;
            }
            // ==-- Parse WalkTokens extensions --== //
            if (pack.walkTokens) {
                const walkTokens = this.defaults.walkTokens;
                const packWalktokens = pack.walkTokens;
                opts.walkTokens = function (token) {
                    let values = [];
                    values.push(packWalktokens.call(this, token));
                    if (walkTokens) {
                        values = values.concat(walkTokens.call(this, token));
                    }
                    return values;
                };
            }
            this.defaults = { ...this.defaults, ...opts };
        });
        return this;
    }
    setOptions(opt) {
        this.defaults = { ...this.defaults, ...opt };
        return this;
    }
    lexer(src, options) {
        return _Lexer.lex(src, options ?? this.defaults);
    }
    parser(tokens, options) {
        return _Parser.parse(tokens, options ?? this.defaults);
    }
    parseMarkdown(blockType) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parse = (src, options) => {
            const origOpt = { ...options };
            const opt = { ...this.defaults, ...origOpt };
            const throwError = this.onError(!!opt.silent, !!opt.async);
            // throw error if an extension set async to true but parse was called with async: false
            if (this.defaults.async === true && origOpt.async === false) {
                return throwError(new Error('marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.'));
            }
            // throw error in case of non string input
            if (typeof src === 'undefined' || src === null) {
                return throwError(new Error('marked(): input parameter is undefined or null'));
            }
            if (typeof src !== 'string') {
                return throwError(new Error('marked(): input parameter is of type '
                    + Object.prototype.toString.call(src) + ', string expected'));
            }
            if (opt.hooks) {
                opt.hooks.options = opt;
                opt.hooks.block = blockType;
            }
            const lexer = opt.hooks ? opt.hooks.provideLexer() : (blockType ? _Lexer.lex : _Lexer.lexInline);
            const parser = opt.hooks ? opt.hooks.provideParser() : (blockType ? _Parser.parse : _Parser.parseInline);
            if (opt.async) {
                return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src)
                    .then(src => lexer(src, opt))
                    .then(tokens => opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens)
                    .then(tokens => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens)
                    .then(tokens => parser(tokens, opt))
                    .then(html => opt.hooks ? opt.hooks.postprocess(html) : html)
                    .catch(throwError);
            }
            try {
                if (opt.hooks) {
                    src = opt.hooks.preprocess(src);
                }
                let tokens = lexer(src, opt);
                if (opt.hooks) {
                    tokens = opt.hooks.processAllTokens(tokens);
                }
                if (opt.walkTokens) {
                    this.walkTokens(tokens, opt.walkTokens);
                }
                let html = parser(tokens, opt);
                if (opt.hooks) {
                    html = opt.hooks.postprocess(html);
                }
                return html;
            }
            catch (e) {
                return throwError(e);
            }
        };
        return parse;
    }
    onError(silent, async) {
        return (e) => {
            e.message += '\nPlease report this to https://github.com/markedjs/marked.';
            if (silent) {
                const msg = '<p>An error occurred:</p><pre>'
                    + escape(e.message + '', true)
                    + '</pre>';
                if (async) {
                    return Promise.resolve(msg);
                }
                return msg;
            }
            if (async) {
                return Promise.reject(e);
            }
            throw e;
        };
    }
}

const markedInstance = new Marked();
function marked(src, opt) {
    return markedInstance.parse(src, opt);
}
/**
 * Sets the default options.
 *
 * @param options Hash of options
 */
marked.options =
    marked.setOptions = function (options) {
        markedInstance.setOptions(options);
        marked.defaults = markedInstance.defaults;
        changeDefaults(marked.defaults);
        return marked;
    };
/**
 * Gets the original marked default options.
 */
marked.getDefaults = _getDefaults;
marked.defaults = exports.defaults;
/**
 * Use Extension
 */
marked.use = function (...args) {
    markedInstance.use(...args);
    marked.defaults = markedInstance.defaults;
    changeDefaults(marked.defaults);
    return marked;
};
/**
 * Run callback for every token
 */
marked.walkTokens = function (tokens, callback) {
    return markedInstance.walkTokens(tokens, callback);
};
/**
 * Compiles markdown to HTML without enclosing `p` tag.
 *
 * @param src String of markdown source to be compiled
 * @param options Hash of options
 * @return String of compiled HTML
 */
marked.parseInline = markedInstance.parseInline;
/**
 * Expose
 */
marked.Parser = _Parser;
marked.parser = _Parser.parse;
marked.Renderer = _Renderer;
marked.TextRenderer = _TextRenderer;
marked.Lexer = _Lexer;
marked.lexer = _Lexer.lex;
marked.Tokenizer = _Tokenizer;
marked.Hooks = _Hooks;
marked.parse = marked;
const options = marked.options;
const setOptions = marked.setOptions;
const use = marked.use;
const walkTokens = marked.walkTokens;
const parseInline = marked.parseInline;
const parse = marked;
const parser = _Parser.parse;
const lexer = _Lexer.lex;

exports.Hooks = _Hooks;
exports.Lexer = _Lexer;
exports.Marked = Marked;
exports.Parser = _Parser;
exports.Renderer = _Renderer;
exports.TextRenderer = _TextRenderer;
exports.Tokenizer = _Tokenizer;
exports.getDefaults = _getDefaults;
exports.lexer = lexer;
exports.marked = marked;
exports.options = options;
exports.parse = parse;
exports.parseInline = parseInline;
exports.parser = parser;
exports.setOptions = setOptions;
exports.use = use;
exports.walkTokens = walkTokens;
//# sourceMappingURL=marked.cjs.map


/***/ }),

/***/ "./src/js/VIEWsubmit.ts":
/*!******************************!*\
  !*** ./src/js/VIEWsubmit.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
// --- Helper Functions ---
/**
 * Groups an array of objects by a specified property.
 * Items without the property or where the property is undefined are placed in "Ungrouped".
 * @template T - The type of objects in the array.
 * @param {T[]} arr - The array to group.
 * @param {string} property - The name of the property to group by.
 * @returns {Record<string, T[]>} - An object where keys are property values and values are arrays of matching objects.
 */
function groupBy(arr, property) {
    return arr.reduce((memo, x) => {
        let key = x[property];
        // Assign to 'Ungrouped' if the property doesn't exist or is undefined
        if (key === undefined || key === null) {
            key = "Ungrouped";
        }
        else {
            key = String(key); // Ensure key is a string
        }
        if (!memo[key]) {
            memo[key] = [];
        }
        memo[key].push(x);
        return memo;
    }, {});
}
/**
 * Extracts form data from the first <form> element found in a Document.
 * @param {Document} targetDocument - The Document to search for a form.
 * @returns {Promise<FormDataObject>} - A promise resolving to an object containing the form data.
 */
function getFormData(targetDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Find the first form element, or create a dummy one if none exists to avoid errors with FormData constructor
        const formElement = (_a = targetDocument.querySelector("form")) !== null && _a !== void 0 ? _a : document.createElement('form');
        const formData = new FormData(formElement);
        const formDataObject = {};
        formData.forEach((value, key) => {
            formDataObject[key] = value;
        });
        return formDataObject;
    });
}
/**
 * Parses the text content of a Response object into an HTML Document.
 * Includes a retry mechanism if reading the response body times out.
 * @param {Response} vDocument - The Response object from a fetch call.
 * @param {string} url - The original URL fetched (for retries).
 * @param {RequestInit} fetchOptions - The original fetch options (for retries).
 * @returns {Promise<Document>} - A promise resolving to the parsed Document.
 */
function parsePage(vDocument, url, fetchOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        // Helper to get response body with timeout
        const getBodyWithTimeout = (response, timeout = 10000) => {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    reject(new Error(`getBodyWithTimeout timed out after ${timeout}ms for URL: ${url}`));
                }, timeout);
                response.text().then((text) => {
                    clearTimeout(timer);
                    resolve(text);
                }, (err) => {
                    clearTimeout(timer);
                    reject(err); // Propagate fetch error
                });
            });
        };
        let htmlText;
        try {
            htmlText = yield getBodyWithTimeout(vDocument);
        }
        catch (e) {
            console.warn(`Initial parsing failed or timed out for ${url}, retrying fetch...`, e);
            // Retry the fetch and parsing on error/timeout
            const retryResponse = yield fetch(url, fetchOptions); // Assuming fetch handles its own retries
            htmlText = yield getBodyWithTimeout(retryResponse); // Try getting body again
        }
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(htmlText, "text/html");
        return parsedDoc;
    });
}
// --- Main VIEWsubmit Function ---
/**
 * Handles a potentially multi-step view/form submission process.
 *
 * @param data - (Currently unused in snippet) Additional data. Type 'any' for flexibility.
 * @param incrementor - (Currently unused in snippet) Function or object for incrementing. Type 'any'.
 * @param initialParsedDocument - The parsed Document from a *previous* step, if applicable.
 * @param dataParams - Configuration object defining the submission steps and logic.
 * @param [properties={}] - Optional object containing state or configuration flags.
 * @returns {Promise<Document | boolean>} - Resolves to the final parsed Document, or a boolean based on 'next' flags.
 * @throws {string | Error} - Throws if properties.portDisconnected is true.
 */
function VIEWsubmit(data_1, incrementor_1, initialParsedDocument_1, dataParams_1) {
    return __awaiter(this, arguments, void 0, function* (data, // Unused in snippet, keep as any or specify if known
    incrementor, // Unused in snippet, keep as any or specify if known
    initialParsedDocument, dataParams, properties = {}) {
        var _a, _b, _c, _d, _e;
        let currentFormData = {}; // Form data accumulated/used in the current step
        const previousFormData = []; // History of formData objects
        let lastParsedDocument = initialParsedDocument;
        // Get initial form data from the previous step's document, if provided
        if (lastParsedDocument) {
            currentFormData = yield getFormData(lastParsedDocument);
        }
        ;
        // Execute initial action, if defined
        (_a = dataParams.action) === null || _a === void 0 ? void 0 : _a.call(dataParams, lastParsedDocument);
        // Group submission instructions
        const groups = groupBy(dataParams.submit, "group"); // Explicit generic type
        const groupedRepeats = dataParams.groupRepeats || { Ungrouped: () => [{}] }; // Default repeat structure
        // Iterate through each group of submit instructions
        for (const [groupName, group] of Object.entries(groups)) {
            // Determine dynamic parameters for this group, default to [{}] for one iteration
            const groupRepeatsFnOrArray = groupedRepeats[groupName];
            const dynamicParams = typeof groupRepeatsFnOrArray === "function"
                ? groupRepeatsFnOrArray(properties)
                : (Array.isArray(groupRepeatsFnOrArray) ? groupRepeatsFnOrArray : [{}]); // Ensure it's an array
            // Iterate through dynamic parameter sets for the current group
            for (const set of dynamicParams) {
                // Iterate through instructions within the current group and set
                for (const submitInstructions of group) {
                    if (properties.portDisconnected) {
                        throw new Error("Window Closed"); // Throw an Error object
                    }
                    // Check if this instruction step is optional and should be skipped
                    if (((_b = submitInstructions.optional) === null || _b === void 0 ? void 0 : _b.call(submitInstructions, lastParsedDocument, properties)) === false) {
                        continue; // Skip this instruction
                    }
                    // Calculate URL parameters, handling sync/async functions or static objects
                    let urlParamsResult = typeof submitInstructions.urlParams === "function"
                        ? submitInstructions.urlParams(lastParsedDocument, set, properties)
                        : submitInstructions.urlParams;
                    // Await if the result is a Promise, otherwise use directly
                    const resolvedUrlParams = yield urlParamsResult;
                    // Get form data from the *current* wizard page (the live document)
                    let wizardPageFormData = yield getFormData(document); // Use global 'document'
                    // Store the current state of formData before potentially modifying it
                    previousFormData.push(currentFormData);
                    // Determine which previous formData state to use as the base (default: last one)
                    const index = (_c = submitInstructions.formDataTarget) !== null && _c !== void 0 ? _c : previousFormData.length - 1;
                    if (index >= 0 && index < previousFormData.length) {
                        currentFormData = previousFormData[index];
                    }
                    else {
                        console.warn(`formDataTarget index ${index} out of bounds. Using last available form data.`);
                        currentFormData = previousFormData[previousFormData.length - 1] || {};
                    }
                    // Optionally clear form data based on flags
                    if (submitInstructions.clearWizardFormData) {
                        wizardPageFormData = {};
                    }
                    if (submitInstructions.clearVIEWFormData) {
                        currentFormData = {};
                    }
                    // Merge form data: base + URL params + current wizard page data
                    // Ensure resolvedUrlParams is an object before spreading
                    const mergedFormData = Object.assign(Object.assign(Object.assign({}, currentFormData), (resolvedUrlParams && typeof resolvedUrlParams === 'object' ? resolvedUrlParams : {})), wizardPageFormData);
                    // Create FormData for the fetch request body
                    const fetchFormData = new FormData();
                    for (const key in mergedFormData) {
                        // FormData can handle string or Blob/File. Ensure value is not object/array.
                        if (Object.prototype.hasOwnProperty.call(mergedFormData, key) && typeof mergedFormData[key] !== 'object') {
                            fetchFormData.append(key, mergedFormData[key]);
                        }
                        else if (mergedFormData[key] instanceof File || mergedFormData[key] instanceof Blob) {
                            fetchFormData.append(key, mergedFormData[key]);
                        }
                        // Note: Complex objects/arrays are skipped here. Handle serialization if needed.
                    }
                    // Prepare fetch options
                    const fetchOptions = {
                        method: submitInstructions.method || "POST",
                        headers: {
                            "x-civica-application": "CE",
                            "sec-fetch-site": "same-origin",
                            // Add other headers if necessary
                        },
                    };
                    if (submitInstructions.body !== false) { // Include body unless explicitly false
                        fetchOptions.body = fetchFormData;
                    }
                    // Determine the fetch URL, handling sync/async functions
                    let urlResult = typeof submitInstructions.url === 'function'
                        ? submitInstructions.url(lastParsedDocument, set, properties)
                        : submitInstructions.url;
                    const targetUrl = yield urlResult; // Await if it's a promise
                    console.log("-------------------------");
                    console.log(`Workspaceing: ${targetUrl} with method ${fetchOptions.method}`);
                    // Perform the fetch operation
                    let fetchResponse; // Type depends on branch
                    // Ensure targetUrl is defined before proceeding
                    if (!targetUrl) {
                        throw new Error("Target URL is undefined for fetch operation");
                    }
                    if (submitInstructions.sameorigin) {
                        // Assumes runFetchInContentScript directly returns a parsed Document
                        fetchResponse = yield runFetchInContentScript(targetUrl, fetchOptions);
                        lastParsedDocument = fetchResponse; // Update lastParsedDocument directly
                    }
                    else {
                        fetchResponse = yield fetch(targetUrl, fetchOptions);
                        const attempts = submitInstructions.attempts || 3; // Use specified attempts or default
                        // Parse the response (handles retries internally if needed)
                        lastParsedDocument = yield parsePage(fetchResponse, targetUrl, fetchOptions);
                    }
                    // Update formData based on the *newly* parsed document for the next iteration/step
                    currentFormData = yield getFormData(lastParsedDocument);
                    // Execute post-fetch action for this instruction
                    (_d = submitInstructions.after) === null || _d === void 0 ? void 0 : _d.call(submitInstructions, lastParsedDocument);
                    // Check for early return based on instruction flag
                    if (submitInstructions.next === true) {
                        return true;
                    }
                } // End loop: submitInstructions
            } // End loop: set (dynamicParams)
        } // End loop: groupName (groups)
        // Execute final action after all groups/steps are processed
        (_e = dataParams.afterAction) === null || _e === void 0 ? void 0 : _e.call(dataParams, lastParsedDocument, properties);
        // Final return based on dataParams flag
        if (dataParams.next === true) {
            return true;
        }
        if (dataParams.next === false) {
            return false;
        }
        // Default return: the last parsed document or false if undefined
        return lastParsedDocument || false;
    });
}
exports["default"] = VIEWsubmit;


/***/ }),

/***/ "./src/js/emailmaker.ts":
/*!******************************!*\
  !*** ./src/js/emailmaker.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.emailMaker = emailMaker;
exports.getDates = getDates;
const marked_1 = __importDefault(__webpack_require__(/*! marked */ "./node_modules/marked/lib/marked.cjs"));
const templateMap = {
    'Report Needed': 'https://trimapi.justice.vic.gov.au/record/13724486/File/document2',
    'MOU': {
        'Agency FR Granted': 'https://trimapi.justice.vic.gov.au/record/21673543/File/document2',
        'default': 'https://trimapi.justice.vic.gov.au/record/13733834/File/document2'
    },
    'Unable to Contact Applicant': 'https://trimapi.justice.vic.gov.au/record/13735474/File/document2',
    'FVS Further Information Required': 'https://trimapi.justice.vic.gov.au/record/15111431/File/document2',
    'Further Information Required': 'https://trimapi.justice.vic.gov.au/record/15111431/File/document2'
};
function emailMaker(data, parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        let templateUrl;
        if (parameters[1] === 'MOU') {
            templateUrl = parameters[2] === 'Agency FR Granted' ?
                templateMap.MOU['Agency FR Granted'] :
                templateMap.MOU.default;
        }
        else {
            templateUrl = templateMap[parameters[1]];
        }
        const res = yield fetch(templateUrl);
        let template = yield res.text();
        data.today = getDates().today;
        data.todayplus14 = getDates().todayplus14;
        data.emailTo = data.EmailAddress !== undefined ? data.EmailAddress : "None";
        let result = template.split('----boundary_text_string');
        marked_1.default.setOptions({ 'breaks': true, "gfm": true });
        result[1] = yield marked_1.default.parse(result[1]);
        template = result.join('----boundary_text_string \n');
        template = template.replace('<p>Content-Type: text/html</p>', 'Content-Type: text/html \n');
        downloadEmail(template, parameters, data);
    });
}
function readFileAsync(blob) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result); // Type assertion here
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};
function getDates() {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const todayDate = new Date();
    var dd = String(todayDate.getDate()).padStart(2, '0');
    var mm = monthNames[todayDate.getMonth()];
    var yyyy = todayDate.getFullYear();
    var today = dd + ' ' + mm + ' ' + yyyy;
    var todayplus28 = new Date().addDays(28);
    var dd28 = String(todayplus28.getDate()).padStart(2, '0');
    var mm28 = monthNames[todayplus28.getMonth()];
    var yyyy28 = todayplus28.getFullYear();
    var todayplus21 = new Date().addDays(21);
    var dd21 = String(todayplus21.getDate()).padStart(2, '0');
    var mm21 = monthNames[todayplus21.getMonth()];
    var yyyy21 = todayplus21.getFullYear();
    var todayplus14 = new Date().addDays(14);
    var dd14 = String(todayplus14.getDate()).padStart(2, '0');
    var mm14 = monthNames[todayplus14.getMonth()];
    var yyyy14 = todayplus14.getFullYear();
    return { "today": today, "todayplus14": dd14 + ' ' + mm14 + ' ' + yyyy14, "todayplus28": dd28 + ' ' + mm28 + ' ' + yyyy28, "todayplus21": dd21 + ' ' + mm21 + ' ' + yyyy21 };
}
function downloadEmail(emlContent, parameters, data) {
    var encodedUri = encodeURI(emlContent); //encode spaces etc like a url
    encodedUri = encodedUri.replace(/#/g, '%23');
    var a = document.createElement('a'); //make a link in document
    var linkText = document.createTextNode("fileLink");
    a.appendChild(linkText);
    a.href = encodedUri;
    a.id = 'fileLink';
    if (parameters[1] !== 'MOU') {
        a.download = data.First_Name + " " + data.Last_Name + ' - ' + parameters[1] + '.eml';
    }
    else {
        a.download = data.First_Name + " " + data.Last_Name + ' - ' + data.enforcename + '.eml';
    }
    a.style = "display:none;"; //hidden link
    document.body.appendChild(a);
    const fileLink = document.getElementById('fileLink');
    if (fileLink) {
        fileLink.click(); //click the link
    }
    a.remove();
}


/***/ }),

/***/ "./src/js/genLetter-module.ts":
/*!************************************!*\
  !*** ./src/js/genLetter-module.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


// @ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadLetter = downloadLetter;
exports.makeLetter = makeLetter;
let expressions = __webpack_require__(/*! angular-expressions */ "./node_modules/angular-expressions/lib/main.js");
function downloadLetter(address, properties) {
    let addressArray = address.split(",");
    if (addressArray.length > 5) {
        addressArray[1] = `${addressArray[0]}${addressArray[1]}`;
        addressArray.shift();
    }
    let l = {
        "provable": [],
        "courtFines": [],
        "nonProvable": [],
        "zeroBalance": [],
        "dateOfBankruptcy": toDate(properties.dateOfBankruptcy).toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
        "bankruptcynotificationdate": toDate(document.getElementById('noteDate').value).toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
        "First_Name": properties.firstName,
        "Last_Name": properties.lastName,
        "Address_1": addressArray[0].trim(),
        "Town": addressArray[1].trim(),
        "State": addressArray[2].trim(),
        "Post_Code": addressArray[3].trim(),
        "Debtor_ID": properties.debtorid
    };
    let reduced = properties.agencies.reduce((obj, item) => (obj[item.key] = item.value, obj), {});
    properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
        let data = this.data();
        const types = ["1A", "1B", "1C", "2A"];
        const statuses = ["WARRNT", "CHLGLOG", "NFDP", "SELDEA"];
        if (String(data.Offence) === "0000") {
            properties.courtDetails;
            data.hearingDate = properties.courtDetails[data.NoticeNumber].hearingDate;
            data.courtLocation = properties.courtDetails[data.NoticeNumber].courtLocation;
            data.CaseRef = properties.courtDetails[data.NoticeNumber].CaseRef;
        }
        data.agency = reduced[data.NoticeNumber];
        let bd = moment(properties.dateOfBankruptcy, "YYYY-MM-DD");
        let td = moment(data.OffenceDate, "DD/MM/YYYY");
        let balance = Number(data.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));
        (balance <= 0) &&
            (l.zeroBalance.push(data)) ||
            (bd.isAfter(td)) &&
                (types.some(type => data.InputType === type)) &&
                (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
                (l.provable.push(data)) ||
            (data.Offence === "0000") &&
                (l.courtFines.push(data)) ||
            (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
                (l.nonProvable.push(data));
    });
    properties.filename = `${titleCase(properties.firstName)} ${titleCase(properties.lastName)} - Bankruptcy Confirmation`;
    backgroundLetterMaker(l, properties, "https://trimwebdrawer.justice.vic.gov.au/record/13930494/File/document");
}
function angularParser(tag) {
    if (tag === '.') {
        return {
            get: function (s) { return s; }
        };
    }
    /*  if (tag.includes('%')) {
        return {
            'get': function (scope) { return scope[tag] }
        }
    }*/
    const expr = expressions.compile(tag.replace(/(’|“|”)/g, "'"));
    return {
        get: function (s) {
            return expr(s);
        }
    };
}
function backgroundLetterMaker(letterData, properties, letterTemplateURL) {
    return __awaiter(this, void 0, void 0, function* () {
        const letterTemplate = yield loadLetter(letterTemplateURL);
        /* Create a letter for each of the objects in letterData */
        const letter = makeLetter(letterData, letterTemplate, properties.filename);
    });
}
function makeLetter(content, letterTemplate, filename, imageModule) {
    var zip = new PizZip(letterTemplate);
    var doc = new window.Docxtemplater().loadZip(zip);
    if (imageModule) {
        doc.attachModule(imageModule);
    }
    doc.setOptions({
        parser: angularParser
    });
    console.log(content);
    doc.setData(content);
    try {
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render();
    }
    catch (error) {
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        };
        // console.log(JSON.stringify({ error: e }));
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        throw error;
    }
    var out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }); //Output the document using Data-URI    
    saveAs(out, filename + ".docx");
}
function loadLetter(url) {
    return new Promise((resolve, reject) => {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                throw err; // or handle err
            }
            data = resolve(data);
            return data;
        });
    });
}
const toDate = (dateStr = "2000-01-01") => {
    const [day, month, year] = dateStr.split("-").reverse();
    return new Date(year, month - 1, day);
};
function titleCase(string) {
    var sentence = string.trim().toLowerCase().split(" ");
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(" ");
}


/***/ }),

/***/ "./src/js/letter-logic.ts":
/*!********************************!*\
  !*** ./src/js/letter-logic.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseTable = parseTable;
const emailmaker_1 = __webpack_require__(/*! ./emailmaker */ "./src/js/emailmaker.ts");
// Import types or functions from other modules
// Assuming VIEWsubmit takes config and properties and returns a Promise
const VIEWsubmit_1 = __importDefault(__webpack_require__(/*! ./VIEWsubmit */ "./src/js/VIEWsubmit.ts")); // Adjust if it has a default export or named exports
// Assuming makeLetter takes data, template buffer, and filename
const genLetter_module_1 = __webpack_require__(/*! ./genLetter-module */ "./src/js/genLetter-module.ts"); // Adjust if default export
// --- Global State ---
let running = false; // Simple lock state
// --- Chrome Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Basic check for message structure - consider adding more validation
    if (!Array.isArray(message) || message.length < 11) {
        console.warn("Received unexpected message format:", message);
        return;
    }
    const source = message[5];
    const expectedUrlPart = `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations`.toUpperCase();
    if (sender.url && sender.url.toUpperCase().includes(expectedUrlPart) &&
        !message[1].includes('Bulk') && !message[1].includes('Export') &&
        message[4] === false) {
        const properties = {}; // Start with partial, will be filled
        properties.obligationRows = message[6];
        properties.source = message[5];
        properties.agency = message[7];
        properties.letters = message[8];
        properties.extended = message[9];
        properties.SharePoint = message[10];
        // Ensure all required properties are present before launching
        if (properties.obligationRows && properties.source && properties.letters) {
            launch(properties)
                .then(() => {
                console.log("Launch completed successfully.");
                // sendResponse({ status: "success" }); // Optional: respond if needed
            })
                .catch(error => {
                console.error("Error during launch:", error);
                // sendResponse({ status: "error", message: error instanceof Error ? error.message : String(error) }); // Optional: respond on error
                // Re-throw if necessary for higher-level handlers
                // throw error;
            });
            return true; // Indicates that sendResponse will be called asynchronously (optional)
        }
        else {
            console.error("Missing required properties in message:", message);
        }
    }
    // Return false or undefined if not handling the message or not responding asynchronously
    return undefined;
});
// --- Main Launch Function ---
function launch(properties) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Assuming VIEWsubmit matches the inferred type
            yield (VIEWsubmit_1.default)({}, 0, undefined, letterGen(properties), properties);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage !== 'Scraper already running') {
                running = false; // Reset lock only if it's not the 'already running' error
            }
            // Re-throw the original error to propagate it
            throw err;
        }
    });
}
// --- Letter Generation Configuration ---
function letterGen(properties) {
    if (running === true) {
        throw new Error('Scraper already running'); // Throw an actual Error object
    }
    running = true;
    return {
        groupRepeats: {
            "obligationsGroup": () => {
                var _a;
                properties.agencies = (_a = properties.agencies) !== null && _a !== void 0 ? _a : []; // Initialize if undefined
                let paramArray = [];
                if (properties.agency || properties.extended) {
                    properties.obligationRows.forEach(data => {
                        var _a, _b;
                        const params = {};
                        if ((_a = data["Input Type"]) === null || _a === void 0 ? void 0 : _a.includes('1A')) {
                            properties.agencies.push({ key: data["Notice Number"], value: "TRAFFIC CAMERA OFFICE" });
                        }
                        else if ((_b = data["Input Type"]) === null || _b === void 0 ? void 0 : _b.includes('1C')) {
                            properties.agencies.push({ key: data["Notice Number"], value: "VICTORIA POLICE TOLL ENFORCEMENT OFFICE" });
                        }
                        else {
                            params["txtNoticeNo"] = data["Notice Number"];
                            paramArray.push(params);
                        }
                    });
                }
                properties.obligationsCountFixed = paramArray.length;
                properties.obligationsCount = paramArray.length;
                return paramArray;
            },
            "getChallenge": () => {
                var _a, _b;
                const paramArray = [];
                // Ensure obligationRows exists and has at least one element
                if (((_b = (_a = properties.obligationRows) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b['Notice Status/Previous Status']) &&
                    !properties.obligationRows[0]['Notice Status/Previous Status'].includes('CHLGLOG')) {
                    paramArray.push({ "txtNoticeNo": properties.obligationRows[0]["Notice Number"] });
                }
                return paramArray;
            }
        },
        submit: [{
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
                urlParams: (parsedDocument, set, props) => {
                    // Ensure chrome storage types are correct
                    const storageData = { 'obligationsCount': 10, "obligationsCountFixed": 10 };
                    chrome.storage.local.set(storageData);
                    // Assuming fetchRetryTimeout matches the inferred type
                    props.agenciesList = fetch('https://vicgov.sharepoint.com/:u:/s/msteams_3af44a/ETiKQS5uTzxHnTmAV6Zpl9oBvhNZexZFmJrJxLNZLD6L4A?download=1');
                    props.reviewList = fetch(`https://${props.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx`);
                    props.templates = props.letters.map((letter) => {
                        const urlKey = letter; // Type assertion
                        const trimRecordId = letterURL[urlKey];
                        if (!trimRecordId) {
                            console.error(`No URL found for letter type: ${letter}`);
                            // Handle error appropriately - maybe return a dummy template promise?
                            throw new Error(`Missing URL configuration for letter: ${letter}`);
                        }
                        const letterTemplateURL = `https://trimapi.justice.vic.gov.au/record/${trimRecordId}/File/document2`;
                        // Assuming the SharePoint URL structure is consistent and uses the same ID
                        const SharePointletterTemplateURL = `https://vicgov-my.sharepoint.com/:w:/g/personal/adrian_zafir_justice_vic_gov_au/${trimRecordId}?download=1`;
                        return {
                            "kind": letter === 'Agency Enforcement Cancelled' ||
                                letter === 'Agency Fee Removal' ||
                                letter === 'FVS Eligible Agency' ||
                                letter === 'Agency FR Granted' ||
                                letter === 'Agency Enforcement Cancelled Updated' || // Ensure this is in letterURL
                                letter === "Notice of Deregistration" ? 'Agency' : 'Debtor',
                            "letter": letter,
                            "template": props.SharePoint === true ? loadLetter(SharePointletterTemplateURL) : loadLetter(letterTemplateURL)
                        };
                    });
                },
                after: (parsedDocument) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
                    if (!parsedDocument)
                        return; // Guard against null document
                    // Use optional chaining and nullish coalescing for safer access
                    properties.DebtorId = (_c = (_b = (_a = parsedDocument.querySelector("#DebtorDetailsCtrl_DebtorIdSearch")) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
                    properties.lastName = (_f = (_e = (_d = parsedDocument.querySelector("#DebtorDetailsCtrl_surnameTxt")) === null || _d === void 0 ? void 0 : _d.textContent) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : '';
                    properties.firstName = (_j = (_h = (_g = parsedDocument.querySelector("#DebtorDetailsCtrl_firstnameTxt")) === null || _g === void 0 ? void 0 : _g.textContent) === null || _h === void 0 ? void 0 : _h.trim()) !== null && _j !== void 0 ? _j : '';
                    properties.companyName = (_m = (_l = (_k = parsedDocument.querySelector("#DebtorDetailsCtrl_companyNameTxt")) === null || _k === void 0 ? void 0 : _k.textContent) === null || _l === void 0 ? void 0 : _l.trim()) !== null && _m !== void 0 ? _m : '';
                    properties.Is_Company = !!properties.companyName; // Simpler boolean check
                    const addressTable = parsedDocument.querySelector("#DebtorAddressesCtrl_gridDebtorAddresses_tblData");
                    if (!addressTable) {
                        console.warn("Address table not found.");
                        properties.Address = { Address_1: "", Town: "", State: "", Post_Code: "" }; // Default empty address
                        return;
                    }
                    let addressTableData = parseTable(addressTable);
                    let addressParts = []; // Initialize as empty array
                    addressTableData = addressTableData.filter(row => row["Best Address"] === "Y");
                    const addressObject = convertArrayToObject(addressTableData, "Type");
                    for (const priority of addressPriority) {
                        if ((_o = addressObject[priority]) === null || _o === void 0 ? void 0 : _o.Address) { // Check if priority exists and has Address
                            addressParts = addressObject[priority].Address.split(",");
                            addressParts.push((_p = addressObject[priority].Postcode) !== null && _p !== void 0 ? _p : ''); // Use nullish coalescing for postcode
                            break;
                        }
                    }
                    // Clean up address parts (ensure strings before trimming)
                    addressParts = addressParts.map(part => String(part || '').trim());
                    // Handle unit numbers etc. combined with street name
                    if (addressParts.length > 0 && addressParts.length > 4) { // Check length before accessing index 1
                        addressParts[1] = `${addressParts[0]} ${addressParts[1]}`; // Add space
                        addressParts.shift();
                    }
                    properties.Address = {
                        "Address_1": (_q = addressParts[0]) !== null && _q !== void 0 ? _q : '', // Provide defaults
                        "Town": (_r = addressParts[1]) !== null && _r !== void 0 ? _r : '',
                        "State": (_s = addressParts[2]) !== null && _s !== void 0 ? _s : '',
                        "Post_Code": (_t = addressParts[3]) !== null && _t !== void 0 ? _t : undefined
                    };
                }
            }, {
                group: "obligationsGroup",
                urlParams: function (parsedDocument, dynamicParams) {
                    // Modify the URL on the 'this' context (the step object)
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParams.txtNoticeNo}`;
                    return {}; // Return empty object as params are in URL
                },
                after: (parsedDocument) => {
                    var _a, _b, _c;
                    if (!parsedDocument || !properties.obligationsCountFixed || properties.obligationsCount === undefined)
                        return;
                    const progress = ((properties.obligationsCountFixed - properties.obligationsCount + 1) / properties.obligationsCountFixed) * 10; // Correct progress calculation
                    properties.obligationsCount--;
                    const storageData = { 'obligationsCount': progress, "obligationsCountFixed": 10 }; // Consider if fixed should be dynamic
                    chrome.storage.local.set(storageData);
                    const noticeNo = (_a = parsedDocument.getElementById("NoticeInfo_txtNoticeNo")) === null || _a === void 0 ? void 0 : _a.value;
                    const agencyCode = (_b = parsedDocument.getElementById("NoticeInfo_lblAgencyCode")) === null || _b === void 0 ? void 0 : _b.textContent;
                    if (noticeNo && agencyCode) {
                        properties.agencies = (_c = properties.agencies) !== null && _c !== void 0 ? _c : [];
                        properties.agencies.push({ key: noticeNo, value: agencyCode });
                    }
                    else {
                        console.warn("Could not extract notice number or agency code.");
                    }
                },
                clearVIEWFormData: true
            }, {
                group: "getChallenge",
                urlParams: function (parsedDocument, dynamicParams) {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParams.txtNoticeNo}`;
                    return {};
                },
                clearVIEWFormData: true
            }, {
                group: "getChallenge",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeChallengeHistory.aspx`,
                after: (parsedDocument) => {
                    var _a, _b;
                    if (!parsedDocument)
                        return;
                    const challengeText = (_b = (_a = parsedDocument.querySelector("#lblChallengeCodeVal")) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : '';
                    const match = challengeText.match(/Enforcement - (.*)/);
                    properties.challengeType = match ? match[1] : 'No Challenge Logged';
                },
                clearVIEWFormData: true
            }
        ],
        afterAction: (doc, props) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
            // Ensure required promises exist before proceeding
            if (!props || !props.agenciesList || !props.reviewList || !props.templates) {
                console.error("Prerequisite data (agenciesList, reviewList, templates) missing in afterAction.");
                running = false; // Reset lock on error
                throw new Error("Missing prerequisite data for afterAction.");
            }
            // Combine agency info into a lookup object
            const agencyLookup = ((_a = props.agencies) !== null && _a !== void 0 ? _a : []).reduce((obj, item) => {
                obj[item.key] = item.value;
                return obj;
            }, {});
            try {
                // Resolve all promises concurrently
                const results = yield Promise.all([
                    props.agenciesList.then((response) => response.json()), // Assuming JSON response
                    props.reviewList.then((response) => response.text()), // Assuming text/HTML response
                    // Resolve template promises (already initiated)
                    ...props.templates.map((t) => t.template)
                ]);
                const agenciesListData = results[0]; // Type this if structure is known (e.g., { addresses: any[] })
                const reviewListHtml = results[1];
                const templateBuffers = results.slice(2);
                // Assign resolved templates back to properties.templates
                props.templates.forEach((templateMeta, index) => {
                    // Re-wrap in a resolved promise if needed elsewhere, or just store buffer
                    templateMeta.template = Promise.resolve(templateBuffers[index]);
                });
                // Process obligation rows
                props.obligationRows = props.obligationRows.map((row) => {
                    var _a;
                    const noticeNumber = row['Notice Number'];
                    const dueDate = row['Due Date'];
                    const noticeStatus = row['Notice Status/Previous Status'];
                    let isLapsed = false;
                    if (dueDate) {
                        const dateParts = dueDate.split("/");
                        if (dateParts.length === 3) {
                            // Check date format before creating Date object
                            const year = parseInt(dateParts[2], 10);
                            const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
                            const day = parseInt(dateParts[0], 10);
                            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                isLapsed = new Date(year, month, day).getTime() < Date.now();
                            }
                        }
                    }
                    return Object.assign(Object.assign({}, row), { Obligation: noticeNumber, Balance_Outstanding: row['Balance Outstanding'], Infringement: row['Infringement No.'], Offence: row['Offence'], OffenceDate: row['Offence Date'], IssueDate: row['Issued'], altname: (_a = agencyLookup[noticeNumber]) !== null && _a !== void 0 ? _a : 'Unknown Agency', NoticeStatus: noticeStatus, ProgressionDate: dueDate, NFDlapsed: noticeStatus === 'SELDEA' || noticeStatus === 'WARRNT' || (isLapsed && noticeStatus === 'NFDP') });
                });
                // Parse review list HTML
                const parser = new DOMParser();
                const reviewDoc = parser.parseFromString(reviewListHtml, 'text/html');
                const reviewTable = reviewDoc.querySelector("#DebtorDecisionCtrl_DebtorNoticesTable_tblData");
                if (reviewTable) {
                    const reviewTableData = parseTable(reviewTable);
                    reviewTableData.forEach(reviewdata => {
                        var _a;
                        const challengeCode = reviewdata['Challenge Code'];
                        const ob = props.obligationRows.find((data) => reviewdata['Notice Number'] == data.Obligation);
                        if (ob) {
                            ob.Challenge = (_a = challengeList[challengeCode]) !== null && _a !== void 0 ? _a : 'Unknown Challenge'; // Use lookup
                        }
                    });
                }
                else {
                    console.warn("Review table not found in fetched HTML.");
                }
                // Prepare base letter data
                const baseLetterData = {
                    "First_Name": toTitleCaseHypen(toTitleCase((_b = props.firstName) !== null && _b !== void 0 ? _b : '')).trim().split(" ")[0],
                    "Last_Name": toTitleCaseHypen(toTitleCase((_c = props.lastName) !== null && _c !== void 0 ? _c : '')).trim(),
                    "Company_Name": props.Is_Company ? toTitleCase((_d = props.companyName) !== null && _d !== void 0 ? _d : '').trim() : undefined,
                    "Is_Company": (_e = props.Is_Company) !== null && _e !== void 0 ? _e : false,
                    "Address_1": toTitleCase((_g = (_f = props.Address) === null || _f === void 0 ? void 0 : _f.Address_1) !== null && _g !== void 0 ? _g : '').trim(),
                    "Town": (_j = (_h = props.Address) === null || _h === void 0 ? void 0 : _h.Town) !== null && _j !== void 0 ? _j : '',
                    "Town2": toTitleCase((_l = (_k = props.Address) === null || _k === void 0 ? void 0 : _k.Town) !== null && _l !== void 0 ? _l : ''), // Duplicate?
                    "State": (_o = (_m = props.Address) === null || _m === void 0 ? void 0 : _m.State) !== null && _o !== void 0 ? _o : '',
                    "Post_Code": (_p = props.Address) === null || _p === void 0 ? void 0 : _p.Post_Code,
                    "Debtor_ID": props.DebtorId,
                    "Challenge": (_t = (_s = (_r = (_q = props.obligationRows) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.Challenge) !== null && _s !== void 0 ? _s : props.challengeType) !== null && _t !== void 0 ? _t : 'No Challenge Logged',
                    "UserID": yield getData('userName') // Assuming getData returns Promise<string | undefined>
                };
                baseLetterData.OnlyNFDLapsed = !((_v = (_u = props.obligationRows) === null || _u === void 0 ? void 0 : _u.some((row) => row.NFDlapsed === false)) !== null && _v !== void 0 ? _v : false);
                // Enhance base data with AppData
                yield getAppData(baseLetterData); // Modifies baseLetterData in place
                // Address formatting (make safer)
                const replacements = [
                    [/ Gr$/i, " Grove"], [/ St$/i, " Street"], [/ Dr$/i, " Drive"], [/ Ct$/i, " Court"],
                    [/ Rd$/i, " Road"], [/ Ave?$/i, " Avenue"], [/ Cre?s?$/i, " Crescent"], [/ Pl$/i, " Place"],
                    [/ Tce$/i, " Terrace"], [/ Bvd$/i, " Boulevard"], [/ Cl$/i, " Close"], [/ Cir$/i, " Circle"],
                    [/ Pde$/i, " Parade"], [/ Cct$/i, " Circuit"], [/ Wy$/i, " Way"], [/ Esp$/i, " Esplanade"],
                    [/ Sq$/i, " Square"], [/ Hwy$/i, " Highway"], [/^Po /i, "PO "]
                ];
                let address1 = baseLetterData.Address_1 || '';
                replacements.forEach(([regex, replacement]) => {
                    address1 = address1.replace(regex, replacement);
                });
                baseLetterData.Address_1 = address1;
                // Prepare final letter data array
                props.letterData = [];
                if (props.agency && (agenciesListData === null || agenciesListData === void 0 ? void 0 : agenciesListData.addresses)) { // Check agenciesListData structure
                    let groupedByAgency = groupBy((_w = props.obligationRows) !== null && _w !== void 0 ? _w : [], 'altname');
                    // Ensure mergeById handles potential missing data gracefully
                    groupedByAgency = mergeById(groupedByAgency, agenciesListData.addresses, "altname", "altname"); // Assuming 'altname' matches key in addresses
                    props.letterData.push(...groupedByAgency.map((item) => (Object.assign(Object.assign(Object.assign({}, item), baseLetterData), { kind: "Agency" }))));
                }
                if (!props.letters.includes("Notice of Deregistration")) { // Check if debtor letter is needed
                    // Ensure 'a' property is expected by downstream consumers
                    props.letterData.push(Object.assign(Object.assign({}, baseLetterData), { a: props.obligationRows, kind: "Debtor" }));
                }
                const storageUpdate = { 'obligationsCount': 0, "obligationsCountFixed": 10 };
                chrome.storage.local.set(storageUpdate);
                // Generate letters
                if (!props.letterData || props.letterData.length === 0) {
                    console.log("No letter data generated.");
                    running = false; // Reset lock
                    return;
                }
                for (const data of props.letterData) {
                    // Determine letter type and find corresponding template meta
                    const userId = String((_x = data.UserID) !== null && _x !== void 0 ? _x : 'UnknownUser'); // Ensure UserID is string
                    const nameForFilename = data.Is_Company ? data.Company_Name : `${(_y = data.First_Name) === null || _y === void 0 ? void 0 : _y.charAt(0)} ${data.Last_Name}`;
                    const letterTypeMap = letterTypes((_z = data.a) !== null && _z !== void 0 ? _z : [], (_0 = data.enforcename) !== null && _0 !== void 0 ? _0 : 'UnknownAgency', nameForFilename !== null && nameForFilename !== void 0 ? nameForFilename : 'UnknownName', userId); // Provide defaults
                    const templateMeta = (_1 = props.templates) === null || _1 === void 0 ? void 0 : _1.find((template) => template.kind === data.kind);
                    if (!templateMeta) {
                        console.warn(`No template found for kind: ${data.kind}`);
                        continue; // Skip if no template
                    }
                    const letterTypeName = templateMeta.letter;
                    const specificLetterType = letterTypeMap[letterTypeName];
                    if (!specificLetterType) {
                        console.warn(`No letter type definition found for: ${letterTypeName}`);
                        continue; // Skip if no definition
                    }
                    // Calculate selected obligation value
                    data.selectedObValue = '$' + formatMoney(((_2 = data.a) !== null && _2 !== void 0 ? _2 : []).reduce((t, o) => t + Number(String(o.Balance_Outstanding || '0').replace(/[^0-9.-]+/g, "")), 0));
                    // Add dynamic properties based on letter type Props
                    if (specificLetterType.Props) {
                        const dates = (0, emailmaker_1.getDates)(); // Get dates once if needed
                        specificLetterType.Props.forEach(prop => {
                            data[prop] = true; // Default value
                            if (prop === "todayplus14")
                                data[prop] = dates.todayplus14;
                            if (prop === "todayplus28")
                                data[prop] = dates.todayplus28;
                            if (prop === "todayplus21")
                                data[prop] = dates.todayplus21;
                            // Add other specific prop handlers if necessary
                        });
                    }
                    // Resolve the template promise before calling makeLetter
                    const templateBuffer = yield templateMeta.template;
                    // Assuming makeLetter matches the inferred type
                    genLetter_module_1.makeLetter(data, templateBuffer, specificLetterType.filename);
                    // Email generation logic (ensure emailMaker is defined and typed)
                    if (data.MOU === true &&
                        !props.letters.some((type) => type === 'Agency Fee Removal' || type === "Notice of Deregistration")) {
                        const agencyTemplateMeta = (_3 = props.templates) === null || _3 === void 0 ? void 0 : _3.find((template) => template.kind === 'Agency');
                        if (agencyTemplateMeta) {
                            (0, emailmaker_1.emailMaker)(data, [data.AgencyEmail, 'MOU', agencyTemplateMeta.letter]);
                        }
                    }
                }
            }
            catch (error) {
                console.error("Error during afterAction processing:", error);
                // Rethrow or handle as appropriate
                throw error;
            }
            finally {
                running = false; // Ensure lock is always reset
            }
        })
    };
}
// --- Helper Functions with Types ---
function getAppData(data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['value'], (items) => {
            var _a, _b;
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return reject(chrome.runtime.lastError);
            }
            const applicationData = (_a = items.value) !== null && _a !== void 0 ? _a : {};
            data.tParty = false; // Default
            data.legalCentre = false; // Default
            for (const applicationKey in applicationData) {
                const appDetails = applicationData[applicationKey];
                // Check array length before accessing indices
                if (Array.isArray(appDetails) && appDetails.length > 18 && appDetails[0] === data.Debtor_ID) {
                    data.legalCentre = false; // Reset per application check
                    if (appDetails[1] === true) { // Assuming index 1 indicates tParty status
                        data.tParty = true;
                        data.applicantName = appDetails[2];
                        data.appOrganisation = appDetails[3];
                        data.appStreet = appDetails[4];
                        data.appTown = appDetails[5];
                        data.appState = appDetails[6];
                        data.appPost = appDetails[7];
                        data.legalCentre = appDetails[17]; // Potential Legal Centre flag for main 3rd party
                        // Determine recipient based on flags at indices 8, 9, 10
                        if (appDetails[8] === true) {
                            data.recipient = '3rd Party';
                        }
                        else if (appDetails[9] === true) {
                            data.recipient = 'Debtor';
                        }
                        else if (appDetails[10] === true) {
                            data.recipient = 'Alt 3rd Party';
                            data.altApplicantName = appDetails[11];
                            data.altAppOrganisation = appDetails[12];
                            data.altAppStreet = appDetails[13];
                            data.altAppTown = appDetails[14];
                            data.altAppState = appDetails[15];
                            data.altAppPost = appDetails[16];
                            // Assuming index 18 is the legal centre flag specifically for Alt 3rd Party
                            data.legalCentre = appDetails[18]; // Overwrite if Alt 3rd party is chosen
                        }
                        else {
                            // Default recipient if no flag is set?
                            data.recipient = 'Unknown'; // Or Debtor/3rd Party based on data.tParty?
                        }
                        break; // Found matching debtor, stop searching
                    }
                    else {
                        // Debtor ID matched, but tParty flag (index 1) is false
                        data.tParty = false;
                        // Potentially break here too if only one entry per Debtor_ID is expected
                        break;
                    }
                }
            }
            // Resolve with the original retrieved items.value structure
            resolve((_b = items.value) !== null && _b !== void 0 ? _b : {});
        });
    });
}
function loadLetter(url) {
    return new Promise((resolve, reject) => {
        JSZipUtils.getBinaryContent(url, (err, data) => {
            if (err) {
                console.error("Error loading letter template:", err);
                running = false; // Reset lock on error
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
const addressPriority = ["Postal Address", "Residential Address", "Unknown Address"];
const challengeList = {
    "E_EXCIRCUM": "Exceptional circumstances",
    "E_PERUNAWR": "Person unaware",
    "E_SPCIRCUM": "Special circumstances",
    "E_CONTRLAW": "Contrary to the law",
    "E_MISTAKID": "Mistake of identity"
};
// Ensure all keys used in code exist here
const letterURL = {
    'Agency Enforcement Cancelled': "21860542",
    'Agency Fee Removal': "12918361",
    'Enforcement Confirmed': "21908189",
    'Enforcement Cancelled': "21864380",
    "ER Confirm/ FW Grant": "21922728",
    'Report Needed': "12918375",
    'Wrong person applying. No grounds': "12918368",
    'Paid in full. Ineligible': "12918367",
    'Outside Person Unaware. Ineligible': "12918370", // Used twice in original JS? Check logic
    'Offence n/e Person Unaware. No grounds': "12918370", // Used twice in original JS? Check logic
    'Unable to Contact Applicant': "12918377",
    'Claim of payment adv contact agency': "14513448",
    'Notice of Deregistration': "14688539",
    'Further Information Required': "15102090",
    'FVS Eligible Debtor': "15104893",
    'FVS Eligible Agency': "15104895",
    'FVS Ineligible': "15111337",
    'FVS Further Information Required': "15111404",
    'PSL': "15119430",
    'Suspension of driver licence': "15531068",
    "Suspension of vehicle registration - Ind": "17470564",
    "Suspension of vehicle registration - Corp": "17470563",
    'Court Fine Fee Waive Granted': "EXKiK2Ln98ZFq1RNxyVlAuIB9XFcwmEu0u-wn-u9xLRaeg", // Different format?
    "Special Circumstances No grounds": "18754905", // Duplicate key? Check logic
    "POI - direction to produce": "21266650",
    "PA Refused - Active 7DN": "21379969",
    "No Grounds": "21781572", // Duplicate key? Check logic
    "PA Refused": "21780824",
    "EOT Refused": "21781515",
    "PA Refused-Sanction": "21538164",
    "PA App Incomplete": "21543595",
    "Company PA Ineligible SZWIP": "21543668",
    "EOT Refused - Infringements stage": "21547909",
    "PA Refused Expired 7DN": "21554295",
    "Fee Removal PIF": "21569882",
    "CF Fee Removal Granted": "21588427",
    "CF Fee Removal Refused": "21623835",
    'Fee Removal Refused': "21625790", // Duplicate key? Check logic
    'FR Refused - Active 7DN': "21630687",
    'FW Refused - Sanction': "21642104",
    "FR Granted": "21602358",
    "Agency FR Granted": "21609844",
    "FR Granted - Active 7DN": "21575815",
    "FR Granted - Sanction": "21582960",
    "Ineligible for ER - offence type": "21720126",
    "Court not an option": "21746214",
    "ER Ineligible Deregistered Company": "21758558",
    "Ineligible Paid in full": "21761625", // Duplicate key? Check logic
    "Appeal not available": "21761877",
    "Nomination Not Grounds": "21767490",
    "ER Ineligible Court Fine": "21771157",
    "Spec Circ Options": "21774656",
    "ER Additional Info": "21738969",
    "Ineligible for ER enforcement action": "21745145",
    "Ineligible PU - Outside Time": "21787906",
    "Ineligible for ER previous review": "21790863",
    "ER Ineligible PU": "21794412",
    "Claim of payment to agency": "21797592", // Duplicate key? Check logic
    "Request for photo evidence": "21811532",
    "Ineligible Incorrect company applying": "21815023",
    "Spec Circ No Grounds": "21825433", // Duplicate key? Check logic
    "Spec Circ Report Required": "21827269",
    "Unauthorised 3rd party applying": "21834939",
    "Ineligible Incorrect person applying": "21846719",
    "Spec Circ App Required": "21976745",
    "Spec Circ Report Insufficient": "21979090",
    "SC 3P Lawyer - Report Insufficient": "21977719",
    "ER Application Incomplete": "21982730",
    "SC 3P Lawyer - Report Required": "21991100",
    "ER Confirm/FW Grant - Active 7DN": "21993681",
    "ER Confirm/FW Grant - 7DN Expired option": "21993728",
    // Add any missing ones like 'Agency Enforcement Cancelled Updated' if needed
    'Agency Enforcement Cancelled Updated': "MISSING_ID", // Placeholder
};
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
function formatDate(date = new Date()) {
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1), // Month is 0-indexed
        padTo2Digits(date.getDate()),
    ].join('');
}
// Returns a map of letter names to their definitions (filename, props)
function letterTypes(obligationRows, enforcename, name, UserID) {
    var _a, _b;
    const o = obligationRows !== null && obligationRows !== void 0 ? obligationRows : [];
    const OBL = o.length === 1 ? " OBL " + ((_a = o[0]) === null || _a === void 0 ? void 0 : _a.Obligation) : " x " + o.length;
    const firstChallenge = (_b = o[0]) === null || _b === void 0 ? void 0 : _b.Challenge;
    const ReviewType = firstChallenge === "Special circumstances" ? "ER Special" : firstChallenge !== undefined ? "ER General" : undefined;
    const dt = formatDate(); // Calculate date once
    // Build the map directly
    const types = {
        'Agency Enforcement Cancelled': { filename: `${enforcename} - Cancelled${OBL} ${name} - ${UserID} - ${dt}` },
        'Agency Fee Removal': { filename: `${enforcename} - Fee Removal - Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'Enforcement Confirmed': { filename: `${ReviewType !== null && ReviewType !== void 0 ? ReviewType : 'Review'} - Confirmed${OBL} ${name} - ${UserID} - ${dt}` },
        'Enforcement Cancelled': { filename: `${ReviewType !== null && ReviewType !== void 0 ? ReviewType : 'Review'} - Cancelled${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Confirm/ FW Grant': { filename: `${ReviewType !== null && ReviewType !== void 0 ? ReviewType : 'Review'} - Confirmed With Fee Removal - Granted${OBL} ${name} - ${UserID} - ${dt}`, Props: ["ECCV"] },
        'Report Needed': { filename: `Report Needed${OBL} ${name} - ${UserID} - ${dt}`, Props: ["todayplus14"] },
        'Further Information Required': { filename: `Further Information Required${OBL} ${name} - ${UserID} - ${dt}`, Props: ["todayplus14"] },
        'Wrong person applying. No grounds': { filename: `No Grounds${OBL} ${name} - ${UserID} - ${dt}` },
        'Paid in full. Ineligible': { filename: `Paid In Full${OBL} ${name} - ${UserID} - ${dt}` },
        'Outside Person Unaware. Ineligible': { filename: `Outside Person Unware${OBL} ${name} - ${UserID} - ${dt}`, Props: ["Person_unaware_1"] },
        'Offence n/e Person Unaware. No grounds': { filename: `No Grounds Person Unware${OBL} ${name} - ${UserID} - ${dt}`, Props: ["Person_unaware_2"] },
        'Unable to Contact Applicant': { filename: `Unable To Contact Applicant${OBL} ${name} - ${UserID} - ${dt}` },
        'Special Circumstances No grounds': { filename: `No Grounds${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Claim of payment adv contact agency': { filename: `Cont Agency${OBL} ${name} - ${UserID} - ${dt}` },
        'Notice of Deregistration': { filename: `Notice Of Deregistration${OBL} ${name} - ${UserID} - ${dt}` },
        'FVS Eligible Debtor': { filename: `${name} - FVS Eligible${OBL}`, Props: ["todayplus28"] },
        'FVS Eligible Agency': { filename: `${name} - ${enforcename} - FVS Eligible${OBL}` },
        'FVS Ineligible': { filename: `${name} - ${enforcename} - FVS Ineligible${OBL}` },
        'FVS Further Information Required': { filename: `${name} - ${enforcename} - FVS Further Information Required${OBL}`, Props: ["todayplus21"] },
        'Suspension of driver licence': { filename: `${name} - Suspension of driver licence${OBL}` },
        'Suspension of vehicle registration - Ind': { filename: `${name} - Suspension of vehicle registration${OBL}` },
        'Suspension of vehicle registration - Corp': { filename: `${name} - Suspension of vehicle registration${OBL}` },
        'PSL': { filename: `${name} - PSL${OBL}` },
        'Court Fine Fee Waive Granted': { filename: `Court Fine - Fee Removal - Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'POI - direction to produce': { filename: `${name} - POI - direction to produce${OBL}`, Props: ["todayplus28"] },
        'PA Refused - Active 7DN': { filename: `${name} - PA Refused - Active 7DN${OBL}`, Props: ["todayplus28"] },
        'No Grounds': { filename: `No Grounds${OBL} ${name} - ${UserID} - ${dt}`, Props: ["No_Grounds"] }, // Duplicate?
        'PA Refused': { filename: `PA Refused${OBL} ${name} - ${UserID} - ${dt}` },
        'EOT Refused': { filename: `EOT Refused${OBL} ${name} - ${UserID} - ${dt}` },
        'PA Refused-Sanction': { filename: `PA Refused-Sanction${OBL} ${name} - ${UserID} - ${dt}` },
        'PA App Incomplete': { filename: `PA App Incomplete${OBL} ${name} - ${UserID} - ${dt}` },
        'Company PA Ineligible SZWIP': { filename: `Company PA Ineligible SZWIP${OBL} ${name} - ${UserID} - ${dt}` },
        'EOT Refused - Infringements stage': { filename: `EOT Refused - Infringements stage${OBL} ${name} - ${UserID} - ${dt}` },
        'PA Refused Expired 7DN': { filename: `PA Refused Expired 7DN${OBL} ${name} - ${UserID} - ${dt}` },
        'Fee Removal PIF': { filename: `Fee Removal PIF${OBL} ${name} - ${UserID} - ${dt}` },
        'CF Fee Removal Granted': { filename: `CF Fee Removal Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'CF Fee Removal Refused': { filename: `CF Fee Removal Refused${OBL} ${name} - ${UserID} - ${dt}` },
        'Fee Removal Refused': { filename: `Fee Removal Refused${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'FR Refused - Active 7DN': { filename: `FR Refused - Active 7DN${OBL} ${name} - ${UserID} - ${dt}` },
        'FW Refused - Sanction': { filename: `FW Refused - Sanction${OBL} ${name} - ${UserID} - ${dt}` },
        'FR Granted': { filename: `FR Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'Agency FR Granted': { filename: `${enforcename} - Agency FR Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'FR Granted - Active 7DN': { filename: `FR Granted - Active 7DN${OBL} ${name} - ${UserID} - ${dt}` }, // Enforce name was here?
        'FR Granted - Sanction': { filename: `FR Granted - Sanction${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible for ER - offence type': { filename: `Ineligible for ER - offence type${OBL} ${name} - ${UserID} - ${dt}` },
        'Court not an option': { filename: `Court not an option${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Ineligible Deregistered Company': { filename: `ER Ineligible Deregistered Company${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible Paid in full': { filename: `Ineligible Paid in full${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Appeal not available': { filename: `Appeal not available${OBL} ${name} - ${UserID} - ${dt}` },
        'Nomination Not Grounds': { filename: `Nomination Not Grounds${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Ineligible Court Fine': { filename: `ER Ineligible Court Fine${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ Options': { filename: `Spec Circ Options${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Additional Info': { filename: `ER Additional Info${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible for ER enforcement action': { filename: `Ineligible for ER enforcement action${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible PU - Outside Time': { filename: `Ineligible PU - Outside Time${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible for ER previous review': { filename: `Ineligible for ER previous review${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Ineligible PU': { filename: `ER Ineligible PU${OBL} ${name} - ${UserID} - ${dt}` },
        'Claim of payment to agency': { filename: `Claim of payment to agency${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Request for photo evidence': { filename: `Request for photo evidence${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible Incorrect company applying': { filename: `Ineligible Incorrect company applying${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ No Grounds': { filename: `Spec Circ No Grounds${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Spec Circ Report Required': { filename: `Spec Circ Report Required${OBL} ${name} - ${UserID} - ${dt}` },
        'Unauthorised 3rd party applying': { filename: `Unauthorised 3rd party applying${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible Incorrect person applying': { filename: `Ineligible Incorrect person applying${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ App Required': { filename: `Spec Circ App Required${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ Report Insufficient': { filename: `Spec Circ Report Insufficient${OBL} ${name} - ${UserID} - ${dt}` },
        'SC 3P Lawyer - Report Insufficient': { filename: `SC 3P Lawyer - Report Insufficient${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Application Incomplete': { filename: `ER Application Incomplete${OBL} ${name} - ${UserID} - ${dt}` },
        'SC 3P Lawyer - Report Required': { filename: `SC 3P Lawyer - Report Required${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Confirm/FW Grant - Active 7DN': { filename: `ER Confirm/FW Grant - Active 7DN${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Confirm/FW Grant - 7DN Expired option': { filename: `ER Confirm/FW Grant - 7DN Expired option${OBL} ${name} - ${UserID} - ${dt}` },
        // Add any missing letter types referenced elsewhere
        'Agency Enforcement Cancelled Updated': { filename: `${enforcename} - Cancelled Updated${OBL} ${name} - ${UserID} - ${dt}` }, // Example
    };
    return types;
}
// Generic types T and U, K is key property name
function mergeById(a1, a2, property1, property2
// The return type implies all items from a1 are returned,
// potentially merged with properties from a matching U item.
// Using Partial<U> because a match isn't guaranteed for every T.
) {
    // Create a Map for efficient lookups based on property2 values from a2
    const mapU = new Map();
    for (const item of a2) {
        // Ensure item has the property before setting
        if (Object.prototype.hasOwnProperty.call(item, property2)) {
            mapU.set(item[property2], item);
        }
    }
    return a1.map(itm => {
        // Look up the corresponding item from a2 using the map
        // Skip undefined properties
        const propValue = itm[property1];
        if (propValue === undefined) {
            return itm;
        }
        const matchingItem = mapU.get(propValue);
        // Spread itm first, then add/override with properties from matchingItem if it exists.
        // If matchingItem is undefined, spreading it results in no added properties.
        // The type assertion `{} as U` is no longer needed due to Partial<U> return type.
        return Object.assign(Object.assign({}, itm), (matchingItem !== null && matchingItem !== void 0 ? matchingItem : {}));
    });
}
function toTitleCase(str) {
    if (!str)
        return "";
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}
function toTitleCaseHypen(str) {
    if (!str)
        return "";
    return str.toLowerCase().replace(/(?:^|\s|\/|-)\w/g, (match) => match.toUpperCase());
}
// Specify return type more accurately if known (e.g., string | number | undefined)
function getData(sKey) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(sKey, (items) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            }
            else {
                resolve(items[sKey]);
            }
        });
    });
}
// --- HTML Table Parsing Utilities ---
function mapRow(headings) {
    return ({ cells }) => {
        return Array.from(cells).reduce((result, cell, i) => {
            var _a, _b, _c;
            const input = cell.querySelector("input,select");
            let value;
            if (input) {
                value = input.type === "checkbox" ? input.checked : input.value;
            }
            else {
                // Use textContent for potentially better consistency than innerText
                value = (_b = (_a = cell.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
            }
            // Use heading if available, otherwise use index as key
            const key = (_c = headings[i]) !== null && _c !== void 0 ? _c : `column_${i}`;
            result[key] = String(value); // Convert boolean/number to string for consistency? Or allow mixed types? Let's keep string for now.
            return result;
        }, {});
    };
}
function parseTable(table) {
    var _a, _b, _c, _d, _e;
    if (!((_c = (_b = (_a = table === null || table === void 0 ? void 0 : table.tHead) === null || _a === void 0 ? void 0 : _a.rows) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.cells) || !((_e = (_d = table === null || table === void 0 ? void 0 : table.tBodies) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.rows)) {
        console.warn("Table structure incomplete for parsing:", table);
        return [];
    }
    // Header parsing with robust check and fallback
    const headings = Array.from(table.tHead.rows[0].cells).map(heading => { var _a; return ((_a = heading.textContent) !== null && _a !== void 0 ? _a : '').replace(/ ▲ \d| ▼ \d/g, "").trim(); } // Use textContent and trim
    );
    // Body parsing with robust check
    return Array.from(table.tBodies[0].rows).map(mapRow(headings));
}
function convertArrayToObject(array, key) {
    const initialValue = {};
    return array.reduce((obj, item) => {
        const keyValue = String(item[key]); // Ensure key is a string
        obj[keyValue] = item;
        return obj;
    }, initialValue);
}
function groupBy(arr, property) {
    return arr.reduce(function (memo, x) {
        console.log();
        if (!memo.some((item) => item[property] === x[property])) {
            memo.push({ [property]: x[property], a: [] });
        }
        memo.map((itm) => itm[property] === x[property] && itm.a.push(x));
        return memo;
    }, []);
}
function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
        const amountNum = Math.abs(Number(amount) || 0); // Ensure number and positive
        const negativeSign = Number(amount) < 0 ? "-" : "";
        const i = parseInt(amountNum.toFixed(decimalCount), 10).toString();
        const j = i.length > 3 ? i.length % 3 : 0;
        return (negativeSign +
            (j ? i.substring(0, j) + thousands : '') +
            i.substring(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) +
            (decimalCount ? decimal + Math.abs(amountNum - parseInt(i, 10)).toFixed(decimalCount).slice(2) : ""));
    }
    catch (e) {
        console.error("Error formatting money:", e);
        return String(amount !== null && amount !== void 0 ? amount : ''); // Return original string or empty on error
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _js_letter_logic__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./js/letter-logic */ "./src/js/letter-logic.ts");
/* harmony import */ var _js_letter_logic__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_js_letter_logic__WEBPACK_IMPORTED_MODULE_0__);
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }

var running = false;
chrome.runtime.onMessage.addListener(/*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(message, sender, sendResponse) {
    var properties;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          if (sender.url.toUpperCase().includes("https://".concat(message[5], ".view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations").toUpperCase()) && !message[1].includes('Bulk') && !message[1].includes('Export') && message[4] === false) {
            properties = {};
            properties.obligationRows = message[6];
            properties.source = message[5];
            properties.agency = message[7];
            properties.letters = message[8];
            properties.extended = message[9];
            properties.SharePoint = message[10];
            (0,_js_letter_logic__WEBPACK_IMPORTED_MODULE_0__.launch)(properties);
          }
        case 1:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}());
})();

/******/ })()
;
//# sourceMappingURL=background.js.map