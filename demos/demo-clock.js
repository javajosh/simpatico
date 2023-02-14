import stree from "../stree.js";
import { now, debug } from "../core.js";

/**
 Clock with a requestAnimationFrame (raf) pump.
 Note: the basic raf() pattern is fn(){stuff; raf(fn)}.
 */
let clock = stree();

clock.add({
  interval: 0,
  limit: 20,
  delay: 0, //config
  intervalId: null,
  ticks: 0,
  err: null,
  started: null,
  stopped: null,
  duration: null,
  row: null,
  debug: false,
  onTick: null,
});

clock.add({
  name: "start",
  example: { handler: "start" },
  handle: (c, m) => {
    const { row, interval, delay, started } = c;
    if (started) throw `row ${row} already started at ${started}`;
    const pump = (a) => {
      // Gotcha: We cannot access c.ticks and c.stopped directly because
      // the 'c' here is as it was at the beginning of the row.
      clock.focus(row);
      const { ticks, stopped } = clock.residue();
      clock.add({ handler: "tick" });
      if (!stopped) {
        if (interval) {
          // Q: Is there a better way to artificially slow down the interval?
          window.setTimeout(() => requestAnimationFrame(pump), interval);
        } else {
          requestAnimationFrame(pump);
        }
      }
    };
    window.setTimeout(pump, delay);
    debug("start", now(), "row", row);
    return [{ started: now() }];
  },
});

clock.add({
  name: "stop",
  handle: (c, m) => {
    const { started, row } = c;
    // TODO figure out why this throws periodically
    if (c.stopped)
      throw `row ${row} already stopped ${now() - c.stopped}ms ago`;
    const stopped = now();
    return [{ stopped }, { duration: stopped - started }];
  },
});

// Gotcha: by using a static 'tick' we save considerable memory
clock.add({
  name: "tick",
  tick: { ticks: 1 },
  handle: function (c, m) {
    const { ticks, limit, stopped, onTick, debug: deb } = c;
    if (c.stopped) return; // the pump is often sloppy by one tick - can we avoid this?
    // Fun: it's cool to put stuff here to drive it. there are better ways, but it's fun.
    if (onTick) onTick(c);
    if (deb) debug(clock.print());
    return limit === -1 || ticks < limit ? this.tick : { handler: "stop" };
  },
});

// Tests - Fun this one sets up a bunch of clocks with staggered starts
// let reps = 10
// while(reps--){
//   t.focus([0])
//   t.add({debug:true, delay: reps * 500 + ''})
//   t.add(start)
// }

// Test - fun, move a clock around. also demonstrates custom values in the clock
// this one is brittle because it depends on a DOM elt.
clock.focus([0]);
clock.add({
  limit: "-1",
  elt: document.getElementsByClassName("radius")[0],
  onTick: (c) => SVG.scatter(c.elt, { transform: `rotate(${c.ticks})` }),
});
clock.add({ handler: "start" });

export default clock;
