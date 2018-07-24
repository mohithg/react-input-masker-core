import React from 'react';
import PropTypes from 'prop-types';
import InputMask from 'inputmask-core';

const KEYCODE_Z = 90;
const KEYCODE_Y = 89;

function isUndo(e) {
  return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Y : KEYCODE_Z);
}

function isRedo(e) {
  return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Z : KEYCODE_Y);
}

function getSelection(el) {
  var start, end, rangeEl, clone;

  if (el.selectionStart !== undefined) {
    start = el.selectionStart
    end = el.selectionEnd
  }
  else {
    try {
      el.focus()
      rangeEl = el.createTextRange()
      clone = rangeEl.duplicate()

      rangeEl.moveToBookmark(document.selection.createRange().getBookmark());
      clone.setEndPoint('EndToStart', rangeEl);

      start = clone.text.length;
      end = start + rangeEl.text.length
    }
    catch (e) { /* not focused or not visible */ }
  }

  return { start, end }
}

function setSelection(el, selection) {
  var rangeEl;

  try {
    if (el.selectionStart !== undefined) {
      el.focus()
      el.setSelectionRange(selection.start, selection.end)
    }
    else {
      el.focus();
      rangeEl = el.createTextRange();
      rangeEl.collapse(true);
      rangeEl.moveStart('character', selection.start);
      rangeEl.moveEnd('character', selection.end - selection.start);
      rangeEl.select();
    }
  }
  catch (e) { /* not focused or not visible */ }
}

class InputMasker extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.mask = '';

    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onPaste = this.onPaste.bind(this);
    this.focus = this.focus.bind(this);
    this.blur = this.blur.bind(this);
  }

  componentWillMount() {
    const options = {
      pattern: this.props.mask,
      value: this.props.value,
      formatCharacters: this.props.formatCharacters,
    };
    if (this.props.placeholderChar) {
      options.placeholderChar = this.props.placeholderChar;
    }
    this.mask = new InputMask(options);
  }

  componentWillReceiveProps(nextProps) {
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

  componentWillUpdate(nextProps) {
    if (nextProps.mask !== this.props.mask) {
      this.updatePattern(nextProps);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.mask !== this.props.mask && this.mask.selection.start) {
      this.updateInputSelection();
    }
  }

  onChange(e) {
    // console.log('onChange', JSON.stringify(getSelection(this.input)), e.target.value)

    const maskValue = this.mask.getValue();
    if (e.target.value !== maskValue) {
      // Cut or delete operations will have shortened the value
      if (e.target.value.length < maskValue.length) {
        const sizeDiff = maskValue.length - e.target.value.length;
        this.updateMaskSelection();
        this.mask.selection.end = this.mask.selection.start + sizeDiff;
        this.mask.backspace();
      }
      const value = this.getDisplayValue();
      e.target.value = value; // eslint-disable-line no-param-reassign
      if (value) {
        this.updateInputSelection();
      }
    }
    if (this.props.onChange) {
      this.props.onChange(e);
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      this.props.onEnter(this.mask.getValue());
    }

    // console.log('onKeyDown', JSON.stringify(getSelection(this.input)), e.key, e.target.value)
    if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') { e.preventDefault(); return; }

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
        const value = this.getDisplayValue();
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

  onKeyPress(e) {
    // console.log('onKeyPress', JSON.stringify(getSelection(this.input)), e.key, e.target.value)

    if (e.key === 'Enter') {
      this.props.onEnter(this.mask.getValue());
    }

    // Ignore modified key presses
    // Ignore enter key to allow form submission
    if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') { e.preventDefault(); return; }

    e.preventDefault();
    this.updateMaskSelection();
    if (this.mask.input((e.key || e.data))) {
      e.target.value = this.mask.getValue(); // eslint-disable-line no-param-reassign
      this.updateInputSelection();
      if (this.props.onChange) {
        this.props.onChange(e);
      }
    }
  }

  onPaste(e) {
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

  getDisplayValue() {
    const value = this.mask.getValue();
    if (this.state.focus && (value === this.mask.emptyValue)) {
      setTimeout(
        () => {
          setSelection(this.input, { start: 0, end: 0 });
        },
        1
      );
      return value;
    }
    return value === this.mask.emptyValue ? '' : value;
  }

  updatePattern(props) {
    this.mask.setPattern(props.mask, {
      value: this.mask.getRawValue(),
      selection: getSelection(this.input),
    });
  }

  updateMaskSelection() {
    this.mask.selection = getSelection(this.input);
  }

  updateInputSelection() {
    setSelection(this.input, this.mask.selection);
  }

  focus() {
    this.setState({
      focus: true,
    });
    this.input.focus();
    this.props.onFocus();
  }

  blur() {
    this.setState({
      focus: false,
    });
    this.input.blur();
    this.props.onBlur();
  }

  render() {
    /* eslint-disable */
    const patternLength = this.mask.pattern.length;
    const { onEnter, ...props } = this.props;
    return (<input
      {...props}
      ref={r => this.input = r}
      maxLength={patternLength}
      onChange={this.onChange}
      onKeyDown={this.onKeyDown}
      onFocus={this.focus}
      onBlur={this.blur}
      onBeforeInput={this.onKeyPress}
      onPaste={this.onPaste}
      placeholder={this.props.placeholder || this.mask.emptyValue}
      size={this.props.size || patternLength}
      value={this.getDisplayValue()}
    />);
    /* eslint-enable */
  }
}

InputMasker.propTypes = {
  mask: PropTypes.string.isRequired,
  formatCharacters: PropTypes.object,
  placeholderChar: PropTypes.string,
  size: PropTypes.any,
  placeholder: PropTypes.string,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onEnter: PropTypes.func,
};

InputMasker.defaultProps = {
  value: '',
  onEnter: () => {},
};

export default InputMasker;
