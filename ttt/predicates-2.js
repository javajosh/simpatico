'use strict';
// Import highlight.min.js

function get(state, path, set=null, del=false){
  log('get', state, path);
  if (path && path.length > 0){
    const p = path.shift();
    const nextState = state[p]; 
    if (nextState == null) 
      throw new Error(`path not found ${p} in ${path}`);
    if (path.length === 1 && (set != null || del)) {
      const old = state[path[0]]; //READ: may be undefined
      if (del)
        Array.isArray(state) ? state.slice(path[0], 1) : delete state[path[0]]; //DELETE
      else
        state[path[0]] = set; //WRITE
      return old;
    } 
    return get(nextState, path);
  }
  return state;
}


// let p = document.body.children[1];
// p.insertAdjacentElement('afterend', p.cloneNode(true));

const log = console.log.bind(window.console);
const warn = console.warn.bind(window.console);
const error = console.error.bind(window.console);
const fail = (reason) => {throw new Error(reason)};
const assert = (pred, msg) => pred ? true : fail('Assertion failed: ' + msg);
const curry = (fn, b) => (a) => fn(a,b); // Some down-home (right) curry

// General predicate-assertions.
const exists = (a, t=true) => t ? assert(a != null, `${a} does not exist`) : a != null;
const equals = (a,b,t=true) => t ? assert(a === b, `${a} not equal to ${b}`) : a===b;
const contains = (elt, arr, t=true) => t ? assert(arr.indexOf(elt) !== -1, `${elt} not a member of ${arr}`) : arr.indexOf(elt) !== -1;
const isA = (a, kind, t=true) => t ? assert(a instanceof kind, `${a} not instance of ${kind}`) : a instanceof kind;
const boolean = (a, t=true) => equals(typeof a, 'boolean', t);
const number = (a, t=true) => equals(typeof a, 'number', t);
const array = (a, t=true) => equals(Array.isArray(a), true, t);
const object = (a, t=true) => equals(typeof a, 'object', t) && equals (Array.isArray(a), false, t);
const string = (a, t=true) => equals(typeof a, 'string', t);
const fun = (a, t=true) => equals(typeof a, 'function', t);