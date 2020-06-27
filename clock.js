import rtree from './rtree.js'
import C from './core.js'

const {now, debug} = C.utils;
/**
 Clock with a requestAnimationFrame (raf) pump.
 The basic raf() pattern is fn(){stuff; raf(fn)}.
 */
let t = rtree();
t.add({
  interval: 0, limit: 20, delay:0, //config
  intervalId: null, ticks: 0, err: null,
  started: null, stopped: null, duration: null, row: null,
  debug: false, onTick: null,
});

t.add({name: 'start', example: {handler: 'start'}, handle:(c,m)=>{
    const {row, interval, delay, started} = c;
    if (started) throw `row ${row} already started at ${started}`;
    const pump = a => {
      // Gotcha: We cannot access c.ticks and c.stopped directly because
      // the 'c' here is as it was at the beginning of the row.
      t.focus(row);
      const {ticks, stopped} = t.residue();
      t.add({handler:'tick'});
      if (!stopped) {
        if (interval){
          // Q: Is there a better way to artificially slow down the interval?
          window.setTimeout(() => requestAnimationFrame(pump), interval)
        } else {
          requestAnimationFrame(pump);
        }
      }
    };
    window.setTimeout(pump, delay);
    debug('start', now(), 'row', row);
    return [{ started:now() }];
  }});

t.add({name: 'stop', handle:(c,m)=>{
    const {started, row} = c;
    // TODO figure out why this throws periodically
    if (c.stopped) throw `row ${row} already stopped ${now() -c.stopped}ms ago`;;
    const stopped = now();
    return [{stopped}, {duration: (stopped - started) }];
  }});

// Gotcha: by using a static 'tick' we save considerable memory
t.add({name: 'tick', tick: {ticks: 1}, handle: function(c,m){
    const {ticks, limit, stopped, onTick, debug:deb} = c;
    if (c.stopped) return; // the pump is often sloppy by one tick - can we avoid this?
    // Fun: it's cool to put stuff here to drive it. there are better ways, but it's fun.
    if (onTick) onTick(c);
    if (deb) debug(t.print());
    return (limit === -1 || ticks < limit) ? this.tick : {handler:'stop'};
  }});

// Tests - Fun this one sets up a bunch of clocks with staggered starts
// let reps = 10
// while(reps--){
//   t.focus([0])
//   t.add({debug:true, delay: reps * 500 + ''})
//   t.add(start)
// }

// Test - fun, move a clock around. also demonstrates custom values in the clock
// this one is brittle because it depends on a DOM elt.
t.focus([0])
t.add({
  limit:'-1',
  elt: document.getElementsByClassName('radius')[0],
  onTick: c => SVG.scatter(c.elt, {transform:`rotate(${c.ticks})`}),
});
t.add({handler: 'start'})
document.onclick = e => t.add(stop)
