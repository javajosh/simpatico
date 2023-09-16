<!--<!DOCTYPE html>
<head lang="en">
  <meta charset="UTF-8">
  <meta name="keywords" content="JavaScript, ES6, functional, simpatico, minimalist, web verite">
  <meta name="author" content="jbr">

  <!-- Begin testable.js html boilerplate; testable.js is in the same directory -->
  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='DodgerBlue' />
  </svg>"/>
  <script src="testable.js"></script>
  <!-- End testable.js boilerplate  -->

  <title>Simpatico: SVG</title>
  <link rel="stylesheet" type="text/css" href="/style.css">
  <link rel="stylesheet" href="/kata/highlight.github-dark.css">
  <script type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    hljs.registerLanguage('javascript', javascript);
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
      });
    });
  </script>
</head>-->

# Simpatico: SVG
jbr 2023
See:
[home](/),
[combine2](./combine2.md),
[litmd](/lit.md),
[audience](/audience.md)

__________________________________________
# Rotating squares animation

```html
<svg id="rotating-squares-animation" class="natural-units"
     width="200px" height="200px"
     viewBox="-1 -1 2 2"
>
  <desc>Two squares moving around the unit circle and rotating, too, plus constantly changing text.</desc>
  <g transform="scale(1,-1)">
    <line class="x-axis-blue" stroke="blue" stroke-width=".001" x1=-1 y1=0 x2=1 y2=0 />
    <line class="y-axis-red" stroke="red" stroke-width=".001" x1=0 y1=-1 x2=0 y2=1 />
    <g id="green-square"  transform="translate(0,0)"  ><rect x=-0.1 y=-0.1 width=".2" height=".2" fill="#482" /></g>
    <g id="yellow-square" transform="translate(0,0)">  <rect x=-0.2 y=-0.2 width=".4" height=".4" fill="#882" /></g>
    <g id="unit-circle"   transform="translate(0 ,0 )"><circle class='unit-circle' r="1" fill="none" stroke="red" stroke-width=".001 "/></g>
    <g id="some-text"     transform="scale(.008,-.008)"><text>Simpatico is pretty cool</text></g>
  </g>
</svg>
```

```css
#rotating-squares-animation  rect {
  opacity: .5
}
```

```js
import {svg, shuffle, now, log} from '/simpatico.js';
// Bind elements
const greenSquare = svg.elt("green-square");
const yellowSquare = svg.elt("yellow-square");
const someText = svg.elt("some-text");

// Configure the clock
const throttle = 2;
const clock = svg.clock(throttle);
// window.clock = clock;

// Steady state - global event requestAnimationFrame pump-based  clock
window.addEventListener(clock.clockId, e => {
  animate(e.detail.t);
});

const DEBUG = false;
const {cos, sin} = Math;
const C = 1e-3;
const letters = 'Simpatico is cool!'.split('');

/**
 * Animate the rotating squares.
 * For each element, we update its transform attribute.
 * Those attributes are themselves a function of t.
 *
 * @param {number} t - time in ms
 */
function animate(t) {
  // Hopefully the javascript engine is smart enough to not actually redefine this on every invocation
  // "Config" here in the physical sense, not the software sense.
  // These functions define the physical configuration of the elements.
  const config = {
    "green-square":  t => ({
      x: cos( C * t),
      y: sin( C * t),
      rotate: t/10 % 360,
    }),
    "yellow-square": t => ({
      desc: 'big and yellow, clockwise',
      x: cos( -C * t),
      y: sin( -C * t),
      rotate: t/10 % 360,
    }),
    "some-text":     t => ({
      text: shuffle(letters).join(''),
      scale: ".008,-.008",
      rotate: t/10 % 360,
    })
  };

  svg.scatter(greenSquare,  config["green-square"](t));
  svg.scatter(yellowSquare, config["yellow-square"](t));
  svg.scatter(someText,     config["some-text"](t));
}
```

# Particle Container
This is a simpler, worse version of [d3 collision demo](https://observablehq.com/@d3/collision-detection/2)

```html
<svg id="particle-container" class="natural-units"
     width="200px" height="200px"
     viewBox="-2 -2 4 4"
>
  <g id="box" transform="scale(1.15)">
    <rect x=-1 y=-1
          width=2
          height=2
          fill="none"
          stroke="#777"
          stroke-width=".09">
    </rect>
  </g>
  <!-- Put particles here -->
</svg>
```

```js
import { svg, shuffle, now, log } from '/simpatico.js';

// Bind
const svgElement = svg.elt('particle-container');

// Configure
const DEBUG = false;
const { cos, sin, random, sqrt, floor } = Math;
const C = 1e-3;
const numParticles = 1e2; // 3 is okay, 4 is very slow
const throttle = 5;
const collisionThreshold = 1;
const dataSetKey = '___d';

// Initialize particles
const particles = Array.from({ length: numParticles }, particle);


// Add them all to the DOM
particles.forEach((particle, i) => {
  svgElement.appendChild(particle.elt);
});

// Start the clock
window.addEventListener(svg.clock(throttle).clockId, e => {
  animate(e.detail.t);
});


/**
 * Create or update a particle.
 * Create an association between DOM elt and particle data.
 * May look into using a Dataset if we want to specify states within markup..
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset

 * @param p
 * @returns {{vx: number, vy: number, x: number, y: number, id: number, fill: string, elt: SVGGElement}}
 */
function particle(p){
  let elt, particleData;

  if (typeof p === 'number' || p === undefined) {
    const [x, y] = [2 * random() - 1, 2 * random() - 1];
    const [vx, vy] = [x/20, y/20];
    const fill = '#' + floor(random() * 16777215).toString(16);
    elt = createCircleElement(fill);
    particleData = { id: p, x, y, vx, vy, fill, elt};
  } else {
    if (!p.hasOwnProperty('elt') || p.elt[dataSetKey] === undefined){
      throw new Error('Particle data not found in DOM element');
    }
    elt = p.elt;
    // Recover the data from the DOM elt
    const prevParticleData = elt[dataSetKey];
    let {x, y, vx, vy} = prevParticleData;

    // Non-interacting regular motion in a box
    if (x > 1 || x < -1) vx *= -1;
    if (y > 1 || y < -1) vy *= -1;

    // It is surprisingly hard to add random motion without increasing velocity without bound.
    // const r = randomWalk(p);

    // Return the result
    particleData = {
      ...prevParticleData,
      x: x + random() * vx,
      y: y + random() * vy,
      vx:  vx,
      vy:  vy,
    };
  }
  // The DOM elt and data are bidirectionally linked.
  elt[dataSetKey] = particleData;
  return particleData;
}

// For artistic reasons, update one elt at a time.
// For a smoother animation, update all at once.
function animate(t) {
  particles.forEach(p => {
    scatter(p.elt, particle(p));
  });
}

// Update element transform
function scatter(element, config) {
  const { x=0, y=0, rotate=0, scale=1 } = config;
  const transform = `translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`;
  element.setAttribute('transform', transform);
}

function createCircleElement(fill='DodgerBlue', r = 0.1) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('r', r);
  circle.setAttribute('fill', fill);
  g.appendChild(circle);
  return g;
}


// Find any collisions. This is O(N^2), but N is small.
// Not used yet.
function checkCollision(particle){
  particles.forEach((other) => {
    if (particle === other) return;

    const dx = other.x - x;
    const dy = other.y - y;
    const dist = sqrt(dx * dx + dy * dy);

    // If we're too close, swap velocities
    if (dist <= collisionThreshold) {
      [particle.vx, other.vx] = [other.vx, particle.vx];
      [particle.vy, other.vy] = [other.vy, particle.vy];
    }
  })
}

// random distance in a random direction
function randomWalk({x, y, vx, vy}){
  const dir = random() * 360;
  const mag = random()/100;
  return {
    x:  cos(dir) * mag,
    y:  sin(dir) * mag,
    vx: cos(dir) * mag,
    vy: sin(dir) * mag,
  };
}





```
# Testing Animation Efficacy (nonvisual)
It's challenging to test something like animation automatically, but it can be done.
To test that something is changing, we use the `MutationObserver` DOM API to check for changes.
If I don't see any after a short time (~500ms), the test fails.
TODO: factor this out into a testing module and reuse it for, say, the clock animation.
```js
// Bind to the target element
const rotatingSquaresAnimation = document.getElementById('rotating-squares-animation');

// Configure the observer
// Set INSPECT to true to see the mutations
const INSPECT = false;
const observeDuration = 500;
const config = {
  attributes: true,
  childList: true,
  subtree: true,
};

// Run the steady state, driven by mutation events
let mutationCount = 0;
const observer = new MutationObserver(handleMutations);
observer.observe(rotatingSquaresAnimation, config);

// Limit the steady state to observDuration ms.
// if we don't see any mutations, we fail the test
setTimeout(()=>{
  if (mutationCount == 0){
    throw new Error(`animation target #rotating-squares-animation did not mutate within ${observeDuration} ms`);
  }
  observer.disconnect();
}, observeDuration)

/**
 * Callback function to execute when mutations are observed
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 * @param {MutationRecord[]} mutations
 */
function handleMutations(mutations) {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutationCount += 1;
      if (INSPECT) console.log('A child node has been added or removed:', mutation);
    } else if (mutation.type === 'attributes') {
      mutationCount += 1;
      if (INSPECT) console.log(`Attribute '${mutation.attributeName}' changed on element:`, mutation.target);
    }
  });
}
```
Notice the pattern: bind to the target element, configure the observer, and run the steady state.
(In this case we also have a limiter on the steady state.)
The bulk of the code will almost always be in the support functions below.
(Which cannot be arrow functions because they aren't hoisted like functions are.)

# Clock Animation
Let's make an analog clock that keeps proper time.
The first problem is to get the angles of the 3 hands, hours minutes and seconds.
Timestamp is in milliseconds, so we need to convert to seconds, then to hours, minutes and seconds.
We also need to convert to radians, and then to degrees.

_______________________________________________________
## Clock 1
This clock, and the next one, is animated from the same script below.
The difference is that this clockface was done crudely, and `tick()` is not throttled.
```html
<svg id="clock0" class="natural-units"
     width="200px" height="200px"
     viewBox="-1 -1 2 2">
  <desc>A clock with hands that keep proper time</desc>
  <g transform="scale(1,-1)">
    <g id="clock-face" transform="scale(.01,-.01)">
      <circle class='unit-circle' r="100" fill="none" stroke="red" stroke-width=".1"/>
      <g transform="translate(0,-90)"><text>12</text></g>
      <g transform="translate(0,90)"><text>6</text></g>
      <g transform="translate(90,0)"><text>3</text></g>
      <g transform="translate(-90,0)"><text>9</text></g>
    </g>
    <g id="hour-hand0">
      <rect width=".1" height=".4" fill="#482" />
    </g>
    <g id="minute-hand0">
      <rect width=".05" height=".6" fill="#882" />
    </g>
    <g id="second-hand0">
      <rect width=".01" height=".8" fill="#c82" />
    </g>
</svg>
```
_______________________________________________________
## Clock 2
This is a face taken from [wikipedia](https://upload.wikimedia.org/wikipedia/commons/0/02/Analogue_clock_face.svg).
I then modified it in place - adding the hands.
```html
<svg id="clock1" width="200" height="200">
  <linearGradient id="a" x1=".7495" x2="198.2495" y1="1.252" y2="197.752" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#666"/>
    <stop offset="1" stop-color="#b2b2b2"/>
  </linearGradient>
  <circle cx="100" cy="100" r="97.5" fill="url(#a)"/>
  <linearGradient id="b" x1="21.7056" x2="177.7056" y1="16.687" y2="182.687" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#e5e5e5"/>
    <stop offset="1" stop-color="#fff"/>
  </linearGradient>
  <circle cx="100" cy="100" r="93.5" fill="url(#b)"/>
  <radialGradient id="c" cx="59.1675" cy="35.834" r="252.8037" gradientUnits="userSpaceOnUse">
    <stop offset=".1057" stop-color="#fff"/>
    <stop offset="1" stop-color="#e5e5e5"/>
  </radialGradient>
  <circle cx="100" cy="100" r="88.5" fill="url(#c)"/>
  <path fill="#133" d="M96.695 14.852V26.5h-3.219v-7.633c-.521.396-1.025.716-1.512.961-.487.245-1.098.479-1.832.703v-2.609c1.083-.349 1.924-.768 2.523-1.258.599-.489 1.067-1.094 1.406-1.813h2.634zM109.469 26.5h-9.547c.109-.942.441-1.829.996-2.66.555-.831 1.595-1.811 3.121-2.941.932-.692 1.528-1.219 1.789-1.578.26-.359.391-.7.391-1.023 0-.349-.129-.647-.387-.895-.258-.247-.582-.371-.973-.371-.406 0-.738.128-.996.383s-.432.706-.52 1.352l-3.188-.258c.125-.896.354-1.595.688-2.098.333-.502.803-.888 1.41-1.156.606-.268 1.446-.402 2.52-.402 1.119 0 1.99.128 2.613.383.622.255 1.111.647 1.469 1.176.356.529.535 1.121.535 1.777 0 .698-.205 1.365-.613 2-.409.636-1.152 1.333-2.23 2.094-.641.443-1.069.753-1.285.93-.217.177-.471.409-.762.695h4.969V26.5zm68.437 69.27-3.008-.539c.25-.958.73-1.692 1.441-2.203.711-.51 1.717-.766 3.02-.766 1.494 0 2.575.279 3.242.836.666.558 1 1.258 1 2.102 0 .495-.136.943-.406 1.344-.271.401-.68.753-1.227 1.055.442.109.781.237 1.016.383.38.234.676.543.887.926s.316.84.316 1.371c0 .667-.175 1.307-.523 1.918-.35.612-.852 1.084-1.508 1.414s-1.519.496-2.586.496c-1.042 0-1.863-.123-2.465-.367s-1.097-.603-1.484-1.074c-.389-.471-.687-1.063-.895-1.777l3.18-.422c.125.641.318 1.085.582 1.332.263.248.598.371 1.004.371.427 0 .782-.156 1.066-.469.283-.313.426-.729.426-1.25 0-.531-.137-.942-.41-1.234-.273-.292-.645-.438-1.113-.438-.25 0-.594.063-1.031.188l.164-2.273c.177.026.314.039.414.039.416 0 .764-.133 1.043-.398.278-.266.418-.581.418-.945 0-.349-.104-.627-.313-.836-.209-.208-.495-.313-.859-.313-.375 0-.68.113-.914.34s-.394.621-.477 1.189zm-160.945 5.57 3.164-.398c.083.443.224.756.422.938.198.183.44.273.727.273.51 0 .909-.258 1.195-.773.208-.38.364-1.185.469-2.414-.38.391-.771.677-1.172.859-.401.183-.865.273-1.391.273-1.026 0-1.892-.364-2.598-1.094-.706-.729-1.059-1.651-1.059-2.766 0-.76.18-1.453.539-2.078s.854-1.098 1.484-1.418c.63-.32 1.422-.48 2.375-.48 1.146 0 2.065.197 2.758.59.692.394 1.246 1.019 1.66 1.875.414.857.621 1.988.621 3.395 0 2.068-.435 3.582-1.305 4.543-.87.961-2.076 1.441-3.617 1.441-.912 0-1.63-.105-2.156-.316-.526-.211-.964-.52-1.313-.926-.347-.407-.616-.915-.803-1.524zm5.859-5.11c0-.62-.156-1.105-.469-1.457s-.693-.527-1.141-.527c-.422 0-.772.159-1.051.477-.279.318-.418.794-.418 1.43 0 .641.145 1.13.434 1.469.289.339.649.508 1.082.508.448 0 .82-.164 1.117-.492s.446-.798.446-1.408zm81.211 79.895-3.164.391c-.084-.442-.223-.755-.418-.938-.195-.182-.437-.273-.723-.273-.516 0-.917.261-1.203.781-.208.375-.362 1.178-.461 2.406.38-.385.771-.67 1.172-.855.401-.185.864-.277 1.391-.277 1.021 0 1.884.365 2.59 1.094.705.729 1.059 1.654 1.059 2.773 0 .756-.179 1.445-.535 2.07-.357.625-.852 1.098-1.484 1.418s-1.426.48-2.379.48c-1.146 0-2.065-.195-2.758-.586-.693-.391-1.246-1.014-1.66-1.871-.414-.856-.621-1.99-.621-3.402 0-2.067.435-3.582 1.305-4.543.87-.961 2.075-1.441 3.617-1.441.911 0 1.631.105 2.16.316.528.211.967.52 1.316.926.348.406.614.917.796 1.531zm-5.859 5.102c0 .62.156 1.105.469 1.457s.695.527 1.148.527c.417 0 .766-.158 1.047-.477.281-.317.422-.791.422-1.422 0-.646-.146-1.138-.438-1.477-.292-.338-.654-.508-1.086-.508-.443 0-.814.164-1.113.492-.3.329-.449.798-.449 1.408zM143.73 26.383l-2.963-1.711-3.1 5.369c1 .551 1.991 1.115 2.965 1.708l3.098-5.366zM55.268 172.761l2.962 1.711 3.163-5.478c-1-.55-1.992-1.114-2.966-1.705l-3.159 5.472zm85.5 1.711 2.963-1.711-3.159-5.472c-.974.592-1.965 1.156-2.966 1.706l3.162 5.477zM58.23 24.671l-2.962 1.711 3.098 5.366c.973-.592 1.965-1.157 2.965-1.708l-3.101-5.369zm114.458 119.133 1.712-2.962-5.455-3.149c-.551 1-1.116 1.991-1.708 2.964l5.451 3.147zM26.311 55.341 24.6 58.303l5.393 3.114c.549-1.001 1.114-1.992 1.705-2.966l-5.387-3.11zm-2.139 85.927 1.709 2.962 5.965-3.443c-.594-.972-1.161-1.961-1.714-2.96l-5.96 3.441zm149.8-82.537-1.711-2.962-4.88 2.818c.589.975 1.157 1.963 1.705 2.965l4.886-2.821z"/>
  <radialGradient id="d" cx="99.5" cy="99.5" r="7" gradientUnits="userSpaceOnUse">
    <stop offset=".0088" stop-color="#4d4d4d"/>
    <stop offset="1"/>
  </radialGradient>
  <circle cx="99.5" cy="99.5" r="7" fill="url(#d)"/>
  <circle cx="99.5" cy="99.5" r="3"/>

  /* a transform to fit the clock hands in with the clock face scene coordinates */
  <g transform="translate(100,100)scale(100,-100)">
    <g id="hour-hand1">
      <rect width=".1" height=".4" fill="#482" />
    </g>
    <g id="minute-hand1">
      <rect width=".05" height=".6" fill="#882" />
    </g>
    <g id="second-hand1">
      <rect width=".01" height=".8" fill="#c82" />
    </g>
  </g>
</svg>
```

## Clock Animation script
Then we bind to the elements in the sketch, and animate them.
Note that the entirety of `clockAnglesInDegrees` is a pure function that could be used in any clock implementation.
There is nothing about this function that is specific to the DOM or SVG.

```js
import {svg} from '/simpatico.js';

//bind to the DOM svg clock elts
const clock0 = svg.elt('clock0');
const clock1 = svg.elt('clock1');

// Animate the hands of each clock.
// Note: we animate individual elements by id! They could be anywhere!
// Throttle 5 is a smooth 30fps on my browser
// Throttle 30 is pleasently chunky 5fps on my browser. Like a Rolex second-hand.
const clockControl0 = animateClock(5,  {hour:'hour-hand0', minute:'minute-hand0', second:'second-hand0'});
const clockControl1 = animateClock(30, {hour:'hour-hand1', minute:'minute-hand1', second:'second-hand1'});

// Control the clock mechanism
// Bind clock input elements to the clock controls
// In this case, just clock anywhere on the clock to toggle its runstate.
clock0.addEventListener('click', (e) => clockControl0.toggle());
clock1.addEventListener('click', (e) => clockControl1.toggle());

// Export the clocks to window for developer (and user) console support
// Try 'clockControl0.toggle()' in the console, or inspect the instances directly.
window.clockControl0 = clockControl0;
window.clockControl1 = clockControl1;


/**
 * Animate the clock hands
 *
 * @param {number} throttle - throttle the clock to this many milliseconds
 * @param {object} selectors - map of hand names to element ids like {hour, minute, second}
 * @param {boolean} INSPECT - if true, log the clock ticks
 */
function animateClock(throttle=5, selectors={hour:'hour-hand', minute:'minute-hand', second:'second-hand'}, INSPECT=false) {
  const hourHand = svg.elt(selectors.hour);
  const minuteHand = svg.elt(selectors.minute);
  const secondHand = svg.elt(selectors.second);

  // The steady-state is driven by a global singleton requestAnimationFrame pump-based  clock
  const clock = svg.clock(throttle);
  window.addEventListener(clock.clockId, (e) => {
    if (INSPECT) console.log('svg.md', 'throttle', throttle, 'tick detail', e.detail);
    animate(e.detail.t);
  });

  // The fun part: transform your target by specifying an object.
  function animate(t) {
    const {hourAngle, minuteAngle, secondAngle} = clockAnglesInDegrees(t);
    if (INSPECT) console.log({hourAngle, minuteAngle, secondAngle});
    svg.scatter(hourHand, {rotate: hourAngle});
    svg.scatter(minuteHand, {rotate: minuteAngle});
    svg.scatter(secondHand, {rotate: secondAngle});
  }
  return clock;
}

/**
 * Calculate the angles of the clock hands in degrees
 *
 * @param {number} timestamp - milliseconds since the epoch
 * @returns {hourAngle, minuteAngle, secondAngle} - the angles of the clock hands in degrees
 */
function clockAnglesInDegrees(timestamp) {
  // Extract hours, minutes, and seconds from the timestamp
  const date = new Date(timestamp);
  const hours = date.getHours() % 12; // Convert to 12-hour format
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();

  // Calculate the position of each hand (0 to 360 degrees)
  const hourAngle = (360 / 12) * hours + (360 / 12) * (minutes / 60) + (360 / 12) * (seconds / 3600);
  const minuteAngle = (360 / 60) * minutes + (360 / 60) * (seconds / 60);
  const secondAngle = (360 / 60) * seconds + (360 / 60) * ms / 1000;

  // Return the angles in degrees, with negative sign to make the hands rotate clockwise
  // toFixed truncates the numbers to be of reasonable length.
  return {
    hourAngle  : -hourAngle.toFixed(2),
    minuteAngle: -minuteAngle.toFixed(2),
    secondAngle: -secondAngle.toFixed(2)
  };
}

```
_______________________________________________________
# Animating events

```html
<svg id="animate-events-demo"
  viewBox="0 0 40 10"
  width="800px" height="200px"
>
  <rect width="1" height="1" rx=".2" />
</svg>
```
This svg consumes several kinds of events: timer, mouse, and scroll.
Once the canvas is filled, it will start over on the upper left.
Each rectangle is a different color, and the color is totally random.

```js
import {svg} from '/simpatico.js';

// Bind
const animateEventsDemo = svg.elt('animate-events-demo');

// Config
const DEBUG = false;
const clockDuration = 5000;
const W = 40, H = 10;
const dx = 1, dy = 1;
let x = 0, y = 0;
console.log('animateEventsDemo config', {W, H, dx, dy, x, y, clockDuration, DEBUG});

// Steady-state - listen for a bunch of different events:
animateEventsDemo.addEventListener('click',     eventSink);
animateEventsDemo.addEventListener('mousemove', eventSink);
document.addEventListener('scroll',    eventSink);
window.addEventListener(svg.clock(10, clockDuration).clockId, eventSink);

// Keep cloning the last child, asigning it a new position and color
// To avoid a memory leak we remove the oldest child when we hit the limit
function eventSink(e) {
  const clone = cloneLast();
  [x,y] = mod2D();
  const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
  svg.scatter(clone, {x,y, fill: color});
  if (DEBUG) console.log('animateEventsDemo eventSink', {x, y, dx, dy, fill: color}, e);
}

function mod2D() {
  x = x + dx;
  // if we hit the edge, start a new row
  if (x > W-1) {
    x = 0; y += dy;
    // if we hit the bottom, start over at the top left
    if (y > H-1) {
      x = 0; y = 0;
    }
  }
  if (DEBUG) console.log('mod2D', {x, y, dx, dy});
  return [x, y];
};

// Clone the last element in the svg and add it to the svg
// If we are over the child limit, remove the oldest child, forming a FIFO queue
function cloneLast(scene=animateEventsDemo, childLimit=W*H) {
  const last = animateEventsDemo.lastElementChild;
  const clone = last.cloneNode(true);
  if (scene.children.length > childLimit ) {
    scene.removeChild(scene.firstElementChild);
  }
  scene.appendChild(clone);
  return clone;
}

```
_______________________________
# Native SVG animation

See [animate element.](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animate)

```html
<svg
  viewBox="0 0 10 10"
  width="200px" height="200px"
>
  <rect width="10" height="10">
    <animate
      attributeName="rx"
      values="0;5;0"
      dur="10s"
      repeatCount="indefinite" />
  </rect>
</svg>
```
_______________________________
# Different ways to use SVG in HTML

See [A guy who makes great SVGs for technical illustration](https://en.wikipedia.org/wiki/User:Cmglee/Dynamic_SVG_for_Wikimedia_projects)

## Referencing an svg as a separate resource:
These three ways:

```md
<img id="wizard1" width="200px" src="/img/wizard.svg" alt="simpatico wizard" /> This is just html, supports all attributes, but no dom.
![simpatico wizard](/img/wizard.svg =200x200) This is markdown with height and width, but no id and no dom.
<object id="wizard2" data="/img/wizard.svg" width="100" height="100" type="image/svg+xml"></object> This is html, supports all attributes, and supports dom
```
<img id="wizard1" width="1px" src="/img/wizard.svg" alt="simpatico wizard" />
<object id="wizard2" data="/img/wizard.svg" width="100" height="100" type="image/svg+xml"></object>

To get to the img svg DOM, you must use the `<object>` tag.
The svg element is at `contentDocument.documentElement` property:
```js
import {svg} from '/simpatico.js';
assertEquals(false, svg.elt('wizard1').hasOwnProperty('contentDocument'));
const wizard = svg.elt('wizard2').contentDocument.documentElement;
window.wizard = wizard;
console.log('wizard', wizard);
```

Here is an aperiodic thing

```md
![aperiodic.svg](/kata/aperiodic.svg =200x200)
```
![aperiodic.svg](/kata/aperiodic.svg =200x200)

## Referencing an svg with built-in styles and javascript


To make the javascript work, you must right-click and "open image in new tab" where you can then interact (!) with it.
This technique was originally described by [Peter Collingridge](https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/)

![minimal draggable object demo](/img/draggable.svg =200x200)


_______________________________
# Discussion
_______________________________
## SVG Tools

[Open source, in browser](https://svgedit.netlify.app/editor/index.html) (here is the [source](https://github.com/SVG-Edit/svgedit))

[inkscape](https://inkscape.org/) is the grandaddy of them all. It's a GPL'd thick-client authoring tool. Check out the "output optimized svg" save options.


## Links
A good list of tools here: https://github.com/sw-yx/spark-joy/blob/master/README.md.
(Associated [HN thread](https://news.ycombinator.com/item?id=35235952)).

Useful looking background tools include [Hero patterns](https://heropatterns.com/) and [SVG Backgrounds](https://www.svgbackgrounds.com/). Here is another cool [Penrose Tile Generator.](https://misc.0o0o.org/penrose/) (Veritasium has a [good video about Penrose tiles](https://www.youtube.com/watch?v=48sCx-wBs34)).

Natural Units
-------------

Scalable Vector Graphics, or SVG, is an important component of Simpatico. The browser also offers Canvas and WebGL, and of course DOM manipulation, as other ways to draw. We pick SVG and drive toward a state where _drawing_ is done statically, and program state is characterized by a list of vectors interpreted to move these shapes. One particularly interesting application is drawing an [stree](/stree) visualization, and then animating it under various conditions.

Building up to that, we build up a few techniques

First, an inline svg that uses a classical schoolroom coordinate system: the unit circle, (0,0) in the center, y up. Those new to programming graphics may be surprised that the standard way to program puts the origin at the top left with y increasing downward. This is a very good coordinate system if you want to always render text, starting from the upper left, and making a newline. This is how we write letters, school papers, and books, fiction and non-fiction. But _math_ is usually taught on this particular coordinate system.

1.  The old system optimized for english text on highly resource constrained computers. Modern systems are vastly more powerful, allowing us to _start_ from a more general primitive.
2.  Our primary target for graphics will be an inline svg in an html resource.
3.  SVG has several good features we want such as:
1.  Object persistence. You can author a shape, or a group of shapes, and then move them around later.
2.  Arbitrary control over coordinate system - which we use to recover school math intuition

```html
<svg class="natural-units"
     width="200px" height="200px"
     viewBox="-1 -1 2 2"
>
  <desc>A static svg unit circle</desc>
  <g transform="scale(1,-1)">
    <g transform="translate(0,0)"  ><rect width=".2" height=".2" fill="#482" /></g>
    <g transform="translate(.1,.1)"><rect width=".2" height=".2" fill="#882" /></g>
    <g transform="translate(0 ,0 )"><circle class='unit-circle' r="1" fill="none" stroke="red" stroke-width=".001 "/></g>
    <g transform="translate(0,0)scale(.01,-.01)"><text>Scale and reflip text</text></g>
  </g>
</svg>
```

___________________________________________
## SVG animation with scatter(elt, obj)


The basic idea is to scatter objects into svg elements.

First you author an svg image inline, as above. This time you add ids to the pieces you want to animate (and I use a simple naming convention to make names easier). Each of these ids will become a named variable in your code. As the author, you usually want to add a characteristic list of elements and 'meaningful' attribute values. In our case, _transform_ is very important!

```js
///
import {svg} from '/simpatico.js';
svg.scatter(greenSquare, {x:cos(C*t), y:sin(C*t), rotate: t % 3600/10});
```


When [SVG almost got raw sockets?!](https://leonidasv.com/til-svg-specs-almost-got-raw-socket-support/)

  1. https://martinheinz.github.io/physics-visual/
  1. https://gist.github.com/mbostock/3231298
  1. https://algs4.cs.princeton.edu/61event/CollisionSystem.java.html
  1. https://developer.ibm.com/tutorials/wa-build2dphysicsengine/
  1. https://svgmix.com/
  1. https://omrelli.ug/g9/gallery/
