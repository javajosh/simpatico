"use strict";

/**
    Handy utilities for types, assertions functional programming
    and array manipulation.
 */

const TYPES = {
  STR: 'string',
  ANY: 'any',
  NUM: 'number',
  BOOL: 'boolean',
  OBJ: 'object',
  FUN: 'function',
  ARR: 'array',
  NULL: 'null',
  UNDEF: 'undefined',
  MSG: 'msg',
  HANDLER: 'handle',
};

const log = console.log.bind(console);
Array.prototype.peek = function(){return this.length ? this[this.length-1] : null};

const assert = (a, msg) => {
  if (!a) throw new Error(msg)
};
const assertEquals = (expected, actual) => {
  if (actual !== expected) assert(false, `expected [${expected}] but got [${actual}]`)
};

const isType = (type, a) => getType(a) === type;

const assertType = (type, a) => assert(getType(a) === type, `Expected ${a} to be of type ${type} but was of type ${getType(a)}`);

const assertThrows = fn => {
  assertType(TYPES.FUN, fn);
  let throws = false;
  try {
    fn();
  } catch (e) {
    throws = true;
  }
  assert(throws, `Expected fn to throw, but it didn't`);
};


// Map over all entries passing (key,val) into the mapFn
const objectMap = (object, mapFn) => Object.keys(object).reduce(
  (result, key) => {
    result[key] = mapFn(key, object[key]);
    return result;
  }, {});


const getType = (a) => {
  let t = typeof a;
  if (t !== TYPES.OBJ) return t;

  if (Array.isArray(a)) return TYPES.ARR;
  if (a === null) return TYPES.NULL;
  if (a === undefined) return TYPES.UNDEF;

  if (a.hasOwnProperty(TYPES.MSG) && typeof a[TYPES.MSG] === TYPES.STR) return TYPES.MSG;
  if (a.hasOwnProperty(TYPES.HANDLER) && typeof a[TYPES.HANDLER] === TYPES.FUN) return TYPES.HANDLER;

  return TYPES.OBJ;
};

// Cast a string to a particular type
const cast = (type, str) => {
  assertions.str(str);
  switch (type) {
    case TYPES.STRING:
      return str;
    case TYPES.NUM:
      const result = 1 * str;
      if (Number.isNaN(result)) throw new Error(`Cannot convert ${str} into a number`);
      return result;
    case TYPES.BOOL:
      return (str === 'true') ? true : false;
  }
};

const functions = {
  curry : (f, a) => b => f(a,b),
  compose : (f, g) => a => f(g(a)),
};

const math = {
  randomIntBetween: (min = 1, max = 10) => {
    assertions.int(min);
    assertions.int(max);
    assert(min <= max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

};

const size = (a) => {
  const t = getType(a);
  switch (t){
    case TYPES.NUM:
      return a;
    case TYPES.STR:
      return a.length;
    case TYPES.ARR:
      return a.length;
    case TYPES.OBJ:
      return Object.keys(a).length;
    default:
      return 0;
  }
};

const objects = {

};

const predicates = {
  between: (min, max, num) => min <= size(num) && size(num) <= max,
  deepEquals : (a,b) => JSON.stringify(a) === JSON.stringify(b),
  defined: (a) => getType(a) !== TYPES.NULL && getType(a) !== TYPES.UNDEF,
  int: (a) => getType(a) === TYPES.NUM && (a % 1 === 0),
  t: a => a === true,
  f: a => a === false,
};

objectMap(TYPES, (typeHandle, type) => predicates[typeHandle.toLowerCase()] = functions.curry(isType, type));

// Generally useful functions on arrays.
const arrays = {
  all: (arr, val) => arr.reduce((acc, a) => (a === val) && acc, true),
  same: (arr) => arrays.all(arr, arr[0]),
  eq: (a, b) => a.length === b.length && arrays.all(arrays.zip(a, b).map(d => d[0] === d[1])),
  contains: (arr, a) => arr.includes(a),
  excludes: (arr, a) => !arr.includes(a),
  zip: (a, b) => a.map((a_i, i) => [a_i, b[i]]),
  add: (a, b) => arrays.zip(a, b).map(ab_i => ab_i[0] + ab_i[1]),
  dot: (a, b) => arrays.zip(a, b).map(ab_i => ab_i[0] * ab_i[1]),
  get: (arr, pos) => pos.length ? arrays.get(arr[pos.shift()], pos) : arr,
  mul: (arr, c) => arr.map(d => c * d),
  peek:(arr) => arr.length ? arr[arr.length -1] : null,
  push: (arr, a) => {arr.push(a); return arr},
  _f: (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e)))),
  cartesian : (a, b, ...c) => (b ? arrays.cartesian(arrays._f(a, b), ...c) : a),
  copy1: a => [...a],
  copy2: a => a.slice(),
  copy: a => JSON.parse(JSON.stringify(a)),
  shuffle : (arr)=> {
    // Fisher-Yates shuffle using ES6 swap (possibly slow)
    // A lovely little algo that starts at the last index.
    // This loop's last iteration is when right = 1.
    let right, left;
    for (right = arr.length - 1; right > 0; right--) {
      left = Math.floor(Math.random() * (right + 1));
      [arr[left], arr[right]] = [arr[right], arr[left]];
    }
  }
};


const assertions = {
  all: (arr, val) => assert(arrays.all(arr, val), `Expected all array values [${arr}] to be ${val} but they weren't`),
  same: (arr) => assert(arrays.same(arr), `Expected all values in array [${arr}] to be the same, but they weren't`),
  eq: (a, b) => assert(arrays.eq(a, b), `Expected arrays to be equal [${a}] and [${b}]`),
  contains: (arr, a) => assert(arrays.contains(arr, a), `Expected array [${arr}] to contain value ${a}, but it didn't`),
  excludes: (arr, a) => assert(arrays.excludes(arr, a), `Expected array [${arr}] to exclude value ${a}, but it didn't`),
  between: (min, max, num) => assert(predicates.between(min, max, num), `Middle number out of bounds: ${min} <= ${num} && ${num} <= ${max}`),
  deepEquals: (a,b) => assert(predicates.deepEquals(a,b), `${JSON.stringify(a)} is not deeply equal to ${JSON.stringify(b)}`),
  int : (a) => assert(predicates.int(a), `expected ${a} to be an int, but it wasn't`),
  t: a => assert(a === true, `${a} is not true`),
  f: a => assert(a === false, `${a} is not false`),
}

// Add all the types to the assertion object too.
objectMap(TYPES, (typeHandle, type) => assertions[typeHandle.toLowerCase()] = functions.curry(assertType, type));

// This is basically an object.assign that prints out an error if the target doesn't permit setting the key
const install = (target, source) => Object.keys(source).forEach(key => {
  try {
    target[key] = source[key];
  } catch (e) {
    console.error(`Tried to install ${key} but an exception was thrown ${e.message}`);
  }
});


// Combine two objects, mutating target
// Similar to Object.assign, but use the target values
// (The only time we don't use the value is when the target is a string)
const combine_basic = (target, obj, print=false) => {
  if (typeof obj === 'undefined') return;
  for (const key in obj){
    if (typeof target[key] === 'boolean'){
      target[key] = !target[key];
    } else if (typeof target[key] === 'number'){
      target[key] = target[key] + obj[key];
    } else {
      target[key] = obj[key]
    }
  }
  if (print) console.log(target, obj);
}

// Gather data from the (SVG) DOM into obj, casting them according to initial values in obj.
const gather = (elt, obj) => {
  for (const key in obj){
    if (!elt.hasAttribute(key)) continue;
    const val = elt.getAttribute(key);
    const type = getType(obj[key]);
    obj[key] = cast(type, val);
  }
};

// Scatter data from an obj onto the (SVG) DOM, writing only if the values differ.
const scatter = (elt, obj) => {
  for (const key in obj){
    const old = elt.getAttribute(key);
    if (obj[key] + '' !== old)
      elt.setAttribute(key, obj[key]);
  }
}

// A simple PRNG inside the browser. 
function RNG(seed) {
    // A simple seedable RNG based on https://en.wikipedia.org/wiki/Linear_congruential_generator
    // LCG using GCC's constants
    this.m = 0x80000000; // 2**31;
    this.a = 1103515245;
    this.c = 12345;
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  RNG.prototype.nextInt = function () {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }
  RNG.prototype.nextFloat = function () {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1);
  }
  RNG.prototype.nextRange = function (start, end) {
    // returns in range [start, end): including start, excluding end
    // can't modulu nextInt because of weak randomness in lower bits
    const rangeSize = end - start;
    const randomUnder1 = this.nextInt() / this.m;
    return start + Math.floor(randomUnder1 * rangeSize);
  }
  RNG.prototype.choice = function (array) {
    return array[this.nextRange(0, array.length)];
  }
