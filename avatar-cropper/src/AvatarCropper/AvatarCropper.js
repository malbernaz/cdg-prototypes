import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import './AvatarCropper.css'

class AvatarCropper extends Component {
  constructor (props) {
    super(props)

    this.state = {}
    this.image = null
    this.initialX = 0
    this.initialY = 0
    this.factor = 1
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

    image.onload = () => this.draw()
    reader.onload = e => { image.src = e.target.result }
    reader.readAsDataURL(img)

    this.image = image
    this.setState({ hasImage: true })
  }

  draw = () => {
    const { canvas, container } = this.refs
    const context = canvas.getContext('2d')

    if (!this.initialWidth) {
      canvas.width = 500
      canvas.height = 500
      this.initialWidth = this.image.width
      this.initialHeight = this.image.height

      if (this.image.width <= container.getBoundingClientRect().width) {
        this.finalWidth = this.image.width
        this.finalHeight = this.image.height
      } else {
        this.finalWidth = container.getBoundingClientRect().width
        this.finalHeight = this.finalWidth * (this.image.height / this.image.width)
      }
    }

    if (this.pos !== undefined) {
      this.modX = Math.round(this.touchEnd !== undefined ?
        this.touchEnd.x - (this.touchStart.x - this.pos.x) :
        (canvas.width - this.finalWidth) / 2 - (this.touchStart.x - this.pos.x))

      this.modY = Math.round(this.touchEnd !== undefined ?
        this.touchEnd.y - (this.touchStart.y - this.pos.y) :
        (canvas.height - this.finalHeight) / 2 - (this.touchStart.y - this.pos.y))

      if (this.modX <= 0) {
        this.finalX = 0
      } else if (this.modX >= canvas.width - this.finalWidth) {
        this.finalX = canvas.width - this.finalWidth
      } else {
        this.finalX = this.modX
      }

      if (this.modY <= 0) {
        this.finalY = 0
      } else if (this.modY >= canvas.height - this.finalHeight - 0) {
        this.finalY = canvas.height - this.finalHeight - 0
      } else {
        this.finalY = this.modY
      }

    } else {
      this.finalY = (canvas.height - this.finalHeight) / 2
      this.finalX = (canvas.width - this.finalWidth) / 2
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      this.image,
      this.initialX,
      this.initialY,
      this.initialWidth,
      this.initialHeight,
      this.finalX,
      this.finalY,
      this.finalWidth * this.factor,
      this.finalHeight * this.factor
    )
  }

  scaleImage = e => {
    e.preventDefault()

    this.factor = e.target.value / 50

    this.draw()
  }

  handleTouchStart = e => {
    if (this.image) {
      e.preventDefault()
      this.setState({ dragging: true })
      this.pos = {
        x: (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft,
        y: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
      }
      this.touchStart = { x: this.pos.x, y: this.pos.y }
    }
  }

  handleTouchMove = e => {
    if (this.state.dragging && this.image) {
      e.preventDefault()
      this.pos = {
        x: (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft,
        y: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
      }
      this.draw()
    }
  }

  handleTouchEnd = e => {
    if (this.image) {
      e.preventDefault()
      this.setState({ dragging: false })
      this.touchEnd = { x: this.finalX, y: this.finalY }
    }
  }

  handleMouseOut = e => {
    if (this.image) {
      e.preventDefault()
      if (this.state.dragging && e.buttons === 1) {
        this.pos = {
          x: (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft,
          y: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
        }
        this.draw()
      } else {
        this.setState({ dragging: false })
        this.touchEnd = { x: this.finalX, y: this.finalY }
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
