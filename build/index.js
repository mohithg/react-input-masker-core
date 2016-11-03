'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ReactInputSelection = require('react/lib/ReactInputSelection');

var _inputmaskCore = require('inputmask-core');

var _inputmaskCore2 = _interopRequireDefault(_inputmaskCore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
      // console.log('onKeyDown', JSON.stringify(getSelection(this.input)), e.key, e.target.value)

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

      // Ignore modified key presses
      // Ignore enter key to allow form submission
      if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') {
        return;
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
          (0, _ReactInputSelection.setSelection)(_this2.input, { start: 0, end: 0 });
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
        selection: (0, _ReactInputSelection.getSelection)(this.input)
      });
    }
  }, {
    key: 'updateMaskSelection',
    value: function updateMaskSelection() {
      this.mask.selection = (0, _ReactInputSelection.getSelection)(this.input);
    }
  }, {
    key: 'updateInputSelection',
    value: function updateInputSelection() {
      (0, _ReactInputSelection.setSelection)(this.input, this.mask.selection);
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
      return _react2.default.createElement('input', _extends({}, this.props, {
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
  mask: _react2.default.PropTypes.string.isRequired,
  formatCharacters: _react2.default.PropTypes.object,
  placeholderChar: _react2.default.PropTypes.string,
  size: _react2.default.PropTypes.any,
  placeholder: _react2.default.PropTypes.string,
  onBlur: _react2.default.PropTypes.func,
  onFocus: _react2.default.PropTypes.func,
  value: _react2.default.PropTypes.any,
  onChange: _react2.default.PropTypes.func
};

InputMasker.defaultProps = {
  value: ''
};

exports.default = InputMasker;