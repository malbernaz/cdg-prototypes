import React, { Component, PropTypes } from 'react'
import Dropzone from 'react-dropzone'
import CompressWorker from 'worker?inline!./CompressWorker.js'
import './CoverCropper.css'

class CoverCropper extends Component {
  constructor (props) {
    super(props)

    const { height, width } = props
    const ratio = height / width

    this.state = {
      height: window.innerWidth * ratio >= height ? height : window.innerWidth * ratio,
      scale: window.innerWidth >= width ? 1 : window.innerWidth / width
    }
    this.drawParams = {
      image: false,
      initialX: 0,
      initialY: 0
    }

    this.worker = new CompressWorker()
  }

  componentDidMount () {
    window.addEventListener('resize', this.handleResize)
    this.worker.addEventListener('message', this.receiveCompressedImage)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
    this.worker.removeEventListener('message', this.receiveCompressedImage)
  }

  onDrop = file => {
    const img = file[0]
    const reader = new FileReader()
    const image = new Image()
    const _this = this

    image.onload = function loadImage () {
      const { width } = _this.props
      const finalHeight = width * (this.height / this.width)

      _this.drawParams = {
        ..._this.drawParams,
        image: this,
        initialWidth: this.width,
        initialHeight: this.height,
        finalWidth: width,
        finalHeight,
        finalX: _this.canvas.width / 2 - width / 2,
        finalY: (_this.canvas.height - finalHeight) / 2
      }

      _this.setState({ hasImage: true })
      _this.draw()
    }

    reader.onload = e => { image.src = e.target.result }
    reader.readAsDataURL(img)
  }

  handleResize = () => {
    const { height, width } = this.props
    const ratio = height / width

    this.setState({
      height: window.innerWidth * ratio >= height ? height : window.innerWidth * ratio,
      scale: window.innerWidth >= width ? 1 : window.innerWidth / width
    })
  }

  draw = () => {
    const context = this.canvas.getContext('2d')
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
    } = this.drawParams

    if (touchStart !== undefined) {
      this.drawParams = {
        ...this.drawParams,
        mod: touchEndY !== undefined ?
          touchEndY - (touchStart - posY) :
          (this.canvas.height - finalHeight) / 2 - (touchStart - posY)
      }

      const { mod } = this.drawParams

      if (mod > 0) {
        this.drawParams = { ...this.drawParams, finalY: 0 }
      } else if (mod < this.canvas.height - finalHeight) {
        this.drawParams = { ...this.drawParams, finalY: this.canvas.height - finalHeight }
      } else {
        this.drawParams = { ...this.drawParams, finalY: mod }
      }
    }

    const { finalY } = this.drawParams

    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, this.canvas.width, this.canvas.height)
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

  handleSave = e => {
    e.preventDefault()

    const context = this.canvas.getContext('2d')
    const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height)

    this.worker.postMessage({ imageData, quality: 50 })
  }

  receiveCompressedImage = e => {
    const blob = new Blob([e.data.data], { type: 'image/jpeg' })

    this.downloader.href = window.URL.createObjectURL(blob)
    this.downloader.download = 'compressed.jpg'
    this.downloader.click()
  }

  handleTouchStart = e => {
    if (this.drawParams.image) {
      e.preventDefault()

      this.setState({ dragging: true })

      const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

      this.drawParams = { ...this.drawParams, posY, touchStart: posY }

      this.draw()
    }
  }

  handleTouchMove = e => {
    if (this.state.dragging && this.drawParams.image) {
      e.preventDefault()

      this.drawParams = {
        ...this.drawParams,
        posY: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
      }

      this.draw()
    }
  }

  handleTouchEnd = e => {
    if (this.drawParams.image) {
      e.preventDefault()

      this.setState({ dragging: false })

      this.drawParams = {
        ...this.drawParams,
        touchEndY: this.drawParams.finalY
      }
    }
  }

  handleMouseOut = e => {
    if (this.drawParams.image) {
      e.preventDefault()

      if (this.state.dragging && e.buttons === 1) {
        this.drawParams = {
          ...this.drawParams,
          posY: (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop
        }

        this.draw()
      } else {
        this.setState({ dragging: false })

        this.drawParams = {
          ...this.drawParams,
          touchEndY: this.drawParams.finalY
        }
      }
    }
  }

  render () {
    return (
      <div className="CoverCropperContainer" style={{ maxWidth: this.props.width }}>
        <div
          className="CoverCropper"
          style={{ height: this.state.height, maxWidth: this.props.width }}
        >
          <Dropzone className="Dropzone" multiple={ false } onDrop={ this.onDrop } />
          <canvas
            className="CoverCropper__result"
            height={ this.props.height }
            onMouseDown={ this.handleTouchStart }
            onMouseMove={ this.handleTouchMove }
            onMouseUp={ this.handleTouchEnd }
            onTouchEnd={ this.handleTouchEnd }
            onTouchMove={ this.handleTouchMove }
            onTouchStart={ this.handleTouchStart }
            ref={ c => { this.canvas = c } }
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
          <button onClick={ this.handleSave } className="saveButton">save image</button>
        </div>
        <div
          className="mouseoutTrigger"
          onMouseMove={ this.handleMouseOut }
          style={{ pointerEvents: this.image && this.state.dragging ? 'auto' : 'none' }}
        />
        <a ref={ c => { this.downloader = c } } style={{ display: 'none' }} />
      </div>
    )
  }
}

CoverCropper.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number
}

export default CoverCropper
