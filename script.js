// Fullscreen API Polyfill
!function(a){"use strict";function g(b,c){var d=a.createEvent("Event");d.initEvent(b,!0,!1),c.dispatchEvent(d)}function h(b){a[f.enabled]=a[c.enabled],a[f.element]=a[c.element],g(f.events.change,b.target)}function i(a){g(f.events.error,a.target)}var c,d,b=!0,e={w3:{enabled:"fullscreenEnabled",element:"fullscreenElement",request:"requestFullscreen",exit:"exitFullscreen",events:{change:"fullscreenchange",error:"fullscreenerror"}},webkit:{enabled:"webkitIsFullScreen",element:"webkitCurrentFullScreenElement",request:"webkitRequestFullScreen",exit:"webkitCancelFullScreen",events:{change:"webkitfullscreenchange",error:"webkitfullscreenerror"}},moz:{enabled:"mozFullScreen",element:"mozFullScreenElement",request:"mozRequestFullScreen",exit:"mozCancelFullScreen",events:{change:"mozfullscreenchange",error:"mozfullscreenerror"}},ms:{enabled:"msFullscreenEnabled",element:"msFullscreenElement",request:"msRequestFullscreen",exit:"msExitFullscreen",events:{change:"MSFullscreenChange",error:"MSFullscreenError"}}},f=e.w3;for(d in e)if(e[d].enabled in a){c=e[d];break}return!b||f.enabled in a||!c||(a.addEventListener(c.events.change,h,!1),a.addEventListener(c.events.error,i,!1),a[f.enabled]=a[c.enabled],a[f.element]=a[c.element],a[f.exit]=a[c.exit],Element.prototype[f.request]=function(){return this[c.request].apply(this,arguments)}),c}(document);

////////////////////
///Initialization///
////////////////////

// get DOM nodes
var body = document.body;
var canvas = document.getElementById('canvas');
var audio = document.getElementById('audio');
// overlay elements
var overlay = document.getElementById('overlay');
var title = document.getElementById('title');
// menu items
var lakeButton = document.getElementById('lake');
var hillsButton = document.getElementById('hills');
var forestButton = document.getElementById('forest');
var fullscreenButton = document.getElementById('fullscreen');
var muteButton = document.getElementById('mute');

// initialize canvas
var ctx = canvas.getContext('2d');
var resolution = (function () {
  var dpr = window.devicePixelRatio || 1;
  var bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
  return dpr / bsr;
})();

// track audio state
var muted = false;

// menu fading
var doneMoving; // holds a setTimeout that fades the overlay when the user is idle
var faded; // boolean, whether or not the overlay is showing
var chromeBlock = false; // Chromefix, prevents mouse event refire

// window resizing
var dim = fitCanvas();
var doneResizing; // holds a setTimeout that fades the overlay when the user is idle
var cleared = false;

// scenes & animation
var scenes = [lake, hills, forest];
var currentScene;
var sceneLoop;
var animationLoop;

initScene('linescapes', 'stark');

///////////////
///Functions///
///////////////

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen () {
  if (document.fullscreenEnabled) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
}

/**
 * TODO
 */
function toggleMute () {
  if (muted) {
    muteButton.className = '';
  } else {
    muteButton.className = 'muted';
  }
  muted = !muted;
  audio.muted = muted;
}

/**
 * Make the canvas full window dimensions + 10% overflow on edges
 * @return {w, h}  w & h represent the *onscreen* dimensions
 */
function fitCanvas () {
  var d = {};
  // onscreen dimensions
  d.w = window.innerWidth * resolution;
  d.h = window.innerHeight * resolution;
  // actual dimensions (includes padding)
  d.wFull = canvas.width = d.w * 1.2;
  d.hFull = canvas.height = d.h * 1.2;

  return d;
}

function initScene (name, theme, fn) {
  clearTimeout(sceneLoop);
  cancelAnimationFrame(animationLoop);
  title.textContent = name;
  body.className = theme;
  canvas.className = name;
  currentScene = fn ? fn : null;
  clear();
}

/**
 * Similar to setInterval, but using requestAnimationFrame
 * Sets {global sceneLoop} to point at the current timeout
 * @param  {Function} fn          function to execute every {framerate}ms
 * @param  {int}      framerate   framerate in ms
 * @param  {string}   scene       name of the scene
 */
function startTick (fn, framerate) {
  var tick;

  if (framerate) {
    tick = function () {
      sceneLoop = setTimeout(function () {
        fn();
        animationLoop = requestAnimationFrame(tick);
      }, framerate);
    };
  } else {
    tick = function () {
      fn();
      animationLoop = requestAnimationFrame(tick);
    };
  }

  animationLoop = requestAnimationFrame(tick);
}

/**
 * Fade the overlay as delegated by fadeHandler()
 */
function fade () {
  // block mouse events for 200ms to avoid accidental refire (Chrome bug)
  chromeBlock = true;
  overlay.className = 'faded';
  faded = true;
  setTimeout(function () { chromeBlock = false; }, 200);
}

/**
 * Unfade the overlay as delegated by fadeHandler()
 */
function unfade () {
  overlay.className = '';
  faded = false;
}

/**
 * Call unfade if the overlay is faded, then set it to fade in 4000ms
 */
function fadeHandler () {
  if (!chromeBlock) {
    if (faded) unfade();
    clearTimeout(doneMoving);
    doneMoving = setTimeout(fade, 1000);
  }
}

/**
 * Update the canvas size and reinitialize the current scene
 */
function redraw () {
  dim = fitCanvas(); // resize the canvas
  if (currentScene) currentScene();
  cleared = false;
}

/**
 * Clear the canvas if there's an active scene, then set it to redraw in 400ms
 */
function resizeHandler () {
  if (!cleared) {
    clear();
    cleared = true;
  }
  clearTimeout(doneResizing);
  doneResizing = setTimeout(redraw, 400);
}

function keypressHandler (e) {
  var val = e.which;
  if (val >= 49 && val < 49 + scenes.length) {
    scenes[val - 49](); // normalizes number keys to val: {1,2,3} -> {0,1,2}
  } else if (val === 70 || val === 102) { // F key
    toggleFullscreen();
  } else if (val === 77 || val === 109) { // M key
    toggleMute();
  }
  fadeHandler();
}

/**
 * Constrain a number to a lower and upper bound
 * @param  {int} n   Original number to constrain
 * @param  {int} lo  Lower bound
 * @param  {int} hi  Upper bound
 * @return {int}     Original number constrained to the provided bounds
 */
function bound (n, lo, hi) {
  return Math.min(Math.max(n, lo), hi);
}

/**
 * Add a random +/- error within a provided range to a number
 * @param  {int}   n   Original number to vary
 * @param  {int}   d   Variance in both + and - directions
 * @return {int}       Original number with added variance
 */
function vary (n, d) {
  return n + Math.round(d * (Math.random() * 2 - 1));
}

/**
 * Clear the canvas
 */
function clear () {
  ctx.clearRect(0, 0, dim.wFull, dim.hFull);
}

/**
 * Shift the canvas contents
 * @param  {int}        x   Amount shifted in the x direction (px)
 * @param  {int}        y   Amount shifted in the y direction
 */
function shift (x, y) {
  var imageData = ctx.getImageData(-x, -y, dim.wFull - x, dim.hFull - y);
  ctx.putImageData(imageData, 0, 0);

  if (x > 0) ctx.clearRect(0, 0, x, dim.hFull);
  else if (x < 0) ctx.clearRect(dim.wFull + x, 0, x, dim.hFull);

  if (y > 0) ctx.clearRect(0, 0, dim.wFull, y);
  else if (y < 0) ctx.clearRect(0, dim.hFull + y, dim.wFull, y);
}

/**
 * Draw a full-width random waveform (with constraints) to the canvas
 * @param  {float}   top     Upper y-bound for the bars as a % of canvas height [-0.1, 1.1]
 * @param  {float}   bottom  Lower y-bound for the bars as a % of canvas height [-0.1, 1.1]
 * @param  {float}   min     Minimum bar height as a % of canvas height [-0.1, 1.1]
 * @param  {int}     hDelta  Allowed height variance (+ and -) between adjacent bars (px)
 * @param  {array3}  c1      RGB components for two 'post colors'. Colors are
 * @param  {array3}  c2        taken in the range between c1 and c2
 * @param  {int}     cDelta  Allowed color varience per-channel (+ and -) for adjacent bars
 * @param  {string}  latch   Bars can latch to 'top', 'center', or 'bottom' (default)
 * @return {string}          A string that says "Booya!"
 */
function vertLines (top, bottom, min, hDelta, latch, c1, c2, cOpacity, cDelta) {
  // set defaults
  if (typeof cOpacity === 'undefined') cOpacity = 1;
  if (typeof cDelta === 'undefined') cDelta = 1;

  // switch units from % to px values
  // the canvas has a 10% overflow so we're actually treating axes as 120%, or [-0.1, 1.1]
  top = (top + 0.1) * dim.h;
  bottom = (bottom + 0.1) * dim.h;
  min *= dim.h;

  function noisify (c, i) {
    return bound(vary(c, cDelta), cBounds[i][0], cBounds[i][1]);
  }

  var y0, y1;
  var heightRange = bottom - top;
  var barHeight = Math.round(Math.random() * heightRange);

  var cBounds = c1.map(function (cA, i) {
    var cB = c2[i];
    return cA < cB ? [cA, cB] : [cB, cA];
  });
  var barColor = cBounds.map(function (cs) {
    return Math.round(cs[0] + Math.random() * (cs[1] - cs[0]));
  });

  for (var x = 0; x < dim.wFull; x += resolution) {
    barColor = barColor.map(noisify);
    barHeight = bound(vary(barHeight, hDelta), min, heightRange);

    switch (latch) {
      case 'top':
        y0 = top;
        break;
      case 'center':
        y0 = top + Math.floor((heightRange - barHeight) / 2);
        break;
      case 'bottom':
        y0 = bottom - barHeight;
        break;
      default:
    }
    y1 = y0 + barHeight;

    ctx.strokeStyle = 'rgba(' + barColor + ',' + cOpacity + ')';
    ctx.beginPath();
    // add 0.5 to the x coordinate to avoid antialiasing
    ctx.moveTo(x + 0.5, y0);
    ctx.lineTo(x + 0.5, y1);
    ctx.stroke();
    ctx.closePath();
  }
  return 'Booya!';
}

function lake () {
  initScene('lake', 'light', lake);
  // sky
  vertLines(0, 1, 0.5, 0, 'top', [255, 250, 240], [255, 255, 244]);
  // mountains background
  vertLines(0.125, 0.5, 0.3, 4, 'bottom', [250, 197, 210], [255, 200, 210]);
  // mountains foreground
  vertLines(0.1667, 0.5, 0.2, 5, 'bottom', [250, 207, 200], [255, 210, 200]);
  // back trees
  vertLines(0.25, 0.5, 0.05, 8, 'bottom', [180, 226, 190], [180, 235, 200]);
  // water
  vertLines(0.5, 1, 0.5, 0, 'top', [180, 210, 240], [180, 212, 246]);
  // trees
  vertLines(0.45, 0.55, 0.03, 12, 'center', [200, 240, 226], [200, 255, 226], 0.6);
}

function forest () {
  function step () {
    shift(0, 1);
    if (++counter > division) {
      vertLines(-0.1, 0.1, offset, 8, 'top', [205, 133, 63], [205, 133, 63]);
      counter = 0;
    }
    if (counter % fadeDivision === 0) {
      ctx.fillRect(0, 0, dim.wFull, dim.hFull);
    }
  }

  var counter = 0;
  var division = dim.h / 10;
  var fadeDivision = Math.floor(division / 7);
  var offset = 0.1; // +/- offset for hills (causes overlap)

  initScene('forest', 'light', forest);

  ctx.setFillColor('rgba(0, 0, 0, 0.036)');
  for (var h = 10; h >= 0; h--) {
    vertLines(h/10 - offset, h/10 + offset, offset, 8, 'top', [205, 133, 63], [205, 133, 63]);
    // overlay 6 layers of fog to ensure alpha blending is consistent
    for (var a = 0; a < 6; a++) ctx.fillRect(0, 0, dim.wFull, dim.hFull);
  }
  startTick(step, 0); // as fast as possible
}

function hills () {
  function step () {
    shift(0, -1);
    if (++counter > division) {
      vertLines(0.9, 1.1, offset * 4/3, 5, 'center', [0, 0, 255], [0, 0, 255]);
      counter = 0;
    }
    if (counter % fadeDivision === 0) {
      ctx.fillRect(0, 0, dim.wFull, dim.hFull);
    }
  }

  var counter = 0;
  var division = dim.h / 10;
  var fadeDivision = Math.floor(division / 7);
  var offset = 0.1; // +/- offset for hills (causes overlap)

  initScene('hills', 'light', hills);

  ctx.setFillColor('rgba(255, 255, 255, 0.02)');
  for (var h = -1; h <= 10; h++) {
    vertLines(h/10 - offset, h/10 + offset, offset * 4/3, 5, 'center', [0, 0, 255], [0, 0, 255]);
    // overlay 6 layers of fog to ensure alpha blending is consistent
    for (var a = 0; a < 6; a++) ctx.fillRect(0, 0, dim.wFull, dim.hFull);
  }
  startTick(step, 20000 / dim.h); // 20s for a mountain to travel from bottom to top
}

// event listeners
// menu items
lakeButton.addEventListener('click', lake, false);
hillsButton.addEventListener('click', hills, false);
forestButton.addEventListener('click', forest, false);
fullscreenButton.addEventListener('click', toggleFullscreen, false);
muteButton.addEventListener('click', toggleMute, false);

// window
window.addEventListener('resize', resizeHandler, false);
window.addEventListener('keypress', keypressHandler, false);
window.addEventListener('mousemove', fadeHandler, false);
window.addEventListener('mousedown', fadeHandler, false);
window.addEventListener('DOMMouseScroll', fadeHandler, false);
window.addEventListener('mousewheel', fadeHandler, false);
window.addEventListener('touchmove', fadeHandler, false);
window.addEventListener('MSPointerMove', fadeHandler, false);

fadeHandler();
