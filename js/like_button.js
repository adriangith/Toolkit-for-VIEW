'use strict';

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return !!right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var e = React.createElement;
var element = React.createElement("table", {
  className: "childTable",
  cellSpacing: "0",
  cellPadding: "0",
  width: "100%",
  border: "0"
}, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
  valign: "top"
}, React.createElement("table", {
  cellSpacing: "0",
  cellPadding: "0",
  width: "100%",
  border: "0"
}, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
  className: "menu-header",
  width: "20%"
}, React.createElement("p", null, "\xA0", React.createElement("span", {
  id: "label_KeeperDetails"
}, "Obligation Groups"), "\xA0")), React.createElement("td", {
  align: "right"
}, "\xA0")))))), React.createElement("tr", null, React.createElement("td", {
  valign: "top"
}, React.createElement("div", {
  id: "dvNoticeKeeperVw",
  style: {
    display: 'inline'
  }
}, React.createElement("table", {
  className: "bordertable",
  id: "tblKeeperInfo",
  cellSpacing: "0",
  cellPadding: "0",
  width: "100%",
  border: "0"
}, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
  className: "tdrowspace",
  colSpan: "9"
})), React.createElement("tr", null, React.createElement("td", {
  className: "firstcol"
}, "\xA0"), React.createElement("td", {
  className: "seccol"
}, React.createElement("span", {
  id: "lblTitleHd",
  className: "label-text"
})), React.createElement("td", {
  className: "thirdcol"
}), React.createElement("td", {
  className: "fourthcol"
}, React.createElement("button", {
  type: "button",
  style: {
    width: '200px',
    height: '18px',
    backgroundColor: '#43088e',
    color: 'white',
    borderRadius: '4px'
  }
}, "Create New Group")), React.createElement("td", {
  className: "thirdcol"
}), React.createElement("td", {
  className: "fifthcol"
}, React.createElement("span", {
  id: "Label14",
  className: "label-text"
}, "All Groups:")), React.createElement("td", {
  className: "thirdcol"
}), React.createElement("td", {
  className: "sixthcol"
}, React.createElement("select", {
  style: {
    width: '162px',
    backgroundColor: '#43088e',
    color: 'white'
  }
}, React.createElement("option", {
  value: "volvo"
}, "Generate Letter(s)"), React.createElement("option", {
  value: "saab"
}, "Extract Data"), React.createElement("option", {
  value: "mercedes"
}, "Fees Removed"), React.createElement("option", {
  value: "audi"
}, "Fees Refused")), React.createElement("img", {
  src: chrome.extension.getURL("Images/round-arrow_forward-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
})), React.createElement("td", {
  className: "seventhcol"
}, "\xA0")), React.createElement("tr", null, React.createElement("td", {
  className: "tdrowspace",
  colSpan: "9"
})), React.createElement("tr", null, React.createElement("td", {
  className: "firstcol"
}, "\xA0"), React.createElement("td", {
  className: "seccol"
}, React.createElement("input", {
  type: "checkbox",
  name: "vehicle1",
  value: "Bike",
  style: {
    verticalAlign: 'middle'
  }
}), React.createElement("select", null, React.createElement("option", {
  value: "volvo"
}, "Confirmed"), React.createElement("option", {
  value: "saab"
}, "Group Type"), React.createElement("option", {
  value: "mercedes"
}, "Fees Removed"), React.createElement("option", {
  value: "audi"
}, "Fees Refused"))), React.createElement("td", {
  className: "thirdcol"
}), React.createElement("td", {
  className: "fourthcol"
}, React.createElement("div", {
  style: {
    display: 'inline',
    float: 'right'
  }
}, React.createElement("img", {
  src: chrome.extension.getURL("Images/baseline-history-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
})), React.createElement("select", null, React.createElement("option", {
  value: "volvo"
}, "Generate Letter(s)"), React.createElement("option", {
  value: "saab"
}, "Action"), React.createElement("option", {
  value: "mercedes"
}, "Bulk Note Update"), React.createElement("option", {
  value: "audi"
}, "Bulk Hold Update")), React.createElement("img", {
  src: chrome.extension.getURL("Images/outline-assignment-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
}), React.createElement("img", {
  src: chrome.extension.getURL("Images/round-arrow_forward-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
})), React.createElement("td", {
  className: "thirdcol"
}), React.createElement("td", {
  className: "fifthcol"
}, React.createElement("span", {
  id: "Label14",
  className: "label-text"
}, "Obligations:")), React.createElement("td", {
  className: "thirdcol"
}), React.createElement("td", {
  className: "sixthcol"
}, React.createElement("span", {
  id: "lblKeeperSource",
  className: "labelbox"
}, "48"), React.createElement("img", {
  src: chrome.extension.getURL("Images/outline-edit-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle',
    marginLeft: '60px'
  }
}), React.createElement("img", {
  src: chrome.extension.getURL("Images/round-add-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
}), React.createElement("img", {
  src: chrome.extension.getURL("Images/baseline-remove-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
}), React.createElement("img", {
  src: chrome.extension.getURL("Images/round-vertical_align_bottom-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
}), React.createElement("img", {
  src: chrome.extension.getURL("Images/round-clear-24px.svg"),
  style: {
    height: '80%',
    verticalAlign: 'middle'
  }
})), React.createElement("td", {
  className: "seventhcol"
}, "\xA0")), React.createElement("tr", null, React.createElement("td", {
  className: "tdrowspace",
  colSpan: "9"
})))))))));

var LikeButton =
/*#__PURE__*/
function (_React$Component) {
  _inherits(LikeButton, _React$Component);

  function LikeButton(props) {
    var _this;

    _classCallCheck(this, LikeButton);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(LikeButton).call(this, props));
    _this.state = {
      liked: false
    };
    return _this;
  }

  _createClass(LikeButton, [{
    key: "render",
    value: function render() {
      var _this2 = this;

      if (this.state.liked) {
        return 'You liked this.';
      }

      return e('button', {
        onClick: function onClick() {
          return _this2.setState({
            liked: true
          });
        }
      }, 'Like');
    }
  }]);

  return LikeButton;
}(React.Component);

var domContainer = document.getElementById('tblChild');
// ReactDOM.render(element, domContainer);