<!--<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="JavaScript, ES6, functional, simpatico, minimalist, web verite">
  <meta name="author" content="javajosh">

  <!-- Begin testable.js html boilerplate; testable.js is in the same directory -->
  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='white' />
  </svg>"/>
  <!--  <meta id="refresh" http-equiv="refresh" content="2">-->
  <script src="testable.js"></script>
  <!-- End testable.js boilerplate  -->

  <title>svg.js</title>
  <link rel="stylesheet" type="text/css" href="style.css">
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
  <style>
    svg > text {
      font-size: medium;
      font-family: "sans-serif";
      text-anchor: middle;
    }
    svg {
      background-color: #66b7ff;
      max-width: 800px;
    }
    div {
      max-width: 800px;
      margin: 40px;
    }
    body {
      background-color: #9bc8cc;
      background-attachment: fixed;
      background-size: cover;
    }
  </style>
</head>-->

# Simpatico: SVG
jbr 2023

<div class="makeItStop"></div>


# Links
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

SVG animation with scatter(elt, obj)
------------------------------------

The basic idea is to scatter objects into svg elements.

First you author an svg image inline, as above. This time you add ids to the pieces you want to animate (and I use a simple naming convention to make names easier). Each of these ids will become a named variable in your code. As the author, you usually want to add a characteristic list of elements and 'meaningful' attribute values. In our case, _transform_ is very important!

```js
///
import {svg} from '/simpatico.js';
svg.scatter(greenSquare, {x:cos(C*t), y:sin(C*t), rotate: t % 3600/10});
```


This example call to `scatter()` is typical, where you have 1) a reference to the DOM elt to be mutated, and 2) a nice object representation for mutating that elt. I wanted objects of the form "{attr: value}" combining (and decomposing) the transform attribute with the child shape. (This might even be considered a special type of svg elt, g>shape, or most generally g>path and the union of those attributes is what you scatter to).

In this example we adopt the more conventional "unidirectional dataflow" from a low entropy source. That source is a custom "tick" event emitted by a handy global module. We use that one parameter, time, to produce a time-dependent object for each animation target.

We first author a static starting point by hand:

```html
<svg id="rotating-squares-animation" class="natural-units"
     width="200px" height="200px"
     viewBox="-1 -1 2 2"
>
  <desc>Two squares moving around the unit circle and rotating, too, plus constantly changing text.</desc>
  <g transform="scale(1,-1)">
    <g id="green-square"  transform="translate(0,0)"  ><rect width=".2" height=".2" fill="#482" /></g>
    <g id="yellow-square" transform="translate(.1,.1)"><rect width=".2" height=".2" fill="#882" /></g>
    <g id="unit-circle"   transform="translate(0 ,0 )"><circle class='unit-circle' r="1" fill="none" stroke="red" stroke-width=".001 "/></g>
    <g id="some-text"     transform="translate(0,0)scale(.01,-.01)"><text>Simpatico is pretty cool</text></g>
  </g>
</svg>
```

Then we bind to the elements in the sketch, and animate them:
```js
///
import {svg, shuffle, now, log} from '/simpatico.js';
// Good practice to put all your DOM bindings at the top of the script
const greenSquare = svg.elt("green-square");
const yellowSquare = svg.elt("yellow-square");
const someText = svg.elt("some-text");

// The steady-state is driven by a global singleton requestAnimationFrame pump-based  clock
svg.clock();
window.addEventListener('tick', e => animate(e.detail.t));

// The fun part: transform your target by specifying an object.
const {cos, sin} = Math;
const C = 1/10000;
const letters = 'Simpatico is pretty cool'.split('');

function animate(t) {
  svg.scatter(greenSquare, {x:cos(C*t), y:sin(C*t), rotate: t % 3600/10});
  svg.scatter(yellowSquare, {x:cos(-C*t), y:sin(-C*t), rotate: t % 3600/10});
  svg.scatter(someText, {x:-.9, y: 0, scale: ".008,-.008", text: shuffle(letters).join('')});
}
```

Let's make an analog clock that keeps proper time.
The first problem is to get the angles of the 3 hands, hours minutes and seconds.
Timestamp is in milliseconds, so we need to convert to seconds, then to hours, minutes and seconds.
We also need to convert to radians, and then to degrees.

```html
<svg id="clock" class="natural-units"
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
    <g id="hour-hand">
      <rect width=".1" height=".4" fill="#482" />
    </g>
    <g id="minute-hand">
      <rect width=".05" height=".6" fill="#882" />
    </g>
    <g id="second-hand">
      <rect width=".01" height=".8" fill="#c82" />
    </g>
</svg>
```

Then we bind to the elements in the sketch, and animate them:

```js
import {svg} from '/simpatico.js';

// bind to the elements in the sketch
const hourHand = svg.elt("hour-hand");
const minuteHand = svg.elt("minute-hand");
const secondHand = svg.elt("second-hand");

// The steady-state is driven by a global singleton requestAnimationFrame pump-based  clock
svg.clock(30);
window.addEventListener('tick', e => animate(e.detail.t));

// The fun part: transform your target by specifying an object.
function animate(t) {
  const {hourAngle, minuteAngle, secondAngle} = clockAnglesInDegrees(t);
  // console.log({hourAngle, minuteAngle, secondAngle});
  svg.scatter(hourHand,   {rotate: hourAngle});
  svg.scatter(minuteHand, {rotate: minuteAngle});
  svg.scatter(secondHand, {rotate: secondAngle});
}

// This is a generic function that can be used for any clock, and has nothing to do with SVG
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



SVG animation
-------------

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

Different ways to reference SVG
-------------------------------

### Referencing an svg as an `img` tag:

`   <img width="200px" src="/img/wizard.svg" alt="simpatico wizard" />   `

![simpatico wizard](/img/wizard.svg =200x200)

### Referencing an svg with built-in styles and javascript as an image, from :

`   <img width="200px" src="/img/draggable.svg" alt="minimal draggable object demo" />   `

To make the javascript work, you must right-click and "open image in new tab" where you can then interact (!) with it.
This technique was originally described by [Peter Collingridge](https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/)

![minimal draggable object demo](/img/draggable.svg =200x200)

### SVG Tools


[Open source, in browser](https://svgedit.netlify.app/editor/index.html) (here is the [source](https://github.com/SVG-Edit/svgedit))

[inkscape](https://inkscape.org/) is the grandaddy of them all. It's a GPL'd thick-client authoring tool. Check out the "output optimized svg" save options.


### History

When [SVG almost got raw sockets?!](https://leonidasv.com/til-svg-specs-almost-got-raw-socket-support/)

### Discussion

I imagine there are some interesting possibilities storing application data directly in the DOM.
Clearly persistence between tab sessions an issue (right?).
(It becomes really easy to store a lot of data in DOM with scatter and gather).

I'm unsure of the performance implications of having lots of RAF pumps.
This also pushes at the boundary of my knowledge of javascript modules and their lifespans/state.

If we were to commit to some representation of state in the DOM, as D3 does, then we can specify a full application loop with:

    until quit:
      gather
      map
      scatter

This is the essence of what I call the "boardgame" representation of state: transforms over the position of a finite set of pieces over a meaningful space (board). This immediately shows a classic time/space tradeoff since we might want a small number of persistent objects which we use for everything. However it may be convenient to pretend like those objects were always present.
