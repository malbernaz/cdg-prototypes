import React, { Component } from 'react'
import './App.css'

import ImageCropper from '../components/ImageCropper'

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="container">
          <ImageCropper height={ 270 } width={ 1050 } />
        </div>
      </div>
    )
  }
}

export default App
