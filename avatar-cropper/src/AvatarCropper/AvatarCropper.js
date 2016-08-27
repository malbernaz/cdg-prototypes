import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import CompressWorker from 'worker?inline!./CompressWorker.js'
import './AvatarCropper.css'
import './InputRange.css'

class AvatarCropper extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hasImage: false,
      scaleValue: 50,
      scale: window.innerWidth >= 530 ? 1 : window.innerWidth / 530
    }

    this.imageData = {
      image: null,
      initialCoords: { x: 0, y: 0 },
      factor: 1
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
      _this.imageData = {
        ..._this.imageData,
        image: this,
        initialWidth: this.width,
        initialHeight: this.height
      }

      if (this.width >= this.height) {
        _this.inputRange.min = Math.floor((180 / this.width) * 50)

        if (this.width <= 500) {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: this.width,
            finalHeight: this.height
          }
        } else {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: 500,
            finalHeight: 500 * (this.height / this.width)
          }
        }
      } else {
        _this.inputRange.min = Math.floor((180 / this.height) * 50)

        if (this.height <= 500) {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: this.width,
            finalHeight: this.height
          }
        } else {
          _this.imageData = {
            ..._this.imageData,
            finalWidth: 500 * (this.width / this.height),
            finalHeight: 500
          }
        }
      }

      _this.modifyCoords({
        x: (_this.canvas.width - _this.imageData.finalWidth) / 2,
        y: (_this.canvas.height - _this.imageData.finalHeight) / 2
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

  handleResize = () => {
    if (window.matchMedia(530)) {
      this.setState({
        scale: window.innerWidth >= 530 ? 1 : window.innerWidth / 530
      })
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
      finalCoords,
      factor
    } = this.imageData

    context.clearRect(0, 0, this.canvas.width, this.canvas.height)
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

    if (x < (this.canvas.width - finalWidth * factor) - 160) {
      this.modifyCoords({ x: (this.canvas.width - finalWidth * factor) - 160 })
    } else if (x > 160) {
      this.modifyCoords({ x: 160 })
    } else {
      this.modifyCoords({ x })
    }

    if (y < (this.canvas.height - finalHeight * factor) - 160) {
      this.modifyCoords({ y: (this.canvas.height - finalHeight * factor) - 160 })
    } else if (y > 160) {
      this.modifyCoords({ y: 160 })
    } else {
      this.modifyCoords({ y })
    }

    this.draw()
  }

  scaleImage = e => {
    e.preventDefault()

    if (this.imageData.image) {
      const { inputRange: { max, min }, canvas } = this
      const { scaleValue } = this.state
      const {
        finalCoords: { x, y },
        finalWidth,
        finalHeight,
        lastWidth,
        lastHeight
      } = this.imageData

      if (e.type === 'wheel') {
        if (e.deltaY > 1) {
          this.setState({
            scaleValue: scaleValue + 2 <= max ? scaleValue + 2 : scaleValue
          })
        } else {
          this.setState({
            scaleValue: scaleValue - 2 >= min ? scaleValue - 2 : scaleValue
          })
        }
      } else {
        this.setState({ scaleValue: e.target.value })
      }

      let factor = this.state.scaleValue / 50

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

    if (this.imageData.image) {
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

    if (this.state.dragging && this.imageData.image) {
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

    if (this.imageData.image) {
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

    if (this.imageData.image) {
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
    const { scaleValue, scale } = this.state

    return (
      <div className="AvatarCropper" ref={ c => { this.container = c } }>
        <Dropzone
          className="Dropzone"
          style={{
            transform: `scale(${scale}) translate(-50%)`,
            WebkitTransform: `scale(${scale}) translate(-50%)`
          }}
          multiple={ false }
          onDrop={ this.onDrop }
        >
          { this.children }
        </Dropzone>
        <canvas
          ref={ c => { this.canvas = c } }
          className="canvas"
          onTouchStart={ this.handleTouchStart }
          onMouseDown={ this.handleTouchStart }
          onTouchMove={ this.handleTouchMove }
          onMouseMove={ this.handleTouchMove }
          onTouchEnd={ this.handleTouchEnd }
          onMouseUp={ this.handleTouchEnd }
          onWheel={ this.scaleImage }
          style={{
            pointerEvents: this.state.hasImage ? 'auto' : 'none',
            transform: `scale(${scale}) translate(-50%)`,
            WebkitTransform: `scale(${scale}) translate(-50%)`
          }}
          width={ 500 }
          height={ 500 }
        />
        <div
          className="mask"
          style={{
            transform: `scale(${scale}) translate(-50%)`,
            WebkitTransform: `scale(${scale}) translate(-50%)`
          }}
        />
        <div className="inputGroup">
          <input
            className="InputRange"
            max={ 100 }
            min={ 25 }
            value={ parseInt(scaleValue, 10) }
            onChange={ e => this.scaleImage(e) }
            ref={ c => { this.inputRange = c } }
            style={{ transform: 'translateY(-50%)' }}
            type="range"
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
