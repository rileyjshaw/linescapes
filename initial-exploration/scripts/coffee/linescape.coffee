class Linescape
  constructor: () ->
    canvas = document.getElementById 'canvas'
    ctx = canvas.getContext '2d'
    this.resize()

  resize: () =>
    @width = canvas.width = document.body.clientWidth
    # timeout addresses iFrame bug
    setTimeout () ->
      @height = canvas.height = document.body.clientHeight
    , 0

  paint: (avg, range, color) =>
    skew = Math.random() * range
    step = range / 8
    halfstep = step / 2

    ctx.strokeStyle = color
    ctx.fillStyle = 'rgba(255,255,255, .1)'

    ctx.beginPath()
    ctx.rect 0, 0, @width, @height
    ctx.fill()
    ctx.closePath()

    for i in [0..c_width]
      skew += Math.random() * step - halfstep

      ctx.beginPath()
      ctx.moveTo i, avg + skew
      ctx.lineTo i, avg - skew
      ctx.stroke()
      ctx.closePath()

linescape = new Linescape
window.addEventListener load, linescape.init, false
window.addEventListener resize, linescape.init, false