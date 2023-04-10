// A much simpler combine not for production use - just playing with some ideas.

import {assertEquals, tryToStringify} from './core.js';

const DEBUG = false;
const isNum = d => Number.isInteger(d);
const isArray = d => Array.isArray(d);
const isObj = a => typeof a === 'object' && !isArray(a);
const isScalar = a => !isArray(a) && !isObj(a);

const isCore = a =>    typeof a === 'object' && a.hasOwnProperty('handlers') && typeof a['handlers'] === 'object';
const isHandler = a => typeof a === 'object' && a.hasOwnProperty('handle')   && typeof a['handle'  ] === 'function';
const isMsg = a =>     typeof a === 'object' && a.hasOwnProperty('handler')  && typeof a['handler' ] === 'string';
const isInstance = a =>isCore(a) && a.hasOwnProperty('nodeId') && isNum(a.nodeId);
const isType = a =>    isCore(a) && a.hasOwnProperty('type') && typeof a['type'] === 'string';

const assertHandler = {
  name: 'assert',
  install: function(){return {handlers: {assert: this}}},
  call: a => ({handler: 'assert', ...a}),
  handle: (core, msg) => {
    Object.entries(msg).forEach(([key, msgValue]) => {
      if (key === 'handler' || key === 'parent') return; // skip the handler name itself
      if (core.hasOwnProperty(key)) assertEquals(msgValue, core[key]);
      else throw new Error(`core ${tryToStringify(core)} is missing asserted property ` + key);
    });
    return [{}];
  },
};

const logHandler = {
  name: 'log',
  install: function(output=console.log){
    this.output = output;
    return {
      handlers: {log: this},
      debug   : true, // residue that can turn off logging
      lastOutput: '', // the last thing logged
    }},
  call: a => {
    if (typeof a === 'string') a = {msg: a};
    return {handler: 'log', ...a};
  },
  handle: function (core, msg) {
    if (core.debug){
      let out = (msg && msg.hasOwnProperty('msg')) ? msg.msg : undefined;
      this.output('logHandler:', out, {msg, core});
      if (out)
        return {lastOutput: msg.msg}
    }
  }
};

function combine(a, b) {
  // this convention implies b "acts on" a, in this case by 'zeroing a out' when b is null.
  // we can't zero out a boolean without introducing null, so we toggle it instead.
  // combine is not associative, but it does have an identity and a zero.
  if (typeof a === 'undefined' || a === null) return b; // 'something is better than nothing'
  if (typeof b === 'undefined') return a; // 'avoid special cases and let nothing compose as a noop'
  if (b === null) { // 'use null as a signal to set a type-dependent zero
    if (Array.isArray(a))       return [];
    if (typeof a === 'object')  return {};
    if (typeof a === 'number')  return  0;
    if (typeof a === 'string')  return '';
    if (typeof a === 'boolean') return !a;
    if (typeof a === 'function') return () => {};
  }

  // If both args are arrays, combine every element - concatenation is also a reasonable rule
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.concat(b);
  }

  // if the target is an array, push the argument onto the array
  if (Array.isArray(a) && !Array.isArray(b)) {
    a.push(b);
    return a;
  }

  // If both args are plain objects, combine every shared key, and add the non-shared keys, too.
  if (isObj(a) && isObj(b)) {
    if (isCore(a) && isMsg(b)){
      if (!isHandler(a.handlers[b.handler])) {
        let e = new Error(`Unable to find valid handler ${b.handler} in core ${tryToStringify(a)}`);
        // const msg = `Unable to find valid handler ${b.handler} in core ${tryToStringify(a)}`;
        // e = Object.assign(e,{msg})
        throw e;
      }
      let result = a.handlers[b.handler].handle(a, b);
      if (!Array.isArray(result)) result = [result];
      result.every(obj => a = combine(a, obj));
      return a;
    }
    const result = {};
    for (const key of Object.keys(a)) {
      result[key] = a[key];
      if (key in b) {
        result[key] = combine(a[key], b[key]);
      }
    }
    for (const key of Object.keys(b)) {
      if (!(key in a)) {
        result[key] = b[key];
      }
    }
    return result;
  }

  if (typeof a === 'string'   && typeof b === 'string'  ) return b;
  if (typeof a === 'boolean'  && typeof b === 'boolean' ) return b;
  if (typeof a === 'function' && typeof b === 'function') return b;
  if (typeof a === 'number'   && typeof b === 'number'  ) return a + b;

  throw new Error(`unable to combine ${tryToStringify(a)} and ${tryToStringify(b)} types ${typeof a} ${typeof b}`);
}

function combineAll(...args) {
  if (args.length === 2) {
    return combine(args[0], args[1]);
  } else if (args.length === 1 && Array.isArray(args[0])) {
    return args[0].reduce(combine, {});
  } else {
    return args.reduce(combine, {});
  }
}

export {
  combineAll as combine,
  combine as combineReducer,
  assertHandler, logHandler
}
