import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import InputRange from './InputRange'
import './AvatarCropper.css'

class AvatarCropper extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hasImage: false,
      scaleParams: {
        max: 25,
        min: 100,
        value: 50
      }
    }

    this.imageData = {
      image: null,
      initialCoords: { x: 0, y: 0 },
      factor: 1
    }
  }

  onDrop = file => {
    if (file[0].constructor !== File) return false

    const img = file[0]
    const reader = new FileReader()
    const image = new Image()
    const _this = this

    image.onload = function loadImage () {
      if (this.width < 180 || this.height < 180) return false

      const { canvas, container } = _this.refs
      const { width, height } = container.getBoundingClientRect()

      _this.imageData = {
        ..._this.imageData,
        image: this,
        initialWidth: this.width,
        initialHeight: this.height
      }

      if (this.width > this.height) {
        if (this.width <= width) {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: this.width,
            finalHeight: this.height
          }
        } else {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: width,
            finalHeight: width * (this.height / this.width)
          }
        }
      } else {
        if (this.height <= height) {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: this.width,
            finalHeight: this.height
          }
        } else {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: height * (this.width / this.height),
            finalHeight: height
          }
        }
      }

      _this.modifyCoords({
        x: (canvas.width - _this.imageData.finalWidth) / 2,
        y: (canvas.height - _this.imageData.finalHeight) / 2
      })

      _this.imageData = {
        ..._this.imageData,
        lastWidth: _this.imageData.finalWidth,
        lastHeight: _this.imageData.finalHeight
      }

      _this.setState({ hasImage: true })
      _this.draw()
    }

    reader.onload = e => { image.src = e.target.result }
    reader.readAsDataURL(img)
  }

  draw = () => {
    const { canvas } = this.refs
    const context = canvas.getContext('2d')
    const {
      image,
      initialCoords,
      initialWidth,
      initialHeight,
      finalWidth,
      finalHeight,
      finalCoords,
      factor
    } = this.imageData

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      image,
      initialCoords.x,
      initialCoords.y,
      initialWidth,
      initialHeight,
      finalCoords.x,
      finalCoords.y,
      finalWidth * factor,
      finalHeight * factor
    )
  }

  drag = () => {
    const { canvas } = this.refs
    const {
      finalWidth,
      finalHeight,
      factor,
      touchPos,
      touchStart,
      touchEndCoords
    } = this.imageData

    this.imageData = {
      ...this.imageData,
      mod: {
        x: Math.round(touchEndCoords.x - (touchStart.x - touchPos.x)),
        y: Math.round(touchEndCoords.y - (touchStart.y - touchPos.y))
      }
    }

    const { mod: { x, y } } = this.imageData

    if (x < (canvas.width - finalWidth * factor) - 160) {
      this.modifyCoords({ x: (canvas.width - finalWidth * factor) - 160 })
    } else if (x > 160) {
      this.modifyCoords({ x: 160 })
    } else {
      this.modifyCoords({ x })
    }

    if (y < (canvas.height - finalHeight * factor) - 160) {
      this.modifyCoords({ y: (canvas.height - finalHeight * factor) - 160 })
    } else if (y > 160) {
      this.modifyCoords({ y: 160 })
    } else {
      this.modifyCoords({ y })
    }

    this.draw()
  }

  scaleImage = e => {
    e.preventDefault()

    if (!!this.imageData.image) {
      const { canvas } = this.refs
      const {
        finalCoords: { x, y },
        finalWidth,
        finalHeight,
        lastWidth,
        lastHeight
      } = this.imageData

      let factor = e.target.value / 50

      if (finalHeight * factor < 180) factor = 180 / finalHeight
      if (finalWidth * factor < 180) factor = 180 / finalWidth

      if (x < (canvas.width - finalWidth * factor) - 160) {
        this.modifyCoords({ x: (canvas.width - finalWidth * factor) - 160 })
      } else if (x > 160) {
        this.modifyCoords({ x: 160 })
      } else {
        this.modifyCoords({ x: x + (lastWidth - finalWidth * factor) / 2 })
      }

      if (y < (canvas.height - finalHeight * factor) - 160) {
        this.modifyCoords({ y: (canvas.height - finalHeight * factor) - 160 })
      } else if (y > 160) {
        this.modifyCoords({ y: 160 })
      } else {
        this.modifyCoords({ y: y + (lastHeight - finalHeight * factor) / 2 })
      }

      this.imageData = {
        ...this.imageData,
        factor,
        touchStart: { x: 0, y: 0 },
        touchPos: { x: 0, y: 0 },
        lastWidth: finalWidth * factor,
        lastHeight: finalHeight * factor,
        touchEndCoords: this.imageData.finalCoords
      }

      this.setState({
        scaleParams: {
          ...this.state.scaleParams,
          value: e.target.value
        }
      })

      this.draw()
    }
  }

  modifyCoords = nextCoords => {
    this.imageData = {
      ...this.imageData,
      finalCoords: {
        ...this.imageData.finalCoords,
        ...nextCoords
      }
    }

    if (!this.imageData.touchEndCoords) {
      this.imageData = {
        ...this.imageData,
        touchEndCoords: this.imageData.finalCoords
      }
    }
  }

  handleTouchStart = e => {
    e.preventDefault()

    if (!!this.imageData.image) {
      this.setState({ dragging: true })

      const posX = (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft
      const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

      this.imageData = {
        ...this.imageData,
        touchPos: { x: posX, y: posY },
        touchStart: { x: posX, y: posY }
      }
    }
  }

  handleTouchMove = e => {
    e.preventDefault()

    if (this.state.dragging && !!this.imageData.image) {
      const posX = (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft
      const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

      this.imageData = {
        ...this.imageData,
        touchPos: { x: posX, y: posY }
      }

      this.drag()
    }
  }

  handleTouchEnd = e => {
    e.preventDefault()

    if (!!this.imageData.image) {
      this.setState({ dragging: false })

      this.imageData = {
        ...this.imageData,
        touchStart: { x: 0, y: 0 },
        touchPos: { x: 0, y: 0 },
        touchEndCoords: this.imageData.finalCoords
      }
    }
  }

  handleMouseOut = e => {
    e.preventDefault()

    if (!!this.imageData.image) {
      if (this.state.dragging && e.buttons === 1) {
        const posX = (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft
        const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

        this.imageData = {
          ...this.imageData,
          touchPos: { x: posX, y: posY }
        }

        this.drag()
      } else {
        this.setState({ dragging: false })

        this.imageData = {
          ...this.imageData,
          touchStart: { x: 0, y: 0 },
          touchPos: { x: 0, y: 0 },
          touchEndCoords: this.imageData.finalCoords
        }
      }
    }
  }

  render () {
    const { scaleParams } = this.state

    return (
      <div className="AvatarCropper" ref="container">
        <Dropzone
          className="Dropzone"
          style={{ height: 500 }}
          multiple={ false }
          onDrop={ this.onDrop }
        />
        <canvas
          ref="canvas"
          className="canvas"
          onTouchStart={ this.handleTouchStart }
          onMouseDown={ this.handleTouchStart }
          onTouchMove={ this.handleTouchMove }
          onMouseMove={ this.handleTouchMove }
          onTouchEnd={ this.handleTouchEnd }
          onMouseUp={ this.handleTouchEnd }
          style={{ pointerEvents: this.state.hasImage ? 'auto' : 'none' }}
          width={ 500 }
          height={ 500 }
        />
        <div className="mask" />
        <InputRange
          max={ 100 }
          min={ 20 }
          onChange={ e => this.scaleImage(e) }
          value={ parseInt(scaleParams.value, 10) }
        />
        <div
          className="mouseoutTrigger"
          onMouseMove={ this.handleMouseOut }
          style={{ pointerEvents: this.image && this.state.dragging ? 'auto' : 'none' }}
        />
      </div>
    )
  }
}

export default AvatarCropper
