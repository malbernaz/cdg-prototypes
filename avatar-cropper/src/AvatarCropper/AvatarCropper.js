import React, { Component, PropTypes } from 'react'
import Dropzone from 'react-dropzone'

import CompressWorker from 'worker?inline!./CompressWorker.js'
import './AvatarCropper.css'
import './InputRange.css'

class AvatarCropper extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  }

  constructor (props) {
    super(props)

    this.drawParams = {
      image: false,
      initialCoords: { x: 0, y: 0 },
      marginX: (500 - props.width) / 2,
      marginY: (500 - props.height) / 2
    }

    this.worker = new CompressWorker()

    this.state = {
      hasImage: false,
      scaleValue: 250,
      scale: window.innerWidth >= 530 ? 1 : window.innerWidth / 530
    }
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
      _this.drawParams = {
        ..._this.drawParams,
        image: this,
        initialWidth: this.width,
        initialHeight: this.height,
        ratio: this.width / this.height
      }

      if (this.width >= this.height && this.width <= 500) {
        _this.inputRange.max = this.width * 2
        _this.setState({ hasImage: true, scaleValue: parseInt(this.width, 10) })

        _this.drawParams = {
          ..._this.drawParams,
          finalWidth: this.width,
          finalHeight: this.height
        }
      } else if (this.width >= this.height) {
        _this.inputRange.max = 1000
        _this.setState({ hasImage: true, scaleValue: 500 })

        _this.drawParams = {
          ..._this.drawParams,
          finalWidth: 500,
          finalHeight: 500 * (this.height / this.width)
        }
      } else if (this.height <= 500) {
        _this.inputRange.max = this.height * 2
        _this.setState({ hasImage: true, scaleValue: parseInt(this.height, 10) })

        _this.drawParams = {
          ..._this.drawParams,
          finalWidth: this.width,
          finalHeight: this.height
        }
      } else {
        _this.inputRange.max = 1000
        _this.setState({ hasImage: true, scaleValue: 500 })

        _this.drawParams = {
          ..._this.drawParams,
          finalWidth: 500 * (this.width / this.height),
          finalHeight: 500
        }
      }

      _this.modifyCoords({
        x: (_this.canvas.width - _this.drawParams.finalWidth) / 2,
        y: (_this.canvas.height - _this.drawParams.finalHeight) / 2
      })

      _this.draw()
    }

    reader.onload = e => { image.src = e.target.result }
    reader.readAsDataURL(img)
  }

  handleResize = () => {
    if (window.matchMedia(530)) {
      this.setState({ scale: window.innerWidth >= 530 ? 1 : window.innerWidth / 530 })
    }
  }

  draw = () => {
    const context = this.canvas.getContext('2d')
    const {
      image,
      initialCoords,
      initialWidth,
      initialHeight,
      finalWidth,
      finalHeight,
      finalCoords
    } = this.drawParams

    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    context.drawImage(
      image,
      initialCoords.x,
      initialCoords.y,
      initialWidth,
      initialHeight,
      finalCoords.x,
      finalCoords.y,
      finalWidth,
      finalHeight
    )
  }

  drag = () => {
    const {
      finalWidth,
      finalHeight,
      touchPos,
      touchStart,
      touchEndCoords,
      marginX,
      marginY
    } = this.drawParams

    this.drawParams = {
      ...this.drawParams,
      mod: {
        x: Math.round(touchEndCoords.x - (touchStart.x - touchPos.x)),
        y: Math.round(touchEndCoords.y - (touchStart.y - touchPos.y))
      }
    }

    const { mod: { x, y } } = this.drawParams

    if (x < (this.canvas.width - finalWidth) - marginX) {
      this.modifyCoords({ x: (this.canvas.width - finalWidth) - marginX })
    } else if (x > marginX) {
      this.modifyCoords({ x: marginX })
    } else {
      this.modifyCoords({ x })
    }

    if (y < (this.canvas.height - finalHeight) - marginY) {
      this.modifyCoords({ y: (this.canvas.height - finalHeight) - marginY })
    } else if (y > marginY) {
      this.modifyCoords({ y: marginY })
    } else {
      this.modifyCoords({ y })
    }

    this.draw()
  }

  scaleImage = e => {
    e.preventDefault()

    if (this.drawParams.image) {
      const { max, min } = this.inputRange
      const { scaleValue } = this.state
      const {
        finalCoords: { x, y },
        finalWidth,
        finalHeight,
        marginX,
        marginY,
        ratio
      } = this.drawParams
      const { width, height } = this.props

      let nextMeasure
      if (e.type === 'wheel' && e.deltaY > 1) {
        nextMeasure = scaleValue + 3 < max ? scaleValue + 3 : max
      } else if (e.type === 'wheel' && e.deltaY < 1) {
        nextMeasure = scaleValue - 3 > min ? scaleValue - 3 : min
      } else {
        nextMeasure = e.target.value
      }

      this.setState({ scaleValue: parseInt(nextMeasure, 10) })

      if (x < (this.canvas.width - nextMeasure) - marginX) {
        this.modifyCoords({ x: (this.canvas.width - nextMeasure) - marginX })
      } else if (x > marginX) {
        this.modifyCoords({ x: marginX })
      } else {
        this.modifyCoords({ x: x + (finalWidth - nextMeasure) / 2 })
      }

      if (y < (this.canvas.height - nextMeasure) - marginY) {
        this.modifyCoords({ y: (this.canvas.height - nextMeasure) - marginY })
      } else if (y > marginY) {
        this.modifyCoords({ y: marginY })
      } else {
        this.modifyCoords({ y: y + (finalHeight - nextMeasure * ratio) / 2 })
      }

      this.drawParams = {
        ...this.drawParams,
        touchStart: { x: 0, y: 0 },
        touchPos: { x: 0, y: 0 },
        finalWidth: width >= height ? nextMeasure * ratio : nextMeasure,
        finalHeight: width >= height ? nextMeasure : nextMeasure * ratio,
        touchEndCoords: this.drawParams.finalCoords
      }

      this.draw()
    }
  }

  modifyCoords = nextCoords => {
    this.drawParams = {
      ...this.drawParams,
      finalCoords: {
        ...this.drawParams.finalCoords,
        ...nextCoords
      }
    }

    if (!this.drawParams.touchEndCoords) {
      this.drawParams = {
        ...this.drawParams,
        touchEndCoords: this.drawParams.finalCoords
      }
    }
  }

  handleSave = e => {
    e.preventDefault()

    const context = this.canvas.getContext('2d')
    const imageData = context.getImageData(160, 160, 180, 180)

    this.worker.postMessage({ imageData, quality: 50 })
  }

  receiveCompressedImage = e => {
    const blob = new Blob([e.data.data], { type: 'image/jpeg' })

    this.downloader.href = window.URL.createObjectURL(blob)
    this.downloader.download = 'compressed.jpg'
    this.downloader.click()
  }

  handleTouchStart = e => {
    e.preventDefault()

    if (this.drawParams.image) {
      this.setState({ dragging: true })

      const posX = (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft
      const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

      this.drawParams = {
        ...this.drawParams,
        touchPos: { x: posX, y: posY },
        touchStart: { x: posX, y: posY }
      }
    }
  }

  handleTouchMove = e => {
    e.preventDefault()

    if (this.state.dragging && this.drawParams.image) {
      const posX = (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft
      const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

      this.drawParams = {
        ...this.drawParams,
        touchPos: { x: posX, y: posY }
      }

      this.drag()
    }
  }

  handleTouchEnd = e => {
    e.preventDefault()

    if (this.drawParams.image) {
      this.setState({ dragging: false })

      this.drawParams = {
        ...this.drawParams,
        touchStart: { x: 0, y: 0 },
        touchPos: { x: 0, y: 0 },
        touchEndCoords: this.drawParams.finalCoords
      }
    }
  }

  handleMouseOut = e => {
    e.preventDefault()

    if (this.drawParams.image) {
      if (this.state.dragging && e.buttons === 1) {
        const posX = (e.touches ? e.touches[0].pageX : e.pageX) - e.target.offsetLeft
        const posY = (e.touches ? e.touches[0].pageY : e.pageY) - e.target.offsetTop

        this.drawParams = {
          ...this.drawParams,
          touchPos: { x: posX, y: posY }
        }

        this.drag()
      } else {
        this.setState({ dragging: false })

        this.drawParams = {
          ...this.drawParams,
          touchStart: { x: 0, y: 0 },
          touchPos: { x: 0, y: 0 },
          touchEndCoords: this.drawParams.finalCoords
        }
      }
    }
  }

  render () {
    const { marginX, marginY } = this.drawParams
    const { scale } = this.state
    const { width, height } = this.props

    return (
      <div className="AvatarCropper" ref={ c => { this.container = c } }>
        <Dropzone
          className="Dropzone"
          multiple={ false }
          onDrop={ this.onDrop }
          style={{
            transform: `scale(${scale}) translate(-50%)`,
            WebkitTransform: `scale(${scale}) translate(-50%)`
          }}
        />
        <canvas
          className="canvas"
          height={ 500 }
          onMouseDown={ this.handleTouchStart }
          onMouseMove={ this.handleTouchMove }
          onMouseUp={ this.handleTouchEnd }
          onTouchEnd={ this.handleTouchEnd }
          onTouchMove={ this.handleTouchMove }
          onTouchStart={ this.handleTouchStart }
          onWheel={ this.scaleImage }
          ref={ c => { this.canvas = c } }
          style={{
            pointerEvents: this.state.hasImage ? 'auto' : 'none',
            transform: `scale(${scale}) translate(-50%)`,
            WebkitTransform: `scale(${scale}) translate(-50%)`
          }}
          width={ 500 }
        />
        <div
          className="mask"
          style={{
            borderTop: `${marginY}px solid rgba(252, 248, 240, .8)`,
            borderLeft: `${marginX}px solid rgba(252, 248, 240, .8)`,
            borderBottom: `${marginY}px solid rgba(252, 248, 240, .8)`,
            borderRight: `${marginX}px solid rgba(252, 248, 240, .8)`,
            transform: `scale(${scale}) translate(-50%)`,
            WebkitTransform: `scale(${scale}) translate(-50%)`
          }}
        />
        <div
          className="inputGroup"
          style={{
            transform: `translateX(-50%) translateY(${500 * scale}px)`,
            WebkitTransform: `translateX(-50%) translateY(${500 * scale}px)`
          }}
        >
          <input
            className="InputRange"
            max={ 500 }
            min={ width <= height ? width : height }
            onChange={ e => this.scaleImage(e) }
            ref={ c => { this.inputRange = c } }
            type="range"
            value={ this.state.scaleValue }
          />
          <button
            className="saveButton"
            onClick={ this.handleSave }
          >
            salvar imagem
          </button>
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

export default AvatarCropper
