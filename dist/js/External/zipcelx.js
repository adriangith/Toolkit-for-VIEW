! function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ? t() : "function" == typeof define && define.amd ? define(t) : t()
}(0, function() {
    "use strict";
    var e = "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {},
        t = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};

    function r(e, t) {
        return e(t = {
            exports: {}
        }, t.exports), t.exports
    }
    var n = [],
        i = [],
        a = "undefined" != typeof Uint8Array ? Uint8Array : Array,
        o = !1;

    function s() {
        o = !0;
        for (var e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", t = 0, r = e.length; t < r; ++t) n[t] = e[t], i[e.charCodeAt(t)] = t;
        i["-".charCodeAt(0)] = 62, i["_".charCodeAt(0)] = 63
    }

    function h(e, t, r) {
        for (var i, a, o = [], s = t; s < r; s += 3) i = (e[s] << 16) + (e[s + 1] << 8) + e[s + 2], o.push(n[(a = i) >> 18 & 63] + n[a >> 12 & 63] + n[a >> 6 & 63] + n[63 & a]);
        return o.join("")
    }

    function u(e) {
        var t;
        o || s();
        for (var r = e.length, i = r % 3, a = "", u = [], f = 0, l = r - i; f < l; f += 16383) u.push(h(e, f, f + 16383 > l ? l : f + 16383));
        return 1 === i ? (t = e[r - 1], a += n[t >> 2], a += n[t << 4 & 63], a += "==") : 2 === i && (t = (e[r - 2] << 8) + e[r - 1], a += n[t >> 10], a += n[t >> 4 & 63], a += n[t << 2 & 63], a += "="), u.push(a), u.join("")
    }

    function f(e, t, r, n, i) {
        var a, o, s = 8 * i - n - 1,
            h = (1 << s) - 1,
            u = h >> 1,
            f = -7,
            l = r ? i - 1 : 0,
            c = r ? -1 : 1,
            d = e[t + l];
        for (l += c, a = d & (1 << -f) - 1, d >>= -f, f += s; f > 0; a = 256 * a + e[t + l], l += c, f -= 8);
        for (o = a & (1 << -f) - 1, a >>= -f, f += n; f > 0; o = 256 * o + e[t + l], l += c, f -= 8);
        if (0 === a) a = 1 - u;
        else {
            if (a === h) return o ? NaN : 1 / 0 * (d ? -1 : 1);
            o += Math.pow(2, n), a -= u
        }
        return (d ? -1 : 1) * o * Math.pow(2, a - n)
    }

    function l(e, t, r, n, i, a) {
        var o, s, h, u = 8 * a - i - 1,
            f = (1 << u) - 1,
            l = f >> 1,
            c = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
            d = n ? 0 : a - 1,
            p = n ? 1 : -1,
            m = t < 0 || 0 === t && 1 / t < 0 ? 1 : 0;
        for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (s = isNaN(t) ? 1 : 0, o = f) : (o = Math.floor(Math.log(t) / Math.LN2), t * (h = Math.pow(2, -o)) < 1 && (o--, h *= 2), (t += o + l >= 1 ? c / h : c * Math.pow(2, 1 - l)) * h >= 2 && (o++, h /= 2), o + l >= f ? (s = 0, o = f) : o + l >= 1 ? (s = (t * h - 1) * Math.pow(2, i), o += l) : (s = t * Math.pow(2, l - 1) * Math.pow(2, i), o = 0)); i >= 8; e[r + d] = 255 & s, d += p, s /= 256, i -= 8);
        for (o = o << i | s, u += i; u > 0; e[r + d] = 255 & o, d += p, o /= 256, u -= 8);
        e[r + d - p] |= 128 * m
    }
    var c = {}.toString,
        d = Array.isArray || function(e) {
            return "[object Array]" == c.call(e)
        };
    v.TYPED_ARRAY_SUPPORT = void 0 === e.TYPED_ARRAY_SUPPORT || e.TYPED_ARRAY_SUPPORT;
    var p = m();

    function m() {
        return v.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823
    }

    function g(e, t) {
        if (m() < t) throw new RangeError("Invalid typed array length");
        return v.TYPED_ARRAY_SUPPORT ? (e = new Uint8Array(t)).__proto__ = v.prototype : (null === e && (e = new v(t)), e.length = t), e
    }

    function v(e, t, r) {
        if (!(v.TYPED_ARRAY_SUPPORT || this instanceof v)) return new v(e, t, r);
        if ("number" == typeof e) {
            if ("string" == typeof t) throw new Error("If encoding is specified then the first argument must be a string");
            return _(this, e)
        }
        return y(this, e, t, r)
    }

    function y(e, t, r, n) {
        if ("number" == typeof t) throw new TypeError('"value" argument must not be a number');
        return "undefined" != typeof ArrayBuffer && t instanceof ArrayBuffer ? function(e, t, r, n) {
            if (t.byteLength, r < 0 || t.byteLength < r) throw new RangeError("'offset' is out of bounds");
            if (t.byteLength < r + (n || 0)) throw new RangeError("'length' is out of bounds");
            t = void 0 === r && void 0 === n ? new Uint8Array(t) : void 0 === n ? new Uint8Array(t, r) : new Uint8Array(t, r, n);
            v.TYPED_ARRAY_SUPPORT ? (e = t).__proto__ = v.prototype : e = b(e, t);
            return e
        }(e, t, r, n) : "string" == typeof t ? function(e, t, r) {
            "string" == typeof r && "" !== r || (r = "utf8");
            if (!v.isEncoding(r)) throw new TypeError('"encoding" must be a valid string encoding');
            var n = 0 | S(t, r),
                i = (e = g(e, n)).write(t, r);
            i !== n && (e = e.slice(0, i));
            return e
        }(e, t, r) : function(e, t) {
            if (x(t)) {
                var r = 0 | k(t.length);
                return 0 === (e = g(e, r)).length ? e : (t.copy(e, 0, 0, r), e)
            }
            if (t) {
                if ("undefined" != typeof ArrayBuffer && t.buffer instanceof ArrayBuffer || "length" in t) return "number" != typeof t.length || (n = t.length) != n ? g(e, 0) : b(e, t);
                if ("Buffer" === t.type && d(t.data)) return b(e, t.data)
            }
            var n;
            throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")
        }(e, t)
    }

    function w(e) {
        if ("number" != typeof e) throw new TypeError('"size" argument must be a number');
        if (e < 0) throw new RangeError('"size" argument must not be negative')
    }

    function _(e, t) {
        if (w(t), e = g(e, t < 0 ? 0 : 0 | k(t)), !v.TYPED_ARRAY_SUPPORT)
            for (var r = 0; r < t; ++r) e[r] = 0;
        return e
    }

    function b(e, t) {
        var r = t.length < 0 ? 0 : 0 | k(t.length);
        e = g(e, r);
        for (var n = 0; n < r; n += 1) e[n] = 255 & t[n];
        return e
    }

    function k(e) {
        if (e >= m()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + m().toString(16) + " bytes");
        return 0 | e
    }

    function x(e) {
        return !(null == e || !e._isBuffer)
    }

    function S(e, t) {
        if (x(e)) return e.length;
        if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(e) || e instanceof ArrayBuffer)) return e.byteLength;
        "string" != typeof e && (e = "" + e);
        var r = e.length;
        if (0 === r) return 0;
        for (var n = !1;;) switch (t) {
            case "ascii":
            case "latin1":
            case "binary":
                return r;
            case "utf8":
            case "utf-8":
            case void 0:
                return $(e).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
                return 2 * r;
            case "hex":
                return r >>> 1;
            case "base64":
                return G(e).length;
            default:
                if (n) return $(e).length;
                t = ("" + t).toLowerCase(), n = !0
        }
    }

    function E(e, t, r) {
        var n = e[t];
        e[t] = e[r], e[r] = n
    }

    function A(e, t, r, n, i) {
        if (0 === e.length) return -1;
        if ("string" == typeof r ? (n = r, r = 0) : r > 2147483647 ? r = 2147483647 : r < -2147483648 && (r = -2147483648), r = +r, isNaN(r) && (r = i ? 0 : e.length - 1), r < 0 && (r = e.length + r), r >= e.length) {
            if (i) return -1;
            r = e.length - 1
        } else if (r < 0) {
            if (!i) return -1;
            r = 0
        }
        if ("string" == typeof t && (t = v.from(t, n)), x(t)) return 0 === t.length ? -1 : C(e, t, r, n, i);
        if ("number" == typeof t) return t &= 255, v.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? i ? Uint8Array.prototype.indexOf.call(e, t, r) : Uint8Array.prototype.lastIndexOf.call(e, t, r) : C(e, [t], r, n, i);
        throw new TypeError("val must be string, number or Buffer")
    }

    function C(e, t, r, n, i) {
        var a, o = 1,
            s = e.length,
            h = t.length;
        if (void 0 !== n && ("ucs2" === (n = String(n).toLowerCase()) || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
            if (e.length < 2 || t.length < 2) return -1;
            o = 2, s /= 2, h /= 2, r /= 2
        }

        function u(e, t) {
            return 1 === o ? e[t] : e.readUInt16BE(t * o)
        }
        if (i) {
            var f = -1;
            for (a = r; a < s; a++)
                if (u(e, a) === u(t, -1 === f ? 0 : a - f)) {
                    if (-1 === f && (f = a), a - f + 1 === h) return f * o
                } else -1 !== f && (a -= a - f), f = -1
        } else
            for (r + h > s && (r = s - h), a = r; a >= 0; a--) {
                for (var l = !0, c = 0; c < h; c++)
                    if (u(e, a + c) !== u(t, c)) {
                        l = !1;
                        break
                    }
                if (l) return a
            }
        return -1
    }

    function R(e, t, r, n) {
        r = Number(r) || 0;
        var i = e.length - r;
        n ? (n = Number(n)) > i && (n = i) : n = i;
        var a = t.length;
        if (a % 2 != 0) throw new TypeError("Invalid hex string");
        n > a / 2 && (n = a / 2);
        for (var o = 0; o < n; ++o) {
            var s = parseInt(t.substr(2 * o, 2), 16);
            if (isNaN(s)) return o;
            e[r + o] = s
        }
        return o
    }

    function z(e, t, r, n) {
        return J($(t, e.length - r), e, r, n)
    }

    function T(e, t, r, n) {
        return J(function(e) {
            for (var t = [], r = 0; r < e.length; ++r) t.push(255 & e.charCodeAt(r));
            return t
        }(t), e, r, n)
    }

    function B(e, t, r, n) {
        return T(e, t, r, n)
    }

    function O(e, t, r, n) {
        return J(G(t), e, r, n)
    }

    function I(e, t, r, n) {
        return J(function(e, t) {
            for (var r, n, i, a = [], o = 0; o < e.length && !((t -= 2) < 0); ++o) r = e.charCodeAt(o), n = r >> 8, i = r % 256, a.push(i), a.push(n);
            return a
        }(t, e.length - r), e, r, n)
    }

    function L(e, t, r) {
        return 0 === t && r === e.length ? u(e) : u(e.slice(t, r))
    }

    function P(e, t, r) {
        r = Math.min(e.length, r);
        for (var n = [], i = t; i < r;) {
            var a, o, s, h, u = e[i],
                f = null,
                l = u > 239 ? 4 : u > 223 ? 3 : u > 191 ? 2 : 1;
            if (i + l <= r) switch (l) {
                case 1:
                    u < 128 && (f = u);
                    break;
                case 2:
                    128 == (192 & (a = e[i + 1])) && (h = (31 & u) << 6 | 63 & a) > 127 && (f = h);
                    break;
                case 3:
                    a = e[i + 1], o = e[i + 2], 128 == (192 & a) && 128 == (192 & o) && (h = (15 & u) << 12 | (63 & a) << 6 | 63 & o) > 2047 && (h < 55296 || h > 57343) && (f = h);
                    break;
                case 4:
                    a = e[i + 1], o = e[i + 2], s = e[i + 3], 128 == (192 & a) && 128 == (192 & o) && 128 == (192 & s) && (h = (15 & u) << 18 | (63 & a) << 12 | (63 & o) << 6 | 63 & s) > 65535 && h < 1114112 && (f = h)
            }
            null === f ? (f = 65533, l = 1) : f > 65535 && (f -= 65536, n.push(f >>> 10 & 1023 | 55296), f = 56320 | 1023 & f), n.push(f), i += l
        }
        return function(e) {
            var t = e.length;
            if (t <= U) return String.fromCharCode.apply(String, e);
            var r = "",
                n = 0;
            for (; n < t;) r += String.fromCharCode.apply(String, e.slice(n, n += U));
            return r
        }(n)
    }
    v.poolSize = 8192, v._augment = function(e) {
        return e.__proto__ = v.prototype, e
    }, v.from = function(e, t, r) {
        return y(null, e, t, r)
    }, v.TYPED_ARRAY_SUPPORT && (v.prototype.__proto__ = Uint8Array.prototype, v.__proto__ = Uint8Array), v.alloc = function(e, t, r) {
        return function(e, t, r, n) {
            return w(t), t <= 0 ? g(e, t) : void 0 !== r ? "string" == typeof n ? g(e, t).fill(r, n) : g(e, t).fill(r) : g(e, t)
        }(null, e, t, r)
    }, v.allocUnsafe = function(e) {
        return _(null, e)
    }, v.allocUnsafeSlow = function(e) {
        return _(null, e)
    }, v.isBuffer = Q, v.compare = function(e, t) {
        if (!x(e) || !x(t)) throw new TypeError("Arguments must be Buffers");
        if (e === t) return 0;
        for (var r = e.length, n = t.length, i = 0, a = Math.min(r, n); i < a; ++i)
            if (e[i] !== t[i]) {
                r = e[i], n = t[i];
                break
            }
        return r < n ? -1 : n < r ? 1 : 0
    }, v.isEncoding = function(e) {
        switch (String(e).toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "latin1":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
                return !0;
            default:
                return !1
        }
    }, v.concat = function(e, t) {
        if (!d(e)) throw new TypeError('"list" argument must be an Array of Buffers');
        if (0 === e.length) return v.alloc(0);
        var r;
        if (void 0 === t)
            for (t = 0, r = 0; r < e.length; ++r) t += e[r].length;
        var n = v.allocUnsafe(t),
            i = 0;
        for (r = 0; r < e.length; ++r) {
            var a = e[r];
            if (!x(a)) throw new TypeError('"list" argument must be an Array of Buffers');
            a.copy(n, i), i += a.length
        }
        return n
    }, v.byteLength = S, v.prototype._isBuffer = !0, v.prototype.swap16 = function() {
        var e = this.length;
        if (e % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
        for (var t = 0; t < e; t += 2) E(this, t, t + 1);
        return this
    }, v.prototype.swap32 = function() {
        var e = this.length;
        if (e % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
        for (var t = 0; t < e; t += 4) E(this, t, t + 3), E(this, t + 1, t + 2);
        return this
    }, v.prototype.swap64 = function() {
        var e = this.length;
        if (e % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
        for (var t = 0; t < e; t += 8) E(this, t, t + 7), E(this, t + 1, t + 6), E(this, t + 2, t + 5), E(this, t + 3, t + 4);
        return this
    }, v.prototype.toString = function() {
        var e = 0 | this.length;
        return 0 === e ? "" : 0 === arguments.length ? P(this, 0, e) : function(e, t, r) {
            var n = !1;
            if ((void 0 === t || t < 0) && (t = 0), t > this.length) return "";
            if ((void 0 === r || r > this.length) && (r = this.length), r <= 0) return "";
            if ((r >>>= 0) <= (t >>>= 0)) return "";
            for (e || (e = "utf8");;) switch (e) {
                case "hex":
                    return j(this, t, r);
                case "utf8":
                case "utf-8":
                    return P(this, t, r);
                case "ascii":
                    return D(this, t, r);
                case "latin1":
                case "binary":
                    return M(this, t, r);
                case "base64":
                    return L(this, t, r);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return F(this, t, r);
                default:
                    if (n) throw new TypeError("Unknown encoding: " + e);
                    e = (e + "").toLowerCase(), n = !0
            }
        }.apply(this, arguments)
    }, v.prototype.equals = function(e) {
        if (!x(e)) throw new TypeError("Argument must be a Buffer");
        return this === e || 0 === v.compare(this, e)
    }, v.prototype.inspect = function() {
        var e = "";
        return this.length > 0 && (e = this.toString("hex", 0, 50).match(/.{2}/g).join(" "), this.length > 50 && (e += " ... ")), "<Buffer " + e + ">"
    }, v.prototype.compare = function(e, t, r, n, i) {
        if (!x(e)) throw new TypeError("Argument must be a Buffer");
        if (void 0 === t && (t = 0), void 0 === r && (r = e ? e.length : 0), void 0 === n && (n = 0), void 0 === i && (i = this.length), t < 0 || r > e.length || n < 0 || i > this.length) throw new RangeError("out of range index");
        if (n >= i && t >= r) return 0;
        if (n >= i) return -1;
        if (t >= r) return 1;
        if (this === e) return 0;
        for (var a = (i >>>= 0) - (n >>>= 0), o = (r >>>= 0) - (t >>>= 0), s = Math.min(a, o), h = this.slice(n, i), u = e.slice(t, r), f = 0; f < s; ++f)
            if (h[f] !== u[f]) {
                a = h[f], o = u[f];
                break
            }
        return a < o ? -1 : o < a ? 1 : 0
    }, v.prototype.includes = function(e, t, r) {
        return -1 !== this.indexOf(e, t, r)
    }, v.prototype.indexOf = function(e, t, r) {
        return A(this, e, t, r, !0)
    }, v.prototype.lastIndexOf = function(e, t, r) {
        return A(this, e, t, r, !1)
    }, v.prototype.write = function(e, t, r, n) {
        if (void 0 === t) n = "utf8", r = this.length, t = 0;
        else if (void 0 === r && "string" == typeof t) n = t, r = this.length, t = 0;
        else {
            if (!isFinite(t)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
            t |= 0, isFinite(r) ? (r |= 0, void 0 === n && (n = "utf8")) : (n = r, r = void 0)
        }
        var i = this.length - t;
        if ((void 0 === r || r > i) && (r = i), e.length > 0 && (r < 0 || t < 0) || t > this.length) throw new RangeError("Attempt to write outside buffer bounds");
        n || (n = "utf8");
        for (var a = !1;;) switch (n) {
            case "hex":
                return R(this, e, t, r);
            case "utf8":
            case "utf-8":
                return z(this, e, t, r);
            case "ascii":
                return T(this, e, t, r);
            case "latin1":
            case "binary":
                return B(this, e, t, r);
            case "base64":
                return O(this, e, t, r);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
                return I(this, e, t, r);
            default:
                if (a) throw new TypeError("Unknown encoding: " + n);
                n = ("" + n).toLowerCase(), a = !0
        }
    }, v.prototype.toJSON = function() {
        return {
            type: "Buffer",
            data: Array.prototype.slice.call(this._arr || this, 0)
        }
    };
    var U = 4096;

    function D(e, t, r) {
        var n = "";
        r = Math.min(e.length, r);
        for (var i = t; i < r; ++i) n += String.fromCharCode(127 & e[i]);
        return n
    }

    function M(e, t, r) {
        var n = "";
        r = Math.min(e.length, r);
        for (var i = t; i < r; ++i) n += String.fromCharCode(e[i]);
        return n
    }

    function j(e, t, r) {
        var n = e.length;
        (!t || t < 0) && (t = 0), (!r || r < 0 || r > n) && (r = n);
        for (var i = "", a = t; a < r; ++a) i += V(e[a]);
        return i
    }

    function F(e, t, r) {
        for (var n = e.slice(t, r), i = "", a = 0; a < n.length; a += 2) i += String.fromCharCode(n[a] + 256 * n[a + 1]);
        return i
    }

    function N(e, t, r) {
        if (e % 1 != 0 || e < 0) throw new RangeError("offset is not uint");
        if (e + t > r) throw new RangeError("Trying to access beyond buffer length")
    }

    function Z(e, t, r, n, i, a) {
        if (!x(e)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (t > i || t < a) throw new RangeError('"value" argument is out of bounds');
        if (r + n > e.length) throw new RangeError("Index out of range")
    }

    function W(e, t, r, n) {
        t < 0 && (t = 65535 + t + 1);
        for (var i = 0, a = Math.min(e.length - r, 2); i < a; ++i) e[r + i] = (t & 255 << 8 * (n ? i : 1 - i)) >>> 8 * (n ? i : 1 - i)
    }

    function Y(e, t, r, n) {
        t < 0 && (t = 4294967295 + t + 1);
        for (var i = 0, a = Math.min(e.length - r, 4); i < a; ++i) e[r + i] = t >>> 8 * (n ? i : 3 - i) & 255
    }

    function q(e, t, r, n, i, a) {
        if (r + n > e.length) throw new RangeError("Index out of range");
        if (r < 0) throw new RangeError("Index out of range")
    }

    function H(e, t, r, n, i) {
        return i || q(e, 0, r, 4), l(e, t, r, n, 23, 4), r + 4
    }

    function K(e, t, r, n, i) {
        return i || q(e, 0, r, 8), l(e, t, r, n, 52, 8), r + 8
    }
    v.prototype.slice = function(e, t) {
        var r, n = this.length;
        if ((e = ~~e) < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n), (t = void 0 === t ? n : ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), t < e && (t = e), v.TYPED_ARRAY_SUPPORT)(r = this.subarray(e, t)).__proto__ = v.prototype;
        else {
            var i = t - e;
            r = new v(i, void 0);
            for (var a = 0; a < i; ++a) r[a] = this[a + e]
        }
        return r
    }, v.prototype.readUIntLE = function(e, t, r) {
        e |= 0, t |= 0, r || N(e, t, this.length);
        for (var n = this[e], i = 1, a = 0; ++a < t && (i *= 256);) n += this[e + a] * i;
        return n
    }, v.prototype.readUIntBE = function(e, t, r) {
        e |= 0, t |= 0, r || N(e, t, this.length);
        for (var n = this[e + --t], i = 1; t > 0 && (i *= 256);) n += this[e + --t] * i;
        return n
    }, v.prototype.readUInt8 = function(e, t) {
        return t || N(e, 1, this.length), this[e]
    }, v.prototype.readUInt16LE = function(e, t) {
        return t || N(e, 2, this.length), this[e] | this[e + 1] << 8
    }, v.prototype.readUInt16BE = function(e, t) {
        return t || N(e, 2, this.length), this[e] << 8 | this[e + 1]
    }, v.prototype.readUInt32LE = function(e, t) {
        return t || N(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + 16777216 * this[e + 3]
    }, v.prototype.readUInt32BE = function(e, t) {
        return t || N(e, 4, this.length), 16777216 * this[e] + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3])
    }, v.prototype.readIntLE = function(e, t, r) {
        e |= 0, t |= 0, r || N(e, t, this.length);
        for (var n = this[e], i = 1, a = 0; ++a < t && (i *= 256);) n += this[e + a] * i;
        return n >= (i *= 128) && (n -= Math.pow(2, 8 * t)), n
    }, v.prototype.readIntBE = function(e, t, r) {
        e |= 0, t |= 0, r || N(e, t, this.length);
        for (var n = t, i = 1, a = this[e + --n]; n > 0 && (i *= 256);) a += this[e + --n] * i;
        return a >= (i *= 128) && (a -= Math.pow(2, 8 * t)), a
    }, v.prototype.readInt8 = function(e, t) {
        return t || N(e, 1, this.length), 128 & this[e] ? -1 * (255 - this[e] + 1) : this[e]
    }, v.prototype.readInt16LE = function(e, t) {
        t || N(e, 2, this.length);
        var r = this[e] | this[e + 1] << 8;
        return 32768 & r ? 4294901760 | r : r
    }, v.prototype.readInt16BE = function(e, t) {
        t || N(e, 2, this.length);
        var r = this[e + 1] | this[e] << 8;
        return 32768 & r ? 4294901760 | r : r
    }, v.prototype.readInt32LE = function(e, t) {
        return t || N(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24
    }, v.prototype.readInt32BE = function(e, t) {
        return t || N(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]
    }, v.prototype.readFloatLE = function(e, t) {
        return t || N(e, 4, this.length), f(this, e, !0, 23, 4)
    }, v.prototype.readFloatBE = function(e, t) {
        return t || N(e, 4, this.length), f(this, e, !1, 23, 4)
    }, v.prototype.readDoubleLE = function(e, t) {
        return t || N(e, 8, this.length), f(this, e, !0, 52, 8)
    }, v.prototype.readDoubleBE = function(e, t) {
        return t || N(e, 8, this.length), f(this, e, !1, 52, 8)
    }, v.prototype.writeUIntLE = function(e, t, r, n) {
        (e = +e, t |= 0, r |= 0, n) || Z(this, e, t, r, Math.pow(2, 8 * r) - 1, 0);
        var i = 1,
            a = 0;
        for (this[t] = 255 & e; ++a < r && (i *= 256);) this[t + a] = e / i & 255;
        return t + r
    }, v.prototype.writeUIntBE = function(e, t, r, n) {
        (e = +e, t |= 0, r |= 0, n) || Z(this, e, t, r, Math.pow(2, 8 * r) - 1, 0);
        var i = r - 1,
            a = 1;
        for (this[t + i] = 255 & e; --i >= 0 && (a *= 256);) this[t + i] = e / a & 255;
        return t + r
    }, v.prototype.writeUInt8 = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 1, 255, 0), v.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), this[t] = 255 & e, t + 1
    }, v.prototype.writeUInt16LE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 2, 65535, 0), v.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8) : W(this, e, t, !0), t + 2
    }, v.prototype.writeUInt16BE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 2, 65535, 0), v.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, this[t + 1] = 255 & e) : W(this, e, t, !1), t + 2
    }, v.prototype.writeUInt32LE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 4, 4294967295, 0), v.TYPED_ARRAY_SUPPORT ? (this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = 255 & e) : Y(this, e, t, !0), t + 4
    }, v.prototype.writeUInt32BE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 4, 4294967295, 0), v.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = 255 & e) : Y(this, e, t, !1), t + 4
    }, v.prototype.writeIntLE = function(e, t, r, n) {
        if (e = +e, t |= 0, !n) {
            var i = Math.pow(2, 8 * r - 1);
            Z(this, e, t, r, i - 1, -i)
        }
        var a = 0,
            o = 1,
            s = 0;
        for (this[t] = 255 & e; ++a < r && (o *= 256);) e < 0 && 0 === s && 0 !== this[t + a - 1] && (s = 1), this[t + a] = (e / o >> 0) - s & 255;
        return t + r
    }, v.prototype.writeIntBE = function(e, t, r, n) {
        if (e = +e, t |= 0, !n) {
            var i = Math.pow(2, 8 * r - 1);
            Z(this, e, t, r, i - 1, -i)
        }
        var a = r - 1,
            o = 1,
            s = 0;
        for (this[t + a] = 255 & e; --a >= 0 && (o *= 256);) e < 0 && 0 === s && 0 !== this[t + a + 1] && (s = 1), this[t + a] = (e / o >> 0) - s & 255;
        return t + r
    }, v.prototype.writeInt8 = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 1, 127, -128), v.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), e < 0 && (e = 255 + e + 1), this[t] = 255 & e, t + 1
    }, v.prototype.writeInt16LE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 2, 32767, -32768), v.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8) : W(this, e, t, !0), t + 2
    }, v.prototype.writeInt16BE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 2, 32767, -32768), v.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, this[t + 1] = 255 & e) : W(this, e, t, !1), t + 2
    }, v.prototype.writeInt32LE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 4, 2147483647, -2147483648), v.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24) : Y(this, e, t, !0), t + 4
    }, v.prototype.writeInt32BE = function(e, t, r) {
        return e = +e, t |= 0, r || Z(this, e, t, 4, 2147483647, -2147483648), e < 0 && (e = 4294967295 + e + 1), v.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = 255 & e) : Y(this, e, t, !1), t + 4
    }, v.prototype.writeFloatLE = function(e, t, r) {
        return H(this, e, t, !0, r)
    }, v.prototype.writeFloatBE = function(e, t, r) {
        return H(this, e, t, !1, r)
    }, v.prototype.writeDoubleLE = function(e, t, r) {
        return K(this, e, t, !0, r)
    }, v.prototype.writeDoubleBE = function(e, t, r) {
        return K(this, e, t, !1, r)
    }, v.prototype.copy = function(e, t, r, n) {
        if (r || (r = 0), n || 0 === n || (n = this.length), t >= e.length && (t = e.length), t || (t = 0), n > 0 && n < r && (n = r), n === r) return 0;
        if (0 === e.length || 0 === this.length) return 0;
        if (t < 0) throw new RangeError("targetStart out of bounds");
        if (r < 0 || r >= this.length) throw new RangeError("sourceStart out of bounds");
        if (n < 0) throw new RangeError("sourceEnd out of bounds");
        n > this.length && (n = this.length), e.length - t < n - r && (n = e.length - t + r);
        var i, a = n - r;
        if (this === e && r < t && t < n)
            for (i = a - 1; i >= 0; --i) e[i + t] = this[i + r];
        else if (a < 1e3 || !v.TYPED_ARRAY_SUPPORT)
            for (i = 0; i < a; ++i) e[i + t] = this[i + r];
        else Uint8Array.prototype.set.call(e, this.subarray(r, r + a), t);
        return a
    }, v.prototype.fill = function(e, t, r, n) {
        if ("string" == typeof e) {
            if ("string" == typeof t ? (n = t, t = 0, r = this.length) : "string" == typeof r && (n = r, r = this.length), 1 === e.length) {
                var i = e.charCodeAt(0);
                i < 256 && (e = i)
            }
            if (void 0 !== n && "string" != typeof n) throw new TypeError("encoding must be a string");
            if ("string" == typeof n && !v.isEncoding(n)) throw new TypeError("Unknown encoding: " + n)
        } else "number" == typeof e && (e &= 255);
        if (t < 0 || this.length < t || this.length < r) throw new RangeError("Out of range index");
        if (r <= t) return this;
        var a;
        if (t >>>= 0, r = void 0 === r ? this.length : r >>> 0, e || (e = 0), "number" == typeof e)
            for (a = t; a < r; ++a) this[a] = e;
        else {
            var o = x(e) ? e : $(new v(e, n).toString()),
                s = o.length;
            for (a = 0; a < r - t; ++a) this[a + t] = o[a % s]
        }
        return this
    };
    var X = /[^+\/0-9A-Za-z-_]/g;

    function V(e) {
        return e < 16 ? "0" + e.toString(16) : e.toString(16)
    }

    function $(e, t) {
        var r;
        t = t || 1 / 0;
        for (var n = e.length, i = null, a = [], o = 0; o < n; ++o) {
            if ((r = e.charCodeAt(o)) > 55295 && r < 57344) {
                if (!i) {
                    if (r > 56319) {
                        (t -= 3) > -1 && a.push(239, 191, 189);
                        continue
                    }
                    if (o + 1 === n) {
                        (t -= 3) > -1 && a.push(239, 191, 189);
                        continue
                    }
                    i = r;
                    continue
                }
                if (r < 56320) {
                    (t -= 3) > -1 && a.push(239, 191, 189), i = r;
                    continue
                }
                r = 65536 + (i - 55296 << 10 | r - 56320)
            } else i && (t -= 3) > -1 && a.push(239, 191, 189);
            if (i = null, r < 128) {
                if ((t -= 1) < 0) break;
                a.push(r)
            } else if (r < 2048) {
                if ((t -= 2) < 0) break;
                a.push(r >> 6 | 192, 63 & r | 128)
            } else if (r < 65536) {
                if ((t -= 3) < 0) break;
                a.push(r >> 12 | 224, r >> 6 & 63 | 128, 63 & r | 128)
            } else {
                if (!(r < 1114112)) throw new Error("Invalid code point");
                if ((t -= 4) < 0) break;
                a.push(r >> 18 | 240, r >> 12 & 63 | 128, r >> 6 & 63 | 128, 63 & r | 128)
            }
        }
        return a
    }

    function G(e) {
        return function(e) {
            var t, r, n, h, u, f;
            o || s();
            var l = e.length;
            if (l % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
            u = "=" === e[l - 2] ? 2 : "=" === e[l - 1] ? 1 : 0, f = new a(3 * l / 4 - u), n = u > 0 ? l - 4 : l;
            var c = 0;
            for (t = 0, r = 0; t < n; t += 4, r += 3) h = i[e.charCodeAt(t)] << 18 | i[e.charCodeAt(t + 1)] << 12 | i[e.charCodeAt(t + 2)] << 6 | i[e.charCodeAt(t + 3)], f[c++] = h >> 16 & 255, f[c++] = h >> 8 & 255, f[c++] = 255 & h;
            return 2 === u ? (h = i[e.charCodeAt(t)] << 2 | i[e.charCodeAt(t + 1)] >> 4, f[c++] = 255 & h) : 1 === u && (h = i[e.charCodeAt(t)] << 10 | i[e.charCodeAt(t + 1)] << 4 | i[e.charCodeAt(t + 2)] >> 2, f[c++] = h >> 8 & 255, f[c++] = 255 & h), f
        }(function(e) {
            if ((e = function(e) {
                    return e.trim ? e.trim() : e.replace(/^\s+|\s+$/g, "")
                }(e).replace(X, "")).length < 2) return "";
            for (; e.length % 4 != 0;) e += "=";
            return e
        }(e))
    }

    function J(e, t, r, n) {
        for (var i = 0; i < n && !(i + r >= t.length || i >= e.length); ++i) t[i + r] = e[i];
        return i
    }

    function Q(e) {
        return null != e && (!!e._isBuffer || ee(e) || function(e) {
            return "function" == typeof e.readFloatLE && "function" == typeof e.slice && ee(e.slice(0, 0))
        }(e))
    }

    function ee(e) {
        return !!e.constructor && "function" == typeof e.constructor.isBuffer && e.constructor.isBuffer(e)
    }
    var te = Object.freeze({
        INSPECT_MAX_BYTES: 50,
        kMaxLength: p,
        Buffer: v,
        SlowBuffer: function(e) {
            return +e != e && (e = 0), v.alloc(+e)
        },
        isBuffer: Q
    });

    function re() {}

    function ne() {
        ne.init.call(this)
    }

    function ie(e) {
        return void 0 === e._maxListeners ? ne.defaultMaxListeners : e._maxListeners
    }

    function ae(e, t, r, n) {
        var i, a, o, s;
        if ("function" != typeof r) throw new TypeError('"listener" argument must be a function');
        if ((a = e._events) ? (a.newListener && (e.emit("newListener", t, r.listener ? r.listener : r), a = e._events), o = a[t]) : (a = e._events = new re, e._eventsCount = 0), o) {
            if ("function" == typeof o ? o = a[t] = n ? [r, o] : [o, r] : n ? o.unshift(r) : o.push(r), !o.warned && (i = ie(e)) && i > 0 && o.length > i) {
                o.warned = !0;
                var h = new Error("Possible EventEmitter memory leak detected. " + o.length + " " + t + " listeners added. Use emitter.setMaxListeners() to increase limit");
                h.name = "MaxListenersExceededWarning", h.emitter = e, h.type = t, h.count = o.length, s = h, "function" == typeof console.warn ? console.warn(s) : console.log(s)
            }
        } else o = a[t] = r, ++e._eventsCount;
        return e
    }

    function oe(e, t, r) {
        var n = !1;

        function i() {
            e.removeListener(t, i), n || (n = !0, r.apply(e, arguments))
        }
        return i.listener = r, i
    }

    function se(e) {
        var t = this._events;
        if (t) {
            var r = t[e];
            if ("function" == typeof r) return 1;
            if (r) return r.length
        }
        return 0
    }

    function he(e, t) {
        for (var r = new Array(t); t--;) r[t] = e[t];
        return r
    }

    function ue() {
        throw new Error("setTimeout has not been defined")
    }

    function fe() {
        throw new Error("clearTimeout has not been defined")
    }
    re.prototype = Object.create(null), ne.EventEmitter = ne, ne.usingDomains = !1, ne.prototype.domain = void 0, ne.prototype._events = void 0, ne.prototype._maxListeners = void 0, ne.defaultMaxListeners = 10, ne.init = function() {
        this.domain = null, ne.usingDomains && (!(void 0).active || this instanceof(void 0).Domain || (this.domain = (void 0).active)), this._events && this._events !== Object.getPrototypeOf(this)._events || (this._events = new re, this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0
    }, ne.prototype.setMaxListeners = function(e) {
        if ("number" != typeof e || e < 0 || isNaN(e)) throw new TypeError('"n" argument must be a positive number');
        return this._maxListeners = e, this
    }, ne.prototype.getMaxListeners = function() {
        return ie(this)
    }, ne.prototype.emit = function(e) {
        var t, r, n, i, a, o, s, h = "error" === e;
        if (o = this._events) h = h && null == o.error;
        else if (!h) return !1;
        if (s = this.domain, h) {
            if (t = arguments[1], !s) {
                if (t instanceof Error) throw t;
                var u = new Error('Uncaught, unspecified "error" event. (' + t + ")");
                throw u.context = t, u
            }
            return t || (t = new Error('Uncaught, unspecified "error" event')), t.domainEmitter = this, t.domain = s, t.domainThrown = !1, s.emit("error", t), !1
        }
        if (!(r = o[e])) return !1;
        var f = "function" == typeof r;
        switch (n = arguments.length) {
            case 1:
                ! function(e, t, r) {
                    if (t) e.call(r);
                    else
                        for (var n = e.length, i = he(e, n), a = 0; a < n; ++a) i[a].call(r)
                }(r, f, this);
                break;
            case 2:
                ! function(e, t, r, n) {
                    if (t) e.call(r, n);
                    else
                        for (var i = e.length, a = he(e, i), o = 0; o < i; ++o) a[o].call(r, n)
                }(r, f, this, arguments[1]);
                break;
            case 3:
                ! function(e, t, r, n, i) {
                    if (t) e.call(r, n, i);
                    else
                        for (var a = e.length, o = he(e, a), s = 0; s < a; ++s) o[s].call(r, n, i)
                }(r, f, this, arguments[1], arguments[2]);
                break;
            case 4:
                ! function(e, t, r, n, i, a) {
                    if (t) e.call(r, n, i, a);
                    else
                        for (var o = e.length, s = he(e, o), h = 0; h < o; ++h) s[h].call(r, n, i, a)
                }(r, f, this, arguments[1], arguments[2], arguments[3]);
                break;
            default:
                for (i = new Array(n - 1), a = 1; a < n; a++) i[a - 1] = arguments[a];
                ! function(e, t, r, n) {
                    if (t) e.apply(r, n);
                    else
                        for (var i = e.length, a = he(e, i), o = 0; o < i; ++o) a[o].apply(r, n)
                }(r, f, this, i)
        }
        return !0
    }, ne.prototype.addListener = function(e, t) {
        return ae(this, e, t, !1)
    }, ne.prototype.on = ne.prototype.addListener, ne.prototype.prependListener = function(e, t) {
        return ae(this, e, t, !0)
    }, ne.prototype.once = function(e, t) {
        if ("function" != typeof t) throw new TypeError('"listener" argument must be a function');
        return this.on(e, oe(this, e, t)), this
    }, ne.prototype.prependOnceListener = function(e, t) {
        if ("function" != typeof t) throw new TypeError('"listener" argument must be a function');
        return this.prependListener(e, oe(this, e, t)), this
    }, ne.prototype.removeListener = function(e, t) {
        var r, n, i, a, o;
        if ("function" != typeof t) throw new TypeError('"listener" argument must be a function');
        if (!(n = this._events)) return this;
        if (!(r = n[e])) return this;
        if (r === t || r.listener && r.listener === t) 0 == --this._eventsCount ? this._events = new re : (delete n[e], n.removeListener && this.emit("removeListener", e, r.listener || t));
        else if ("function" != typeof r) {
            for (i = -1, a = r.length; a-- > 0;)
                if (r[a] === t || r[a].listener && r[a].listener === t) {
                    o = r[a].listener, i = a;
                    break
                }
            if (i < 0) return this;
            if (1 === r.length) {
                if (r[0] = void 0, 0 == --this._eventsCount) return this._events = new re, this;
                delete n[e]
            } else ! function(e, t) {
                for (var r = t, n = r + 1, i = e.length; n < i; r += 1, n += 1) e[r] = e[n];
                e.pop()
            }(r, i);
            n.removeListener && this.emit("removeListener", e, o || t)
        }
        return this
    }, ne.prototype.removeAllListeners = function(e) {
        var t, r;
        if (!(r = this._events)) return this;
        if (!r.removeListener) return 0 === arguments.length ? (this._events = new re, this._eventsCount = 0) : r[e] && (0 == --this._eventsCount ? this._events = new re : delete r[e]), this;
        if (0 === arguments.length) {
            for (var n, i = Object.keys(r), a = 0; a < i.length; ++a) "removeListener" !== (n = i[a]) && this.removeAllListeners(n);
            return this.removeAllListeners("removeListener"), this._events = new re, this._eventsCount = 0, this
        }
        if ("function" == typeof(t = r[e])) this.removeListener(e, t);
        else if (t)
            do {
                this.removeListener(e, t[t.length - 1])
            } while (t[0]);
        return this
    }, ne.prototype.listeners = function(e) {
        var t, r = this._events;
        return r && (t = r[e]) ? "function" == typeof t ? [t.listener || t] : function(e) {
            for (var t = new Array(e.length), r = 0; r < t.length; ++r) t[r] = e[r].listener || e[r];
            return t
        }(t) : []
    }, ne.listenerCount = function(e, t) {
        return "function" == typeof e.listenerCount ? e.listenerCount(t) : se.call(e, t)
    }, ne.prototype.listenerCount = se, ne.prototype.eventNames = function() {
        return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : []
    };
    var le = ue,
        ce = fe;

    function de(e) {
        if (le === setTimeout) return setTimeout(e, 0);
        if ((le === ue || !le) && setTimeout) return le = setTimeout, setTimeout(e, 0);
        try {
            return le(e, 0)
        } catch (t) {
            try {
                return le.call(null, e, 0)
            } catch (t) {
                return le.call(this, e, 0)
            }
        }
    }
    "function" == typeof e.setTimeout && (le = setTimeout), "function" == typeof e.clearTimeout && (ce = clearTimeout);
    var pe, me = [],
        ge = !1,
        ve = -1;

    function ye() {
        ge && pe && (ge = !1, pe.length ? me = pe.concat(me) : ve = -1, me.length && we())
    }

    function we() {
        if (!ge) {
            var e = de(ye);
            ge = !0;
            for (var t = me.length; t;) {
                for (pe = me, me = []; ++ve < t;) pe && pe[ve].run();
                ve = -1, t = me.length
            }
            pe = null, ge = !1,
                function(e) {
                    if (ce === clearTimeout) return clearTimeout(e);
                    if ((ce === fe || !ce) && clearTimeout) return ce = clearTimeout, clearTimeout(e);
                    try {
                        ce(e)
                    } catch (t) {
                        try {
                            return ce.call(null, e)
                        } catch (t) {
                            return ce.call(this, e)
                        }
                    }
                }(e)
        }
    }

    function _e(e) {
        var t = new Array(arguments.length - 1);
        if (arguments.length > 1)
            for (var r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
        me.push(new be(e, t)), 1 !== me.length || ge || de(we)
    }

    function be(e, t) {
        this.fun = e, this.array = t
    }
    be.prototype.run = function() {
        this.fun.apply(null, this.array)
    };

    function ke() {}
    var xe = ke,
        Se = ke,
        Ee = ke,
        Ae = ke,
        Ce = ke,
        Re = ke,
        ze = ke;
    var Te = e.performance || {},
        Be = Te.now || Te.mozNow || Te.msNow || Te.oNow || Te.webkitNow || function() {
            return (new Date).getTime()
        };
    var Oe = new Date;
    var Ie = {
            nextTick: _e,
            title: "browser",
            browser: !0,
            env: {},
            argv: [],
            version: "",
            versions: {},
            on: xe,
            addListener: Se,
            once: Ee,
            off: Ae,
            removeListener: Ce,
            removeAllListeners: Re,
            emit: ze,
            binding: function(e) {
                throw new Error("process.binding is not supported")
            },
            cwd: function() {
                return "/"
            },
            chdir: function(e) {
                throw new Error("process.chdir is not supported")
            },
            umask: function() {
                return 0
            },
            hrtime: function(e) {
                var t = .001 * Be.call(Te),
                    r = Math.floor(t),
                    n = Math.floor(t % 1 * 1e9);
                return e && (r -= e[0], (n -= e[1]) < 0 && (r--, n += 1e9)), [r, n]
            },
            platform: "browser",
            release: {},
            config: {},
            uptime: function() {
                return (new Date - Oe) / 1e3
            }
        },
        Le = "function" == typeof Object.create ? function(e, t) {
            e.super_ = t, e.prototype = Object.create(t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            })
        } : function(e, t) {
            e.super_ = t;
            var r = function() {};
            r.prototype = t.prototype, e.prototype = new r, e.prototype.constructor = e
        },
        Pe = /%[sdj%]/g;
    var Ue, De = {};

    function Me(e, t) {
        var r = {
            seen: [],
            stylize: Fe
        };
        return arguments.length >= 3 && (r.depth = arguments[2]), arguments.length >= 4 && (r.colors = arguments[3]), Ye(t) ? r.showHidden = t : t && function(e, t) {
            if (!t || !Ve(t)) return e;
            var r = Object.keys(t),
                n = r.length;
            for (; n--;) e[r[n]] = t[r[n]]
        }(r, t), Ke(r.showHidden) && (r.showHidden = !1), Ke(r.depth) && (r.depth = 2), Ke(r.colors) && (r.colors = !1), Ke(r.customInspect) && (r.customInspect = !0), r.colors && (r.stylize = je), Ne(r, e, r.depth)
    }

    function je(e, t) {
        var r = Me.styles[t];
        return r ? "[" + Me.colors[r][0] + "m" + e + "[" + Me.colors[r][1] + "m" : e
    }

    function Fe(e, t) {
        return e
    }

    function Ne(e, t, r) {
        if (e.customInspect && t && Je(t.inspect) && t.inspect !== Me && (!t.constructor || t.constructor.prototype !== t)) {
            var n = t.inspect(r, e);
            return He(n) || (n = Ne(e, n, r)), n
        }
        var i = function(e, t) {
            if (Ke(t)) return e.stylize("undefined", "undefined");
            if (He(t)) {
                var r = "'" + JSON.stringify(t).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                return e.stylize(r, "string")
            }
            if (n = t, "number" == typeof n) return e.stylize("" + t, "number");
            var n;
            if (Ye(t)) return e.stylize("" + t, "boolean");
            if (qe(t)) return e.stylize("null", "null")
        }(e, t);
        if (i) return i;
        var a = Object.keys(t),
            o = function(e) {
                var t = {};
                return e.forEach(function(e, r) {
                    t[e] = !0
                }), t
            }(a);
        if (e.showHidden && (a = Object.getOwnPropertyNames(t)), Ge(t) && (a.indexOf("message") >= 0 || a.indexOf("description") >= 0)) return Ze(t);
        if (0 === a.length) {
            if (Je(t)) {
                var s = t.name ? ": " + t.name : "";
                return e.stylize("[Function" + s + "]", "special")
            }
            if (Xe(t)) return e.stylize(RegExp.prototype.toString.call(t), "regexp");
            if ($e(t)) return e.stylize(Date.prototype.toString.call(t), "date");
            if (Ge(t)) return Ze(t)
        }
        var h, u, f = "",
            l = !1,
            c = ["{", "}"];
        (h = t, Array.isArray(h) && (l = !0, c = ["[", "]"]), Je(t)) && (f = " [Function" + (t.name ? ": " + t.name : "") + "]");
        return Xe(t) && (f = " " + RegExp.prototype.toString.call(t)), $e(t) && (f = " " + Date.prototype.toUTCString.call(t)), Ge(t) && (f = " " + Ze(t)), 0 !== a.length || l && 0 != t.length ? r < 0 ? Xe(t) ? e.stylize(RegExp.prototype.toString.call(t), "regexp") : e.stylize("[Object]", "special") : (e.seen.push(t), u = l ? function(e, t, r, n, i) {
            for (var a = [], o = 0, s = t.length; o < s; ++o) et(t, String(o)) ? a.push(We(e, t, r, n, String(o), !0)) : a.push("");
            return i.forEach(function(i) {
                i.match(/^\d+$/) || a.push(We(e, t, r, n, i, !0))
            }), a
        }(e, t, r, o, a) : a.map(function(n) {
            return We(e, t, r, o, n, l)
        }), e.seen.pop(), function(e, t, r) {
            if (e.reduce(function(e, t) {
                    return 0, t.indexOf("\n") >= 0 && 0, e + t.replace(/\u001b\[\d\d?m/g, "").length + 1
                }, 0) > 60) return r[0] + ("" === t ? "" : t + "\n ") + " " + e.join(",\n  ") + " " + r[1];
            return r[0] + t + " " + e.join(", ") + " " + r[1]
        }(u, f, c)) : c[0] + f + c[1]
    }

    function Ze(e) {
        return "[" + Error.prototype.toString.call(e) + "]"
    }

    function We(e, t, r, n, i, a) {
        var o, s, h;
        if ((h = Object.getOwnPropertyDescriptor(t, i) || {
                value: t[i]
            }).get ? s = h.set ? e.stylize("[Getter/Setter]", "special") : e.stylize("[Getter]", "special") : h.set && (s = e.stylize("[Setter]", "special")), et(n, i) || (o = "[" + i + "]"), s || (e.seen.indexOf(h.value) < 0 ? (s = qe(r) ? Ne(e, h.value, null) : Ne(e, h.value, r - 1)).indexOf("\n") > -1 && (s = a ? s.split("\n").map(function(e) {
                return "  " + e
            }).join("\n").substr(2) : "\n" + s.split("\n").map(function(e) {
                return "   " + e
            }).join("\n")) : s = e.stylize("[Circular]", "special")), Ke(o)) {
            if (a && i.match(/^\d+$/)) return s;
            (o = JSON.stringify("" + i)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (o = o.substr(1, o.length - 2), o = e.stylize(o, "name")) : (o = o.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), o = e.stylize(o, "string"))
        }
        return o + ": " + s
    }

    function Ye(e) {
        return "boolean" == typeof e
    }

    function qe(e) {
        return null === e
    }

    function He(e) {
        return "string" == typeof e
    }

    function Ke(e) {
        return void 0 === e
    }

    function Xe(e) {
        return Ve(e) && "[object RegExp]" === Qe(e)
    }

    function Ve(e) {
        return "object" == typeof e && null !== e
    }

    function $e(e) {
        return Ve(e) && "[object Date]" === Qe(e)
    }

    function Ge(e) {
        return Ve(e) && ("[object Error]" === Qe(e) || e instanceof Error)
    }

    function Je(e) {
        return "function" == typeof e
    }

    function Qe(e) {
        return Object.prototype.toString.call(e)
    }

    function et(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }

    function tt() {
        this.head = null, this.tail = null, this.length = 0
    }
    Me.colors = {
        bold: [1, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        white: [37, 39],
        grey: [90, 39],
        black: [30, 39],
        blue: [34, 39],
        cyan: [36, 39],
        green: [32, 39],
        magenta: [35, 39],
        red: [31, 39],
        yellow: [33, 39]
    }, Me.styles = {
        special: "cyan",
        number: "yellow",
        boolean: "yellow",
        undefined: "grey",
        null: "bold",
        string: "green",
        date: "magenta",
        regexp: "red"
    }, tt.prototype.push = function(e) {
        var t = {
            data: e,
            next: null
        };
        this.length > 0 ? this.tail.next = t : this.head = t, this.tail = t, ++this.length
    }, tt.prototype.unshift = function(e) {
        var t = {
            data: e,
            next: this.head
        };
        0 === this.length && (this.tail = t), this.head = t, ++this.length
    }, tt.prototype.shift = function() {
        if (0 !== this.length) {
            var e = this.head.data;
            return 1 === this.length ? this.head = this.tail = null : this.head = this.head.next, --this.length, e
        }
    }, tt.prototype.clear = function() {
        this.head = this.tail = null, this.length = 0
    }, tt.prototype.join = function(e) {
        if (0 === this.length) return "";
        for (var t = this.head, r = "" + t.data; t = t.next;) r += e + t.data;
        return r
    }, tt.prototype.concat = function(e) {
        if (0 === this.length) return v.alloc(0);
        if (1 === this.length) return this.head.data;
        for (var t = v.allocUnsafe(e >>> 0), r = this.head, n = 0; r;) r.data.copy(t, n), n += r.data.length, r = r.next;
        return t
    };
    var rt = r(function(e, t) {
        var r = te.Buffer,
            n = r.isEncoding || function(e) {
                switch (e && e.toLowerCase()) {
                    case "hex":
                    case "utf8":
                    case "utf-8":
                    case "ascii":
                    case "binary":
                    case "base64":
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                    case "raw":
                        return !0;
                    default:
                        return !1
                }
            };
        var i = t.StringDecoder = function(e) {
            switch (this.encoding = (e || "utf8").toLowerCase().replace(/[-_]/, ""), function(e) {
                if (e && !n(e)) throw new Error("Unknown encoding: " + e)
            }(e), this.encoding) {
                case "utf8":
                    this.surrogateSize = 3;
                    break;
                case "ucs2":
                case "utf16le":
                    this.surrogateSize = 2, this.detectIncompleteChar = o;
                    break;
                case "base64":
                    this.surrogateSize = 3, this.detectIncompleteChar = s;
                    break;
                default:
                    return void(this.write = a)
            }
            this.charBuffer = new r(6), this.charReceived = 0, this.charLength = 0
        };

        function a(e) {
            return e.toString(this.encoding)
        }

        function o(e) {
            this.charReceived = e.length % 2, this.charLength = this.charReceived ? 2 : 0
        }

        function s(e) {
            this.charReceived = e.length % 3, this.charLength = this.charReceived ? 3 : 0
        }
        i.prototype.write = function(e) {
            for (var t = ""; this.charLength;) {
                var r = e.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : e.length;
                if (e.copy(this.charBuffer, this.charReceived, 0, r), this.charReceived += r, this.charReceived < this.charLength) return "";
                if (e = e.slice(r, e.length), !((i = (t = this.charBuffer.slice(0, this.charLength).toString(this.encoding)).charCodeAt(t.length - 1)) >= 55296 && i <= 56319)) {
                    if (this.charReceived = this.charLength = 0, 0 === e.length) return t;
                    break
                }
                this.charLength += this.surrogateSize, t = ""
            }
            this.detectIncompleteChar(e);
            var n = e.length;
            this.charLength && (e.copy(this.charBuffer, 0, e.length - this.charReceived, n), n -= this.charReceived);
            var i;
            n = (t += e.toString(this.encoding, 0, n)).length - 1;
            if ((i = t.charCodeAt(n)) >= 55296 && i <= 56319) {
                var a = this.surrogateSize;
                return this.charLength += a, this.charReceived += a, this.charBuffer.copy(this.charBuffer, a, 0, a), e.copy(this.charBuffer, 0, 0, a), t.substring(0, n)
            }
            return t
        }, i.prototype.detectIncompleteChar = function(e) {
            for (var t = e.length >= 3 ? 3 : e.length; t > 0; t--) {
                var r = e[e.length - t];
                if (1 == t && r >> 5 == 6) {
                    this.charLength = 2;
                    break
                }
                if (t <= 2 && r >> 4 == 14) {
                    this.charLength = 3;
                    break
                }
                if (t <= 3 && r >> 3 == 30) {
                    this.charLength = 4;
                    break
                }
            }
            this.charReceived = t
        }, i.prototype.end = function(e) {
            var t = "";
            if (e && e.length && (t = this.write(e)), this.charReceived) {
                var r = this.charReceived,
                    n = this.charBuffer,
                    i = this.encoding;
                t += n.slice(0, r).toString(i)
            }
            return t
        }
    }).StringDecoder;
    at.ReadableState = it;
    var nt = function(e) {
        Ke(Ue) && (Ue = Ie.env.NODE_DEBUG || ""), e = e.toUpperCase(), De[e] || (new RegExp("\\b" + e + "\\b", "i").test(Ue) ? De[e] = function() {
            var t = function(e) {
                if (!He(e)) {
                    for (var t = [], r = 0; r < arguments.length; r++) t.push(Me(arguments[r]));
                    return t.join(" ")
                }
                r = 1;
                for (var n = arguments, i = n.length, a = String(e).replace(Pe, function(e) {
                        if ("%%" === e) return "%";
                        if (r >= i) return e;
                        switch (e) {
                            case "%s":
                                return String(n[r++]);
                            case "%d":
                                return Number(n[r++]);
                            case "%j":
                                try {
                                    return JSON.stringify(n[r++])
                                } catch (e) {
                                    return "[Circular]"
                                }
                            default:
                                return e
                        }
                    }), o = n[r]; r < i; o = n[++r]) qe(o) || !Ve(o) ? a += " " + o : a += " " + Me(o);
                return a
            }.apply(null, arguments);
            console.error("%s %d: %s", e, 0, t)
        } : De[e] = function() {});
        return De[e]
    }("stream");

    function it(e, t) {
        e = e || {}, this.objectMode = !!e.objectMode, t instanceof Ot && (this.objectMode = this.objectMode || !!e.readableObjectMode);
        var r = e.highWaterMark,
            n = this.objectMode ? 16 : 16384;
        this.highWaterMark = r || 0 === r ? r : n, this.highWaterMark = ~~this.highWaterMark, this.buffer = new tt, this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.ranOut = !1, this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, e.encoding && (this.decoder = new rt(e.encoding), this.encoding = e.encoding)
    }

    function at(e) {
        if (!(this instanceof at)) return new at(e);
        this._readableState = new it(e, this), this.readable = !0, e && "function" == typeof e.read && (this._read = e.read), ne.call(this)
    }

    function ot(e, t, r, n, i) {
        var a = function(e, t) {
            var r = null;
            Q(t) || "string" == typeof t || null == t || e.objectMode || (r = new TypeError("Invalid non-string/buffer chunk"));
            return r
        }(t, r);
        if (a) e.emit("error", a);
        else if (null === r) t.reading = !1,
            function(e, t) {
                if (t.ended) return;
                if (t.decoder) {
                    var r = t.decoder.end();
                    r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length)
                }
                t.ended = !0, ut(e)
            }(e, t);
        else if (t.objectMode || r && r.length > 0)
            if (t.ended && !i) {
                var o = new Error("stream.push() after EOF");
                e.emit("error", o)
            } else if (t.endEmitted && i) {
            var s = new Error("stream.unshift() after end event");
            e.emit("error", s)
        } else {
            var h;
            !t.decoder || i || n || (r = t.decoder.write(r), h = !t.objectMode && 0 === r.length), i || (t.reading = !1), h || (t.flowing && 0 === t.length && !t.sync ? (e.emit("data", r), e.read(0)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.unshift(r) : t.buffer.push(r), t.needReadable && ut(e))),
                function(e, t) {
                    t.readingMore || (t.readingMore = !0, _e(lt, e, t))
                }(e, t)
        } else i || (t.reading = !1);
        return function(e) {
            return !e.ended && (e.needReadable || e.length < e.highWaterMark || 0 === e.length)
        }(t)
    }
    Le(at, ne), at.prototype.push = function(e, t) {
        var r = this._readableState;
        return r.objectMode || "string" != typeof e || (t = t || r.defaultEncoding) !== r.encoding && (e = v.from(e, t), t = ""), ot(this, r, e, t, !1)
    }, at.prototype.unshift = function(e) {
        return ot(this, this._readableState, e, "", !0)
    }, at.prototype.isPaused = function() {
        return !1 === this._readableState.flowing
    }, at.prototype.setEncoding = function(e) {
        return this._readableState.decoder = new rt(e), this._readableState.encoding = e, this
    };
    var st = 8388608;

    function ht(e, t) {
        return e <= 0 || 0 === t.length && t.ended ? 0 : t.objectMode ? 1 : e != e ? t.flowing && t.length ? t.buffer.head.data.length : t.length : (e > t.highWaterMark && (t.highWaterMark = function(e) {
            return e >= st ? e = st : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e
        }(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0))
    }

    function ut(e) {
        var t = e._readableState;
        t.needReadable = !1, t.emittedReadable || (nt("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? _e(ft, e) : ft(e))
    }

    function ft(e) {
        nt("emit readable"), e.emit("readable"), pt(e)
    }

    function lt(e, t) {
        for (var r = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (nt("maybeReadMore read 0"), e.read(0), r !== t.length);) r = t.length;
        t.readingMore = !1
    }

    function ct(e) {
        nt("readable nexttick read 0"), e.read(0)
    }

    function dt(e, t) {
        t.reading || (nt("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), pt(e), t.flowing && !t.reading && e.read(0)
    }

    function pt(e) {
        var t = e._readableState;
        for (nt("flow", t.flowing); t.flowing && null !== e.read(););
    }

    function mt(e, t) {
        return 0 === t.length ? null : (t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (r = t.decoder ? t.buffer.join("") : 1 === t.buffer.length ? t.buffer.head.data : t.buffer.concat(t.length), t.buffer.clear()) : r = function(e, t, r) {
            var n;
            e < t.head.data.length ? (n = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : n = e === t.head.data.length ? t.shift() : r ? function(e, t) {
                var r = t.head,
                    n = 1,
                    i = r.data;
                e -= i.length;
                for (; r = r.next;) {
                    var a = r.data,
                        o = e > a.length ? a.length : e;
                    if (o === a.length ? i += a : i += a.slice(0, e), 0 === (e -= o)) {
                        o === a.length ? (++n, r.next ? t.head = r.next : t.head = t.tail = null) : (t.head = r, r.data = a.slice(o));
                        break
                    }++n
                }
                return t.length -= n, i
            }(e, t) : function(e, t) {
                var r = v.allocUnsafe(e),
                    n = t.head,
                    i = 1;
                n.data.copy(r), e -= n.data.length;
                for (; n = n.next;) {
                    var a = n.data,
                        o = e > a.length ? a.length : e;
                    if (a.copy(r, r.length - e, 0, o), 0 === (e -= o)) {
                        o === a.length ? (++i, n.next ? t.head = n.next : t.head = t.tail = null) : (t.head = n, n.data = a.slice(o));
                        break
                    }++i
                }
                return t.length -= i, r
            }(e, t);
            return n
        }(e, t.buffer, t.decoder), r);
        var r
    }

    function gt(e) {
        var t = e._readableState;
        if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
        t.endEmitted || (t.ended = !0, _e(vt, t, e))
    }

    function vt(e, t) {
        e.endEmitted || 0 !== e.length || (e.endEmitted = !0, t.readable = !1, t.emit("end"))
    }

    function yt(e, t) {
        for (var r = 0, n = e.length; r < n; r++)
            if (e[r] === t) return r;
        return -1
    }

    function wt() {}

    function _t(t, r) {
        Object.defineProperty(this, "buffer", {
            get: function t(r, n) {
                if (Ke(e.process)) return function() {
                    return t(r, n).apply(this, arguments)
                };
                if (!0 === Ie.noDeprecation) return r;
                var i = !1;
                return function() {
                    if (!i) {
                        if (Ie.throwDeprecation) throw new Error(n);
                        Ie.traceDeprecation ? console.trace(n) : console.error(n), i = !0
                    }
                    return r.apply(this, arguments)
                }
            }(function() {
                return this.getBuffer()
            }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.")
        }), t = t || {}, this.objectMode = !!t.objectMode, r instanceof Ot && (this.objectMode = this.objectMode || !!t.writableObjectMode);
        var n = t.highWaterMark,
            i = this.objectMode ? 16 : 16384;
        this.highWaterMark = n || 0 === n ? n : i, this.highWaterMark = ~~this.highWaterMark, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1;
        var a = !1 === t.decodeStrings;
        this.decodeStrings = !a, this.defaultEncoding = t.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(e) {
            ! function(e, t) {
                var r = e._writableState,
                    n = r.sync,
                    i = r.writecb;
                if (function(e) {
                        e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0
                    }(r), t) ! function(e, t, r, n, i) {
                    --t.pendingcb, r ? _e(i, n) : i(n);
                    e._writableState.errorEmitted = !0, e.emit("error", n)
                }(e, r, n, t, i);
                else {
                    var a = Et(r);
                    a || r.corked || r.bufferProcessing || !r.bufferedRequest || St(e, r), n ? _e(xt, e, r, a, i) : xt(e, r, a, i)
                }
            }(r, e)
        }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new Rt(this)
    }

    function bt(e) {
        if (!(this instanceof bt || this instanceof Ot)) return new bt(e);
        this._writableState = new _t(e, this), this.writable = !0, e && ("function" == typeof e.write && (this._write = e.write), "function" == typeof e.writev && (this._writev = e.writev)), ne.call(this)
    }

    function kt(e, t, r, n, i, a, o) {
        t.writelen = n, t.writecb = o, t.writing = !0, t.sync = !0, r ? e._writev(i, t.onwrite) : e._write(i, a, t.onwrite), t.sync = !1
    }

    function xt(e, t, r, n) {
        r || function(e, t) {
            0 === t.length && t.needDrain && (t.needDrain = !1, e.emit("drain"))
        }(e, t), t.pendingcb--, n(), Ct(e, t)
    }

    function St(e, t) {
        t.bufferProcessing = !0;
        var r = t.bufferedRequest;
        if (e._writev && r && r.next) {
            var n = t.bufferedRequestCount,
                i = new Array(n),
                a = t.corkedRequestsFree;
            a.entry = r;
            for (var o = 0; r;) i[o] = r, r = r.next, o += 1;
            kt(e, t, !0, t.length, i, "", a.finish), t.pendingcb++, t.lastBufferedRequest = null, a.next ? (t.corkedRequestsFree = a.next, a.next = null) : t.corkedRequestsFree = new Rt(t)
        } else {
            for (; r;) {
                var s = r.chunk,
                    h = r.encoding,
                    u = r.callback;
                if (kt(e, t, !1, t.objectMode ? 1 : s.length, s, h, u), r = r.next, t.writing) break
            }
            null === r && (t.lastBufferedRequest = null)
        }
        t.bufferedRequestCount = 0, t.bufferedRequest = r, t.bufferProcessing = !1
    }

    function Et(e) {
        return e.ending && 0 === e.length && null === e.bufferedRequest && !e.finished && !e.writing
    }

    function At(e, t) {
        t.prefinished || (t.prefinished = !0, e.emit("prefinish"))
    }

    function Ct(e, t) {
        var r = Et(t);
        return r && (0 === t.pendingcb ? (At(e, t), t.finished = !0, e.emit("finish")) : At(e, t)), r
    }

    function Rt(e) {
        var t = this;
        this.next = null, this.entry = null, this.finish = function(r) {
            var n = t.entry;
            for (t.entry = null; n;) {
                var i = n.callback;
                e.pendingcb--, i(r), n = n.next
            }
            e.corkedRequestsFree ? e.corkedRequestsFree.next = t : e.corkedRequestsFree = t
        }
    }
    at.prototype.read = function(e) {
        nt("read", e), e = parseInt(e, 10);
        var t = this._readableState,
            r = e;
        if (0 !== e && (t.emittedReadable = !1), 0 === e && t.needReadable && (t.length >= t.highWaterMark || t.ended)) return nt("read: emitReadable", t.length, t.ended), 0 === t.length && t.ended ? gt(this) : ut(this), null;
        if (0 === (e = ht(e, t)) && t.ended) return 0 === t.length && gt(this), null;
        var n, i = t.needReadable;
        return nt("need readable", i), (0 === t.length || t.length - e < t.highWaterMark) && nt("length less than watermark", i = !0), t.ended || t.reading ? nt("reading or ended", i = !1) : i && (nt("do read"), t.reading = !0, t.sync = !0, 0 === t.length && (t.needReadable = !0), this._read(t.highWaterMark), t.sync = !1, t.reading || (e = ht(r, t))), null === (n = e > 0 ? mt(e, t) : null) ? (t.needReadable = !0, e = 0) : t.length -= e, 0 === t.length && (t.ended || (t.needReadable = !0), r !== e && t.ended && gt(this)), null !== n && this.emit("data", n), n
    }, at.prototype._read = function(e) {
        this.emit("error", new Error("not implemented"))
    }, at.prototype.pipe = function(e, t) {
        var r = this,
            n = this._readableState;
        switch (n.pipesCount) {
            case 0:
                n.pipes = e;
                break;
            case 1:
                n.pipes = [n.pipes, e];
                break;
            default:
                n.pipes.push(e)
        }
        n.pipesCount += 1, nt("pipe count=%d opts=%j", n.pipesCount, t);
        var i = !t || !1 !== t.end ? o : u;

        function a(e) {
            nt("onunpipe"), e === r && u()
        }

        function o() {
            nt("onend"), e.end()
        }
        n.endEmitted ? _e(i) : r.once("end", i), e.on("unpipe", a);
        var s = function(e) {
            return function() {
                var t = e._readableState;
                nt("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, 0 === t.awaitDrain && e.listeners("data").length && (t.flowing = !0, pt(e))
            }
        }(r);
        e.on("drain", s);
        var h = !1;

        function u() {
            nt("cleanup"), e.removeListener("close", d), e.removeListener("finish", p), e.removeListener("drain", s), e.removeListener("error", c), e.removeListener("unpipe", a), r.removeListener("end", o), r.removeListener("end", u), r.removeListener("data", l), h = !0, !n.awaitDrain || e._writableState && !e._writableState.needDrain || s()
        }
        var f = !1;

        function l(t) {
            nt("ondata"), f = !1, !1 !== e.write(t) || f || ((1 === n.pipesCount && n.pipes === e || n.pipesCount > 1 && -1 !== yt(n.pipes, e)) && !h && (nt("false write response, pause", r._readableState.awaitDrain), r._readableState.awaitDrain++, f = !0), r.pause())
        }

        function c(t) {
            var r;
            nt("onerror", t), m(), e.removeListener("error", c), 0 === (r = "error", e.listeners(r).length) && e.emit("error", t)
        }

        function d() {
            e.removeListener("finish", p), m()
        }

        function p() {
            nt("onfinish"), e.removeListener("close", d), m()
        }

        function m() {
            nt("unpipe"), r.unpipe(e)
        }
        return r.on("data", l),
            function(e, t, r) {
                if ("function" == typeof e.prependListener) return e.prependListener(t, r);
                e._events && e._events[t] ? Array.isArray(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]] : e.on(t, r)
            }(e, "error", c), e.once("close", d), e.once("finish", p), e.emit("pipe", r), n.flowing || (nt("pipe resume"), r.resume()), e
    }, at.prototype.unpipe = function(e) {
        var t = this._readableState;
        if (0 === t.pipesCount) return this;
        if (1 === t.pipesCount) return e && e !== t.pipes ? this : (e || (e = t.pipes), t.pipes = null, t.pipesCount = 0, t.flowing = !1, e && e.emit("unpipe", this), this);
        if (!e) {
            var r = t.pipes,
                n = t.pipesCount;
            t.pipes = null, t.pipesCount = 0, t.flowing = !1;
            for (var i = 0; i < n; i++) r[i].emit("unpipe", this);
            return this
        }
        var a = yt(t.pipes, e);
        return -1 === a ? this : (t.pipes.splice(a, 1), t.pipesCount -= 1, 1 === t.pipesCount && (t.pipes = t.pipes[0]), e.emit("unpipe", this), this)
    }, at.prototype.on = function(e, t) {
        var r = ne.prototype.on.call(this, e, t);
        if ("data" === e) !1 !== this._readableState.flowing && this.resume();
        else if ("readable" === e) {
            var n = this._readableState;
            n.endEmitted || n.readableListening || (n.readableListening = n.needReadable = !0, n.emittedReadable = !1, n.reading ? n.length && ut(this) : _e(ct, this))
        }
        return r
    }, at.prototype.addListener = at.prototype.on, at.prototype.resume = function() {
        var e = this._readableState;
        return e.flowing || (nt("resume"), e.flowing = !0, function(e, t) {
            t.resumeScheduled || (t.resumeScheduled = !0, _e(dt, e, t))
        }(this, e)), this
    }, at.prototype.pause = function() {
        return nt("call pause flowing=%j", this._readableState.flowing), !1 !== this._readableState.flowing && (nt("pause"), this._readableState.flowing = !1, this.emit("pause")), this
    }, at.prototype.wrap = function(e) {
        var t = this._readableState,
            r = !1,
            n = this;
        for (var i in e.on("end", function() {
                if (nt("wrapped end"), t.decoder && !t.ended) {
                    var e = t.decoder.end();
                    e && e.length && n.push(e)
                }
                n.push(null)
            }), e.on("data", function(i) {
                (nt("wrapped data"), t.decoder && (i = t.decoder.write(i)), t.objectMode && null == i) || (t.objectMode || i && i.length) && (n.push(i) || (r = !0, e.pause()))
            }), e) void 0 === this[i] && "function" == typeof e[i] && (this[i] = function(t) {
            return function() {
                return e[t].apply(e, arguments)
            }
        }(i));
        return function(e, t) {
            for (var r = 0, n = e.length; r < n; r++) t(e[r], r)
        }(["error", "close", "destroy", "pause", "resume"], function(t) {
            e.on(t, n.emit.bind(n, t))
        }), n._read = function(t) {
            nt("wrapped _read", t), r && (r = !1, e.resume())
        }, n
    }, at._fromList = mt, bt.WritableState = _t, Le(bt, ne), _t.prototype.getBuffer = function() {
        for (var e = this.bufferedRequest, t = []; e;) t.push(e), e = e.next;
        return t
    }, bt.prototype.pipe = function() {
        this.emit("error", new Error("Cannot pipe, not readable"))
    }, bt.prototype.write = function(e, t, r) {
        var n = this._writableState,
            i = !1;
        return "function" == typeof t && (r = t, t = null), v.isBuffer(e) ? t = "buffer" : t || (t = n.defaultEncoding), "function" != typeof r && (r = wt), n.ended ? function(e, t) {
            var r = new Error("write after end");
            e.emit("error", r), _e(t, r)
        }(this, r) : function(e, t, r, n) {
            var i = !0,
                a = !1;
            return null === r ? a = new TypeError("May not write null values to stream") : v.isBuffer(r) || "string" == typeof r || void 0 === r || t.objectMode || (a = new TypeError("Invalid non-string/buffer chunk")), a && (e.emit("error", a), _e(n, a), i = !1), i
        }(this, n, e, r) && (n.pendingcb++, i = function(e, t, r, n, i) {
            r = function(e, t, r) {
                return e.objectMode || !1 === e.decodeStrings || "string" != typeof t || (t = v.from(t, r)), t
            }(t, r, n), v.isBuffer(r) && (n = "buffer");
            var a = t.objectMode ? 1 : r.length;
            t.length += a;
            var o = t.length < t.highWaterMark;
            o || (t.needDrain = !0);
            if (t.writing || t.corked) {
                var s = t.lastBufferedRequest;
                t.lastBufferedRequest = new function(e, t, r) {
                    this.chunk = e, this.encoding = t, this.callback = r, this.next = null
                }(r, n, i), s ? s.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest, t.bufferedRequestCount += 1
            } else kt(e, t, !1, a, r, n, i);
            return o
        }(this, n, e, t, r)), i
    }, bt.prototype.cork = function() {
        this._writableState.corked++
    }, bt.prototype.uncork = function() {
        var e = this._writableState;
        e.corked && (e.corked--, e.writing || e.corked || e.finished || e.bufferProcessing || !e.bufferedRequest || St(this, e))
    }, bt.prototype.setDefaultEncoding = function(e) {
        if ("string" == typeof e && (e = e.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((e + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + e);
        return this._writableState.defaultEncoding = e, this
    }, bt.prototype._write = function(e, t, r) {
        r(new Error("not implemented"))
    }, bt.prototype._writev = null, bt.prototype.end = function(e, t, r) {
        var n = this._writableState;
        "function" == typeof e ? (r = e, e = null, t = null) : "function" == typeof t && (r = t, t = null), null != e && this.write(e, t), n.corked && (n.corked = 1, this.uncork()), n.ending || n.finished || function(e, t, r) {
            t.ending = !0, Ct(e, t), r && (t.finished ? _e(r) : e.once("finish", r));
            t.ended = !0, e.writable = !1
        }(this, n, r)
    }, Le(Ot, at);
    for (var zt = Object.keys(bt.prototype), Tt = 0; Tt < zt.length; Tt++) {
        var Bt = zt[Tt];
        Ot.prototype[Bt] || (Ot.prototype[Bt] = bt.prototype[Bt])
    }

    function Ot(e) {
        if (!(this instanceof Ot)) return new Ot(e);
        at.call(this, e), bt.call(this, e), e && !1 === e.readable && (this.readable = !1), e && !1 === e.writable && (this.writable = !1), this.allowHalfOpen = !0, e && !1 === e.allowHalfOpen && (this.allowHalfOpen = !1), this.once("end", It)
    }

    function It() {
        this.allowHalfOpen || this._writableState.ended || _e(Lt, this)
    }

    function Lt(e) {
        e.end()
    }

    function Pt(e) {
        this.afterTransform = function(t, r) {
            return function(e, t, r) {
                var n = e._transformState;
                n.transforming = !1;
                var i = n.writecb;
                if (!i) return e.emit("error", new Error("no writecb in Transform class"));
                n.writechunk = null, n.writecb = null, null != r && e.push(r);
                i(t);
                var a = e._readableState;
                a.reading = !1, (a.needReadable || a.length < a.highWaterMark) && e._read(a.highWaterMark)
            }(e, t, r)
        }, this.needTransform = !1, this.transforming = !1, this.writecb = null, this.writechunk = null, this.writeencoding = null
    }

    function Ut(e) {
        if (!(this instanceof Ut)) return new Ut(e);
        Ot.call(this, e), this._transformState = new Pt(this);
        var t = this;
        this._readableState.needReadable = !0, this._readableState.sync = !1, e && ("function" == typeof e.transform && (this._transform = e.transform), "function" == typeof e.flush && (this._flush = e.flush)), this.once("prefinish", function() {
            "function" == typeof this._flush ? this._flush(function(e) {
                Dt(t, e)
            }) : Dt(t)
        })
    }

    function Dt(e, t) {
        if (t) return e.emit("error", t);
        var r = e._writableState,
            n = e._transformState;
        if (r.length) throw new Error("Calling transform done when ws.length != 0");
        if (n.transforming) throw new Error("Calling transform done when still transforming");
        return e.push(null)
    }

    function Mt(e) {
        if (!(this instanceof Mt)) return new Mt(e);
        Ut.call(this, e)
    }

    function jt() {
        ne.call(this)
    }
    Le(Ut, Ot), Ut.prototype.push = function(e, t) {
        return this._transformState.needTransform = !1, Ot.prototype.push.call(this, e, t)
    }, Ut.prototype._transform = function(e, t, r) {
        throw new Error("Not implemented")
    }, Ut.prototype._write = function(e, t, r) {
        var n = this._transformState;
        if (n.writecb = r, n.writechunk = e, n.writeencoding = t, !n.transforming) {
            var i = this._readableState;
            (n.needTransform || i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark)
        }
    }, Ut.prototype._read = function(e) {
        var t = this._transformState;
        null !== t.writechunk && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) : t.needTransform = !0
    }, Le(Mt, Ut), Mt.prototype._transform = function(e, t, r) {
        r(null, e)
    }, Le(jt, ne), jt.Readable = at, jt.Writable = bt, jt.Duplex = Ot, jt.Transform = Ut, jt.PassThrough = Mt, jt.Stream = jt, jt.prototype.pipe = function(e, t) {
        var r = this;

        function n(t) {
            e.writable && !1 === e.write(t) && r.pause && r.pause()
        }

        function i() {
            r.readable && r.resume && r.resume()
        }
        r.on("data", n), e.on("drain", i), e._isStdio || t && !1 === t.end || (r.on("end", o), r.on("close", s));
        var a = !1;

        function o() {
            a || (a = !0, e.end())
        }

        function s() {
            a || (a = !0, "function" == typeof e.destroy && e.destroy())
        }

        function h(e) {
            if (u(), 0 === ne.listenerCount(this, "error")) throw e
        }

        function u() {
            r.removeListener("data", n), e.removeListener("drain", i), r.removeListener("end", o), r.removeListener("close", s), r.removeListener("error", h), e.removeListener("error", h), r.removeListener("end", u), r.removeListener("close", u), e.removeListener("close", u)
        }
        return r.on("error", h), e.on("error", h), r.on("end", u), r.on("close", u), e.on("close", u), e.emit("pipe", r), e
    };
    var Ft = Object.freeze({
            default: jt,
            Readable: at,
            Writable: bt,
            Duplex: Ot,
            Transform: Ut,
            PassThrough: Mt,
            Stream: jt
        }),
        Nt = Ft && jt || Ft,
        Zt = r(function(e, t) {
            if (t.base64 = !0, t.array = !0, t.string = !0, t.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, t.nodebuffer = !0, t.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) t.blob = !1;
            else {
                var r = new ArrayBuffer(0);
                try {
                    t.blob = 0 === new Blob([r], {
                        type: "application/zip"
                    }).size
                } catch (e) {
                    try {
                        var n = new(self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder);
                        n.append(r), t.blob = 0 === n.getBlob("application/zip").size
                    } catch (e) {
                        t.blob = !1
                    }
                }
            }
            try {
                t.nodestream = !!Nt.Readable
            } catch (e) {
                t.nodestream = !1
            }
        }),
        Wt = (Zt.base64, Zt.array, Zt.string, Zt.arraybuffer, Zt.nodebuffer, Zt.uint8array, Zt.blob, Zt.nodestream, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="),
        Yt = {
            encode: function(e) {
                for (var t, r, n, i, a, o, s, h = [], u = 0, f = e.length, l = f, c = "string" !== Gr.getTypeOf(e); u < e.length;) l = f - u, c ? (t = e[u++], r = u < f ? e[u++] : 0, n = u < f ? e[u++] : 0) : (t = e.charCodeAt(u++), r = u < f ? e.charCodeAt(u++) : 0, n = u < f ? e.charCodeAt(u++) : 0), i = t >> 2, a = (3 & t) << 4 | r >> 4, o = l > 1 ? (15 & r) << 2 | n >> 6 : 64, s = l > 2 ? 63 & n : 64, h.push(Wt.charAt(i) + Wt.charAt(a) + Wt.charAt(o) + Wt.charAt(s));
                return h.join("")
            },
            decode: function(e) {
                var t, r, n, i, a, o, s = 0,
                    h = 0;
                if ("data:" === e.substr(0, "data:".length)) throw new Error("Invalid base64 input, it looks like a data url.");
                var u, f = 3 * (e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "")).length / 4;
                if (e.charAt(e.length - 1) === Wt.charAt(64) && f--, e.charAt(e.length - 2) === Wt.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
                for (u = Zt.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); s < e.length;) t = Wt.indexOf(e.charAt(s++)) << 2 | (i = Wt.indexOf(e.charAt(s++))) >> 4, r = (15 & i) << 4 | (a = Wt.indexOf(e.charAt(s++))) >> 2, n = (3 & a) << 6 | (o = Wt.indexOf(e.charAt(s++))), u[h++] = t, 64 !== a && (u[h++] = r), 64 !== o && (u[h++] = n);
                return u
            }
        },
        qt = !0,
        Ht = function(e, t) {
            return new v(e, t)
        },
        Kt = function(e) {
            return v.alloc ? v.alloc(e) : new v(e)
        },
        Xt = function(e) {
            return Q(e)
        },
        Vt = function(e) {
            return e && "function" == typeof e.on && "function" == typeof e.pause && "function" == typeof e.resume
        },
        $t = r(function(e) {
            var t = e.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")();
            "number" == typeof __g && (__g = t)
        }),
        Gt = r(function(e) {
            var t = e.exports = {
                version: "2.3.0"
            };
            "number" == typeof __e && (__e = t)
        }),
        Jt = (Gt.version, function(e, t, r) {
            if (function(e) {
                    if ("function" != typeof e) throw TypeError(e + " is not a function!")
                }(e), void 0 === t) return e;
            switch (r) {
                case 1:
                    return function(r) {
                        return e.call(t, r)
                    };
                case 2:
                    return function(r, n) {
                        return e.call(t, r, n)
                    };
                case 3:
                    return function(r, n, i) {
                        return e.call(t, r, n, i)
                    }
            }
            return function() {
                return e.apply(t, arguments)
            }
        }),
        Qt = function(e) {
            return "object" == typeof e ? null !== e : "function" == typeof e
        },
        er = function(e) {
            if (!Qt(e)) throw TypeError(e + " is not an object!");
            return e
        },
        tr = function(e) {
            try {
                return !!e()
            } catch (e) {
                return !0
            }
        },
        rr = !tr(function() {
            return 7 != Object.defineProperty({}, "a", {
                get: function() {
                    return 7
                }
            }).a
        }),
        nr = $t.document,
        ir = Qt(nr) && Qt(nr.createElement),
        ar = function(e) {
            return ir ? nr.createElement(e) : {}
        },
        or = !rr && !tr(function() {
            return 7 != Object.defineProperty(ar("div"), "a", {
                get: function() {
                    return 7
                }
            }).a
        }),
        sr = Object.defineProperty,
        hr = {
            f: rr ? Object.defineProperty : function(e, t, r) {
                if (er(e), t = function(e, t) {
                        if (!Qt(e)) return e;
                        var r, n;
                        if (t && "function" == typeof(r = e.toString) && !Qt(n = r.call(e))) return n;
                        if ("function" == typeof(r = e.valueOf) && !Qt(n = r.call(e))) return n;
                        if (!t && "function" == typeof(r = e.toString) && !Qt(n = r.call(e))) return n;
                        throw TypeError("Can't convert object to primitive value")
                    }(t, !0), er(r), or) try {
                    return sr(e, t, r)
                } catch (e) {}
                if ("get" in r || "set" in r) throw TypeError("Accessors not supported!");
                return "value" in r && (e[t] = r.value), e
            }
        },
        ur = rr ? function(e, t, r) {
            return hr.f(e, t, function(e, t) {
                return {
                    enumerable: !(1 & e),
                    configurable: !(2 & e),
                    writable: !(4 & e),
                    value: t
                }
            }(1, r))
        } : function(e, t, r) {
            return e[t] = r, e
        },
        fr = function(e, t, r) {
            var n, i, a, o = e & fr.F,
                s = e & fr.G,
                h = e & fr.S,
                u = e & fr.P,
                f = e & fr.B,
                l = e & fr.W,
                c = s ? Gt : Gt[t] || (Gt[t] = {}),
                d = c.prototype,
                p = s ? $t : h ? $t[t] : ($t[t] || {}).prototype;
            for (n in s && (r = t), r)(i = !o && p && void 0 !== p[n]) && n in c || (a = i ? p[n] : r[n], c[n] = s && "function" != typeof p[n] ? r[n] : f && i ? Jt(a, $t) : l && p[n] == a ? function(e) {
                var t = function(t, r, n) {
                    if (this instanceof e) {
                        switch (arguments.length) {
                            case 0:
                                return new e;
                            case 1:
                                return new e(t);
                            case 2:
                                return new e(t, r)
                        }
                        return new e(t, r, n)
                    }
                    return e.apply(this, arguments)
                };
                return t.prototype = e.prototype, t
            }(a) : u && "function" == typeof a ? Jt(Function.call, a) : a, u && ((c.virtual || (c.virtual = {}))[n] = a, e & fr.R && d && !d[n] && ur(d, n, a)))
        };
    fr.F = 1, fr.G = 2, fr.S = 4, fr.P = 8, fr.B = 16, fr.W = 32, fr.U = 64, fr.R = 128;
    var lr, cr, dr, pr, mr = fr,
        gr = $t.document && document.documentElement,
        vr = {}.toString,
        yr = $t.process,
        wr = $t.setImmediate,
        _r = $t.clearImmediate,
        br = $t.MessageChannel,
        kr = 0,
        xr = {},
        Sr = function() {
            var e = +this;
            if (xr.hasOwnProperty(e)) {
                var t = xr[e];
                delete xr[e], t()
            }
        },
        Er = function(e) {
            Sr.call(e.data)
        };
    wr && _r || (wr = function(e) {
        for (var t = [], r = 1; arguments.length > r;) t.push(arguments[r++]);
        return xr[++kr] = function() {
            ! function(e, t, r) {
                var n = void 0 === r;
                switch (t.length) {
                    case 0:
                        return n ? e() : e.call(r);
                    case 1:
                        return n ? e(t[0]) : e.call(r, t[0]);
                    case 2:
                        return n ? e(t[0], t[1]) : e.call(r, t[0], t[1]);
                    case 3:
                        return n ? e(t[0], t[1], t[2]) : e.call(r, t[0], t[1], t[2]);
                    case 4:
                        return n ? e(t[0], t[1], t[2], t[3]) : e.call(r, t[0], t[1], t[2], t[3])
                }
                e.apply(r, t)
            }("function" == typeof e ? e : Function(e), t)
        }, lr(kr), kr
    }, _r = function(e) {
        delete xr[e]
    }, "process" == (pr = yr, vr.call(pr).slice(8, -1)) ? lr = function(e) {
        yr.nextTick(Jt(Sr, e, 1))
    } : br ? (dr = (cr = new br).port2, cr.port1.onmessage = Er, lr = Jt(dr.postMessage, dr, 1)) : $t.addEventListener && "function" == typeof postMessage && !$t.importScripts ? (lr = function(e) {
        $t.postMessage(e + "", "*")
    }, $t.addEventListener("message", Er, !1)) : lr = "onreadystatechange" in ar("script") ? function(e) {
        gr.appendChild(ar("script")).onreadystatechange = function() {
            gr.removeChild(this), Sr.call(e)
        }
    } : function(e) {
        setTimeout(Jt(Sr, e, 1), 0)
    });
    var Ar = {
        set: wr,
        clear: _r
    };
    mr(mr.G + mr.B, {
        setImmediate: Ar.set,
        clearImmediate: Ar.clear
    });
    var Cr, Rr, zr = Gt.setImmediate,
        Tr = t.MutationObserver || t.WebKitMutationObserver;
    if (Tr) {
        var Br = 0,
            Or = new Tr(Ur),
            Ir = t.document.createTextNode("");
        Or.observe(Ir, {
            characterData: !0
        }), Cr = function() {
            Ir.data = Br = ++Br % 2
        }
    } else if (t.setImmediate || void 0 === t.MessageChannel) Cr = "document" in t && "onreadystatechange" in t.document.createElement("script") ? function() {
        var e = t.document.createElement("script");
        e.onreadystatechange = function() {
            Ur(), e.onreadystatechange = null, e.parentNode.removeChild(e), e = null
        }, t.document.documentElement.appendChild(e)
    } : function() {
        setTimeout(Ur, 0)
    };
    else {
        var Lr = new t.MessageChannel;
        Lr.port1.onmessage = Ur, Cr = function() {
            Lr.port2.postMessage(0)
        }
    }
    var Pr = [];

    function Ur() {
        var e, t;
        Rr = !0;
        for (var r = Pr.length; r;) {
            for (t = Pr, Pr = [], e = -1; ++e < r;) t[e]();
            r = Pr.length
        }
        Rr = !1
    }
    var Dr = function(e) {
        1 !== Pr.push(e) || Rr || Cr()
    };

    function Mr() {}
    var jr = {},
        Fr = ["REJECTED"],
        Nr = ["FULFILLED"],
        Zr = ["PENDING"],
        Wr = Yr;

    function Yr(e) {
        if ("function" != typeof e) throw new TypeError("resolver must be a function");
        this.state = Zr, this.queue = [], this.outcome = void 0, e !== Mr && Xr(this, e)
    }

    function qr(e, t, r) {
        this.promise = e, "function" == typeof t && (this.onFulfilled = t, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r && (this.onRejected = r, this.callRejected = this.otherCallRejected)
    }

    function Hr(e, t, r) {
        Dr(function() {
            var n;
            try {
                n = t(r)
            } catch (t) {
                return jr.reject(e, t)
            }
            n === e ? jr.reject(e, new TypeError("Cannot resolve promise with itself")) : jr.resolve(e, n)
        })
    }

    function Kr(e) {
        var t = e && e.then;
        if (e && ("object" == typeof e || "function" == typeof e) && "function" == typeof t) return function() {
            t.apply(e, arguments)
        }
    }

    function Xr(e, t) {
        var r = !1;

        function n(t) {
            r || (r = !0, jr.reject(e, t))
        }

        function i(t) {
            r || (r = !0, jr.resolve(e, t))
        }
        var a = Vr(function() {
            t(i, n)
        });
        "error" === a.status && n(a.value)
    }

    function Vr(e, t) {
        var r = {};
        try {
            r.value = e(t), r.status = "success"
        } catch (e) {
            r.status = "error", r.value = e
        }
        return r
    }
    Yr.prototype.catch = function(e) {
        return this.then(null, e)
    }, Yr.prototype.then = function(e, t) {
        if ("function" != typeof e && this.state === Nr || "function" != typeof t && this.state === Fr) return this;
        var r = new this.constructor(Mr);
        this.state !== Zr ? Hr(r, this.state === Nr ? e : t, this.outcome) : this.queue.push(new qr(r, e, t));
        return r
    }, qr.prototype.callFulfilled = function(e) {
        jr.resolve(this.promise, e)
    }, qr.prototype.otherCallFulfilled = function(e) {
        Hr(this.promise, this.onFulfilled, e)
    }, qr.prototype.callRejected = function(e) {
        jr.reject(this.promise, e)
    }, qr.prototype.otherCallRejected = function(e) {
        Hr(this.promise, this.onRejected, e)
    }, jr.resolve = function(e, t) {
        var r = Vr(Kr, t);
        if ("error" === r.status) return jr.reject(e, r.value);
        var n = r.value;
        if (n) Xr(e, n);
        else {
            e.state = Nr, e.outcome = t;
            for (var i = -1, a = e.queue.length; ++i < a;) e.queue[i].callFulfilled(t)
        }
        return e
    }, jr.reject = function(e, t) {
        e.state = Fr, e.outcome = t;
        for (var r = -1, n = e.queue.length; ++r < n;) e.queue[r].callRejected(t);
        return e
    }, Yr.resolve = function(e) {
        if (e instanceof this) return e;
        return jr.resolve(new this(Mr), e)
    }, Yr.reject = function(e) {
        var t = new this(Mr);
        return jr.reject(t, e)
    }, Yr.all = function(e) {
        var t = this;
        if ("[object Array]" !== Object.prototype.toString.call(e)) return this.reject(new TypeError("must be an array"));
        var r = e.length,
            n = !1;
        if (!r) return this.resolve([]);
        var i = new Array(r),
            a = 0,
            o = -1,
            s = new this(Mr);
        for (; ++o < r;) h(e[o], o);
        return s;

        function h(e, o) {
            t.resolve(e).then(function(e) {
                i[o] = e, ++a !== r || n || (n = !0, jr.resolve(s, i))
            }, function(e) {
                n || (n = !0, jr.reject(s, e))
            })
        }
    }, Yr.race = function(e) {
        var t = this;
        if ("[object Array]" !== Object.prototype.toString.call(e)) return this.reject(new TypeError("must be an array"));
        var r = e.length,
            n = !1;
        if (!r) return this.resolve([]);
        var i = -1,
            a = new this(Mr);
        for (; ++i < r;) o = e[i], t.resolve(o).then(function(e) {
            n || (n = !0, jr.resolve(a, e))
        }, function(e) {
            n || (n = !0, jr.reject(a, e))
        });
        var o;
        return a
    };
    var $r = {
            Promise: "undefined" != typeof Promise ? Promise : Wr
        },
        Gr = r(function(e, t) {
            function r(e) {
                return e
            }

            function n(e, t) {
                for (var r = 0; r < e.length; ++r) t[r] = 255 & e.charCodeAt(r);
                return t
            }
            t.newBlob = function(e, r) {
                t.checkSupport("blob");
                try {
                    return new Blob([e], {
                        type: r
                    })
                } catch (t) {
                    try {
                        var n = new(self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder);
                        return n.append(e), n.getBlob(r)
                    } catch (e) {
                        throw new Error("Bug : can't construct the Blob.")
                    }
                }
            };
            var i = {
                stringifyByChunk: function(e, t, r) {
                    var n = [],
                        i = 0,
                        a = e.length;
                    if (a <= r) return String.fromCharCode.apply(null, e);
                    for (; i < a;) "array" === t || "nodebuffer" === t ? n.push(String.fromCharCode.apply(null, e.slice(i, Math.min(i + r, a)))) : n.push(String.fromCharCode.apply(null, e.subarray(i, Math.min(i + r, a)))), i += r;
                    return n.join("")
                },
                stringifyByChar: function(e) {
                    for (var t = "", r = 0; r < e.length; r++) t += String.fromCharCode(e[r]);
                    return t
                },
                applyCanBeUsed: {
                    uint8array: function() {
                        try {
                            return Zt.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length
                        } catch (e) {
                            return !1
                        }
                    }(),
                    nodebuffer: function() {
                        try {
                            return Zt.nodebuffer && 1 === String.fromCharCode.apply(null, Kt(1)).length
                        } catch (e) {
                            return !1
                        }
                    }()
                }
            };

            function a(e) {
                var r = 65536,
                    n = t.getTypeOf(e),
                    a = !0;
                if ("uint8array" === n ? a = i.applyCanBeUsed.uint8array : "nodebuffer" === n && (a = i.applyCanBeUsed.nodebuffer), a)
                    for (; r > 1;) try {
                        return i.stringifyByChunk(e, n, r)
                    } catch (e) {
                        r = Math.floor(r / 2)
                    }
                return i.stringifyByChar(e)
            }

            function o(e, t) {
                for (var r = 0; r < e.length; r++) t[r] = e[r];
                return t
            }
            t.applyFromCharCode = a;
            var s = {};
            s.string = {
                string: r,
                array: function(e) {
                    return n(e, new Array(e.length))
                },
                arraybuffer: function(e) {
                    return s.string.uint8array(e).buffer
                },
                uint8array: function(e) {
                    return n(e, new Uint8Array(e.length))
                },
                nodebuffer: function(e) {
                    return n(e, Kt(e.length))
                }
            }, s.array = {
                string: a,
                array: r,
                arraybuffer: function(e) {
                    return new Uint8Array(e).buffer
                },
                uint8array: function(e) {
                    return new Uint8Array(e)
                },
                nodebuffer: function(e) {
                    return Ht(e)
                }
            }, s.arraybuffer = {
                string: function(e) {
                    return a(new Uint8Array(e))
                },
                array: function(e) {
                    return o(new Uint8Array(e), new Array(e.byteLength))
                },
                arraybuffer: r,
                uint8array: function(e) {
                    return new Uint8Array(e)
                },
                nodebuffer: function(e) {
                    return Ht(new Uint8Array(e))
                }
            }, s.uint8array = {
                string: a,
                array: function(e) {
                    return o(e, new Array(e.length))
                },
                arraybuffer: function(e) {
                    return e.buffer
                },
                uint8array: r,
                nodebuffer: function(e) {
                    return Ht(e)
                }
            }, s.nodebuffer = {
                string: a,
                array: function(e) {
                    return o(e, new Array(e.length))
                },
                arraybuffer: function(e) {
                    return s.nodebuffer.uint8array(e).buffer
                },
                uint8array: function(e) {
                    return o(e, new Uint8Array(e.length))
                },
                nodebuffer: r
            }, t.transformTo = function(e, r) {
                if (r || (r = ""), !e) return r;
                t.checkSupport(e);
                var n = t.getTypeOf(r);
                return s[n][e](r)
            }, t.getTypeOf = function(e) {
                return "string" == typeof e ? "string" : "[object Array]" === Object.prototype.toString.call(e) ? "array" : Zt.nodebuffer && Xt(e) ? "nodebuffer" : Zt.uint8array && e instanceof Uint8Array ? "uint8array" : Zt.arraybuffer && e instanceof ArrayBuffer ? "arraybuffer" : void 0
            }, t.checkSupport = function(e) {
                if (!Zt[e.toLowerCase()]) throw new Error(e + " is not supported by this platform")
            }, t.MAX_VALUE_16BITS = 65535, t.MAX_VALUE_32BITS = -1, t.pretty = function(e) {
                var t, r, n = "";
                for (r = 0; r < (e || "").length; r++) n += "\\x" + ((t = e.charCodeAt(r)) < 16 ? "0" : "") + t.toString(16).toUpperCase();
                return n
            }, t.delay = function(e, t, r) {
                zr(function() {
                    e.apply(r || null, t || [])
                })
            }, t.inherits = function(e, t) {
                var r = function() {};
                r.prototype = t.prototype, e.prototype = new r
            }, t.extend = function() {
                var e, t, r = {};
                for (e = 0; e < arguments.length; e++)
                    for (t in arguments[e]) arguments[e].hasOwnProperty(t) && void 0 === r[t] && (r[t] = arguments[e][t]);
                return r
            }, t.prepareContent = function(e, r, i, a, o) {
                return $r.Promise.resolve(r).then(function(e) {
                    return Zt.blob && (e instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(e))) && "undefined" != typeof FileReader ? new $r.Promise(function(t, r) {
                        var n = new FileReader;
                        n.onload = function(e) {
                            t(e.target.result)
                        }, n.onerror = function(e) {
                            r(e.target.error)
                        }, n.readAsArrayBuffer(e)
                    }) : e
                }).then(function(r) {
                    var s, h = t.getTypeOf(r);
                    return h ? ("arraybuffer" === h ? r = t.transformTo("uint8array", r) : "string" === h && (o ? r = Yt.decode(r) : i && !0 !== a && (r = n(s = r, Zt.uint8array ? new Uint8Array(s.length) : new Array(s.length)))), r) : $r.Promise.reject(new Error("Can't read the data of '" + e + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))
                })
            }
        });
    Gr.newBlob, Gr.applyFromCharCode, Gr.transformTo, Gr.getTypeOf, Gr.checkSupport, Gr.MAX_VALUE_16BITS, Gr.MAX_VALUE_32BITS, Gr.pretty, Gr.delay, Gr.inherits, Gr.extend, Gr.prepareContent;

    function Jr(e) {
        this.name = e || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = {
            data: [],
            end: [],
            error: []
        }, this.previous = null
    }
    Jr.prototype = {
        push: function(e) {
            this.emit("data", e)
        },
        end: function() {
            if (this.isFinished) return !1;
            this.flush();
            try {
                this.emit("end"), this.cleanUp(), this.isFinished = !0
            } catch (e) {
                this.emit("error", e)
            }
            return !0
        },
        error: function(e) {
            return !this.isFinished && (this.isPaused ? this.generatedError = e : (this.isFinished = !0, this.emit("error", e), this.previous && this.previous.error(e), this.cleanUp()), !0)
        },
        on: function(e, t) {
            return this._listeners[e].push(t), this
        },
        cleanUp: function() {
            this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = []
        },
        emit: function(e, t) {
            if (this._listeners[e])
                for (var r = 0; r < this._listeners[e].length; r++) this._listeners[e][r].call(this, t)
        },
        pipe: function(e) {
            return e.registerPrevious(this)
        },
        registerPrevious: function(e) {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.streamInfo = e.streamInfo, this.mergeStreamInfo(), this.previous = e;
            var t = this;
            return e.on("data", function(e) {
                t.processChunk(e)
            }), e.on("end", function() {
                t.end()
            }), e.on("error", function(e) {
                t.error(e)
            }), this
        },
        pause: function() {
            return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0)
        },
        resume: function() {
            if (!this.isPaused || this.isFinished) return !1;
            this.isPaused = !1;
            var e = !1;
            return this.generatedError && (this.error(this.generatedError), e = !0), this.previous && this.previous.resume(), !e
        },
        flush: function() {},
        processChunk: function(e) {
            this.push(e)
        },
        withStreamInfo: function(e, t) {
            return this.extraStreamInfo[e] = t, this.mergeStreamInfo(), this
        },
        mergeStreamInfo: function() {
            for (var e in this.extraStreamInfo) this.extraStreamInfo.hasOwnProperty(e) && (this.streamInfo[e] = this.extraStreamInfo[e])
        },
        lock: function() {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.isLocked = !0, this.previous && this.previous.lock()
        },
        toString: function() {
            var e = "Worker " + this.name;
            return this.previous ? this.previous + " -> " + e : e
        }
    };
    var Qr = Jr,
        en = r(function(e, t) {
            for (var r = new Array(256), n = 0; n < 256; n++) r[n] = n >= 252 ? 6 : n >= 248 ? 5 : n >= 240 ? 4 : n >= 224 ? 3 : n >= 192 ? 2 : 1;
            r[254] = r[254] = 1;

            function i() {
                Qr.call(this, "utf-8 decode"), this.leftOver = null
            }

            function a() {
                Qr.call(this, "utf-8 encode")
            }
            t.utf8encode = function(e) {
                return Zt.nodebuffer ? Ht(e, "utf-8") : function(e) {
                    var t, r, n, i, a, o = e.length,
                        s = 0;
                    for (i = 0; i < o; i++) 55296 == (64512 & (r = e.charCodeAt(i))) && i + 1 < o && 56320 == (64512 & (n = e.charCodeAt(i + 1))) && (r = 65536 + (r - 55296 << 10) + (n - 56320), i++), s += r < 128 ? 1 : r < 2048 ? 2 : r < 65536 ? 3 : 4;
                    for (t = Zt.uint8array ? new Uint8Array(s) : new Array(s), a = 0, i = 0; a < s; i++) 55296 == (64512 & (r = e.charCodeAt(i))) && i + 1 < o && 56320 == (64512 & (n = e.charCodeAt(i + 1))) && (r = 65536 + (r - 55296 << 10) + (n - 56320), i++), r < 128 ? t[a++] = r : r < 2048 ? (t[a++] = 192 | r >>> 6, t[a++] = 128 | 63 & r) : r < 65536 ? (t[a++] = 224 | r >>> 12, t[a++] = 128 | r >>> 6 & 63, t[a++] = 128 | 63 & r) : (t[a++] = 240 | r >>> 18, t[a++] = 128 | r >>> 12 & 63, t[a++] = 128 | r >>> 6 & 63, t[a++] = 128 | 63 & r);
                    return t
                }(e)
            }, t.utf8decode = function(e) {
                return Zt.nodebuffer ? Gr.transformTo("nodebuffer", e).toString("utf-8") : function(e) {
                    var t, n, i, a, o = e.length,
                        s = new Array(2 * o);
                    for (n = 0, t = 0; t < o;)
                        if ((i = e[t++]) < 128) s[n++] = i;
                        else if ((a = r[i]) > 4) s[n++] = 65533, t += a - 1;
                    else {
                        for (i &= 2 === a ? 31 : 3 === a ? 15 : 7; a > 1 && t < o;) i = i << 6 | 63 & e[t++], a--;
                        a > 1 ? s[n++] = 65533 : i < 65536 ? s[n++] = i : (i -= 65536, s[n++] = 55296 | i >> 10 & 1023, s[n++] = 56320 | 1023 & i)
                    }
                    return s.length !== n && (s.subarray ? s = s.subarray(0, n) : s.length = n), Gr.applyFromCharCode(s)
                }(e = Gr.transformTo(Zt.uint8array ? "uint8array" : "array", e))
            }, Gr.inherits(i, Qr), i.prototype.processChunk = function(e) {
                var n = Gr.transformTo(Zt.uint8array ? "uint8array" : "array", e.data);
                if (this.leftOver && this.leftOver.length) {
                    if (Zt.uint8array) {
                        var i = n;
                        (n = new Uint8Array(i.length + this.leftOver.length)).set(this.leftOver, 0), n.set(i, this.leftOver.length)
                    } else n = this.leftOver.concat(n);
                    this.leftOver = null
                }
                var a = function(e, t) {
                        var n;
                        for ((t = t || e.length) > e.length && (t = e.length), n = t - 1; n >= 0 && 128 == (192 & e[n]);) n--;
                        return n < 0 ? t : 0 === n ? t : n + r[e[n]] > t ? n : t
                    }(n),
                    o = n;
                a !== n.length && (Zt.uint8array ? (o = n.subarray(0, a), this.leftOver = n.subarray(a, n.length)) : (o = n.slice(0, a), this.leftOver = n.slice(a, n.length))), this.push({
                    data: t.utf8decode(o),
                    meta: e.meta
                })
            }, i.prototype.flush = function() {
                this.leftOver && this.leftOver.length && (this.push({
                    data: t.utf8decode(this.leftOver),
                    meta: {}
                }), this.leftOver = null)
            }, t.Utf8DecodeWorker = i, Gr.inherits(a, Qr), a.prototype.processChunk = function(e) {
                this.push({
                    data: t.utf8encode(e.data),
                    meta: e.meta
                })
            }, t.Utf8EncodeWorker = a
        });
    en.utf8encode, en.utf8decode, en.Utf8DecodeWorker, en.Utf8EncodeWorker;

    function tn(e) {
        Qr.call(this, "ConvertWorker to " + e), this.destType = e
    }
    Gr.inherits(tn, Qr), tn.prototype.processChunk = function(e) {
        this.push({
            data: Gr.transformTo(this.destType, e.data),
            meta: e.meta
        })
    };
    var rn = tn,
        nn = Nt.Readable;

    function an(e, t, r) {
        nn.call(this, t), this._helper = e;
        var n = this;
        e.on("data", function(e, t) {
            n.push(e) || n._helper.pause(), r && r(t)
        }).on("error", function(e) {
            n.emit("error", e)
        }).on("end", function() {
            n.push(null)
        })
    }
    Gr.inherits(an, nn), an.prototype._read = function() {
        this._helper.resume()
    };
    var on = an,
        sn = null;
    if (Zt.nodestream) try {
        sn = on
    } catch (e) {}

    function hn(e, t) {
        return new $r.Promise(function(r, n) {
            var i = [],
                a = e._internalType,
                o = e._outputType,
                s = e._mimeType;
            e.on("data", function(e, r) {
                i.push(e), t && t(r)
            }).on("error", function(e) {
                i = [], n(e)
            }).on("end", function() {
                try {
                    var e = function(e, t, r) {
                        switch (e) {
                            case "blob":
                                return Gr.newBlob(Gr.transformTo("arraybuffer", t), r);
                            case "base64":
                                return Yt.encode(t);
                            default:
                                return Gr.transformTo(e, t)
                        }
                    }(o, function(e, t) {
                        var r, n = 0,
                            i = null,
                            a = 0;
                        for (r = 0; r < t.length; r++) a += t[r].length;
                        switch (e) {
                            case "string":
                                return t.join("");
                            case "array":
                                return Array.prototype.concat.apply([], t);
                            case "uint8array":
                                for (i = new Uint8Array(a), r = 0; r < t.length; r++) i.set(t[r], n), n += t[r].length;
                                return i;
                            case "nodebuffer":
                                return v.concat(t);
                            default:
                                throw new Error("concat : unsupported type '" + e + "'")
                        }
                    }(a, i), s);
                    r(e)
                } catch (e) {
                    n(e)
                }
                i = []
            }).resume()
        })
    }

    function un(e, t, r) {
        var n = t;
        switch (t) {
            case "blob":
            case "arraybuffer":
                n = "uint8array";
                break;
            case "base64":
                n = "string"
        }
        try {
            this._internalType = n, this._outputType = t, this._mimeType = r, Gr.checkSupport(n), this._worker = e.pipe(new rn(n)), e.lock()
        } catch (e) {
            this._worker = new Qr("error"), this._worker.error(e)
        }
    }
    un.prototype = {
        accumulate: function(e) {
            return hn(this, e)
        },
        on: function(e, t) {
            var r = this;
            return "data" === e ? this._worker.on(e, function(e) {
                t.call(r, e.data, e.meta)
            }) : this._worker.on(e, function() {
                Gr.delay(t, arguments, r)
            }), this
        },
        resume: function() {
            return Gr.delay(this._worker.resume, [], this._worker), this
        },
        pause: function() {
            return this._worker.pause(), this
        },
        toNodejsStream: function(e) {
            if (Gr.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
            return new sn(this, {
                objectMode: "nodebuffer" !== this._outputType
            }, e)
        }
    };
    var fn = un,
        ln = {
            base64: !1,
            binary: !1,
            dir: !1,
            createFolders: !0,
            date: null,
            compression: null,
            compressionOptions: null,
            comment: null,
            unixPermissions: null,
            dosPermissions: null
        };

    function cn(e) {
        Qr.call(this, "DataWorker");
        var t = this;
        this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, e.then(function(e) {
            t.dataIsReady = !0, t.data = e, t.max = e && e.length || 0, t.type = Gr.getTypeOf(e), t.isPaused || t._tickAndRepeat()
        }, function(e) {
            t.error(e)
        })
    }
    Gr.inherits(cn, Qr), cn.prototype.cleanUp = function() {
        Qr.prototype.cleanUp.call(this), this.data = null
    }, cn.prototype.resume = function() {
        return !!Qr.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, Gr.delay(this._tickAndRepeat, [], this)), !0)
    }, cn.prototype._tickAndRepeat = function() {
        this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (Gr.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0))
    }, cn.prototype._tick = function() {
        if (this.isPaused || this.isFinished) return !1;
        var e = null,
            t = Math.min(this.max, this.index + 16384);
        if (this.index >= this.max) return this.end();
        switch (this.type) {
            case "string":
                e = this.data.substring(this.index, t);
                break;
            case "uint8array":
                e = this.data.subarray(this.index, t);
                break;
            case "array":
            case "nodebuffer":
                e = this.data.slice(this.index, t)
        }
        return this.index = t, this.push({
            data: e,
            meta: {
                percent: this.max ? this.index / this.max * 100 : 0
            }
        })
    };
    var dn = cn;

    function pn(e) {
        Qr.call(this, "DataLengthProbe for " + e), this.propName = e, this.withStreamInfo(e, 0)
    }
    Gr.inherits(pn, Qr), pn.prototype.processChunk = function(e) {
        if (e) {
            var t = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = t + e.data.length
        }
        Qr.prototype.processChunk.call(this, e)
    };
    var mn = pn;
    var gn = function() {
        for (var e, t = [], r = 0; r < 256; r++) {
            e = r;
            for (var n = 0; n < 8; n++) e = 1 & e ? 3988292384 ^ e >>> 1 : e >>> 1;
            t[r] = e
        }
        return t
    }();
    var vn = function(e, t) {
        return void 0 !== e && e.length ? "string" !== Gr.getTypeOf(e) ? function(e, t, r, n) {
            var i = gn,
                a = n + r;
            e ^= -1;
            for (var o = n; o < a; o++) e = e >>> 8 ^ i[255 & (e ^ t[o])];
            return -1 ^ e
        }(0 | t, e, e.length, 0) : function(e, t, r, n) {
            var i = gn,
                a = n + r;
            e ^= -1;
            for (var o = n; o < a; o++) e = e >>> 8 ^ i[255 & (e ^ t.charCodeAt(o))];
            return -1 ^ e
        }(0 | t, e, e.length, 0) : 0
    };

    function yn() {
        Qr.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0)
    }
    Gr.inherits(yn, Qr), yn.prototype.processChunk = function(e) {
        this.streamInfo.crc32 = vn(e.data, this.streamInfo.crc32 || 0), this.push(e)
    };
    var wn = yn;

    function _n(e, t, r, n, i) {
        this.compressedSize = e, this.uncompressedSize = t, this.crc32 = r, this.compression = n, this.compressedContent = i
    }
    _n.prototype = {
        getContentWorker: function() {
            var e = new dn($r.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new mn("data_length")),
                t = this;
            return e.on("end", function() {
                if (this.streamInfo.data_length !== t.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch")
            }), e
        },
        getCompressedWorker: function() {
            return new dn($r.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression)
        }
    }, _n.createWorkerFrom = function(e, t, r) {
        return e.pipe(new wn).pipe(new mn("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new mn("compressedSize")).withStreamInfo("compression", t)
    };
    var bn = _n,
        kn = function(e, t, r) {
            this.name = e, this.dir = r.dir, this.date = r.date, this.comment = r.comment, this.unixPermissions = r.unixPermissions, this.dosPermissions = r.dosPermissions, this._data = t, this._dataBinary = r.binary, this.options = {
                compression: r.compression,
                compressionOptions: r.compressionOptions
            }
        };
    kn.prototype = {
        internalStream: function(e) {
            var t = null,
                r = "string";
            try {
                if (!e) throw new Error("No output type specified.");
                var n = "string" === (r = e.toLowerCase()) || "text" === r;
                "binarystring" !== r && "text" !== r || (r = "string"), t = this._decompressWorker();
                var i = !this._dataBinary;
                i && !n && (t = t.pipe(new en.Utf8EncodeWorker)), !i && n && (t = t.pipe(new en.Utf8DecodeWorker))
            } catch (e) {
                (t = new Qr("error")).error(e)
            }
            return new fn(t, r, "")
        },
        async: function(e, t) {
            return this.internalStream(e).accumulate(t)
        },
        nodeStream: function(e, t) {
            return this.internalStream(e || "nodebuffer").toNodejsStream(t)
        },
        _compressWorker: function(e, t) {
            if (this._data instanceof bn && this._data.compression.magic === e.magic) return this._data.getCompressedWorker();
            var r = this._decompressWorker();
            return this._dataBinary || (r = r.pipe(new en.Utf8EncodeWorker)), bn.createWorkerFrom(r, e, t)
        },
        _decompressWorker: function() {
            return this._data instanceof bn ? this._data.getContentWorker() : this._data instanceof Qr ? this._data : new dn(this._data)
        }
    };
    for (var xn = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], Sn = function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")
        }, En = 0; En < xn.length; En++) kn.prototype[xn[En]] = Sn;
    var An = kn,
        Cn = r(function(e, t) {
            var r = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;

            function n(e, t) {
                return Object.prototype.hasOwnProperty.call(e, t)
            }
            t.assign = function(e) {
                for (var t = Array.prototype.slice.call(arguments, 1); t.length;) {
                    var r = t.shift();
                    if (r) {
                        if ("object" != typeof r) throw new TypeError(r + "must be non-object");
                        for (var i in r) n(r, i) && (e[i] = r[i])
                    }
                }
                return e
            }, t.shrinkBuf = function(e, t) {
                return e.length === t ? e : e.subarray ? e.subarray(0, t) : (e.length = t, e)
            };
            var i = {
                    arraySet: function(e, t, r, n, i) {
                        if (t.subarray && e.subarray) e.set(t.subarray(r, r + n), i);
                        else
                            for (var a = 0; a < n; a++) e[i + a] = t[r + a]
                    },
                    flattenChunks: function(e) {
                        var t, r, n, i, a, o;
                        for (n = 0, t = 0, r = e.length; t < r; t++) n += e[t].length;
                        for (o = new Uint8Array(n), i = 0, t = 0, r = e.length; t < r; t++) a = e[t], o.set(a, i), i += a.length;
                        return o
                    }
                },
                a = {
                    arraySet: function(e, t, r, n, i) {
                        for (var a = 0; a < n; a++) e[i + a] = t[r + a]
                    },
                    flattenChunks: function(e) {
                        return [].concat.apply([], e)
                    }
                };
            t.setTyped = function(e) {
                e ? (t.Buf8 = Uint8Array, t.Buf16 = Uint16Array, t.Buf32 = Int32Array, t.assign(t, i)) : (t.Buf8 = Array, t.Buf16 = Array, t.Buf32 = Array, t.assign(t, a))
            }, t.setTyped(r)
        }),
        Rn = (Cn.assign, Cn.shrinkBuf, Cn.setTyped, Cn.Buf8, Cn.Buf16, Cn.Buf32, 4),
        zn = 0,
        Tn = 1,
        Bn = 2;

    function On(e) {
        for (var t = e.length; --t >= 0;) e[t] = 0
    }
    var In = 0,
        Ln = 1,
        Pn = 2,
        Un = 29,
        Dn = 256,
        Mn = Dn + 1 + Un,
        jn = 30,
        Fn = 19,
        Nn = 2 * Mn + 1,
        Zn = 15,
        Wn = 16,
        Yn = 7,
        qn = 256,
        Hn = 16,
        Kn = 17,
        Xn = 18,
        Vn = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0],
        $n = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
        Gn = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7],
        Jn = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
        Qn = new Array(2 * (Mn + 2));
    On(Qn);
    var ei = new Array(2 * jn);
    On(ei);
    var ti = new Array(512);
    On(ti);
    var ri = new Array(256);
    On(ri);
    var ni = new Array(Un);
    On(ni);
    var ii, ai, oi, si = new Array(jn);

    function hi(e, t, r, n, i) {
        this.static_tree = e, this.extra_bits = t, this.extra_base = r, this.elems = n, this.max_length = i, this.has_stree = e && e.length
    }

    function ui(e, t) {
        this.dyn_tree = e, this.max_code = 0, this.stat_desc = t
    }

    function fi(e) {
        return e < 256 ? ti[e] : ti[256 + (e >>> 7)]
    }

    function li(e, t) {
        e.pending_buf[e.pending++] = 255 & t, e.pending_buf[e.pending++] = t >>> 8 & 255
    }

    function ci(e, t, r) {
        e.bi_valid > Wn - r ? (e.bi_buf |= t << e.bi_valid & 65535, li(e, e.bi_buf), e.bi_buf = t >> Wn - e.bi_valid, e.bi_valid += r - Wn) : (e.bi_buf |= t << e.bi_valid & 65535, e.bi_valid += r)
    }

    function di(e, t, r) {
        ci(e, r[2 * t], r[2 * t + 1])
    }

    function pi(e, t) {
        var r = 0;
        do {
            r |= 1 & e, e >>>= 1, r <<= 1
        } while (--t > 0);
        return r >>> 1
    }

    function mi(e, t, r) {
        var n, i, a = new Array(Zn + 1),
            o = 0;
        for (n = 1; n <= Zn; n++) a[n] = o = o + r[n - 1] << 1;
        for (i = 0; i <= t; i++) {
            var s = e[2 * i + 1];
            0 !== s && (e[2 * i] = pi(a[s]++, s))
        }
    }

    function gi(e) {
        var t;
        for (t = 0; t < Mn; t++) e.dyn_ltree[2 * t] = 0;
        for (t = 0; t < jn; t++) e.dyn_dtree[2 * t] = 0;
        for (t = 0; t < Fn; t++) e.bl_tree[2 * t] = 0;
        e.dyn_ltree[2 * qn] = 1, e.opt_len = e.static_len = 0, e.last_lit = e.matches = 0
    }

    function vi(e) {
        e.bi_valid > 8 ? li(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0
    }

    function yi(e, t, r, n) {
        var i = 2 * t,
            a = 2 * r;
        return e[i] < e[a] || e[i] === e[a] && n[t] <= n[r]
    }

    function wi(e, t, r) {
        for (var n = e.heap[r], i = r << 1; i <= e.heap_len && (i < e.heap_len && yi(t, e.heap[i + 1], e.heap[i], e.depth) && i++, !yi(t, n, e.heap[i], e.depth));) e.heap[r] = e.heap[i], r = i, i <<= 1;
        e.heap[r] = n
    }

    function _i(e, t, r) {
        var n, i, a, o, s = 0;
        if (0 !== e.last_lit)
            do {
                n = e.pending_buf[e.d_buf + 2 * s] << 8 | e.pending_buf[e.d_buf + 2 * s + 1], i = e.pending_buf[e.l_buf + s], s++, 0 === n ? di(e, i, t) : (di(e, (a = ri[i]) + Dn + 1, t), 0 !== (o = Vn[a]) && ci(e, i -= ni[a], o), di(e, a = fi(--n), r), 0 !== (o = $n[a]) && ci(e, n -= si[a], o))
            } while (s < e.last_lit);
        di(e, qn, t)
    }

    function bi(e, t) {
        var r, n, i, a = t.dyn_tree,
            o = t.stat_desc.static_tree,
            s = t.stat_desc.has_stree,
            h = t.stat_desc.elems,
            u = -1;
        for (e.heap_len = 0, e.heap_max = Nn, r = 0; r < h; r++) 0 !== a[2 * r] ? (e.heap[++e.heap_len] = u = r, e.depth[r] = 0) : a[2 * r + 1] = 0;
        for (; e.heap_len < 2;) a[2 * (i = e.heap[++e.heap_len] = u < 2 ? ++u : 0)] = 1, e.depth[i] = 0, e.opt_len--, s && (e.static_len -= o[2 * i + 1]);
        for (t.max_code = u, r = e.heap_len >> 1; r >= 1; r--) wi(e, a, r);
        i = h;
        do {
            r = e.heap[1], e.heap[1] = e.heap[e.heap_len--], wi(e, a, 1), n = e.heap[1], e.heap[--e.heap_max] = r, e.heap[--e.heap_max] = n, a[2 * i] = a[2 * r] + a[2 * n], e.depth[i] = (e.depth[r] >= e.depth[n] ? e.depth[r] : e.depth[n]) + 1, a[2 * r + 1] = a[2 * n + 1] = i, e.heap[1] = i++, wi(e, a, 1)
        } while (e.heap_len >= 2);
        e.heap[--e.heap_max] = e.heap[1],
            function(e, t) {
                var r, n, i, a, o, s, h = t.dyn_tree,
                    u = t.max_code,
                    f = t.stat_desc.static_tree,
                    l = t.stat_desc.has_stree,
                    c = t.stat_desc.extra_bits,
                    d = t.stat_desc.extra_base,
                    p = t.stat_desc.max_length,
                    m = 0;
                for (a = 0; a <= Zn; a++) e.bl_count[a] = 0;
                for (h[2 * e.heap[e.heap_max] + 1] = 0, r = e.heap_max + 1; r < Nn; r++)(a = h[2 * h[2 * (n = e.heap[r]) + 1] + 1] + 1) > p && (a = p, m++), h[2 * n + 1] = a, n > u || (e.bl_count[a]++, o = 0, n >= d && (o = c[n - d]), s = h[2 * n], e.opt_len += s * (a + o), l && (e.static_len += s * (f[2 * n + 1] + o)));
                if (0 !== m) {
                    do {
                        for (a = p - 1; 0 === e.bl_count[a];) a--;
                        e.bl_count[a]--, e.bl_count[a + 1] += 2, e.bl_count[p]--, m -= 2
                    } while (m > 0);
                    for (a = p; 0 !== a; a--)
                        for (n = e.bl_count[a]; 0 !== n;)(i = e.heap[--r]) > u || (h[2 * i + 1] !== a && (e.opt_len += (a - h[2 * i + 1]) * h[2 * i], h[2 * i + 1] = a), n--)
                }
            }(e, t), mi(a, u, e.bl_count)
    }

    function ki(e, t, r) {
        var n, i, a = -1,
            o = t[1],
            s = 0,
            h = 7,
            u = 4;
        for (0 === o && (h = 138, u = 3), t[2 * (r + 1) + 1] = 65535, n = 0; n <= r; n++) i = o, o = t[2 * (n + 1) + 1], ++s < h && i === o || (s < u ? e.bl_tree[2 * i] += s : 0 !== i ? (i !== a && e.bl_tree[2 * i]++, e.bl_tree[2 * Hn]++) : s <= 10 ? e.bl_tree[2 * Kn]++ : e.bl_tree[2 * Xn]++, s = 0, a = i, 0 === o ? (h = 138, u = 3) : i === o ? (h = 6, u = 3) : (h = 7, u = 4))
    }

    function xi(e, t, r) {
        var n, i, a = -1,
            o = t[1],
            s = 0,
            h = 7,
            u = 4;
        for (0 === o && (h = 138, u = 3), n = 0; n <= r; n++)
            if (i = o, o = t[2 * (n + 1) + 1], !(++s < h && i === o)) {
                if (s < u)
                    do {
                        di(e, i, e.bl_tree)
                    } while (0 != --s);
                else 0 !== i ? (i !== a && (di(e, i, e.bl_tree), s--), di(e, Hn, e.bl_tree), ci(e, s - 3, 2)) : s <= 10 ? (di(e, Kn, e.bl_tree), ci(e, s - 3, 3)) : (di(e, Xn, e.bl_tree), ci(e, s - 11, 7));
                s = 0, a = i, 0 === o ? (h = 138, u = 3) : i === o ? (h = 6, u = 3) : (h = 7, u = 4)
            }
    }
    On(si);
    var Si = !1;

    function Ei(e, t, r, n) {
        ci(e, (In << 1) + (n ? 1 : 0), 3),
            function(e, t, r, n) {
                vi(e), n && (li(e, r), li(e, ~r)), Cn.arraySet(e.pending_buf, e.window, t, r, e.pending), e.pending += r
            }(e, t, r, !0)
    }
    var Ai = {
        _tr_init: function(e) {
            Si || (function() {
                var e, t, r, n, i, a = new Array(Zn + 1);
                for (r = 0, n = 0; n < Un - 1; n++)
                    for (ni[n] = r, e = 0; e < 1 << Vn[n]; e++) ri[r++] = n;
                for (ri[r - 1] = n, i = 0, n = 0; n < 16; n++)
                    for (si[n] = i, e = 0; e < 1 << $n[n]; e++) ti[i++] = n;
                for (i >>= 7; n < jn; n++)
                    for (si[n] = i << 7, e = 0; e < 1 << $n[n] - 7; e++) ti[256 + i++] = n;
                for (t = 0; t <= Zn; t++) a[t] = 0;
                for (e = 0; e <= 143;) Qn[2 * e + 1] = 8, e++, a[8]++;
                for (; e <= 255;) Qn[2 * e + 1] = 9, e++, a[9]++;
                for (; e <= 279;) Qn[2 * e + 1] = 7, e++, a[7]++;
                for (; e <= 287;) Qn[2 * e + 1] = 8, e++, a[8]++;
                for (mi(Qn, Mn + 1, a), e = 0; e < jn; e++) ei[2 * e + 1] = 5, ei[2 * e] = pi(e, 5);
                ii = new hi(Qn, Vn, Dn + 1, Mn, Zn), ai = new hi(ei, $n, 0, jn, Zn), oi = new hi(new Array(0), Gn, 0, Fn, Yn)
            }(), Si = !0), e.l_desc = new ui(e.dyn_ltree, ii), e.d_desc = new ui(e.dyn_dtree, ai), e.bl_desc = new ui(e.bl_tree, oi), e.bi_buf = 0, e.bi_valid = 0, gi(e)
        },
        _tr_stored_block: Ei,
        _tr_flush_block: function(e, t, r, n) {
            var i, a, o = 0;
            e.level > 0 ? (e.strm.data_type === Bn && (e.strm.data_type = function(e) {
                var t, r = 4093624447;
                for (t = 0; t <= 31; t++, r >>>= 1)
                    if (1 & r && 0 !== e.dyn_ltree[2 * t]) return zn;
                if (0 !== e.dyn_ltree[18] || 0 !== e.dyn_ltree[20] || 0 !== e.dyn_ltree[26]) return Tn;
                for (t = 32; t < Dn; t++)
                    if (0 !== e.dyn_ltree[2 * t]) return Tn;
                return zn
            }(e)), bi(e, e.l_desc), bi(e, e.d_desc), o = function(e) {
                var t;
                for (ki(e, e.dyn_ltree, e.l_desc.max_code), ki(e, e.dyn_dtree, e.d_desc.max_code), bi(e, e.bl_desc), t = Fn - 1; t >= 3 && 0 === e.bl_tree[2 * Jn[t] + 1]; t--);
                return e.opt_len += 3 * (t + 1) + 5 + 5 + 4, t
            }(e), i = e.opt_len + 3 + 7 >>> 3, (a = e.static_len + 3 + 7 >>> 3) <= i && (i = a)) : i = a = r + 5, r + 4 <= i && -1 !== t ? Ei(e, t, r, n) : e.strategy === Rn || a === i ? (ci(e, (Ln << 1) + (n ? 1 : 0), 3), _i(e, Qn, ei)) : (ci(e, (Pn << 1) + (n ? 1 : 0), 3), function(e, t, r, n) {
                var i;
                for (ci(e, t - 257, 5), ci(e, r - 1, 5), ci(e, n - 4, 4), i = 0; i < n; i++) ci(e, e.bl_tree[2 * Jn[i] + 1], 3);
                xi(e, e.dyn_ltree, t - 1), xi(e, e.dyn_dtree, r - 1)
            }(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, o + 1), _i(e, e.dyn_ltree, e.dyn_dtree)), gi(e), n && vi(e)
        },
        _tr_tally: function(e, t, r) {
            return e.pending_buf[e.d_buf + 2 * e.last_lit] = t >>> 8 & 255, e.pending_buf[e.d_buf + 2 * e.last_lit + 1] = 255 & t, e.pending_buf[e.l_buf + e.last_lit] = 255 & r, e.last_lit++, 0 === t ? e.dyn_ltree[2 * r]++ : (e.matches++, t--, e.dyn_ltree[2 * (ri[r] + Dn + 1)]++, e.dyn_dtree[2 * fi(t)]++), e.last_lit === e.lit_bufsize - 1
        },
        _tr_align: function(e) {
            ci(e, Ln << 1, 3), di(e, qn, Qn),
                function(e) {
                    16 === e.bi_valid ? (li(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = 255 & e.bi_buf, e.bi_buf >>= 8, e.bi_valid -= 8)
                }(e)
        }
    };
    var Ci = function(e, t, r, n) {
        for (var i = 65535 & e | 0, a = e >>> 16 & 65535 | 0, o = 0; 0 !== r;) {
            r -= o = r > 2e3 ? 2e3 : r;
            do {
                a = a + (i = i + t[n++] | 0) | 0
            } while (--o);
            i %= 65521, a %= 65521
        }
        return i | a << 16 | 0
    };
    var Ri = function() {
        for (var e, t = [], r = 0; r < 256; r++) {
            e = r;
            for (var n = 0; n < 8; n++) e = 1 & e ? 3988292384 ^ e >>> 1 : e >>> 1;
            t[r] = e
        }
        return t
    }();
    var zi, Ti = function(e, t, r, n) {
            var i = Ri,
                a = n + r;
            e ^= -1;
            for (var o = n; o < a; o++) e = e >>> 8 ^ i[255 & (e ^ t[o])];
            return -1 ^ e
        },
        Bi = {
            2: "need dictionary",
            1: "stream end",
            0: "",
            "-1": "file error",
            "-2": "stream error",
            "-3": "data error",
            "-4": "insufficient memory",
            "-5": "buffer error",
            "-6": "incompatible version"
        },
        Oi = 0,
        Ii = 1,
        Li = 3,
        Pi = 4,
        Ui = 5,
        Di = 0,
        Mi = 1,
        ji = -2,
        Fi = -3,
        Ni = -5,
        Zi = -1,
        Wi = 1,
        Yi = 2,
        qi = 3,
        Hi = 4,
        Ki = 0,
        Xi = 2,
        Vi = 8,
        $i = 9,
        Gi = 15,
        Ji = 8,
        Qi = 286,
        ea = 30,
        ta = 19,
        ra = 2 * Qi + 1,
        na = 15,
        ia = 3,
        aa = 258,
        oa = aa + ia + 1,
        sa = 32,
        ha = 42,
        ua = 69,
        fa = 73,
        la = 91,
        ca = 103,
        da = 113,
        pa = 666,
        ma = 1,
        ga = 2,
        va = 3,
        ya = 4,
        wa = 3;

    function _a(e, t) {
        return e.msg = Bi[t], t
    }

    function ba(e) {
        return (e << 1) - (e > 4 ? 9 : 0)
    }

    function ka(e) {
        for (var t = e.length; --t >= 0;) e[t] = 0
    }

    function xa(e) {
        var t = e.state,
            r = t.pending;
        r > e.avail_out && (r = e.avail_out), 0 !== r && (Cn.arraySet(e.output, t.pending_buf, t.pending_out, r, e.next_out), e.next_out += r, t.pending_out += r, e.total_out += r, e.avail_out -= r, t.pending -= r, 0 === t.pending && (t.pending_out = 0))
    }

    function Sa(e, t) {
        Ai._tr_flush_block(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, t), e.block_start = e.strstart, xa(e.strm)
    }

    function Ea(e, t) {
        e.pending_buf[e.pending++] = t
    }

    function Aa(e, t) {
        e.pending_buf[e.pending++] = t >>> 8 & 255, e.pending_buf[e.pending++] = 255 & t
    }

    function Ca(e, t) {
        var r, n, i = e.max_chain_length,
            a = e.strstart,
            o = e.prev_length,
            s = e.nice_match,
            h = e.strstart > e.w_size - oa ? e.strstart - (e.w_size - oa) : 0,
            u = e.window,
            f = e.w_mask,
            l = e.prev,
            c = e.strstart + aa,
            d = u[a + o - 1],
            p = u[a + o];
        e.prev_length >= e.good_match && (i >>= 2), s > e.lookahead && (s = e.lookahead);
        do {
            if (u[(r = t) + o] === p && u[r + o - 1] === d && u[r] === u[a] && u[++r] === u[a + 1]) {
                a += 2, r++;
                do {} while (u[++a] === u[++r] && u[++a] === u[++r] && u[++a] === u[++r] && u[++a] === u[++r] && u[++a] === u[++r] && u[++a] === u[++r] && u[++a] === u[++r] && u[++a] === u[++r] && a < c);
                if (n = aa - (c - a), a = c - aa, n > o) {
                    if (e.match_start = t, o = n, n >= s) break;
                    d = u[a + o - 1], p = u[a + o]
                }
            }
        } while ((t = l[t & f]) > h && 0 != --i);
        return o <= e.lookahead ? o : e.lookahead
    }

    function Ra(e) {
        var t, r, n, i, a, o, s, h, u, f, l = e.w_size;
        do {
            if (i = e.window_size - e.lookahead - e.strstart, e.strstart >= l + (l - oa)) {
                Cn.arraySet(e.window, e.window, l, l, 0), e.match_start -= l, e.strstart -= l, e.block_start -= l, t = r = e.hash_size;
                do {
                    n = e.head[--t], e.head[t] = n >= l ? n - l : 0
                } while (--r);
                t = r = l;
                do {
                    n = e.prev[--t], e.prev[t] = n >= l ? n - l : 0
                } while (--r);
                i += l
            }
            if (0 === e.strm.avail_in) break;
            if (o = e.strm, s = e.window, h = e.strstart + e.lookahead, u = i, f = void 0, (f = o.avail_in) > u && (f = u), r = 0 === f ? 0 : (o.avail_in -= f, Cn.arraySet(s, o.input, o.next_in, f, h), 1 === o.state.wrap ? o.adler = Ci(o.adler, s, f, h) : 2 === o.state.wrap && (o.adler = Ti(o.adler, s, f, h)), o.next_in += f, o.total_in += f, f), e.lookahead += r, e.lookahead + e.insert >= ia)
                for (a = e.strstart - e.insert, e.ins_h = e.window[a], e.ins_h = (e.ins_h << e.hash_shift ^ e.window[a + 1]) & e.hash_mask; e.insert && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[a + ia - 1]) & e.hash_mask, e.prev[a & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = a, a++, e.insert--, !(e.lookahead + e.insert < ia)););
        } while (e.lookahead < oa && 0 !== e.strm.avail_in)
    }

    function za(e, t) {
        for (var r, n;;) {
            if (e.lookahead < oa) {
                if (Ra(e), e.lookahead < oa && t === Oi) return ma;
                if (0 === e.lookahead) break
            }
            if (r = 0, e.lookahead >= ia && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + ia - 1]) & e.hash_mask, r = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), 0 !== r && e.strstart - r <= e.w_size - oa && (e.match_length = Ca(e, r)), e.match_length >= ia)
                if (n = Ai._tr_tally(e, e.strstart - e.match_start, e.match_length - ia), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= ia) {
                    e.match_length--;
                    do {
                        e.strstart++, e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + ia - 1]) & e.hash_mask, r = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart
                    } while (0 != --e.match_length);
                    e.strstart++
                } else e.strstart += e.match_length, e.match_length = 0, e.ins_h = e.window[e.strstart], e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + 1]) & e.hash_mask;
            else n = Ai._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
            if (n && (Sa(e, !1), 0 === e.strm.avail_out)) return ma
        }
        return e.insert = e.strstart < ia - 1 ? e.strstart : ia - 1, t === Pi ? (Sa(e, !0), 0 === e.strm.avail_out ? va : ya) : e.last_lit && (Sa(e, !1), 0 === e.strm.avail_out) ? ma : ga
    }

    function Ta(e, t) {
        for (var r, n, i;;) {
            if (e.lookahead < oa) {
                if (Ra(e), e.lookahead < oa && t === Oi) return ma;
                if (0 === e.lookahead) break
            }
            if (r = 0, e.lookahead >= ia && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + ia - 1]) & e.hash_mask, r = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = ia - 1, 0 !== r && e.prev_length < e.max_lazy_match && e.strstart - r <= e.w_size - oa && (e.match_length = Ca(e, r), e.match_length <= 5 && (e.strategy === Wi || e.match_length === ia && e.strstart - e.match_start > 4096) && (e.match_length = ia - 1)), e.prev_length >= ia && e.match_length <= e.prev_length) {
                i = e.strstart + e.lookahead - ia, n = Ai._tr_tally(e, e.strstart - 1 - e.prev_match, e.prev_length - ia), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
                do {
                    ++e.strstart <= i && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + ia - 1]) & e.hash_mask, r = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart)
                } while (0 != --e.prev_length);
                if (e.match_available = 0, e.match_length = ia - 1, e.strstart++, n && (Sa(e, !1), 0 === e.strm.avail_out)) return ma
            } else if (e.match_available) {
                if ((n = Ai._tr_tally(e, 0, e.window[e.strstart - 1])) && Sa(e, !1), e.strstart++, e.lookahead--, 0 === e.strm.avail_out) return ma
            } else e.match_available = 1, e.strstart++, e.lookahead--
        }
        return e.match_available && (n = Ai._tr_tally(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < ia - 1 ? e.strstart : ia - 1, t === Pi ? (Sa(e, !0), 0 === e.strm.avail_out ? va : ya) : e.last_lit && (Sa(e, !1), 0 === e.strm.avail_out) ? ma : ga
    }

    function Ba(e, t, r, n, i) {
        this.good_length = e, this.max_lazy = t, this.nice_length = r, this.max_chain = n, this.func = i
    }

    function Oa(e) {
        var t;
        return e && e.state ? (e.total_in = e.total_out = 0, e.data_type = Xi, (t = e.state).pending = 0, t.pending_out = 0, t.wrap < 0 && (t.wrap = -t.wrap), t.status = t.wrap ? ha : da, e.adler = 2 === t.wrap ? 0 : 1, t.last_flush = Oi, Ai._tr_init(t), Di) : _a(e, ji)
    }

    function Ia(e) {
        var t, r = Oa(e);
        return r === Di && ((t = e.state).window_size = 2 * t.w_size, ka(t.head), t.max_lazy_match = zi[t.level].max_lazy, t.good_match = zi[t.level].good_length, t.nice_match = zi[t.level].nice_length, t.max_chain_length = zi[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = ia - 1, t.match_available = 0, t.ins_h = 0), r
    }

    function La(e, t, r, n, i, a) {
        if (!e) return ji;
        var o = 1;
        if (t === Zi && (t = 6), n < 0 ? (o = 0, n = -n) : n > 15 && (o = 2, n -= 16), i < 1 || i > $i || r !== Vi || n < 8 || n > 15 || t < 0 || t > 9 || a < 0 || a > Hi) return _a(e, ji);
        8 === n && (n = 9);
        var s = new function() {
            this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Vi, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Cn.Buf16(2 * ra), this.dyn_dtree = new Cn.Buf16(2 * (2 * ea + 1)), this.bl_tree = new Cn.Buf16(2 * (2 * ta + 1)), ka(this.dyn_ltree), ka(this.dyn_dtree), ka(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Cn.Buf16(na + 1), this.heap = new Cn.Buf16(2 * Qi + 1), ka(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Cn.Buf16(2 * Qi + 1), ka(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0
        };
        return e.state = s, s.strm = e, s.wrap = o, s.gzhead = null, s.w_bits = n, s.w_size = 1 << s.w_bits, s.w_mask = s.w_size - 1, s.hash_bits = i + 7, s.hash_size = 1 << s.hash_bits, s.hash_mask = s.hash_size - 1, s.hash_shift = ~~((s.hash_bits + ia - 1) / ia), s.window = new Cn.Buf8(2 * s.w_size), s.head = new Cn.Buf16(s.hash_size), s.prev = new Cn.Buf16(s.w_size), s.lit_bufsize = 1 << i + 6, s.pending_buf_size = 4 * s.lit_bufsize, s.pending_buf = new Cn.Buf8(s.pending_buf_size), s.d_buf = 1 * s.lit_bufsize, s.l_buf = 3 * s.lit_bufsize, s.level = t, s.strategy = a, s.method = r, Ia(e)
    }
    zi = [new Ba(0, 0, 0, 0, function(e, t) {
        var r = 65535;
        for (r > e.pending_buf_size - 5 && (r = e.pending_buf_size - 5);;) {
            if (e.lookahead <= 1) {
                if (Ra(e), 0 === e.lookahead && t === Oi) return ma;
                if (0 === e.lookahead) break
            }
            e.strstart += e.lookahead, e.lookahead = 0;
            var n = e.block_start + r;
            if ((0 === e.strstart || e.strstart >= n) && (e.lookahead = e.strstart - n, e.strstart = n, Sa(e, !1), 0 === e.strm.avail_out)) return ma;
            if (e.strstart - e.block_start >= e.w_size - oa && (Sa(e, !1), 0 === e.strm.avail_out)) return ma
        }
        return e.insert = 0, t === Pi ? (Sa(e, !0), 0 === e.strm.avail_out ? va : ya) : (e.strstart > e.block_start && (Sa(e, !1), e.strm.avail_out), ma)
    }), new Ba(4, 4, 8, 4, za), new Ba(4, 5, 16, 8, za), new Ba(4, 6, 32, 32, za), new Ba(4, 4, 16, 16, Ta), new Ba(8, 16, 32, 32, Ta), new Ba(8, 16, 128, 128, Ta), new Ba(8, 32, 128, 256, Ta), new Ba(32, 128, 258, 1024, Ta), new Ba(32, 258, 258, 4096, Ta)];
    var Pa = {
            deflateInit: function(e, t) {
                return La(e, t, Vi, Gi, Ji, Ki)
            },
            deflateInit2: La,
            deflateReset: Ia,
            deflateResetKeep: Oa,
            deflateSetHeader: function(e, t) {
                return e && e.state ? 2 !== e.state.wrap ? ji : (e.state.gzhead = t, Di) : ji
            },
            deflate: function(e, t) {
                var r, n, i, a;
                if (!e || !e.state || t > Ui || t < 0) return e ? _a(e, ji) : ji;
                if (n = e.state, !e.output || !e.input && 0 !== e.avail_in || n.status === pa && t !== Pi) return _a(e, 0 === e.avail_out ? Ni : ji);
                if (n.strm = e, r = n.last_flush, n.last_flush = t, n.status === ha)
                    if (2 === n.wrap) e.adler = 0, Ea(n, 31), Ea(n, 139), Ea(n, 8), n.gzhead ? (Ea(n, (n.gzhead.text ? 1 : 0) + (n.gzhead.hcrc ? 2 : 0) + (n.gzhead.extra ? 4 : 0) + (n.gzhead.name ? 8 : 0) + (n.gzhead.comment ? 16 : 0)), Ea(n, 255 & n.gzhead.time), Ea(n, n.gzhead.time >> 8 & 255), Ea(n, n.gzhead.time >> 16 & 255), Ea(n, n.gzhead.time >> 24 & 255), Ea(n, 9 === n.level ? 2 : n.strategy >= Yi || n.level < 2 ? 4 : 0), Ea(n, 255 & n.gzhead.os), n.gzhead.extra && n.gzhead.extra.length && (Ea(n, 255 & n.gzhead.extra.length), Ea(n, n.gzhead.extra.length >> 8 & 255)), n.gzhead.hcrc && (e.adler = Ti(e.adler, n.pending_buf, n.pending, 0)), n.gzindex = 0, n.status = ua) : (Ea(n, 0), Ea(n, 0), Ea(n, 0), Ea(n, 0), Ea(n, 0), Ea(n, 9 === n.level ? 2 : n.strategy >= Yi || n.level < 2 ? 4 : 0), Ea(n, wa), n.status = da);
                    else {
                        var o = Vi + (n.w_bits - 8 << 4) << 8;
                        o |= (n.strategy >= Yi || n.level < 2 ? 0 : n.level < 6 ? 1 : 6 === n.level ? 2 : 3) << 6, 0 !== n.strstart && (o |= sa), o += 31 - o % 31, n.status = da, Aa(n, o), 0 !== n.strstart && (Aa(n, e.adler >>> 16), Aa(n, 65535 & e.adler)), e.adler = 1
                    }
                if (n.status === ua)
                    if (n.gzhead.extra) {
                        for (i = n.pending; n.gzindex < (65535 & n.gzhead.extra.length) && (n.pending !== n.pending_buf_size || (n.gzhead.hcrc && n.pending > i && (e.adler = Ti(e.adler, n.pending_buf, n.pending - i, i)), xa(e), i = n.pending, n.pending !== n.pending_buf_size));) Ea(n, 255 & n.gzhead.extra[n.gzindex]), n.gzindex++;
                        n.gzhead.hcrc && n.pending > i && (e.adler = Ti(e.adler, n.pending_buf, n.pending - i, i)), n.gzindex === n.gzhead.extra.length && (n.gzindex = 0, n.status = fa)
                    } else n.status = fa;
                if (n.status === fa)
                    if (n.gzhead.name) {
                        i = n.pending;
                        do {
                            if (n.pending === n.pending_buf_size && (n.gzhead.hcrc && n.pending > i && (e.adler = Ti(e.adler, n.pending_buf, n.pending - i, i)), xa(e), i = n.pending, n.pending === n.pending_buf_size)) {
                                a = 1;
                                break
                            }
                            a = n.gzindex < n.gzhead.name.length ? 255 & n.gzhead.name.charCodeAt(n.gzindex++) : 0, Ea(n, a)
                        } while (0 !== a);
                        n.gzhead.hcrc && n.pending > i && (e.adler = Ti(e.adler, n.pending_buf, n.pending - i, i)), 0 === a && (n.gzindex = 0, n.status = la)
                    } else n.status = la;
                if (n.status === la)
                    if (n.gzhead.comment) {
                        i = n.pending;
                        do {
                            if (n.pending === n.pending_buf_size && (n.gzhead.hcrc && n.pending > i && (e.adler = Ti(e.adler, n.pending_buf, n.pending - i, i)), xa(e), i = n.pending, n.pending === n.pending_buf_size)) {
                                a = 1;
                                break
                            }
                            a = n.gzindex < n.gzhead.comment.length ? 255 & n.gzhead.comment.charCodeAt(n.gzindex++) : 0, Ea(n, a)
                        } while (0 !== a);
                        n.gzhead.hcrc && n.pending > i && (e.adler = Ti(e.adler, n.pending_buf, n.pending - i, i)), 0 === a && (n.status = ca)
                    } else n.status = ca;
                if (n.status === ca && (n.gzhead.hcrc ? (n.pending + 2 > n.pending_buf_size && xa(e), n.pending + 2 <= n.pending_buf_size && (Ea(n, 255 & e.adler), Ea(n, e.adler >> 8 & 255), e.adler = 0, n.status = da)) : n.status = da), 0 !== n.pending) {
                    if (xa(e), 0 === e.avail_out) return n.last_flush = -1, Di
                } else if (0 === e.avail_in && ba(t) <= ba(r) && t !== Pi) return _a(e, Ni);
                if (n.status === pa && 0 !== e.avail_in) return _a(e, Ni);
                if (0 !== e.avail_in || 0 !== n.lookahead || t !== Oi && n.status !== pa) {
                    var s = n.strategy === Yi ? function(e, t) {
                        for (var r;;) {
                            if (0 === e.lookahead && (Ra(e), 0 === e.lookahead)) {
                                if (t === Oi) return ma;
                                break
                            }
                            if (e.match_length = 0, r = Ai._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, r && (Sa(e, !1), 0 === e.strm.avail_out)) return ma
                        }
                        return e.insert = 0, t === Pi ? (Sa(e, !0), 0 === e.strm.avail_out ? va : ya) : e.last_lit && (Sa(e, !1), 0 === e.strm.avail_out) ? ma : ga
                    }(n, t) : n.strategy === qi ? function(e, t) {
                        for (var r, n, i, a, o = e.window;;) {
                            if (e.lookahead <= aa) {
                                if (Ra(e), e.lookahead <= aa && t === Oi) return ma;
                                if (0 === e.lookahead) break
                            }
                            if (e.match_length = 0, e.lookahead >= ia && e.strstart > 0 && (n = o[i = e.strstart - 1]) === o[++i] && n === o[++i] && n === o[++i]) {
                                a = e.strstart + aa;
                                do {} while (n === o[++i] && n === o[++i] && n === o[++i] && n === o[++i] && n === o[++i] && n === o[++i] && n === o[++i] && n === o[++i] && i < a);
                                e.match_length = aa - (a - i), e.match_length > e.lookahead && (e.match_length = e.lookahead)
                            }
                            if (e.match_length >= ia ? (r = Ai._tr_tally(e, 1, e.match_length - ia), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (r = Ai._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), r && (Sa(e, !1), 0 === e.strm.avail_out)) return ma
                        }
                        return e.insert = 0, t === Pi ? (Sa(e, !0), 0 === e.strm.avail_out ? va : ya) : e.last_lit && (Sa(e, !1), 0 === e.strm.avail_out) ? ma : ga
                    }(n, t) : zi[n.level].func(n, t);
                    if (s !== va && s !== ya || (n.status = pa), s === ma || s === va) return 0 === e.avail_out && (n.last_flush = -1), Di;
                    if (s === ga && (t === Ii ? Ai._tr_align(n) : t !== Ui && (Ai._tr_stored_block(n, 0, 0, !1), t === Li && (ka(n.head), 0 === n.lookahead && (n.strstart = 0, n.block_start = 0, n.insert = 0))), xa(e), 0 === e.avail_out)) return n.last_flush = -1, Di
                }
                return t !== Pi ? Di : n.wrap <= 0 ? Mi : (2 === n.wrap ? (Ea(n, 255 & e.adler), Ea(n, e.adler >> 8 & 255), Ea(n, e.adler >> 16 & 255), Ea(n, e.adler >> 24 & 255), Ea(n, 255 & e.total_in), Ea(n, e.total_in >> 8 & 255), Ea(n, e.total_in >> 16 & 255), Ea(n, e.total_in >> 24 & 255)) : (Aa(n, e.adler >>> 16), Aa(n, 65535 & e.adler)), xa(e), n.wrap > 0 && (n.wrap = -n.wrap), 0 !== n.pending ? Di : Mi)
            },
            deflateEnd: function(e) {
                var t;
                return e && e.state ? (t = e.state.status) !== ha && t !== ua && t !== fa && t !== la && t !== ca && t !== da && t !== pa ? _a(e, ji) : (e.state = null, t === da ? _a(e, Fi) : Di) : ji
            },
            deflateSetDictionary: function(e, t) {
                var r, n, i, a, o, s, h, u, f = t.length;
                if (!e || !e.state) return ji;
                if (2 === (a = (r = e.state).wrap) || 1 === a && r.status !== ha || r.lookahead) return ji;
                for (1 === a && (e.adler = Ci(e.adler, t, f, 0)), r.wrap = 0, f >= r.w_size && (0 === a && (ka(r.head), r.strstart = 0, r.block_start = 0, r.insert = 0), u = new Cn.Buf8(r.w_size), Cn.arraySet(u, t, f - r.w_size, r.w_size, 0), t = u, f = r.w_size), o = e.avail_in, s = e.next_in, h = e.input, e.avail_in = f, e.next_in = 0, e.input = t, Ra(r); r.lookahead >= ia;) {
                    n = r.strstart, i = r.lookahead - (ia - 1);
                    do {
                        r.ins_h = (r.ins_h << r.hash_shift ^ r.window[n + ia - 1]) & r.hash_mask, r.prev[n & r.w_mask] = r.head[r.ins_h], r.head[r.ins_h] = n, n++
                    } while (--i);
                    r.strstart = n, r.lookahead = ia - 1, Ra(r)
                }
                return r.strstart += r.lookahead, r.block_start = r.strstart, r.insert = r.lookahead, r.lookahead = 0, r.match_length = r.prev_length = ia - 1, r.match_available = 0, e.next_in = s, e.input = h, e.avail_in = o, r.wrap = a, Di
            },
            deflateInfo: "pako deflate (from Nodeca project)"
        },
        Ua = !0,
        Da = !0;
    try {
        String.fromCharCode.apply(null, [0])
    } catch (e) {
        Ua = !1
    }
    try {
        String.fromCharCode.apply(null, new Uint8Array(1))
    } catch (e) {
        Da = !1
    }
    for (var Ma = new Cn.Buf8(256), ja = 0; ja < 256; ja++) Ma[ja] = ja >= 252 ? 6 : ja >= 248 ? 5 : ja >= 240 ? 4 : ja >= 224 ? 3 : ja >= 192 ? 2 : 1;
    Ma[254] = Ma[254] = 1;

    function Fa(e, t) {
        if (t < 65537 && (e.subarray && Da || !e.subarray && Ua)) return String.fromCharCode.apply(null, Cn.shrinkBuf(e, t));
        for (var r = "", n = 0; n < t; n++) r += String.fromCharCode(e[n]);
        return r
    }
    var Na = {
        string2buf: function(e) {
            var t, r, n, i, a, o = e.length,
                s = 0;
            for (i = 0; i < o; i++) 55296 == (64512 & (r = e.charCodeAt(i))) && i + 1 < o && 56320 == (64512 & (n = e.charCodeAt(i + 1))) && (r = 65536 + (r - 55296 << 10) + (n - 56320), i++), s += r < 128 ? 1 : r < 2048 ? 2 : r < 65536 ? 3 : 4;
            for (t = new Cn.Buf8(s), a = 0, i = 0; a < s; i++) 55296 == (64512 & (r = e.charCodeAt(i))) && i + 1 < o && 56320 == (64512 & (n = e.charCodeAt(i + 1))) && (r = 65536 + (r - 55296 << 10) + (n - 56320), i++), r < 128 ? t[a++] = r : r < 2048 ? (t[a++] = 192 | r >>> 6, t[a++] = 128 | 63 & r) : r < 65536 ? (t[a++] = 224 | r >>> 12, t[a++] = 128 | r >>> 6 & 63, t[a++] = 128 | 63 & r) : (t[a++] = 240 | r >>> 18, t[a++] = 128 | r >>> 12 & 63, t[a++] = 128 | r >>> 6 & 63, t[a++] = 128 | 63 & r);
            return t
        },
        buf2binstring: function(e) {
            return Fa(e, e.length)
        },
        binstring2buf: function(e) {
            for (var t = new Cn.Buf8(e.length), r = 0, n = t.length; r < n; r++) t[r] = e.charCodeAt(r);
            return t
        },
        buf2string: function(e, t) {
            var r, n, i, a, o = t || e.length,
                s = new Array(2 * o);
            for (n = 0, r = 0; r < o;)
                if ((i = e[r++]) < 128) s[n++] = i;
                else if ((a = Ma[i]) > 4) s[n++] = 65533, r += a - 1;
            else {
                for (i &= 2 === a ? 31 : 3 === a ? 15 : 7; a > 1 && r < o;) i = i << 6 | 63 & e[r++], a--;
                a > 1 ? s[n++] = 65533 : i < 65536 ? s[n++] = i : (i -= 65536, s[n++] = 55296 | i >> 10 & 1023, s[n++] = 56320 | 1023 & i)
            }
            return Fa(s, n)
        },
        utf8border: function(e, t) {
            var r;
            for ((t = t || e.length) > e.length && (t = e.length), r = t - 1; r >= 0 && 128 == (192 & e[r]);) r--;
            return r < 0 ? t : 0 === r ? t : r + Ma[e[r]] > t ? r : t
        }
    };
    var Za = function() {
            this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0
        },
        Wa = Object.prototype.toString,
        Ya = 0,
        qa = -1,
        Ha = 0,
        Ka = 8;

    function Xa(e) {
        if (!(this instanceof Xa)) return new Xa(e);
        this.options = Cn.assign({
            level: qa,
            method: Ka,
            chunkSize: 16384,
            windowBits: 15,
            memLevel: 8,
            strategy: Ha,
            to: ""
        }, e || {});
        var t = this.options;
        t.raw && t.windowBits > 0 ? t.windowBits = -t.windowBits : t.gzip && t.windowBits > 0 && t.windowBits < 16 && (t.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Za, this.strm.avail_out = 0;
        var r = Pa.deflateInit2(this.strm, t.level, t.method, t.windowBits, t.memLevel, t.strategy);
        if (r !== Ya) throw new Error(Bi[r]);
        if (t.header && Pa.deflateSetHeader(this.strm, t.header), t.dictionary) {
            var n;
            if (n = "string" == typeof t.dictionary ? Na.string2buf(t.dictionary) : "[object ArrayBuffer]" === Wa.call(t.dictionary) ? new Uint8Array(t.dictionary) : t.dictionary, (r = Pa.deflateSetDictionary(this.strm, n)) !== Ya) throw new Error(Bi[r]);
            this._dict_set = !0
        }
    }

    function Va(e, t) {
        var r = new Xa(t);
        if (r.push(e, !0), r.err) throw r.msg || Bi[r.err];
        return r.result
    }
    Xa.prototype.push = function(e, t) {
        var r, n, i = this.strm,
            a = this.options.chunkSize;
        if (this.ended) return !1;
        n = t === ~~t ? t : !0 === t ? 4 : 0, "string" == typeof e ? i.input = Na.string2buf(e) : "[object ArrayBuffer]" === Wa.call(e) ? i.input = new Uint8Array(e) : i.input = e, i.next_in = 0, i.avail_in = i.input.length;
        do {
            if (0 === i.avail_out && (i.output = new Cn.Buf8(a), i.next_out = 0, i.avail_out = a), 1 !== (r = Pa.deflate(i, n)) && r !== Ya) return this.onEnd(r), this.ended = !0, !1;
            0 !== i.avail_out && (0 !== i.avail_in || 4 !== n && 2 !== n) || ("string" === this.options.to ? this.onData(Na.buf2binstring(Cn.shrinkBuf(i.output, i.next_out))) : this.onData(Cn.shrinkBuf(i.output, i.next_out)))
        } while ((i.avail_in > 0 || 0 === i.avail_out) && 1 !== r);
        return 4 === n ? (r = Pa.deflateEnd(this.strm), this.onEnd(r), this.ended = !0, r === Ya) : 2 !== n || (this.onEnd(Ya), i.avail_out = 0, !0)
    }, Xa.prototype.onData = function(e) {
        this.chunks.push(e)
    }, Xa.prototype.onEnd = function(e) {
        e === Ya && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = Cn.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg
    };
    var $a = {
            Deflate: Xa,
            deflate: Va,
            deflateRaw: function(e, t) {
                return (t = t || {}).raw = !0, Va(e, t)
            },
            gzip: function(e, t) {
                return (t = t || {}).gzip = !0, Va(e, t)
            }
        },
        Ga = function(e, t) {
            var r, n, i, a, o, s, h, u, f, l, c, d, p, m, g, v, y, w, _, b, k, x, S, E, A;
            r = e.state, n = e.next_in, E = e.input, i = n + (e.avail_in - 5), a = e.next_out, A = e.output, o = a - (t - e.avail_out), s = a + (e.avail_out - 257), h = r.dmax, u = r.wsize, f = r.whave, l = r.wnext, c = r.window, d = r.hold, p = r.bits, m = r.lencode, g = r.distcode, v = (1 << r.lenbits) - 1, y = (1 << r.distbits) - 1;
            e: do {
                p < 15 && (d += E[n++] << p, p += 8, d += E[n++] << p, p += 8), w = m[d & v];
                t: for (;;) {
                    if (d >>>= _ = w >>> 24, p -= _, 0 === (_ = w >>> 16 & 255)) A[a++] = 65535 & w;
                    else {
                        if (!(16 & _)) {
                            if (0 == (64 & _)) {
                                w = m[(65535 & w) + (d & (1 << _) - 1)];
                                continue t
                            }
                            if (32 & _) {
                                r.mode = 12;
                                break e
                            }
                            e.msg = "invalid literal/length code", r.mode = 30;
                            break e
                        }
                        b = 65535 & w, (_ &= 15) && (p < _ && (d += E[n++] << p, p += 8), b += d & (1 << _) - 1, d >>>= _, p -= _), p < 15 && (d += E[n++] << p, p += 8, d += E[n++] << p, p += 8), w = g[d & y];
                        r: for (;;) {
                            if (d >>>= _ = w >>> 24, p -= _, !(16 & (_ = w >>> 16 & 255))) {
                                if (0 == (64 & _)) {
                                    w = g[(65535 & w) + (d & (1 << _) - 1)];
                                    continue r
                                }
                                e.msg = "invalid distance code", r.mode = 30;
                                break e
                            }
                            if (k = 65535 & w, p < (_ &= 15) && (d += E[n++] << p, (p += 8) < _ && (d += E[n++] << p, p += 8)), (k += d & (1 << _) - 1) > h) {
                                e.msg = "invalid distance too far back", r.mode = 30;
                                break e
                            }
                            if (d >>>= _, p -= _, k > (_ = a - o)) {
                                if ((_ = k - _) > f && r.sane) {
                                    e.msg = "invalid distance too far back", r.mode = 30;
                                    break e
                                }
                                if (x = 0, S = c, 0 === l) {
                                    if (x += u - _, _ < b) {
                                        b -= _;
                                        do {
                                            A[a++] = c[x++]
                                        } while (--_);
                                        x = a - k, S = A
                                    }
                                } else if (l < _) {
                                    if (x += u + l - _, (_ -= l) < b) {
                                        b -= _;
                                        do {
                                            A[a++] = c[x++]
                                        } while (--_);
                                        if (x = 0, l < b) {
                                            b -= _ = l;
                                            do {
                                                A[a++] = c[x++]
                                            } while (--_);
                                            x = a - k, S = A
                                        }
                                    }
                                } else if (x += l - _, _ < b) {
                                    b -= _;
                                    do {
                                        A[a++] = c[x++]
                                    } while (--_);
                                    x = a - k, S = A
                                }
                                for (; b > 2;) A[a++] = S[x++], A[a++] = S[x++], A[a++] = S[x++], b -= 3;
                                b && (A[a++] = S[x++], b > 1 && (A[a++] = S[x++]))
                            } else {
                                x = a - k;
                                do {
                                    A[a++] = A[x++], A[a++] = A[x++], A[a++] = A[x++], b -= 3
                                } while (b > 2);
                                b && (A[a++] = A[x++], b > 1 && (A[a++] = A[x++]))
                            }
                            break
                        }
                    }
                    break
                }
            } while (n < i && a < s);
            n -= b = p >> 3, d &= (1 << (p -= b << 3)) - 1, e.next_in = n, e.next_out = a, e.avail_in = n < i ? i - n + 5 : 5 - (n - i), e.avail_out = a < s ? s - a + 257 : 257 - (a - s), r.hold = d, r.bits = p
        },
        Ja = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0],
        Qa = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78],
        eo = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0],
        to = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64],
        ro = function(e, t, r, n, i, a, o, s) {
            var h, u, f, l, c, d, p, m, g, v = s.bits,
                y = 0,
                w = 0,
                _ = 0,
                b = 0,
                k = 0,
                x = 0,
                S = 0,
                E = 0,
                A = 0,
                C = 0,
                R = null,
                z = 0,
                T = new Cn.Buf16(16),
                B = new Cn.Buf16(16),
                O = null,
                I = 0;
            for (y = 0; y <= 15; y++) T[y] = 0;
            for (w = 0; w < n; w++) T[t[r + w]]++;
            for (k = v, b = 15; b >= 1 && 0 === T[b]; b--);
            if (k > b && (k = b), 0 === b) return i[a++] = 20971520, i[a++] = 20971520, s.bits = 1, 0;
            for (_ = 1; _ < b && 0 === T[_]; _++);
            for (k < _ && (k = _), E = 1, y = 1; y <= 15; y++)
                if (E <<= 1, (E -= T[y]) < 0) return -1;
            if (E > 0 && (0 === e || 1 !== b)) return -1;
            for (B[1] = 0, y = 1; y < 15; y++) B[y + 1] = B[y] + T[y];
            for (w = 0; w < n; w++) 0 !== t[r + w] && (o[B[t[r + w]]++] = w);
            if (0 === e ? (R = O = o, d = 19) : 1 === e ? (R = Ja, z -= 257, O = Qa, I -= 257, d = 256) : (R = eo, O = to, d = -1), C = 0, w = 0, y = _, c = a, x = k, S = 0, f = -1, l = (A = 1 << k) - 1, 1 === e && A > 852 || 2 === e && A > 592) return 1;
            for (;;) {
                p = y - S, o[w] < d ? (m = 0, g = o[w]) : o[w] > d ? (m = O[I + o[w]], g = R[z + o[w]]) : (m = 96, g = 0), h = 1 << y - S, _ = u = 1 << x;
                do {
                    i[c + (C >> S) + (u -= h)] = p << 24 | m << 16 | g | 0
                } while (0 !== u);
                for (h = 1 << y - 1; C & h;) h >>= 1;
                if (0 !== h ? (C &= h - 1, C += h) : C = 0, w++, 0 == --T[y]) {
                    if (y === b) break;
                    y = t[r + o[w]]
                }
                if (y > k && (C & l) !== f) {
                    for (0 === S && (S = k), c += _, E = 1 << (x = y - S); x + S < b && !((E -= T[x + S]) <= 0);) x++, E <<= 1;
                    if (A += 1 << x, 1 === e && A > 852 || 2 === e && A > 592) return 1;
                    i[f = C & l] = k << 24 | x << 16 | c - a | 0
                }
            }
            return 0 !== C && (i[c + C] = y - S << 24 | 64 << 16 | 0), s.bits = k, 0
        },
        no = 0,
        io = 1,
        ao = 2,
        oo = 4,
        so = 5,
        ho = 6,
        uo = 0,
        fo = 1,
        lo = 2,
        co = -2,
        po = -3,
        mo = -4,
        go = -5,
        vo = 8,
        yo = 1,
        wo = 2,
        _o = 3,
        bo = 4,
        ko = 5,
        xo = 6,
        So = 7,
        Eo = 8,
        Ao = 9,
        Co = 10,
        Ro = 11,
        zo = 12,
        To = 13,
        Bo = 14,
        Oo = 15,
        Io = 16,
        Lo = 17,
        Po = 18,
        Uo = 19,
        Do = 20,
        Mo = 21,
        jo = 22,
        Fo = 23,
        No = 24,
        Zo = 25,
        Wo = 26,
        Yo = 27,
        qo = 28,
        Ho = 29,
        Ko = 30,
        Xo = 31,
        Vo = 32,
        $o = 852,
        Go = 592,
        Jo = 15;

    function Qo(e) {
        return (e >>> 24 & 255) + (e >>> 8 & 65280) + ((65280 & e) << 8) + ((255 & e) << 24)
    }

    function es(e) {
        var t;
        return e && e.state ? (t = e.state, e.total_in = e.total_out = t.total = 0, e.msg = "", t.wrap && (e.adler = 1 & t.wrap), t.mode = yo, t.last = 0, t.havedict = 0, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Cn.Buf32($o), t.distcode = t.distdyn = new Cn.Buf32(Go), t.sane = 1, t.back = -1, uo) : co
    }

    function ts(e) {
        var t;
        return e && e.state ? ((t = e.state).wsize = 0, t.whave = 0, t.wnext = 0, es(e)) : co
    }

    function rs(e, t) {
        var r, n;
        return e && e.state ? (n = e.state, t < 0 ? (r = 0, t = -t) : (r = 1 + (t >> 4), t < 48 && (t &= 15)), t && (t < 8 || t > 15) ? co : (null !== n.window && n.wbits !== t && (n.window = null), n.wrap = r, n.wbits = t, ts(e))) : co
    }

    function ns(e, t) {
        var r, n;
        return e ? (n = new function() {
            this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Cn.Buf16(320), this.work = new Cn.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0
        }, e.state = n, n.window = null, (r = rs(e, t)) !== uo && (e.state = null), r) : co
    }
    var is, as, os = !0;

    function ss(e) {
        if (os) {
            var t;
            for (is = new Cn.Buf32(512), as = new Cn.Buf32(32), t = 0; t < 144;) e.lens[t++] = 8;
            for (; t < 256;) e.lens[t++] = 9;
            for (; t < 280;) e.lens[t++] = 7;
            for (; t < 288;) e.lens[t++] = 8;
            for (ro(io, e.lens, 0, 288, is, 0, e.work, {
                    bits: 9
                }), t = 0; t < 32;) e.lens[t++] = 5;
            ro(ao, e.lens, 0, 32, as, 0, e.work, {
                bits: 5
            }), os = !1
        }
        e.lencode = is, e.lenbits = 9, e.distcode = as, e.distbits = 5
    }

    function hs(e, t, r, n) {
        var i, a = e.state;
        return null === a.window && (a.wsize = 1 << a.wbits, a.wnext = 0, a.whave = 0, a.window = new Cn.Buf8(a.wsize)), n >= a.wsize ? (Cn.arraySet(a.window, t, r - a.wsize, a.wsize, 0), a.wnext = 0, a.whave = a.wsize) : ((i = a.wsize - a.wnext) > n && (i = n), Cn.arraySet(a.window, t, r - n, i, a.wnext), (n -= i) ? (Cn.arraySet(a.window, t, r - n, n, 0), a.wnext = n, a.whave = a.wsize) : (a.wnext += i, a.wnext === a.wsize && (a.wnext = 0), a.whave < a.wsize && (a.whave += i))), 0
    }
    var us = {
            inflateReset: ts,
            inflateReset2: rs,
            inflateResetKeep: es,
            inflateInit: function(e) {
                return ns(e, Jo)
            },
            inflateInit2: ns,
            inflate: function(e, t) {
                var r, n, i, a, o, s, h, u, f, l, c, d, p, m, g, v, y, w, _, b, k, x, S, E, A = 0,
                    C = new Cn.Buf8(4),
                    R = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
                if (!e || !e.state || !e.output || !e.input && 0 !== e.avail_in) return co;
                (r = e.state).mode === zo && (r.mode = To), o = e.next_out, i = e.output, h = e.avail_out, a = e.next_in, n = e.input, s = e.avail_in, u = r.hold, f = r.bits, l = s, c = h, x = uo;
                e: for (;;) switch (r.mode) {
                    case yo:
                        if (0 === r.wrap) {
                            r.mode = To;
                            break
                        }
                        for (; f < 16;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        if (2 & r.wrap && 35615 === u) {
                            r.check = 0, C[0] = 255 & u, C[1] = u >>> 8 & 255, r.check = Ti(r.check, C, 2, 0), u = 0, f = 0, r.mode = wo;
                            break
                        }
                        if (r.flags = 0, r.head && (r.head.done = !1), !(1 & r.wrap) || (((255 & u) << 8) + (u >> 8)) % 31) {
                            e.msg = "incorrect header check", r.mode = Ko;
                            break
                        }
                        if ((15 & u) !== vo) {
                            e.msg = "unknown compression method", r.mode = Ko;
                            break
                        }
                        if (f -= 4, k = 8 + (15 & (u >>>= 4)), 0 === r.wbits) r.wbits = k;
                        else if (k > r.wbits) {
                            e.msg = "invalid window size", r.mode = Ko;
                            break
                        }
                        r.dmax = 1 << k, e.adler = r.check = 1, r.mode = 512 & u ? Co : zo, u = 0, f = 0;
                        break;
                    case wo:
                        for (; f < 16;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        if (r.flags = u, (255 & r.flags) !== vo) {
                            e.msg = "unknown compression method", r.mode = Ko;
                            break
                        }
                        if (57344 & r.flags) {
                            e.msg = "unknown header flags set", r.mode = Ko;
                            break
                        }
                        r.head && (r.head.text = u >> 8 & 1), 512 & r.flags && (C[0] = 255 & u, C[1] = u >>> 8 & 255, r.check = Ti(r.check, C, 2, 0)), u = 0, f = 0, r.mode = _o;
                    case _o:
                        for (; f < 32;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        r.head && (r.head.time = u), 512 & r.flags && (C[0] = 255 & u, C[1] = u >>> 8 & 255, C[2] = u >>> 16 & 255, C[3] = u >>> 24 & 255, r.check = Ti(r.check, C, 4, 0)), u = 0, f = 0, r.mode = bo;
                    case bo:
                        for (; f < 16;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        r.head && (r.head.xflags = 255 & u, r.head.os = u >> 8), 512 & r.flags && (C[0] = 255 & u, C[1] = u >>> 8 & 255, r.check = Ti(r.check, C, 2, 0)), u = 0, f = 0, r.mode = ko;
                    case ko:
                        if (1024 & r.flags) {
                            for (; f < 16;) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            r.length = u, r.head && (r.head.extra_len = u), 512 & r.flags && (C[0] = 255 & u, C[1] = u >>> 8 & 255, r.check = Ti(r.check, C, 2, 0)), u = 0, f = 0
                        } else r.head && (r.head.extra = null);
                        r.mode = xo;
                    case xo:
                        if (1024 & r.flags && ((d = r.length) > s && (d = s), d && (r.head && (k = r.head.extra_len - r.length, r.head.extra || (r.head.extra = new Array(r.head.extra_len)), Cn.arraySet(r.head.extra, n, a, d, k)), 512 & r.flags && (r.check = Ti(r.check, n, d, a)), s -= d, a += d, r.length -= d), r.length)) break e;
                        r.length = 0, r.mode = So;
                    case So:
                        if (2048 & r.flags) {
                            if (0 === s) break e;
                            d = 0;
                            do {
                                k = n[a + d++], r.head && k && r.length < 65536 && (r.head.name += String.fromCharCode(k))
                            } while (k && d < s);
                            if (512 & r.flags && (r.check = Ti(r.check, n, d, a)), s -= d, a += d, k) break e
                        } else r.head && (r.head.name = null);
                        r.length = 0, r.mode = Eo;
                    case Eo:
                        if (4096 & r.flags) {
                            if (0 === s) break e;
                            d = 0;
                            do {
                                k = n[a + d++], r.head && k && r.length < 65536 && (r.head.comment += String.fromCharCode(k))
                            } while (k && d < s);
                            if (512 & r.flags && (r.check = Ti(r.check, n, d, a)), s -= d, a += d, k) break e
                        } else r.head && (r.head.comment = null);
                        r.mode = Ao;
                    case Ao:
                        if (512 & r.flags) {
                            for (; f < 16;) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            if (u !== (65535 & r.check)) {
                                e.msg = "header crc mismatch", r.mode = Ko;
                                break
                            }
                            u = 0, f = 0
                        }
                        r.head && (r.head.hcrc = r.flags >> 9 & 1, r.head.done = !0), e.adler = r.check = 0, r.mode = zo;
                        break;
                    case Co:
                        for (; f < 32;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        e.adler = r.check = Qo(u), u = 0, f = 0, r.mode = Ro;
                    case Ro:
                        if (0 === r.havedict) return e.next_out = o, e.avail_out = h, e.next_in = a, e.avail_in = s, r.hold = u, r.bits = f, lo;
                        e.adler = r.check = 1, r.mode = zo;
                    case zo:
                        if (t === so || t === ho) break e;
                    case To:
                        if (r.last) {
                            u >>>= 7 & f, f -= 7 & f, r.mode = Yo;
                            break
                        }
                        for (; f < 3;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        switch (r.last = 1 & u, f -= 1, 3 & (u >>>= 1)) {
                            case 0:
                                r.mode = Bo;
                                break;
                            case 1:
                                if (ss(r), r.mode = Do, t === ho) {
                                    u >>>= 2, f -= 2;
                                    break e
                                }
                                break;
                            case 2:
                                r.mode = Lo;
                                break;
                            case 3:
                                e.msg = "invalid block type", r.mode = Ko
                        }
                        u >>>= 2, f -= 2;
                        break;
                    case Bo:
                        for (u >>>= 7 & f, f -= 7 & f; f < 32;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        if ((65535 & u) != (u >>> 16 ^ 65535)) {
                            e.msg = "invalid stored block lengths", r.mode = Ko;
                            break
                        }
                        if (r.length = 65535 & u, u = 0, f = 0, r.mode = Oo, t === ho) break e;
                    case Oo:
                        r.mode = Io;
                    case Io:
                        if (d = r.length) {
                            if (d > s && (d = s), d > h && (d = h), 0 === d) break e;
                            Cn.arraySet(i, n, a, d, o), s -= d, a += d, h -= d, o += d, r.length -= d;
                            break
                        }
                        r.mode = zo;
                        break;
                    case Lo:
                        for (; f < 14;) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        if (r.nlen = 257 + (31 & u), u >>>= 5, f -= 5, r.ndist = 1 + (31 & u), u >>>= 5, f -= 5, r.ncode = 4 + (15 & u), u >>>= 4, f -= 4, r.nlen > 286 || r.ndist > 30) {
                            e.msg = "too many length or distance symbols", r.mode = Ko;
                            break
                        }
                        r.have = 0, r.mode = Po;
                    case Po:
                        for (; r.have < r.ncode;) {
                            for (; f < 3;) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            r.lens[R[r.have++]] = 7 & u, u >>>= 3, f -= 3
                        }
                        for (; r.have < 19;) r.lens[R[r.have++]] = 0;
                        if (r.lencode = r.lendyn, r.lenbits = 7, S = {
                                bits: r.lenbits
                            }, x = ro(no, r.lens, 0, 19, r.lencode, 0, r.work, S), r.lenbits = S.bits, x) {
                            e.msg = "invalid code lengths set", r.mode = Ko;
                            break
                        }
                        r.have = 0, r.mode = Uo;
                    case Uo:
                        for (; r.have < r.nlen + r.ndist;) {
                            for (; v = (A = r.lencode[u & (1 << r.lenbits) - 1]) >>> 16 & 255, y = 65535 & A, !((g = A >>> 24) <= f);) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            if (y < 16) u >>>= g, f -= g, r.lens[r.have++] = y;
                            else {
                                if (16 === y) {
                                    for (E = g + 2; f < E;) {
                                        if (0 === s) break e;
                                        s--, u += n[a++] << f, f += 8
                                    }
                                    if (u >>>= g, f -= g, 0 === r.have) {
                                        e.msg = "invalid bit length repeat", r.mode = Ko;
                                        break
                                    }
                                    k = r.lens[r.have - 1], d = 3 + (3 & u), u >>>= 2, f -= 2
                                } else if (17 === y) {
                                    for (E = g + 3; f < E;) {
                                        if (0 === s) break e;
                                        s--, u += n[a++] << f, f += 8
                                    }
                                    f -= g, k = 0, d = 3 + (7 & (u >>>= g)), u >>>= 3, f -= 3
                                } else {
                                    for (E = g + 7; f < E;) {
                                        if (0 === s) break e;
                                        s--, u += n[a++] << f, f += 8
                                    }
                                    f -= g, k = 0, d = 11 + (127 & (u >>>= g)), u >>>= 7, f -= 7
                                }
                                if (r.have + d > r.nlen + r.ndist) {
                                    e.msg = "invalid bit length repeat", r.mode = Ko;
                                    break
                                }
                                for (; d--;) r.lens[r.have++] = k
                            }
                        }
                        if (r.mode === Ko) break;
                        if (0 === r.lens[256]) {
                            e.msg = "invalid code -- missing end-of-block", r.mode = Ko;
                            break
                        }
                        if (r.lenbits = 9, S = {
                                bits: r.lenbits
                            }, x = ro(io, r.lens, 0, r.nlen, r.lencode, 0, r.work, S), r.lenbits = S.bits, x) {
                            e.msg = "invalid literal/lengths set", r.mode = Ko;
                            break
                        }
                        if (r.distbits = 6, r.distcode = r.distdyn, S = {
                                bits: r.distbits
                            }, x = ro(ao, r.lens, r.nlen, r.ndist, r.distcode, 0, r.work, S), r.distbits = S.bits, x) {
                            e.msg = "invalid distances set", r.mode = Ko;
                            break
                        }
                        if (r.mode = Do, t === ho) break e;
                    case Do:
                        r.mode = Mo;
                    case Mo:
                        if (s >= 6 && h >= 258) {
                            e.next_out = o, e.avail_out = h, e.next_in = a, e.avail_in = s, r.hold = u, r.bits = f, Ga(e, c), o = e.next_out, i = e.output, h = e.avail_out, a = e.next_in, n = e.input, s = e.avail_in, u = r.hold, f = r.bits, r.mode === zo && (r.back = -1);
                            break
                        }
                        for (r.back = 0; v = (A = r.lencode[u & (1 << r.lenbits) - 1]) >>> 16 & 255, y = 65535 & A, !((g = A >>> 24) <= f);) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        if (v && 0 == (240 & v)) {
                            for (w = g, _ = v, b = y; v = (A = r.lencode[b + ((u & (1 << w + _) - 1) >> w)]) >>> 16 & 255, y = 65535 & A, !(w + (g = A >>> 24) <= f);) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            u >>>= w, f -= w, r.back += w
                        }
                        if (u >>>= g, f -= g, r.back += g, r.length = y, 0 === v) {
                            r.mode = Wo;
                            break
                        }
                        if (32 & v) {
                            r.back = -1, r.mode = zo;
                            break
                        }
                        if (64 & v) {
                            e.msg = "invalid literal/length code", r.mode = Ko;
                            break
                        }
                        r.extra = 15 & v, r.mode = jo;
                    case jo:
                        if (r.extra) {
                            for (E = r.extra; f < E;) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            r.length += u & (1 << r.extra) - 1, u >>>= r.extra, f -= r.extra, r.back += r.extra
                        }
                        r.was = r.length, r.mode = Fo;
                    case Fo:
                        for (; v = (A = r.distcode[u & (1 << r.distbits) - 1]) >>> 16 & 255, y = 65535 & A, !((g = A >>> 24) <= f);) {
                            if (0 === s) break e;
                            s--, u += n[a++] << f, f += 8
                        }
                        if (0 == (240 & v)) {
                            for (w = g, _ = v, b = y; v = (A = r.distcode[b + ((u & (1 << w + _) - 1) >> w)]) >>> 16 & 255, y = 65535 & A, !(w + (g = A >>> 24) <= f);) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            u >>>= w, f -= w, r.back += w
                        }
                        if (u >>>= g, f -= g, r.back += g, 64 & v) {
                            e.msg = "invalid distance code", r.mode = Ko;
                            break
                        }
                        r.offset = y, r.extra = 15 & v, r.mode = No;
                    case No:
                        if (r.extra) {
                            for (E = r.extra; f < E;) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            r.offset += u & (1 << r.extra) - 1, u >>>= r.extra, f -= r.extra, r.back += r.extra
                        }
                        if (r.offset > r.dmax) {
                            e.msg = "invalid distance too far back", r.mode = Ko;
                            break
                        }
                        r.mode = Zo;
                    case Zo:
                        if (0 === h) break e;
                        if (d = c - h, r.offset > d) {
                            if ((d = r.offset - d) > r.whave && r.sane) {
                                e.msg = "invalid distance too far back", r.mode = Ko;
                                break
                            }
                            d > r.wnext ? (d -= r.wnext, p = r.wsize - d) : p = r.wnext - d, d > r.length && (d = r.length), m = r.window
                        } else m = i, p = o - r.offset, d = r.length;
                        d > h && (d = h), h -= d, r.length -= d;
                        do {
                            i[o++] = m[p++]
                        } while (--d);
                        0 === r.length && (r.mode = Mo);
                        break;
                    case Wo:
                        if (0 === h) break e;
                        i[o++] = r.length, h--, r.mode = Mo;
                        break;
                    case Yo:
                        if (r.wrap) {
                            for (; f < 32;) {
                                if (0 === s) break e;
                                s--, u |= n[a++] << f, f += 8
                            }
                            if (c -= h, e.total_out += c, r.total += c, c && (e.adler = r.check = r.flags ? Ti(r.check, i, c, o - c) : Ci(r.check, i, c, o - c)), c = h, (r.flags ? u : Qo(u)) !== r.check) {
                                e.msg = "incorrect data check", r.mode = Ko;
                                break
                            }
                            u = 0, f = 0
                        }
                        r.mode = qo;
                    case qo:
                        if (r.wrap && r.flags) {
                            for (; f < 32;) {
                                if (0 === s) break e;
                                s--, u += n[a++] << f, f += 8
                            }
                            if (u !== (4294967295 & r.total)) {
                                e.msg = "incorrect length check", r.mode = Ko;
                                break
                            }
                            u = 0, f = 0
                        }
                        r.mode = Ho;
                    case Ho:
                        x = fo;
                        break e;
                    case Ko:
                        x = po;
                        break e;
                    case Xo:
                        return mo;
                    case Vo:
                    default:
                        return co
                }
                return e.next_out = o, e.avail_out = h, e.next_in = a, e.avail_in = s, r.hold = u, r.bits = f, (r.wsize || c !== e.avail_out && r.mode < Ko && (r.mode < Yo || t !== oo)) && hs(e, e.output, e.next_out, c - e.avail_out) ? (r.mode = Xo, mo) : (l -= e.avail_in, c -= e.avail_out, e.total_in += l, e.total_out += c, r.total += c, r.wrap && c && (e.adler = r.check = r.flags ? Ti(r.check, i, c, e.next_out - c) : Ci(r.check, i, c, e.next_out - c)), e.data_type = r.bits + (r.last ? 64 : 0) + (r.mode === zo ? 128 : 0) + (r.mode === Do || r.mode === Oo ? 256 : 0), (0 === l && 0 === c || t === oo) && x === uo && (x = go), x)
            },
            inflateEnd: function(e) {
                if (!e || !e.state) return co;
                var t = e.state;
                return t.window && (t.window = null), e.state = null, uo
            },
            inflateGetHeader: function(e, t) {
                var r;
                return e && e.state ? 0 == (2 & (r = e.state).wrap) ? co : (r.head = t, t.done = !1, uo) : co
            },
            inflateSetDictionary: function(e, t) {
                var r, n = t.length;
                return e && e.state ? 0 !== (r = e.state).wrap && r.mode !== Ro ? co : r.mode === Ro && Ci(1, t, n, 0) !== r.check ? po : hs(e, t, n, n) ? (r.mode = Xo, mo) : (r.havedict = 1, uo) : co
            },
            inflateInfo: "pako inflate (from Nodeca project)"
        },
        fs = {
            Z_NO_FLUSH: 0,
            Z_PARTIAL_FLUSH: 1,
            Z_SYNC_FLUSH: 2,
            Z_FULL_FLUSH: 3,
            Z_FINISH: 4,
            Z_BLOCK: 5,
            Z_TREES: 6,
            Z_OK: 0,
            Z_STREAM_END: 1,
            Z_NEED_DICT: 2,
            Z_ERRNO: -1,
            Z_STREAM_ERROR: -2,
            Z_DATA_ERROR: -3,
            Z_BUF_ERROR: -5,
            Z_NO_COMPRESSION: 0,
            Z_BEST_SPEED: 1,
            Z_BEST_COMPRESSION: 9,
            Z_DEFAULT_COMPRESSION: -1,
            Z_FILTERED: 1,
            Z_HUFFMAN_ONLY: 2,
            Z_RLE: 3,
            Z_FIXED: 4,
            Z_DEFAULT_STRATEGY: 0,
            Z_BINARY: 0,
            Z_TEXT: 1,
            Z_UNKNOWN: 2,
            Z_DEFLATED: 8
        };
    var ls = function() {
            this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1
        },
        cs = Object.prototype.toString;

    function ds(e) {
        if (!(this instanceof ds)) return new ds(e);
        this.options = Cn.assign({
            chunkSize: 16384,
            windowBits: 0,
            to: ""
        }, e || {});
        var t = this.options;
        t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, 0 === t.windowBits && (t.windowBits = -15)), !(t.windowBits >= 0 && t.windowBits < 16) || e && e.windowBits || (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && 0 == (15 & t.windowBits) && (t.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Za, this.strm.avail_out = 0;
        var r = us.inflateInit2(this.strm, t.windowBits);
        if (r !== fs.Z_OK) throw new Error(Bi[r]);
        this.header = new ls, us.inflateGetHeader(this.strm, this.header)
    }

    function ps(e, t) {
        var r = new ds(t);
        if (r.push(e, !0), r.err) throw r.msg || Bi[r.err];
        return r.result
    }
    ds.prototype.push = function(e, t) {
        var r, n, i, a, o, s, h = this.strm,
            u = this.options.chunkSize,
            f = this.options.dictionary,
            l = !1;
        if (this.ended) return !1;
        n = t === ~~t ? t : !0 === t ? fs.Z_FINISH : fs.Z_NO_FLUSH, "string" == typeof e ? h.input = Na.binstring2buf(e) : "[object ArrayBuffer]" === cs.call(e) ? h.input = new Uint8Array(e) : h.input = e, h.next_in = 0, h.avail_in = h.input.length;
        do {
            if (0 === h.avail_out && (h.output = new Cn.Buf8(u), h.next_out = 0, h.avail_out = u), (r = us.inflate(h, fs.Z_NO_FLUSH)) === fs.Z_NEED_DICT && f && (s = "string" == typeof f ? Na.string2buf(f) : "[object ArrayBuffer]" === cs.call(f) ? new Uint8Array(f) : f, r = us.inflateSetDictionary(this.strm, s)), r === fs.Z_BUF_ERROR && !0 === l && (r = fs.Z_OK, l = !1), r !== fs.Z_STREAM_END && r !== fs.Z_OK) return this.onEnd(r), this.ended = !0, !1;
            h.next_out && (0 !== h.avail_out && r !== fs.Z_STREAM_END && (0 !== h.avail_in || n !== fs.Z_FINISH && n !== fs.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i = Na.utf8border(h.output, h.next_out), a = h.next_out - i, o = Na.buf2string(h.output, i), h.next_out = a, h.avail_out = u - a, a && Cn.arraySet(h.output, h.output, i, a, 0), this.onData(o)) : this.onData(Cn.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (l = !0)
        } while ((h.avail_in > 0 || 0 === h.avail_out) && r !== fs.Z_STREAM_END);
        return r === fs.Z_STREAM_END && (n = fs.Z_FINISH), n === fs.Z_FINISH ? (r = us.inflateEnd(this.strm), this.onEnd(r), this.ended = !0, r === fs.Z_OK) : n !== fs.Z_SYNC_FLUSH || (this.onEnd(fs.Z_OK), h.avail_out = 0, !0)
    }, ds.prototype.onData = function(e) {
        this.chunks.push(e)
    }, ds.prototype.onEnd = function(e) {
        e === fs.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = Cn.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg
    };
    var ms = {
            Inflate: ds,
            inflate: ps,
            inflateRaw: function(e, t) {
                return (t = t || {}).raw = !0, ps(e, t)
            },
            ungzip: ps
        },
        gs = {};
    (0, Cn.assign)(gs, $a, ms, fs);
    var vs = gs,
        ys = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array ? "uint8array" : "array";

    function ws(e, t) {
        Qr.call(this, "FlateWorker/" + e), this._pako = null, this._pakoAction = e, this._pakoOptions = t, this.meta = {}
    }
    Gr.inherits(ws, Qr), ws.prototype.processChunk = function(e) {
        this.meta = e.meta, null === this._pako && this._createPako(), this._pako.push(Gr.transformTo(ys, e.data), !1)
    }, ws.prototype.flush = function() {
        Qr.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], !0)
    }, ws.prototype.cleanUp = function() {
        Qr.prototype.cleanUp.call(this), this._pako = null
    }, ws.prototype._createPako = function() {
        this._pako = new vs[this._pakoAction]({
            raw: !0,
            level: this._pakoOptions.level || -1
        });
        var e = this;
        this._pako.onData = function(t) {
            e.push({
                data: t,
                meta: e.meta
            })
        }
    };
    var _s = {
            STORE: {
                magic: "\0\0",
                compressWorker: function(e) {
                    return new Qr("STORE compression")
                },
                uncompressWorker: function() {
                    return new Qr("STORE decompression")
                }
            },
            DEFLATE: {
                magic: "\b\0",
                compressWorker: function(e) {
                    return new ws("Deflate", e)
                },
                uncompressWorker: function() {
                    return new ws("Inflate", {})
                }
            }
        },
        bs = "PK",
        ks = "PK",
        xs = "PK",
        Ss = "PK",
        Es = "PK",
        As = "PK\b",
        Cs = function(e, t) {
            var r, n = "";
            for (r = 0; r < t; r++) n += String.fromCharCode(255 & e), e >>>= 8;
            return n
        },
        Rs = function(e, t, r, n, i, a) {
            var o, s, h = e.file,
                u = e.compression,
                f = a !== en.utf8encode,
                l = Gr.transformTo("string", a(h.name)),
                c = Gr.transformTo("string", en.utf8encode(h.name)),
                d = h.comment,
                p = Gr.transformTo("string", a(d)),
                m = Gr.transformTo("string", en.utf8encode(d)),
                g = c.length !== h.name.length,
                v = m.length !== d.length,
                y = "",
                w = "",
                _ = "",
                b = h.dir,
                k = h.date,
                x = {
                    crc32: 0,
                    compressedSize: 0,
                    uncompressedSize: 0
                };
            t && !r || (x.crc32 = e.crc32, x.compressedSize = e.compressedSize, x.uncompressedSize = e.uncompressedSize);
            var S = 0;
            t && (S |= 8), f || !g && !v || (S |= 2048);
            var E, A, C = 0,
                R = 0;
            b && (C |= 16), "UNIX" === i ? (R = 798, C |= (E = h.unixPermissions, A = E, E || (A = b ? 16893 : 33204), (65535 & A) << 16)) : (R = 20, C |= 63 & (h.dosPermissions || 0)), o = k.getUTCHours(), o <<= 6, o |= k.getUTCMinutes(), o <<= 5, o |= k.getUTCSeconds() / 2, s = k.getUTCFullYear() - 1980, s <<= 4, s |= k.getUTCMonth() + 1, s <<= 5, s |= k.getUTCDate(), g && (w = Cs(1, 1) + Cs(vn(l), 4) + c, y += "up" + Cs(w.length, 2) + w), v && (_ = Cs(1, 1) + Cs(vn(p), 4) + m, y += "uc" + Cs(_.length, 2) + _);
            var z = "";
            return z += "\n\0", z += Cs(S, 2), z += u.magic, z += Cs(o, 2), z += Cs(s, 2), z += Cs(x.crc32, 4), z += Cs(x.compressedSize, 4), z += Cs(x.uncompressedSize, 4), z += Cs(l.length, 2), z += Cs(y.length, 2), {
                fileRecord: bs + z + l + y,
                dirRecord: ks + Cs(R, 2) + z + Cs(p.length, 2) + "\0\0\0\0" + Cs(C, 4) + Cs(n, 4) + l + y + p
            }
        };

    function zs(e, t, r, n) {
        Qr.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t, this.zipPlatform = r, this.encodeFileName = n, this.streamFiles = e, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = []
    }
    Gr.inherits(zs, Qr), zs.prototype.push = function(e) {
        var t = e.meta.percent || 0,
            r = this.entriesCount,
            n = this._sources.length;
        this.accumulate ? this.contentBuffer.push(e) : (this.bytesWritten += e.data.length, Qr.prototype.push.call(this, {
            data: e.data,
            meta: {
                currentFile: this.currentFile,
                percent: r ? (t + 100 * (r - n - 1)) / r : 100
            }
        }))
    }, zs.prototype.openedSource = function(e) {
        this.currentSourceOffset = this.bytesWritten, this.currentFile = e.file.name;
        var t = this.streamFiles && !e.file.dir;
        if (t) {
            var r = Rs(e, t, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({
                data: r.fileRecord,
                meta: {
                    percent: 0
                }
            })
        } else this.accumulate = !0
    }, zs.prototype.closedSource = function(e) {
        this.accumulate = !1;
        var t = this.streamFiles && !e.file.dir,
            r = Rs(e, t, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
        if (this.dirRecords.push(r.dirRecord), t) this.push({
            data: function(e) {
                return As + Cs(e.crc32, 4) + Cs(e.compressedSize, 4) + Cs(e.uncompressedSize, 4)
            }(e),
            meta: {
                percent: 100
            }
        });
        else
            for (this.push({
                    data: r.fileRecord,
                    meta: {
                        percent: 0
                    }
                }); this.contentBuffer.length;) this.push(this.contentBuffer.shift());
        this.currentFile = null
    }, zs.prototype.flush = function() {
        for (var e = this.bytesWritten, t = 0; t < this.dirRecords.length; t++) this.push({
            data: this.dirRecords[t],
            meta: {
                percent: 100
            }
        });
        var r = this.bytesWritten - e,
            n = function(e, t, r, n, i) {
                var a = Gr.transformTo("string", i(n));
                return xs + "\0\0\0\0" + Cs(e, 2) + Cs(e, 2) + Cs(t, 4) + Cs(r, 4) + Cs(a.length, 2) + a
            }(this.dirRecords.length, r, e, this.zipComment, this.encodeFileName);
        this.push({
            data: n,
            meta: {
                percent: 100
            }
        })
    }, zs.prototype.prepareNextSource = function() {
        this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume()
    }, zs.prototype.registerPrevious = function(e) {
        this._sources.push(e);
        var t = this;
        return e.on("data", function(e) {
            t.processChunk(e)
        }), e.on("end", function() {
            t.closedSource(t.previous.streamInfo), t._sources.length ? t.prepareNextSource() : t.end()
        }), e.on("error", function(e) {
            t.error(e)
        }), this
    }, zs.prototype.resume = function() {
        return !!Qr.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0))
    }, zs.prototype.error = function(e) {
        var t = this._sources;
        if (!Qr.prototype.error.call(this, e)) return !1;
        for (var r = 0; r < t.length; r++) try {
            t[r].error(e)
        } catch (e) {}
        return !0
    }, zs.prototype.lock = function() {
        Qr.prototype.lock.call(this);
        for (var e = this._sources, t = 0; t < e.length; t++) e[t].lock()
    };
    var Ts = zs,
        Bs = function(e, t, r) {
            var n = new Ts(t.streamFiles, r, t.platform, t.encodeFileName),
                i = 0;
            try {
                e.forEach(function(e, r) {
                    i++;
                    var a = function(e, t) {
                            var r = e || t,
                                n = _s[r];
                            if (!n) throw new Error(r + " is not a valid compression method !");
                            return n
                        }(r.options.compression, t.compression),
                        o = r.options.compressionOptions || t.compressionOptions || {},
                        s = r.dir,
                        h = r.date;
                    r._compressWorker(a, o).withStreamInfo("file", {
                        name: e,
                        dir: s,
                        date: h,
                        comment: r.comment || "",
                        unixPermissions: r.unixPermissions,
                        dosPermissions: r.dosPermissions
                    }).pipe(n)
                }), n.entriesCount = i
            } catch (e) {
                n.error(e)
            }
            return n
        };

    function Os(e, t) {
        Qr.call(this, "Nodejs stream input adapter for " + e), this._upstreamEnded = !1, this._bindStream(t)
    }
    Gr.inherits(Os, Qr), Os.prototype._bindStream = function(e) {
        var t = this;
        this._stream = e, e.pause(), e.on("data", function(e) {
            t.push({
                data: e,
                meta: {
                    percent: 0
                }
            })
        }).on("error", function(e) {
            t.isPaused ? this.generatedError = e : t.error(e)
        }).on("end", function() {
            t.isPaused ? t._upstreamEnded = !0 : t.end()
        })
    }, Os.prototype.pause = function() {
        return !!Qr.prototype.pause.call(this) && (this._stream.pause(), !0)
    }, Os.prototype.resume = function() {
        return !!Qr.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0)
    };
    var Is = Os,
        Ls = function(e, t, r) {
            var n, i = Gr.getTypeOf(t),
                a = Gr.extend(r || {}, ln);
            a.date = a.date || new Date, null !== a.compression && (a.compression = a.compression.toUpperCase()), "string" == typeof a.unixPermissions && (a.unixPermissions = parseInt(a.unixPermissions, 8)), a.unixPermissions && 16384 & a.unixPermissions && (a.dir = !0), a.dosPermissions && 16 & a.dosPermissions && (a.dir = !0), a.dir && (e = Us(e)), a.createFolders && (n = Ps(e)) && Ds.call(this, n, !0);
            var o = "string" === i && !1 === a.binary && !1 === a.base64;
            r && void 0 !== r.binary || (a.binary = !o), (t instanceof bn && 0 === t.uncompressedSize || a.dir || !t || 0 === t.length) && (a.base64 = !1, a.binary = !0, t = "", a.compression = "STORE", i = "string");
            var s = null;
            s = t instanceof bn || t instanceof Qr ? t : qt && Vt(t) ? new Is(e, t) : Gr.prepareContent(e, t, a.binary, a.optimizedBinaryString, a.base64);
            var h = new An(e, s, a);
            this.files[e] = h
        },
        Ps = function(e) {
            "/" === e.slice(-1) && (e = e.substring(0, e.length - 1));
            var t = e.lastIndexOf("/");
            return t > 0 ? e.substring(0, t) : ""
        },
        Us = function(e) {
            return "/" !== e.slice(-1) && (e += "/"), e
        },
        Ds = function(e, t) {
            return t = void 0 !== t ? t : ln.createFolders, e = Us(e), this.files[e] || Ls.call(this, e, null, {
                dir: !0,
                createFolders: t
            }), this.files[e]
        };

    function Ms(e) {
        return "[object RegExp]" === Object.prototype.toString.call(e)
    }
    var js = {
        load: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")
        },
        forEach: function(e) {
            var t, r, n;
            for (t in this.files) this.files.hasOwnProperty(t) && (n = this.files[t], (r = t.slice(this.root.length, t.length)) && t.slice(0, this.root.length) === this.root && e(r, n))
        },
        filter: function(e) {
            var t = [];
            return this.forEach(function(r, n) {
                e(r, n) && t.push(n)
            }), t
        },
        file: function(e, t, r) {
            if (1 === arguments.length) {
                if (Ms(e)) {
                    var n = e;
                    return this.filter(function(e, t) {
                        return !t.dir && n.test(e)
                    })
                }
                var i = this.files[this.root + e];
                return i && !i.dir ? i : null
            }
            return e = this.root + e, Ls.call(this, e, t, r), this
        },
        folder: function(e) {
            if (!e) return this;
            if (Ms(e)) return this.filter(function(t, r) {
                return r.dir && e.test(t)
            });
            var t = this.root + e,
                r = Ds.call(this, t),
                n = this.clone();
            return n.root = r.name, n
        },
        remove: function(e) {
            e = this.root + e;
            var t = this.files[e];
            if (t || ("/" !== e.slice(-1) && (e += "/"), t = this.files[e]), t && !t.dir) delete this.files[e];
            else
                for (var r = this.filter(function(t, r) {
                        return r.name.slice(0, e.length) === e
                    }), n = 0; n < r.length; n++) delete this.files[r[n].name];
            return this
        },
        generate: function(e) {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")
        },
        generateInternalStream: function(e) {
            var t, r = {};
            try {
                if ((r = Gr.extend(e || {}, {
                        streamFiles: !1,
                        compression: "STORE",
                        compressionOptions: null,
                        type: "",
                        platform: "DOS",
                        comment: null,
                        mimeType: "application/zip",
                        encodeFileName: en.utf8encode
                    })).type = r.type.toLowerCase(), r.compression = r.compression.toUpperCase(), "binarystring" === r.type && (r.type = "string"), !r.type) throw new Error("No output type specified.");
                Gr.checkSupport(r.type), "darwin" !== r.platform && "freebsd" !== r.platform && "linux" !== r.platform && "sunos" !== r.platform || (r.platform = "UNIX"), "win32" === r.platform && (r.platform = "DOS");
                var n = r.comment || this.comment || "";
                t = Bs(this, r, n)
            } catch (e) {
                (t = new Qr("error")).error(e)
            }
            return new fn(t, r.type || "string", r.mimeType)
        },
        generateAsync: function(e, t) {
            return this.generateInternalStream(e).accumulate(t)
        },
        generateNodeStream: function(e, t) {
            return (e = e || {}).type || (e.type = "nodebuffer"), this.generateInternalStream(e).toNodejsStream(t)
        }
    };

    function Fs(e) {
        this.data = e, this.length = e.length, this.index = 0, this.zero = 0
    }
    Fs.prototype = {
        checkOffset: function(e) {
            this.checkIndex(this.index + e)
        },
        checkIndex: function(e) {
            if (this.length < this.zero + e || e < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e + "). Corrupted zip ?")
        },
        setIndex: function(e) {
            this.checkIndex(e), this.index = e
        },
        skip: function(e) {
            this.setIndex(this.index + e)
        },
        byteAt: function(e) {},
        readInt: function(e) {
            var t, r = 0;
            for (this.checkOffset(e), t = this.index + e - 1; t >= this.index; t--) r = (r << 8) + this.byteAt(t);
            return this.index += e, r
        },
        readString: function(e) {
            return Gr.transformTo("string", this.readData(e))
        },
        readData: function(e) {},
        lastIndexOfSignature: function(e) {},
        readAndCheckSignature: function(e) {},
        readDate: function() {
            var e = this.readInt(4);
            return new Date(Date.UTC(1980 + (e >> 25 & 127), (e >> 21 & 15) - 1, e >> 16 & 31, e >> 11 & 31, e >> 5 & 63, (31 & e) << 1))
        }
    };
    var Ns = Fs;

    function Zs(e) {
        Ns.call(this, e);
        for (var t = 0; t < this.data.length; t++) e[t] = 255 & e[t]
    }
    Gr.inherits(Zs, Ns), Zs.prototype.byteAt = function(e) {
        return this.data[this.zero + e]
    }, Zs.prototype.lastIndexOfSignature = function(e) {
        for (var t = e.charCodeAt(0), r = e.charCodeAt(1), n = e.charCodeAt(2), i = e.charCodeAt(3), a = this.length - 4; a >= 0; --a)
            if (this.data[a] === t && this.data[a + 1] === r && this.data[a + 2] === n && this.data[a + 3] === i) return a - this.zero;
        return -1
    }, Zs.prototype.readAndCheckSignature = function(e) {
        var t = e.charCodeAt(0),
            r = e.charCodeAt(1),
            n = e.charCodeAt(2),
            i = e.charCodeAt(3),
            a = this.readData(4);
        return t === a[0] && r === a[1] && n === a[2] && i === a[3]
    }, Zs.prototype.readData = function(e) {
        if (this.checkOffset(e), 0 === e) return [];
        var t = this.data.slice(this.zero + this.index, this.zero + this.index + e);
        return this.index += e, t
    };
    var Ws = Zs;

    function Ys(e) {
        Ns.call(this, e)
    }
    Gr.inherits(Ys, Ns), Ys.prototype.byteAt = function(e) {
        return this.data.charCodeAt(this.zero + e)
    }, Ys.prototype.lastIndexOfSignature = function(e) {
        return this.data.lastIndexOf(e) - this.zero
    }, Ys.prototype.readAndCheckSignature = function(e) {
        return e === this.readData(4)
    }, Ys.prototype.readData = function(e) {
        this.checkOffset(e);
        var t = this.data.slice(this.zero + this.index, this.zero + this.index + e);
        return this.index += e, t
    };
    var qs = Ys;

    function Hs(e) {
        Ws.call(this, e)
    }
    Gr.inherits(Hs, Ws), Hs.prototype.readData = function(e) {
        if (this.checkOffset(e), 0 === e) return new Uint8Array(0);
        var t = this.data.subarray(this.zero + this.index, this.zero + this.index + e);
        return this.index += e, t
    };
    var Ks = Hs;

    function Xs(e) {
        Ks.call(this, e)
    }
    Gr.inherits(Xs, Ks), Xs.prototype.readData = function(e) {
        this.checkOffset(e);
        var t = this.data.slice(this.zero + this.index, this.zero + this.index + e);
        return this.index += e, t
    };
    var Vs = Xs,
        $s = function(e) {
            var t = Gr.getTypeOf(e);
            return Gr.checkSupport(t), "string" !== t || Zt.uint8array ? "nodebuffer" === t ? new Vs(e) : Zt.uint8array ? new Ks(Gr.transformTo("uint8array", e)) : new Ws(Gr.transformTo("array", e)) : new qs(e)
        };

    function Gs(e, t) {
        this.options = e, this.loadOptions = t
    }
    Gs.prototype = {
        isEncrypted: function() {
            return 1 == (1 & this.bitFlag)
        },
        useUTF8: function() {
            return 2048 == (2048 & this.bitFlag)
        },
        readLocalPart: function(e) {
            var t, r;
            if (e.skip(22), this.fileNameLength = e.readInt(2), r = e.readInt(2), this.fileName = e.readData(this.fileNameLength), e.skip(r), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory (compressedSize === -1 || uncompressedSize === -1)");
            if (null === (t = function(e) {
                    for (var t in _s)
                        if (_s.hasOwnProperty(t) && _s[t].magic === e) return _s[t];
                    return null
                }(this.compressionMethod))) throw new Error("Corrupted zip : compression " + Gr.pretty(this.compressionMethod) + " unknown (inner file : " + Gr.transformTo("string", this.fileName) + ")");
            this.decompressed = new bn(this.compressedSize, this.uncompressedSize, this.crc32, t, e.readData(this.compressedSize))
        },
        readCentralPart: function(e) {
            this.versionMadeBy = e.readInt(2), e.skip(2), this.bitFlag = e.readInt(2), this.compressionMethod = e.readString(2), this.date = e.readDate(), this.crc32 = e.readInt(4), this.compressedSize = e.readInt(4), this.uncompressedSize = e.readInt(4);
            var t = e.readInt(2);
            if (this.extraFieldsLength = e.readInt(2), this.fileCommentLength = e.readInt(2), this.diskNumberStart = e.readInt(2), this.internalFileAttributes = e.readInt(2), this.externalFileAttributes = e.readInt(4), this.localHeaderOffset = e.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
            e.skip(t), this.readExtraFields(e), this.parseZIP64ExtraField(e), this.fileComment = e.readData(this.fileCommentLength)
        },
        processAttributes: function() {
            this.unixPermissions = null, this.dosPermissions = null;
            var e = this.versionMadeBy >> 8;
            this.dir = !!(16 & this.externalFileAttributes), 0 === e && (this.dosPermissions = 63 & this.externalFileAttributes), 3 === e && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = !0)
        },
        parseZIP64ExtraField: function(e) {
            if (this.extraFields[1]) {
                var t = $s(this.extraFields[1].value);
                this.uncompressedSize === Gr.MAX_VALUE_32BITS && (this.uncompressedSize = t.readInt(8)), this.compressedSize === Gr.MAX_VALUE_32BITS && (this.compressedSize = t.readInt(8)), this.localHeaderOffset === Gr.MAX_VALUE_32BITS && (this.localHeaderOffset = t.readInt(8)), this.diskNumberStart === Gr.MAX_VALUE_32BITS && (this.diskNumberStart = t.readInt(4))
            }
        },
        readExtraFields: function(e) {
            var t, r, n, i = e.index + this.extraFieldsLength;
            for (this.extraFields || (this.extraFields = {}); e.index < i;) t = e.readInt(2), r = e.readInt(2), n = e.readData(r), this.extraFields[t] = {
                id: t,
                length: r,
                value: n
            }
        },
        handleUTF8: function() {
            var e = Zt.uint8array ? "uint8array" : "array";
            if (this.useUTF8()) this.fileNameStr = en.utf8decode(this.fileName), this.fileCommentStr = en.utf8decode(this.fileComment);
            else {
                var t = this.findExtraFieldUnicodePath();
                if (null !== t) this.fileNameStr = t;
                else {
                    var r = Gr.transformTo(e, this.fileName);
                    this.fileNameStr = this.loadOptions.decodeFileName(r)
                }
                var n = this.findExtraFieldUnicodeComment();
                if (null !== n) this.fileCommentStr = n;
                else {
                    var i = Gr.transformTo(e, this.fileComment);
                    this.fileCommentStr = this.loadOptions.decodeFileName(i)
                }
            }
        },
        findExtraFieldUnicodePath: function() {
            var e = this.extraFields[28789];
            if (e) {
                var t = $s(e.value);
                return 1 !== t.readInt(1) ? null : vn(this.fileName) !== t.readInt(4) ? null : en.utf8decode(t.readData(e.length - 5))
            }
            return null
        },
        findExtraFieldUnicodeComment: function() {
            var e = this.extraFields[25461];
            if (e) {
                var t = $s(e.value);
                return 1 !== t.readInt(1) ? null : vn(this.fileComment) !== t.readInt(4) ? null : en.utf8decode(t.readData(e.length - 5))
            }
            return null
        }
    };
    var Js = Gs;

    function Qs(e) {
        this.files = [], this.loadOptions = e
    }
    Qs.prototype = {
        checkSignature: function(e) {
            if (!this.reader.readAndCheckSignature(e)) {
                this.reader.index -= 4;
                var t = this.reader.readString(4);
                throw new Error("Corrupted zip or bug: unexpected signature (" + Gr.pretty(t) + ", expected " + Gr.pretty(e) + ")")
            }
        },
        isSignature: function(e, t) {
            var r = this.reader.index;
            this.reader.setIndex(e);
            var n = this.reader.readString(4) === t;
            return this.reader.setIndex(r), n
        },
        readBlockEndOfCentral: function() {
            this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
            var e = this.reader.readData(this.zipCommentLength),
                t = Zt.uint8array ? "uint8array" : "array",
                r = Gr.transformTo(t, e);
            this.zipComment = this.loadOptions.decodeFileName(r)
        },
        readBlockZip64EndOfCentral: function() {
            this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
            for (var e, t, r, n = this.zip64EndOfCentralSize - 44; 0 < n;) e = this.reader.readInt(2), t = this.reader.readInt(4), r = this.reader.readData(t), this.zip64ExtensibleData[e] = {
                id: e,
                length: t,
                value: r
            }
        },
        readBlockZip64EndOfCentralLocator: function() {
            if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), this.disksCount > 1) throw new Error("Multi-volumes zip are not supported")
        },
        readLocalFiles: function() {
            var e, t;
            for (e = 0; e < this.files.length; e++) t = this.files[e], this.reader.setIndex(t.localHeaderOffset), this.checkSignature(bs), t.readLocalPart(this.reader), t.handleUTF8(), t.processAttributes()
        },
        readCentralDir: function() {
            var e;
            for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(ks);)(e = new Js({
                zip64: this.zip64
            }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e);
            if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length)
        },
        readEndOfCentral: function() {
            var e = this.reader.lastIndexOfSignature(xs);
            if (e < 0) throw !this.isSignature(0, bs) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
            this.reader.setIndex(e);
            var t = e;
            if (this.checkSignature(xs), this.readBlockEndOfCentral(), this.diskNumber === Gr.MAX_VALUE_16BITS || this.diskWithCentralDirStart === Gr.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === Gr.MAX_VALUE_16BITS || this.centralDirRecords === Gr.MAX_VALUE_16BITS || this.centralDirSize === Gr.MAX_VALUE_32BITS || this.centralDirOffset === Gr.MAX_VALUE_32BITS) {
                if (this.zip64 = !0, (e = this.reader.lastIndexOfSignature(Ss)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
                if (this.reader.setIndex(e), this.checkSignature(Ss), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, Es) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(Es), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
                this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(Es), this.readBlockZip64EndOfCentral()
            }
            var r = this.centralDirOffset + this.centralDirSize;
            this.zip64 && (r += 20, r += 12 + this.zip64EndOfCentralSize);
            var n = t - r;
            if (n > 0) this.isSignature(t, ks) || (this.reader.zero = n);
            else if (n < 0) throw new Error("Corrupted zip: missing " + Math.abs(n) + " bytes.")
        },
        prepareReader: function(e) {
            this.reader = $s(e)
        },
        load: function(e) {
            this.prepareReader(e), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles()
        }
    };
    var eh = Qs;

    function th(e) {
        return new $r.Promise(function(t, r) {
            var n = e.decompressed.getContentWorker().pipe(new wn);
            n.on("error", function(e) {
                r(e)
            }).on("end", function() {
                n.streamInfo.crc32 !== e.decompressed.crc32 ? r(new Error("Corrupted zip : CRC32 mismatch")) : t()
            }).resume()
        })
    }

    function rh() {
        if (!(this instanceof rh)) return new rh;
        if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
        this.files = {}, this.comment = null, this.root = "", this.clone = function() {
            var e = new rh;
            for (var t in this) "function" != typeof this[t] && (e[t] = this[t]);
            return e
        }
    }
    rh.prototype = js, rh.prototype.loadAsync = function(e, t) {
        var r = this;
        return t = Gr.extend(t || {}, {
            base64: !1,
            checkCRC32: !1,
            optimizedBinaryString: !1,
            createFolders: !1,
            decodeFileName: en.utf8decode
        }), qt && Vt(e) ? $r.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : Gr.prepareContent("the loaded zip file", e, !0, t.optimizedBinaryString, t.base64).then(function(e) {
            var r = new eh(t);
            return r.load(e), r
        }).then(function(e) {
            var r = [$r.Promise.resolve(e)],
                n = e.files;
            if (t.checkCRC32)
                for (var i = 0; i < n.length; i++) r.push(th(n[i]));
            return $r.Promise.all(r)
        }).then(function(e) {
            for (var n = e.shift(), i = n.files, a = 0; a < i.length; a++) {
                var o = i[a];
                r.file(o.fileNameStr, o.decompressed, {
                    binary: !0,
                    optimizedBinaryString: !0,
                    date: o.date,
                    dir: o.dir,
                    comment: o.fileCommentStr.length ? o.fileCommentStr : null,
                    unixPermissions: o.unixPermissions,
                    dosPermissions: o.dosPermissions,
                    createFolders: t.createFolders
                })
            }
            return n.zipComment.length && (r.comment = n.zipComment), r
        })
    }, rh.support = Zt, rh.defaults = ln, rh.version = "3.1.5", rh.loadAsync = function(e, t) {
        return (new rh).loadAsync(e, t)
    }, rh.external = $r;
    var nh = rh,
        ih = r(function(e, r) {
            (function() {
                function r(e, t, r) {
                    var n = new XMLHttpRequest;
                    n.open("GET", e), n.responseType = "blob", n.onload = function() {
                        o(n.response, t, r)
                    }, n.onerror = function() {
                        console.error("could not download file")
                    }, n.send()
                }

                function n(e) {
                    var t = new XMLHttpRequest;
                    return t.open("HEAD", e, !1), t.send(), 200 <= t.status && 299 >= t.status
                }

                function i(e) {
                    try {
                        e.dispatchEvent(new MouseEvent("click"))
                    } catch (r) {
                        var t = document.createEvent("MouseEvents");
                        t.initMouseEvent("click", !0, !0, window, 0, 0, 0, 80, 20, !1, !1, !1, !1, 0, null), e.dispatchEvent(t)
                    }
                }
                var a = "object" == typeof window && window.window === window ? window : "object" == typeof self && self.self === self ? self : "object" == typeof t && t.global === t ? t : void 0,
                    o = a.saveAs || "object" != typeof window || window !== a ? function() {} : "download" in HTMLAnchorElement.prototype ? function(e, t, o) {
                        var s = a.URL || a.webkitURL,
                            h = document.createElement("a");
                        t = t || e.name || "download", h.download = t, h.rel = "noopener", "string" == typeof e ? (h.href = e, h.origin === location.origin ? i(h) : n(h.href) ? r(e, t, o) : i(h, h.target = "_blank")) : (h.href = s.createObjectURL(e), setTimeout(function() {
                            s.revokeObjectURL(h.href)
                        }, 4e4), setTimeout(function() {
                            i(h)
                        }, 0))
                    } : "msSaveOrOpenBlob" in navigator ? function(e, t, a) {
                        if (t = t || e.name || "download", "string" != typeof e) navigator.msSaveOrOpenBlob(function(e, t) {
                            return void 0 === t ? t = {
                                autoBom: !1
                            } : "object" != typeof t && (console.warn("Depricated: Expected third argument to be a object"), t = {
                                autoBom: !t
                            }), t.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type) ? new Blob(["\ufeff", e], {
                                type: e.type
                            }) : e
                        }(e, a), t);
                        else if (n(e)) r(e, t, a);
                        else {
                            var o = document.createElement("a");
                            o.href = e, o.target = "_blank", setTimeout(function() {
                                i(o)
                            })
                        }
                    } : function(e, t, n, i) {
                        if ((i = i || open("", "_blank")) && (i.document.title = i.document.body.innerText = "downloading..."), "string" == typeof e) return r(e, t, n);
                        var o = "application/octet-stream" === e.type,
                            s = /constructor/i.test(a.HTMLElement) || a.safari,
                            h = /CriOS\/[\d]+/.test(navigator.userAgent);
                        if ((h || o && s) && "object" == typeof FileReader) {
                            var u = new FileReader;
                            u.onloadend = function() {
                                var e = u.result;
                                e = h ? e : e.replace(/^data:[^;]*;/, "data:attachment/file;"), i ? i.location.href = e : location = e, i = null
                            }, u.readAsDataURL(e)
                        } else {
                            var f = a.URL || a.webkitURL,
                                l = f.createObjectURL(e);
                            i ? i.location = l : location.href = l, i = null, setTimeout(function() {
                                f.revokeObjectURL(l)
                            }, 4e4)
                        }
                    };
                a.saveAs = o.saveAs = o, e.exports = o
            })()
        });
    const ah = ["string", "number"];
    var oh = e => e.filename ? "string" != typeof e.filename ? (console.error("Zipclex filename can only be of type string"), !1) : Array.isArray(e.sheet.data) ? !!(e => e.every(e => Array.isArray(e)))(e.sheet.data) || (console.error("Zipclex sheet data childs is not of type array"), !1) : (console.error("Zipcelx sheet data is not of type array"), !1) : (console.error("Zipclex config missing property filename"), !1),
        sh = 1 / 0,
        hh = "[object Symbol]",
        uh = /[&<>"'`]/g,
        fh = RegExp(uh.source),
        lh = "object" == typeof t && t && t.Object === Object && t,
        ch = "object" == typeof self && self && self.Object === Object && self,
        dh = lh || ch || Function("return this")();
    var ph = function(e) {
            return function(t) {
                return null == e ? void 0 : e[t]
            }
        }({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
            "`": "&#96;"
        }),
        mh = Object.prototype.toString,
        gh = dh.Symbol,
        vh = gh ? gh.prototype : void 0,
        yh = vh ? vh.toString : void 0;

    function wh(e) {
        if ("string" == typeof e) return e;
        if (function(e) {
                return "symbol" == typeof e || function(e) {
                    return !!e && "object" == typeof e
                }(e) && mh.call(e) == hh
            }(e)) return yh ? yh.call(e) : "";
        var t = e + "";
        return "0" == t && 1 / e == -sh ? "-0" : t
    }
    var _h = function(e) {
        var t;
        return (e = null == (t = e) ? "" : wh(t)) && fh.test(e) ? e.replace(uh, ph) : e
    };
    const bh = e => {
        if ("number" != typeof e) return "";
        const t = Math.floor(e / 26),
            r = String.fromCharCode(97 + e % 26).toUpperCase();
        return 0 === t ? r : bh(t - 1) + r
    };
    var kh = (e, t) => `${bh(e)}${t}`,
        xh = (e, t, r) => (-1 === ah.indexOf(e.type) && (console.warn('Invalid type supplied in cell config, falling back to "string"'), e.type = "string"), "string" === e.type ? ((e, t, r) => `<c r="${kh(e,r)}" t="inlineStr"><is><t>${_h(t)}</t></is></c>`)(t, e.value, r) : ((e, t, r) => `<c r="${kh(e,r)}"><v>${t}</v></c>`)(t, e.value, r)),
        Sh = e => e.map((e, t) => ((e, t) => {
            const r = t + 1,
                n = e.map((e, t) => xh(e, t, r)).join("");
            return `<row r="${r}">${n}</row>`
        })(e, t)).join(""),
        Eh = '<?xml version="1.0" ?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"><sheetData>{placeholder}</sheetData></worksheet>';
    e.zipcelx = (e => {
        if (!oh(e)) throw new Error("Validation failed.");
        const t = new nh,
            r = t.folder("xl");
        r.file("workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"><workbookPr/><sheets><sheet state="visible" name="Sheet1" sheetId="1" r:id="rId3"/></sheets><definedNames/><calcPr/></workbook>'), r.file("_rels/workbook.xml.rels", '<?xml version="1.0" ?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n<Relationship Id="rId3" Target="worksheets/sheet1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/>\n</Relationships>'), t.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'), t.file("[Content_Types].xml", '<?xml version="1.0" ?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n<Default ContentType="application/xml" Extension="xml"/>\n<Default ContentType="application/vnd.openxmlformats-package.relationships+xml" Extension="rels"/>\n<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" PartName="/xl/worksheets/sheet1.xml"/>\n<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" PartName="/xl/workbook.xml"/>\n</Types>');
        const n = (e => {
            const t = Sh(e);
            return Eh.replace("{placeholder}", t)
        })(e.sheet.data);
        return r.file("worksheets/sheet1.xml", n), t.generateAsync({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }).then(t => {
            ih.saveAs(t, `${e.filename}.xlsx`)
        })
    })
});