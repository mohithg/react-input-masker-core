'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _inputmaskCore = require('inputmask-core');

var _inputmaskCore2 = _interopRequireDefault(_inputmaskCore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var KEYCODE_Z = 90;
var KEYCODE_Y = 89;

function isUndo(e) {
  return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Y : KEYCODE_Z);
}

function isRedo(e) {
  return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Z : KEYCODE_Y);
}

function getSelection(el) {
  var start, end, rangeEl, clone;

  if (el.selectionStart !== undefined) {
    start = el.selectionStart;
    end = el.selectionEnd;
  } else {
    try {
      el.focus();
      rangeEl = el.createTextRange();
      clone = rangeEl.duplicate();

      rangeEl.moveToBookmark(document.selection.createRange().getBookmark());
      clone.setEndPoint('EndToStart', rangeEl);

      start = clone.text.length;
      end = start + rangeEl.text.length;
    } catch (e) {/* not focused or not visible */}
  }

  return { start: start, end: end };
}

function setSelection(el, selection) {
  var rangeEl;

  try {
    if (el.selectionStart !== undefined) {
      el.focus();
      el.setSelectionRange(selection.start, selection.end);
    } else {
      el.focus();
      rangeEl = el.createTextRange();
      rangeEl.collapse(true);
      rangeEl.moveStart('character', selection.start);
      rangeEl.moveEnd('character', selection.end - selection.start);
      rangeEl.select();
    }
  } catch (e) {/* not focused or not visible */}
}

var InputMasker = function (_React$Component) {
  _inherits(InputMasker, _React$Component);

  function InputMasker(props) {
    _classCallCheck(this, InputMasker);

    var _this = _possibleConstructorReturn(this, (InputMasker.__proto__ || Object.getPrototypeOf(InputMasker)).call(this, props));

    _this.state = {};
    _this.mask = '';

    _this.onChange = _this.onChange.bind(_this);
    _this.onKeyDown = _this.onKeyDown.bind(_this);
    _this.onKeyPress = _this.onKeyPress.bind(_this);
    _this.onPaste = _this.onPaste.bind(_this);
    _this.focus = _this.focus.bind(_this);
    _this.blur = _this.blur.bind(_this);
    return _this;
  }

  _createClass(InputMasker, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var options = {
        pattern: this.props.mask,
        value: this.props.value,
        formatCharacters: this.props.formatCharacters
      };
      if (this.props.placeholderChar) {
        options.placeholderChar = this.props.placeholderChar;
      }
      this.mask = new _inputmaskCore2.default(options);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (this.props.mask !== nextProps.mask && this.props.value !== nextProps.mask) {
        /**
         * if we get a new value and a new mask at the same time
         * check if the mask.value is still the initial value
         * - if so use the nextProps value
         * - otherwise the `this.mask` has a value for us (most likely from paste action)
         */
        if (this.mask.getValue() === this.mask.emptyValue) {
          this.mask.setPattern(nextProps.mask, { value: nextProps.value });
        } else {
          this.mask.setPattern(nextProps.mask, { value: this.mask.getRawValue() });
        }
      } else if (this.props.mask !== nextProps.mask) {
        this.mask.setPattern(nextProps.mask, { value: this.mask.getRawValue() });
      } else if (this.props.value !== nextProps.value) {
        this.mask.setValue(nextProps.value);
      }
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps) {
      if (nextProps.mask !== this.props.mask) {
        this.updatePattern(nextProps);
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps) {
      if (prevProps.mask !== this.props.mask && this.mask.selection.start) {
        this.updateInputSelection();
      }
    }
  }, {
    key: 'onChange',
    value: function onChange(e) {
      // console.log('onChange', JSON.stringify(getSelection(this.input)), e.target.value)

      var maskValue = this.mask.getValue();
      if (e.target.value !== maskValue) {
        // Cut or delete operations will have shortened the value
        if (e.target.value.length < maskValue.length) {
          var sizeDiff = maskValue.length - e.target.value.length;
          this.updateMaskSelection();
          this.mask.selection.end = this.mask.selection.start + sizeDiff;
          this.mask.backspace();
        }
        var value = this.getDisplayValue();
        e.target.value = value; // eslint-disable-line no-param-reassign
        if (value) {
          this.updateInputSelection();
        }
      }
      if (this.props.onChange) {
        this.props.onChange(e);
      }
    }
  }, {
    key: 'onKeyDown',
    value: function onKeyDown(e) {
      if (e.key === 'Enter') {
        this.props.onEnter(this.mask.getValue());
      }

      // console.log('onKeyDown', JSON.stringify(getSelection(this.input)), e.key, e.target.value)
      if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') {
        e.preventDefault();return;
      }

      if (isUndo(e)) {
        e.preventDefault();
        if (this.mask.undo()) {
          e.target.value = this.getDisplayValue(); // eslint-disable-line no-param-reassign
          this.updateInputSelection();
          if (this.props.onChange) {
            this.props.onChange(e);
          }
        }
        return;
      } else if (isRedo(e)) {
        e.preventDefault();
        if (this.mask.redo()) {
          e.target.value = this.getDisplayValue(); // eslint-disable-line no-param-reassign
          this.updateInputSelection();
          if (this.props.onChange) {
            this.props.onChange(e);
          }
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        this.updateMaskSelection();
        if (this.mask.backspace()) {
          var value = this.getDisplayValue();
          e.target.value = value; // eslint-disable-line no-param-reassign
          if (value) {
            this.updateInputSelection();
          }
          if (this.props.onChange) {
            this.props.onChange(e);
          }
        }
      }
    }
  }, {
    key: 'onKeyPress',
    value: function onKeyPress(e) {
      // console.log('onKeyPress', JSON.stringify(getSelection(this.input)), e.key, e.target.value)

      if (e.key === 'Enter') {
        this.props.onEnter(this.mask.getValue());
      }

      // Ignore modified key presses
      // Ignore enter key to allow form submission
      if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') {
        e.preventDefault();return;
      }

      e.preventDefault();
      this.updateMaskSelection();
      if (this.mask.input(e.key || e.data)) {
        e.target.value = this.mask.getValue(); // eslint-disable-line no-param-reassign
        this.updateInputSelection();
        if (this.props.onChange) {
          this.props.onChange(e);
        }
      }
    }
  }, {
    key: 'onPaste',
    value: function onPaste(e) {
      e.preventDefault();
      this.updateMaskSelection();
      // getData value needed for IE also works in FF & Chrome
      if (this.mask.paste(e.clipboardData.getData('Text'))) {
        e.target.value = this.mask.getValue(); // eslint-disable-line no-param-reassign
        // Timeout needed for IE
        setTimeout(this.updateInputSelection, 0);
        if (this.props.onChange) {
          this.props.onChange(e);
        }
      }
    }
  }, {
    key: 'getDisplayValue',
    value: function getDisplayValue() {
      var _this2 = this;

      var value = this.mask.getValue();
      if (this.state.focus && value === this.mask.emptyValue) {
        setTimeout(function () {
          setSelection(_this2.input, { start: 0, end: 0 });
        }, 1);
        return value;
      }
      return value === this.mask.emptyValue ? '' : value;
    }
  }, {
    key: 'updatePattern',
    value: function updatePattern(props) {
      this.mask.setPattern(props.mask, {
        value: this.mask.getRawValue(),
        selection: getSelection(this.input)
      });
    }
  }, {
    key: 'updateMaskSelection',
    value: function updateMaskSelection() {
      this.mask.selection = getSelection(this.input);
    }
  }, {
    key: 'updateInputSelection',
    value: function updateInputSelection() {
      setSelection(this.input, this.mask.selection);
    }
  }, {
    key: 'focus',
    value: function focus() {
      this.setState({
        focus: true
      });
      this.input.focus();
      this.props.onFocus();
    }
  }, {
    key: 'blur',
    value: function blur() {
      this.setState({
        focus: false
      });
      this.input.blur();
      this.props.onBlur();
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      /* eslint-disable */
      var patternLength = this.mask.pattern.length;

      var _props = this.props,
          onEnter = _props.onEnter,
          props = _objectWithoutProperties(_props, ['onEnter']);

      return _react2.default.createElement('input', _extends({}, props, {
        ref: function ref(r) {
          return _this3.input = r;
        },
        maxLength: patternLength,
        onChange: this.onChange,
        onKeyDown: this.onKeyDown,
        onFocus: this.focus,
        onBlur: this.blur,
        onBeforeInput: this.onKeyPress,
        onPaste: this.onPaste,
        placeholder: this.props.placeholder || this.mask.emptyValue,
        size: this.props.size || patternLength,
        value: this.getDisplayValue()
      }));
      /* eslint-enable */
    }
  }]);

  return InputMasker;
}(_react2.default.Component);

InputMasker.propTypes = {
  mask: _propTypes2.default.string.isRequired,
  formatCharacters: _propTypes2.default.object,
  placeholderChar: _propTypes2.default.string,
  size: _propTypes2.default.any,
  placeholder: _propTypes2.default.string,
  onBlur: _propTypes2.default.func,
  onFocus: _propTypes2.default.func,
  value: _propTypes2.default.any,
  onChange: _propTypes2.default.func,
  onEnter: _propTypes2.default.func
};

InputMasker.defaultProps = {
  value: '',
  onEnter: function onEnter() {}
};

exports.default = InputMasker;