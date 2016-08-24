import React, { PropTypes } from 'react'

const InputRange = ({ max, min, value, onChange }) =>
  <input
    max={ max || 100 }
    min={ min || 25 }
    value={ value || 50 }
    onChange={ onChange }
    type="range"
  />

InputRange.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  value: PropTypes.number,
  onChange: PropTypes.func
}

export default InputRange
