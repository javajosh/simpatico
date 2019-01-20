"use strict";

/**
    Handy utilities for types, assertions functional programming
    and array manipulation.
 */

const TYPES = {
  STR : 'string', 
  ANY: '',
  NUM: 'number', 
  BOOL: 'boolean',
  OBJ: 'object',
  FUN: 'function',
  ARR: 'array',
  NULL: 'null',
  UNDEF : 'undefined',
  CALL : 'call',
  HANDLER: 'handler',
};

// Object.keys(TYPES).forEach(key => window[key] = TYPES[key]);

const types = Object.keys(TYPES);

const assert = (a, msg) => {if (!a) throw new Error(msg)};
const assertEquals = (expected, actual) => {if (actual !== expected) assert(false, `expected [${expected}] but got [${actual}]`)};

const assertType = (type, a) => assert(getType(a) === type, `Expected ${a} to be of type ${type} but was of type ${getType(a)}`);

const assertThrows = fn => {
  let throws = false;
  try{
    fn();
  }catch (e){
    throws = true;
  }
  if (!throws) throw new Error(`Expected fn to throw but it didn't`);
};


const getType = (a) => {
  let t = typeof a;
  if (t !== TYPES.OBJ) return t;
  
  if (Array.isArray(a)) return TYPES.ARR;
  if (a === null) return TYPES.NULL;
  if (a === undefined) return TYPES.UNDEF;
  
  if (a.hasOwnProperty(TYPES.CALL)) return TYPES.CALL;
  if (a.hasOwnProperty(TYPES.HANDLER)) return TYPES.HANDLER;
  
  return TYPES.OBJ;
};

const predicates = {
  get: (arr, pos) => pos.length ? get(arr[pos.shift()], pos) : arr,
  all: (arr, val) =>  arr.reduce((acc,a) => (a === val) && acc, true),
  same: (arr) => predicates.all(arr, arr[0]),
  eq : (a, b) => a.length === b.length && predicates.all(zip(a,b).map(d => d[0] === d[1])),
  contains : (arr, a) => arr.contains(a),
  between :(min, max, num) => min <= num && num <=max,
}


// Generally useful functions on arrays.
const zip = (a, b) => a.map((d, i) => [d, b[i]]);
const add = (a, b) => zip(a,b).map(d => d[0] + d[1]);
const dot = (a, b) => zip(a,b).map(c => d[0] * d[1]);
const mul = (arr, c) => arr.map(d => c * d);

// This is a very simple curry for two variables. Pareto principal!
const curry = (f, a) => b => f(a,b);

// Map over all entries passing (key,val) into the mapFn
const objectMap = (object, mapFn) => {
    return Object.keys(object).reduce((result, key) =>{
        result[key] = mapFn(key, object[key])
        return result
    }, {})
}


const assertions = {
  all: (arr,val) => assert(predicates.all(arr, val), `Expected all array values [${arr}] to be ${val} but they weren't`),
  same: (arr) => assert(predicates.same(arr), `Expected all values in array [${arr}] to be the same, but they weren't`),
  eq: (a, b) => assert(predicates.eq(a,b), `Expected arrays to be equal [${a}] and [${b}]`),
  contains: (arr, a) => assert(predicates.contains(arr, a), `Expected array [${arr}] to contain value ${a}, but it didn't`),
  between: (min, max, num) => assert(predicates.between(min, max, num),`Middle number out of bounds: ${min} <= ${num} && ${num} <= ${max}`),
}

// Add all the types to the assertion object too.
objectMap(TYPES, (typeHandle, type) => assertions[typeHandle.toLowerCase()] = curry(assertType, type))

// This is basically an object.assign that prints out an error if the target doesn't permit setting the key
const install = (target, source) => Object.keys(source).forEach(key => {
  try{
    target[key] = source[key];
  } catch (e) {
    console.error(`Tried to install ${key} but an exception was thrown ${e.message}`);
  }
});

