# STree Visualization
2024

Various approaches to visualizing stree with SVG.

### Note: Weaknesses in the visualization
For a few days I've been thinking about this, and working on other, more [workmanlike things](/blog.js).
It's clear that, at least for visualization, we want the [stree](/stree.md) to report all handler invocations.
These are currently hidden from `stree` because [combine](/combine.md) handles the recursion internally.

One approach would be to further couple `stree` and `combine` such that combine does NOT resolve recursive handler calls, but instead returns the results of the handler call.
This version of combine no longer a reducer in the presence of handlers, only the combination of stree and combine would be.
I'm reluctant to lose the generality and independence of both stree and combine to achieve this gaol.

Another approach is to modify `combine` to return a list of objects generated during its topmost invocation (rooted at the "world event").
This would mean reserving a property of residue, say 'msgs', that basically tells the caller "what happened" during the call, aka the "message cascade".
This complicates the visualization because now each node does not correspond to only a world event - they also describe elements of the message cascade.
`combine` can differentiate between external and internal calls by the presence of the 'msgs' property in the residue: if it's not there, it's a world event.
Then the [stree visualization](/stree-visualization.md) would render additional elements based on the `{handler}` entries in `residue.msgs`.

Afterword: this ended up working pretty well, and the coupling between combine and stree was less than I expected. The key insight was to hoist `msgs` from residue to the stree node.


## Clone and scatter without msgs render
This is the first iteration of the visualation code.
It assumes that every rendered elt is a node in the stree.
It uses the 'clone and scatter' approach to rendering.
```js
import {svg, tryToStringify} from '/simpatico.js';

const html1 = (svgClass='visualize-stree', inspectorClass ='residue-inspector', colorKeyClass = 'color-key') => `
<p>key: <span class="${colorKeyClass}"></span></p>
<svg xmlns="http://www.w3.org/2000/svg"
  class="${svgClass}"
  viewBox="0 0 40 10"
  width="800px" height="200px"
  style="border: 1px solid gray; pointer-events: visible;"

>
  <g transform="translate(30,0)">
    <rect width ="10" height = "10" fill="white"/>
    <foreignObject width="500" height="500" transform="scale(.02)" style="overflow-y:auto;">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:15px; color:black; padding-left: 10px">
        <h3 style="color:black">Inspector</h3>
        <code><pre class="${inspectorClass}">
Click on a node on the left.
This region will display information about the node.
Note that the display is animated.
To restart the animation, click outside a node.
        </pre></code>
      </div>
    </foreignObject>
  </g>

  <g ">
<!--  TODO fix clickability problem in this visualization. maybe try html spans and overflow-x: scroll -->
    <circle cx=".5" cy=".5" r=".48" fill="#1A4DBC" style="pointer-events: none;" />
    <text x=".492" y=".525" dominant-baseline="central" text-anchor="middle" font-family="Arial" font-size=".5" >0</text>
  </g>

</svg>
`;

const classes1 = {
  svg : 'visualize-stree',
  inspector: 'residue-inspector',
  colorKey: 'color-key',
};

/**
 *
 * @param s - the stree to render
 * @param parent - the parent DOM elt; this will replace innerHTML
 * @param animate - true if we animate, false if we add all at once
 * @param classes - object that defines class names used in the HTML, svg, inspector and colorKey
 * @param html - a function that returns custom html
 */
const renderStree = (
  s,
  parent,
  animate = true,
  classes = classes1,
  html = html1
) => {

  // add the html
  parent.innerHTML = html(classes.svg, classes.inspector, classes.colorKey);

  // Bind to elements
  const scene = svg.elt(classes.svg, parent);
  const residueOutput = svg.elt(classes.inspector, parent);
  const colorKey = svg.elt(classes.colorKey, parent);


  // Config
  const DEBUG = true;
  const W = 40, H = 10;
  const dx = 1, dy = 1;
  const staticChildrenCount = scene.children.length;

  // Hide code and display color key
  hideCode(parent);
  const colors = generateColors(s);
  displayColorKey(colorKey, colors);

  // begin node render, either fast or slow
  if (animate) animateAdd(); else fastAdd();

  // steady-state input - support click to inspect a node and rerender
  scene.addEventListener('click', (e) => {
    const target = e.target.closest('g');
    if (target && target.node) {
      const node = target.node;
      log(node);
      const {handlers, ...residue} = s.residue(node);
      residueOutput.innerText = tryToStringify({
        id: node.id,
        value: node.value,
        residue,
        parent: node.parent ? node.parent.id : 'null',
      });
    } else {
      if (animate) animateAdd(); else fastAdd();
    }
  });

  // remainder are support functions

  // Hide the visualization code - the two details after the parent elt. sadly I could not find a good way to do this with selectors
  function hideCode(parent=parent){
    let count = 0;
    Array.from(parent.parentElement.children).forEach(sibling => {
      if (sibling === parent) count = 2; // should only happen once
      if (sibling.tagName.toLowerCase() === 'details' && count--) sibling.removeAttribute('open'); //hide 2 details tags
    })
  }

  function generateColors(s = s){
    const colors = {
      handlers: "DodgerBlue",
      msg: 'Blue',
    };

    // See also https://gka.github.io/chroma.js/
    function* generateDarkerColor([h, s, l] = [260, 50, 80], step=5) {
      for (let i = 1; ; i++) {
        yield `hsl(${h - 10* i * step}, ${s}%, ${l - i * step}%)`;
      }
    }
    const colorGenerator = generateDarkerColor();

    // create a color key based on the handlers present in the stree
    s.nodes.forEach(node => {
      if (node.value.hasOwnProperty('handlers')){
        Object.keys(node.value.handlers).forEach(name => {
          if (name === 'log')    colors[name] = 'Coral';
          if (name === 'assert') colors[name] = 'Orange';
          if (!colors[name])     colors[name] = colorGenerator.next().value;
        });
      }
    });
    return colors;
  }

  function displayColorKey(colorKeyElt, colors = colors){
    colorKeyElt.innerHTML = Object.entries(colors).map(([key, color]) =>
      `<span style="padding: 3px;color: black; border-radius:10px;background-color: ${color}">${key}</span> `)
      .reduce((a, b) => a + b, '');
  }

  function fastAdd() {
    while (scene.children.length > staticChildrenCount) {
      scene.removeChild(scene.lastElementChild);
    }
    s.nodes.forEach(renderNode)
  }

  function animateAdd(clock=svg.clock(20, -1)) {
    // reset scene
    while (scene.children.length > staticChildrenCount) {
      scene.removeChild(scene.lastElementChild);
    }
    // reset clock
    clock.stop();
    clock = svg.clock(20, -1);

    // do the animation
    let i = 0;
    window.addEventListener(clock.clockId, () => {
      if (i < s.nodes.length) renderNode(s.nodes[i++])
    });
  }


  // Keep cloning the last child, asigning it a new position and color
  // To avoid a memory leak we remove the oldest child when we hit the limit
  function renderNode(node) {
    const clone = cloneLast(scene);
    const pos = nodePosition(node);
    // log(node, pos, clone);
    svg.scatter(clone, {...pos, text: node.id, fill: nodeColor(node), "data-node": node});
  }

  function nodePosition(node) {
    let x = 0;
    while (node.parent && (node.branchIndex === node.parent.branchIndex)) {
      node = node.parent;
      x += dx;
    }
    const y = dy * node.branchIndex;
    return {x, y};
  }

  function nodeColor(node) {
    let color;
    const v = node.value;
    if (v.handlers) color = colors.handlers;
    else if (v.handler) color = colors[v.handler]
    else color = colors.msg;
    return color;
  }

// Clone the last element in the svg and add it to the svg
  function cloneLast(scene) {
    const last = scene.lastElementChild;
    const clone = last.cloneNode(true);
    scene.appendChild(clone);
    return clone;
  }
}

window.renderStree1 = renderStree;

```
Here is an example of what it does
```html
<div id="arithmetic-render"></div>
```
```js
import {arithmeticOps} from "/stree-examples.js";
import {stree, svg} from '/simpatico.js';

const renderParent = svg.elt('arithmetic-render');
const s = stree(arithmeticOps);
renderStree1(s, renderParent);

```

## With msgs render
Most of the changes will be to the `renderNode()` function, but for now we'll copy everything.
It makes life easier to move away from "clone and scatter" and instead use simple interpolation and concatenation, possibly with a generator.


```js
import {svg, tryToStringify} from '/simpatico.js';

const html1 = (svgClass='visualize-stree', inspectorClass ='residue-inspector', colorKeyClass = 'color-key') => `
<p>key: <span class="${colorKeyClass}"></span></p>
<svg xmlns="http://www.w3.org/2000/svg"
  class="${svgClass}"
  viewBox="0 0 40 10"
  width="800px" height="200px"
  style="border: 1px solid gray; pointer-events: visible;"

>
  <g transform="translate(30,0)">
    <rect width ="10" height = "10" fill="white"/>
    <foreignObject width="500" height="500" transform="scale(.02)" style="overflow-y:auto;">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:15px; color:black; padding-left: 10px">
        <h3 style="color:black">Inspector</h3>
        <code><pre class="${inspectorClass}">
Click on a node on the left.
This region will display information about the node.
Note that the display is animated.
To restart the animation, click outside a node.
        </pre></code>
      </div>
    </foreignObject>
  </g>

  <g>
<!--  TODO fix clickability problem in this visualization. maybe try html spans and overflow-x: scroll -->
    <circle cx=".5" cy=".5" r=".48" fill="#1A4DBC" style="pointer-events: none;" />
    <text x=".492" y=".525" dominant-baseline="central" text-anchor="middle" font-family="Arial" font-size=".5" >0</text>
  </g>

</svg>
`;

const classes1 = {
  svg : 'visualize-stree',
  inspector: 'residue-inspector',
  colorKey: 'color-key',
};

/**
 *
 * @param s - the stree to render
 * @param parent - the parent DOM elt; this will replace innerHTML
 * @param animate - true if we animate, false if we add all at once
 * @param classes - object that defines class names used in the HTML, svg, inspector and colorKey
 * @param html - a function that returns custom html
 */
const renderStree = (
  s,
  parent,
  animate = false,
  classes = classes1,
  html = html1
) => {

  // add the html
  parent.innerHTML = html(classes.svg, classes.inspector, classes.colorKey);

  // Bind to elements
  const scene = svg.elt(classes.svg, parent);
  const residueOutput = svg.elt(classes.inspector, parent);
  const colorKey = svg.elt(classes.colorKey, parent);


  // Config
  const DEBUG = true;
  const W = 40, H = 10;
  const dx = 1, dy = 1;
  const staticChildrenCount = scene.children.length;

  // Hide code and display color key
  hideCode(parent);
  const colors = generateColors(s);
  displayColorKey(colorKey, colors);

  // begin node render
  render(animate);

  // steady-state input - support click to inspect a node and rerender
  scene.addEventListener('click', (e) => {
    const target = e.target.closest('g');
    let output;
    if (target && target.node) {
      const node = target.node;
      log(node);
      residueOutput.innerText = tryToStringify(node);
      // const residue = node.handlers ? s.residue(node) : node;
      // residueOutput.innerText = tryToStringify({
      //   id: node.id,
      //   value: node.value,
      //   residue,
      //   parent: node.parent ? node.parent.id : 'null',
      // });
    }
  });

  // remainder are support functions

  // Hide the visualization code - the two details after the parent elt. sadly I could not find a good way to do this with selectors
  function hideCode(parent=parent){
    let count = 0;
    Array.from(parent.parentElement.children).forEach(sibling => {
      if (sibling === parent) count = 2; // should only happen once
      if (sibling.tagName.toLowerCase() === 'details' && count--) sibling.removeAttribute('open'); //hide 2 details tags
    })
  }

  function generateColors(s = s){
    const colors = {
      handlers: "DodgerBlue",
      msg: 'Blue',
    };

    // See also https://gka.github.io/chroma.js/
    function* generateDarkerColor([h, s, l] = [260, 50, 80], step=5) {
      for (let i = 1; ; i++) {
        yield `hsl(${h - 10* i * step}, ${s}%, ${l - i * step}%)`;
      }
    }
    const colorGenerator = generateDarkerColor();

    // create a color key based on the handlers present in the stree
    s.nodes.forEach(node => {
      if (node.value.hasOwnProperty('handlers')){
        Object.keys(node.value.handlers).forEach(name => {
          if (name === 'log')    colors[name] = 'Coral';
          if (name === 'assert') colors[name] = 'Orange';
          if (!colors[name])     colors[name] = colorGenerator.next().value;
        });
      }
    });
    return colors;
  }

  function displayColorKey(colorKeyElt, colors = colors){
    colorKeyElt.innerHTML = Object.entries(colors).map(([key, color]) =>
      `<span style="padding: 3px;color: black; border-radius:10px;background-color: ${color}">${key}</span> `)
      .reduce((a, b) => a + b, '');
  }

  // TODO add animation support with conditional setTimeout around makeCircle
  function render(animate=false) {
    // log('rendering ', s);
    const rowAddPosition = Array.from({ length: s.nodes.length }, () => 0);
    let x, y, color, node, node2;
    for (node of s.nodes){
      y = node.branchIndex;
      x = rowAddPosition[node.branchIndex];
      color = nodeColor(node);
      makeCircle(x * dx, y * dy, color, node.id, node);

      rowAddPosition[node.branchIndex] = ++x;
      // render secondary nodes
      let msgs = node.msgs ? node.msgs : [];
      log('primary', {x, y}, color, msgs, msgs.length);

      for (let j = 0; j < msgs.length; j++) {
        // debugger;
        node2 = {value: msgs[j]};
        const label = String.fromCharCode((j % 26) + 97);
        color = nodeColor(node2);
        log('secondary', j, {x, y}, color, node2);
        makeCircle(x * dx,y * dx, color, label, node2);
        rowAddPosition[node.branchIndex] = ++x;
      }

    }
  }


  function makeCircle (x, y, fill, label='0', node) {
    const clone = cloneLast(scene);
    clone.node = node;
    svg.scatter(clone, {x, y, text: label, fill});
    return clone;
  }

  function nodeColor(node) {
    let color;
    const v = node.value || node; // secondary nodes are bare handler calls TODO visually distinguish secondary colors
    if (v.handlers) color = colors.handlers;
    else if (v.handler) color = colors[v.handler]
    else color = colors.msg;
    return color;
  }

// Clone the last element in the svg and add it to the svg
  function cloneLast(scene) {
    const last = scene.lastElementChild;
    const clone = last.cloneNode(true);
    scene.appendChild(clone);
    return clone;
  }
}

window.renderStree2 = renderStree;

```
```html
<div id="arithmetic-render2"></div>
```
```js
import {arithmeticOps} from "/stree-examples.js";
import {stree, svg} from '/simpatico.js';

const renderParent = svg.elt('arithmetic-render2');
const s = stree(arithmeticOps);
renderStree2(s, renderParent, false);

```
## One more time with imports
Now that it's working right, lets make sure the shared code is okay.
```html
<div id="arithmetic-render3"></div>
```
```js
import {arithmeticOps} from "/stree-examples.js";
import {renderStree} from "/simpatico.js";
import {stree, svg} from '/simpatico.js';

const renderParent = svg.elt('arithmetic-render3');
const s = stree(arithmeticOps);
renderStree(s, renderParent, false);

```
