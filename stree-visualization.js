import {svg, log, tryToStringify} from '/simpatico.js';

const html1 = (svgClass='visualize-stree', inspectorClass ='residue-inspector', colorKeyClass = 'color-key') => `
<p>key: <span class="${colorKeyClass}"></span></p>
<svg class="${svgClass}"
  viewBox="0 0 40 10"
  width="800px" height="200px"
  style="border: 1px solid gray"
>
  <g  transform="translate(30,0)">
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
    <circle cx=".5" cy=".5" r=".48" fill="#1A4DBC"/>
    <text x=".492" y=".525" alignment-baseline="middle" text-anchor="middle" font-family="Arial" font-size=".5">0</text>
  </g>

</svg>
`;

const colors1 = {
  handlers: "DodgerBlue",
  assert: "Coral",
  log: "Orange",
  inc: "Orchid",
  dec: "MediumPurple",
  mul: "BlueViolet",
  msg: "MediumSeaGreen",
};

const classes1 = {
  svg : 'visualize-stree',
  inspector: 'residue-inspector',
  colorKey: 'color-key',
};

const renderStree = (
  s,
  parent,
  classes = classes1,
  colors = colors1,
  animate = true,
  html = html1,
) => {

  // add the html
  parent.innerHTML = html(classes.svg, classes.inspector, classes.colorKey);

  // Bind to elements
  const scene = svg.elt(classes.svg, parent);
  const residueOutput = svg.elt(classes.inspector, parent);
  const colorKey = svg.elt(classes.colorKey, parent);

  // Hide the visualization code TODO: this only closes the first two details in the document; we want to close the two details that follow the "scene" element.
  parent.parentElement.querySelectorAll('details:nth-of-type(1), details:nth-of-type(2)').forEach(detail => detail.removeAttribute('open'));


  // Config
  const DEBUG = true;
  const W = 40, H = 10;
  const dx = 1, dy = 1;

// display key
  colorKey.innerHTML = Object.entries(colors).map(([key, color]) =>
    `<span style="padding: 3px;color: black; border-radius:10px;background-color: ${color}">${key}</span> `)
    .reduce((a, b) => a + b, '');

  // begin node render, either fast or slow
  if (animate) animateAdd(); else fastAdd();


  // add click handler that displays residue or rerenders
  scene.addEventListener('click', (e) => {
    const target = e.target.closest('g');
    if (target && target.node) {
      const node = target.node;
      // log(node);
      const {handlers, ...residue} = s.residue(node);
      residueOutput.innerText = tryToStringify({
        id: node.id,
        value: node.value,
        msgs: node.msgs,
        residue,
        parent: node.parent ? node.parent.id : 'null',
      });
    } else {
      if (animate) animateAdd(); else fastAdd();
    }
  });

  function fastAdd() {
    while (scene.children.length > 2) {
      scene.removeChild(scene.lastElementChild);
    }
    for (let i = 0; i < s.nodes.length; i++) {
      renderNode(s.nodes[i++]);
    }
  }

  function animateAdd(clock=svg.clock(20, -1)) {
    // reset scene
    while (scene.children.length > 2) {
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
    if (v.handlers) {
      color = colors.handlers;
    } else if (v.handler) {
      color = colors[v.handler]
    } else {
      color = colors.msg;
    }
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

export {renderStree}
