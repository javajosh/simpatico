import {stree, svg} from '/simpatico.js';


// Let's do some particle stuff. You can move a particle with the mouse and
// it will change color if you intersect the target. Note that this isn't general
// because if the collision is caused by the other particle's motion, it won't be
// detected here. Yet another reason to define a coupling reduction between rows...
const particle = stree({x: 0, y: 0, halted: false});
particle.add({ particleElt: svg.elt('particle')});
particle.add({ targetElt: svg.elt('target')});
particle.add({name: 'move', handle: function(ctx, msg) {
    if (ctx.halted) return;
    const {x, y} = msg.event;

    // we have to convert the event to the svg coordinate system, which is centered on 500 500 and inverted. the left is 0, or -1.0. The middle is 500 or 0.
    const coords = {cx: (x-500)/500, cy: -(y-500)/500};
    const result = {x: coords.cx, y: coords.cy};
    const intersects = svg.intersectRect(ctx.particleElt, ctx.targetElt);
    svg.scatter(ctx.particleElt, coords);
    svg.scatter(ctx.particleElt, intersects ? {fill:'red'} : {fill:'green'} );

    return [result, {halted: intersects}];
  }});

const EVENTS = {
  mousemove : e => ({
    type: e.type,
    x: e.clientX,
    y: e.clientY,
    dx: e.movementX,
    dy: e.movementY,
    t: e.timeStamp,
  })
}
// Adapted from events.html, which has some other good ideas.

window.onmousemove = e => particle.add({handler:'move', event: EVENTS.mousemove(e)});
