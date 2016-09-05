import React from 'react'
import './App.css'

import CoverCropper from './components/CoverCropper'

const App = () =>
  <div className="App">
    <div className="container">
      <CoverCropper height={ 270 } width={ 1050 } />
    </div>
  </div>

export default App
