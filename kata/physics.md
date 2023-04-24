<!--<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="Simpatico, physics">
  <meta name="author" content="jbr">
  <title>Simpatico - Physics</title>

  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='DodgerBlue' />
    </svg>"/>
  <link href="/style.css" rel="stylesheet" type="text/css" >
  <link href="/kata/highlight.github-dark.css" rel="stylesheet" >
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
  <script src="/testable.js" type="module"></script>

</head>-->

_____________________________________
# Simpatico: Physics

A system of N particles can be described by an array of numbers, one for each position of each particle, for the velocity and the optional force. The next position of a particle is always computed in the same way:

The three laws of motion are:
   1. A body in motion tends to stay in motion.
   2. Conservation of momentum.
   3. Force causes acceleration. Mass slows acceleration. Energy causes work.

Celestial motion, and simple cases like constant acceleration, and harmonic motion.
Analyzing collisions in large systems is statistical thermodynamics.

Particle in a box.

```js
let t = 0;
let x = 0;
let vx = 0;
let ax = 1;
let dt = 0.1;
let max = 1;
let min = -1;
let steps = 10;

const update = () => {
  vx += ax * dt;
  x += vx * dt/2;
  t += dt;
  // Bounce off the walls.
  if (x > max) {
    x = max;
    vx = -vx;
  } else if (x < min) {
    x = min;
    vx = -vx;
  }
};
// Run 10 steps of 0.1 seconds each.
// Imperfections will tend to add up.
for (let i = 0; i < steps; i++) {
  update();
  console.log({x, vx, ax, t});
}
assertEquals(steps * dt, Math.round(vx));

```

