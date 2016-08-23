import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import './AvatarCropper.css'

class AvatarCropper extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hasImage: false
    }
    this.imageData = {
      image: null,
      initialX: 0,
      initialY: 0,
      factor: 1
    }
  }

  onDrop = file => {
    if (file[0].constructor !== File) return false

    const img = file[0]
    const reader = new FileReader()
    const image = new Image()
    const self = this

    image.onload = function loadImage () {
      const containerWidth =
        self.refs.container.getBoundingClientRect().width

      self.imageData = {
        ...self.imageData,
        initialWidth: this.width,
        initialHeight: this.height
      }

      if (this.width <= containerWidth) {
        self.imageData = {
          ...self.imageData,
          finalWidth: this.width,
          finalHeight: this.height
        }
      } else {
        self.imageData = {
          ...self.imageData,
          finalWidth: containerWidth,
          finalHeight: containerWidth * (this.height / this.width)
        }
      }

      self.draw()
    }

    reader.onload = e => { image.src = e.target.result }
    reader.readAsDataURL(img)

    this.imageData = { ...this.imageData, image }
    this.setState({ hasImage: true })
  }

  draw = () => {
    const {
      image,
      initialX,
      initialY,
      initialWidth,
      initialHeight,
      finalWidth,
      finalHeight,
      factor
    } = this.imageData

    const { canvas } = this.refs
    const context = canvas.getContext('2d')

    if (this.imageData.touchStart !== undefined) {
      const {
        pos,
        touchStart,
        lastPos
      } = this.imageData

      this.imageData = {
        ...this.imageData,
        modX: Math.round(lastPos !== undefined ?
          lastPos.x - (touchStart.x - pos.x) :
          (canvas.width - finalWidth) / 2 - (touchStart.x - pos.x)),
        modY: Math.round(lastPos !== undefined ?
          lastPos.y - (touchStart.y - pos.y) :
          (canvas.height - finalHeight) / 2 - (touchStart.y - pos.y))
      }

      const { modX, modY } = this.imageData

      if (modX <= 0) {
        this.imageData = { ...this.imageData, finalX: 0 }
      } else if (modX >= canvas.width - finalWidth) {
        this.imageData = { ...this.imageData, finalX: canvas.width - finalWidth }
      } else {
        this.imageData = { ...this.imageData, finalX: modX }
      }

      if (modY <= 0) {
        this.imageData = { ...this.imageData, finalY: 0 }
      } else if (modY >= canvas.height - finalHeight) {
        this.imageData = { ...this.imageData, finalY: canvas.height - finalHeight }
      } else {
        this.imageData = { ...this.imageData, finalY: modY }
      }

    } else {
      this.imageData = {
        ...this.imageData,
        finalX: (canvas.width - finalWidth) / 2,
        finalY: (canvas.height - finalHeight) / 2
      }
    }

    const { finalX, finalY } = this.imageData

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      image,
      initialX,
      initialY,
      initialWidth,
      initialHeight,
      finalX,
      finalY,
      finalWidth * factor,
      finalHeight * factor
    )
  }

  scaleImage = e => {
    e.preventDefault()

    this.imageData = { ...this.imageData, factor: e.target.value / 50 }

    if (!!this.imageData.image) this.draw()
  }

  handleTouchStart = e => {
    e.preventDefault()

    if (!!this.imageData.image) {
      this.setState({ dragging: true })

      this.imageData = {
        ...this.imageData,
        pos: {
          x: (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft,
          y: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
        },
        touchStart: {
          x: (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft,
          y: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
        }
      }
    }
  }

  handleTouchMove = e => {
    e.preventDefault()

    if (this.state.dragging && !!this.imageData.image) {
      this.imageData = {
        ...this.imageData,
        pos: {
          x: (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft,
          y: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
        }
      }

      this.draw()
    }
  }

  handleTouchEnd = e => {
    e.preventDefault()

    if (!!this.imageData.image) {
      this.setState({ dragging: false })

      this.imageData = {
        ...this.imageData,
        touchStart: { x: 0, y: 0 },
        pos: { x: 0, y: 0 },
        lastPos: {
          x: this.imageData.finalX,
          y: this.imageData.finalY
        }
      }
    }
  }

  handleMouseOut = e => {
    e.preventDefault()

    if (!!this.imageData.image) {
      if (this.state.dragging && e.buttons === 1) {
        this.imageData = {
          ...this.imageData,
          pos: {
            x: (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft,
            y: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
          }
        }

        this.draw()
      } else {
        this.setState({ dragging: false })

        this.imageData = {
          ...this.imageData,
          touchStart: { x: 0, y: 0 },
          pos: { x: 0, y: 0 },
          lastPos: {
            x: this.imageData.finalX,
            y: this.imageData.finalY
          }
        }
      }
    }
  }

  render () {
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
        <input
          type="range"
          min="0"
          max="100"
          onChange={ e => this.scaleImage(e) }
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
