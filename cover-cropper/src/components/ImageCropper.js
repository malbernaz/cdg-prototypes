import React, { Component, PropTypes } from 'react'
import Dropzone from 'react-dropzone'
import './ImageCropper.css'

class ImageCropper extends Component {
  constructor (props) {
    super(props)

    this.state = {
      width: window.innerWidth
    }
    this.image = null
    this.initialX = 0
    this.initialY = 0
  }

  handleResize = e => {
    this.setState({
      height: (this.props.height / this.props.width) * window.innerWidth >= this.props.height ?
        this.props.height : (this.props.height / this.props.width) * window.innerWidth,
      scale: window.innerWidth >= this.props.width ?
        1 : window.innerWidth / this.props.width
    })
  }

  componentDidMount = () => {
    window.addEventListener('resize', this.handleResize)
    this.finalWidth = this.refs.container.getBoundingClientRect().width
    this.setState({
      height: (this.props.height / this.props.width) * window.innerWidth >= this.props.height ?
        this.props.height : (this.props.height / this.props.width) * window.innerWidth,
      scale: window.innerWidth >= this.props.width ?
        1 : window.innerWidth / this.props.width
    })
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.handleResize)
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
    if (!this.initialWidth) {
      this.refs.canvas.width = this.finalWidth
      this.refs.canvas.height = this.state.height
      this.initialWidth = this.image.width
      this.initialHeight = this.image.height
      this.finalHeight = this.finalWidth * (this.image.height / this.image.width)
      this.finalX = this.refs.canvas.width / 2 - this.finalWidth / 2
    }

    this.mod = this.touchEnd !== undefined ?
      this.touchEnd - (this.touchStart - this.posy) :
      (this.refs.canvas.height - this.finalHeight) / 2 - (this.touchStart - this.posy)

    if (this.posy !== undefined) {
      if (this.mod > 0) {
        this.finalY = 0
      } else if (this.mod < this.refs.canvas.height - this.finalHeight) {
        this.finalY = this.refs.canvas.height - this.finalHeight
      } else {
        this.finalY = this.mod
      }
    } else {
      this.finalY = (this.refs.canvas.height - this.finalHeight) / 2
    }

    this.refs.canvas.getContext('2d').clearRect(
      0,
      0,
      this.refs.canvas.width,
      this.refs.canvas.height
    )
    this.refs.canvas.getContext('2d').drawImage(
      this.image,
      this.initialX,
      this.initialY,
      this.initialWidth,
      this.initialHeight,
      this.finalX,
      this.finalY,
      this.finalWidth,
      this.finalHeight
    )
  }

  handleTouchStart = e => {
    if (this.image) {
      e.preventDefault()
      this.setState({ dragging: true })
      this.posy = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
      this.touchStart = this.posy
      this.draw()
    }
  }

  handleTouchMove = e => {
    if (this.state.dragging && this.image) {
      e.preventDefault()
      this.posy = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
      this.draw()
    }
  }

  handleTouchEnd = e => {
    if (this.image) {
      e.preventDefault()
      this.setState({ dragging: false })
      this.touchEnd = this.finalY
    }
  }

  handleMouseOut = e => {
    if (this.image) {
      e.preventDefault()
      if (this.state.dragging && e.buttons === 1) {
        this.posy = (e.touches ? e.touches[0].pageY : e.pageY) - this.refs.canvas.offsetTop
        this.draw()
      } else {
        this.setState({ dragging: false })
        this.touchEnd = this.finalY
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
            ref="canvas"
            className="ImageCropper__result"
            onTouchStart={ this.handleTouchStart }
            onMouseDown={ this.handleTouchStart }
            onTouchMove={ this.handleTouchMove }
            onMouseMove={ this.handleTouchMove }
            onTouchEnd={ this.handleTouchEnd }
            onMouseUp={ this.handleTouchEnd }
            style={{
              pointerEvents: this.state.hasImage ? 'auto' : 'none',
              transform: `scale(${this.state.scale})`,
              WebkitTransform: `scale(${this.state.scale})`,
              width: this.props.width,
              height: this.props.height
            }}
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
