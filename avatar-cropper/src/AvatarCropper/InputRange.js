import React, { PropTypes } from 'react'
import './InputRange.css'

const InputRange = ({ max, min, value, onChange }) =>
  <input
    className="InputRange"
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
