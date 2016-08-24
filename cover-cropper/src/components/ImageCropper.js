import React, { Component, PropTypes } from 'react'
import Dropzone from 'react-dropzone'
import './ImageCropper.css'

class ImageCropper extends Component {
  constructor (props) {
    super(props)

    this.state = {}
    this.imageData = {
      image: null,
      initialX: 0,
      initialY: 0
    }
  }

  componentDidMount () {
    const { height, width } = this.props
    const ratio = height / width

    this.setState({
      height: window.innerWidth * ratio >= height ? height : window.innerWidth * ratio,
      scale: window.innerWidth >= width ? 1 : window.innerWidth / width
    })

    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize = e => {
    const { height, width } = this.props
    const ratio = height / width

    this.setState({
      height: window.innerWidth * ratio >= height ? height : window.innerWidth * ratio,
      scale: window.innerWidth >= width ? 1 : window.innerWidth / width
    })
  }

  onDrop = file => {
    if (file[0].constructor !== File) return false

    const img = file[0]
    const reader = new FileReader()
    const image = new Image()
    const _this = this

    image.onload = function loadImage (e) {
      const { width } = _this.props
      const { canvas } = _this.refs
      const finalHeight = width * (this.height / this.width)

      _this.imageData = {
        ..._this.imageData,
        image: this,
        initialWidth: this.width,
        initialHeight: this.height,
        finalWidth: width,
        finalHeight,
        finalX: canvas.width / 2 - width / 2,
        finalY: (canvas.height - finalHeight) / 2
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
      initialX,
      initialY,
      initialWidth,
      initialHeight,
      finalWidth,
      finalHeight,
      finalX,
      touchStart,
      touchEndY,
      posY
    } = this.imageData

    if (touchStart !== undefined) {
      this.imageData = {
        ...this.imageData,
        mod: touchEndY !== undefined ?
          touchEndY - (touchStart - posY) :
          (canvas.height - finalHeight) / 2 - (touchStart - posY)
      }

      const { mod } = this.imageData

      if (mod > 0) {
        this.imageData = { ...this.imageData, finalY: 0 }
      } else if (mod < canvas.height - finalHeight) {
        this.imageData = { ...this.imageData, finalY: canvas.height - finalHeight }
      } else {
        this.imageData = { ...this.imageData, finalY: mod }
      }
    }

    const { finalY } = this.imageData

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      image,
      initialX,
      initialY,
      initialWidth,
      initialHeight,
      finalX,
      finalY,
      finalWidth,
      finalHeight
    )
  }

  handleTouchStart = e => {
    if (this.imageData.image) {
      e.preventDefault()

      this.setState({ dragging: true })

      const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

      this.imageData = { ...this.imageData, posY, touchStart: posY }

      this.draw()
    }
  }

  handleTouchMove = e => {
    if (this.state.dragging && this.imageData.image) {
      e.preventDefault()

      this.imageData = {
        ...this.imageData,
        posY: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
      }

      this.draw()
    }
  }

  handleTouchEnd = e => {
    if (this.imageData.image) {
      e.preventDefault()

      this.setState({ dragging: false })

      this.imageData = {
        ...this.imageData,
        touchEndY: this.imageData.finalY
      }
    }
  }

  handleMouseOut = e => {
    if (this.imageData.image) {
      e.preventDefault()

      if (this.state.dragging && e.buttons === 1) {
        this.imageData = {
          ...this.imageData,
          posY: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
        }

        this.draw()
      } else {
        this.setState({ dragging: false })

        this.imageData = {
          ...this.imageData,
          touchEndY: this.imageData.finalY
        }
      }
    }
  }

  render = ()  => {
    return (
      <div className="ImageCropperContainer" style={{ maxWidth: this.props.width }}>
        <div
          className="ImageCropper"
          ref="container"
          style={{ height: this.state.height, maxWidth: this.props.width }}
        >
          <Dropzone className="Dropzone" multiple={ false } onDrop={ this.onDrop } />
          <canvas
            className="ImageCropper__result"
            height={ this.props.height }
            onMouseDown={ this.handleTouchStart }
            onMouseMove={ this.handleTouchMove }
            onMouseUp={ this.handleTouchEnd }
            onTouchEnd={ this.handleTouchEnd }
            onTouchMove={ this.handleTouchMove }
            onTouchStart={ this.handleTouchStart }
            ref="canvas"
            style={{
              pointerEvents: this.state.hasImage ? 'auto' : 'none',
              transform: `scale(${this.state.scale})`,
              WebkitTransform: `scale(${this.state.scale})`,
              width: this.props.width,
              height: this.props.height
            }}
            width={ this.props.width }
          />
          <div className="dragIndicatorContainer" style={{ maxWidth: this.props.width }}>
            { this.state.hasImage ?
              <span className="dragIndicator"> arraste para reposicionar </span> : '' }
          </div>
        </div>
        <div
          className="mouseoutTrigger"
          onMouseMove={ this.handleMouseOut }
          style={{ pointerEvents: this.image && this.state.dragging ? 'auto' : 'none' }}
        />
      </div>
    )
  }
}

ImageCropper.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number
}

export default ImageCropper
