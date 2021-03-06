import React, { PropTypes } from 'react'
import './InputRange.css'

const InputRange = ({ max, min, value, onChange, style }) =>
  <input
    className="InputRange"
    max={ max || 100 }
    min={ min || 25 }
    value={ value || 50 }
    onChange={ onChange }
    style={ style }
    type="range"
  />

InputRange.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  style: PropTypes.object,
  value: PropTypes.number
}

export default InputRange
