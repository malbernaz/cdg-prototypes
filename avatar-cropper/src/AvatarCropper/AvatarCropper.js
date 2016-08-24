import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import './AvatarCropper.css'

class AvatarCropper extends Component {
  constructor (props) {
    super(props)

    this.state = { hasImage: false }
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
    const outerThis = this

    image.onload = function loadImage (e) {
      const containerWidth =
        outerThis.refs.container.getBoundingClientRect().width

      outerThis.imageData = {
        ...outerThis.imageData,
        initialWidth: this.width,
        initialHeight: this.height
      }

      if (this.width <= containerWidth) {
        outerThis.imageData = {
          ...outerThis.imageData,
          finalWidth: this.width,
          finalHeight: this.height
        }
      } else {
        outerThis.imageData = {
          ...outerThis.imageData,
          finalWidth: containerWidth,
          finalHeight: containerWidth * (this.height / this.width)
        }
      }

      outerThis.draw(e)
    }

    reader.onload = e => { image.src = e.target.result }
    reader.readAsDataURL(img)

    this.imageData = { ...this.imageData, image }
    this.setState({ hasImage: true })
  }

  draw = e => {
    const {
      image,
      initialCoords,
      initialWidth,
      initialHeight,
      finalWidth,
      finalHeight,
      factor
    } = this.imageData

    const { canvas } = this.refs
    const context = canvas.getContext('2d')

    if (this.imageData.touchStart !== undefined) {
      const { touchPos, touchStart, touchEndCoords } = this.imageData

      this.imageData = {
        ...this.imageData,
        modX: Math.round(touchEndCoords !== undefined ?
          touchEndCoords.x - (touchStart.x - touchPos.x) :
          (canvas.width - finalWidth) / 2 - (touchStart.x - touchPos.x)),
        modY: Math.round(touchEndCoords !== undefined ?
          touchEndCoords.y - (touchStart.y - touchPos.y) :
          (canvas.height - finalHeight) / 2 - (touchStart.y - touchPos.y))
      }

      const { modX, modY } = this.imageData

      this.modifyCoords({ x: modX, y: modY })
    } else {
      this.modifyCoords({
        x: (canvas.width - finalWidth) / 2,
        y: (canvas.height - finalHeight) / 2
      })
    }

    const { finalCoords } = this.imageData

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

  modifyCoords = nextCoords => {
    this.imageData = {
      ...this.imageData,
      finalCoords: {
        ...this.imageData.finalCoords,
        ...nextCoords
      }
    }
  }

  scaleImage = e => {
    e.preventDefault()

    const factor = e.target.value / 50

    this.imageData = { ...this.imageData, factor }

    if (!!this.imageData.image) this.draw(e)
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

      this.draw(e)
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

        this.draw(e)
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
          min={ 0 }
          max={ 100 }
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
