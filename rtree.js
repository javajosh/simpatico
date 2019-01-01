console.log('This is going to be a one-shot program thats a test of our new data-structure, rtree()');

const STRING = 'string', ANY = '',
      NUM = 'number', OBJ = 'object',
      FUN = 'function', ARR = 'array',
      NULL = 'null', UNDEF = 'undefined',
      CALL = 'call', HANDLER = 'handler';

const assert = (a, msg) => {if (!a) throw new Error(msg)};

function getType(a){
  let t = typeof a;
  if (t !== OBJ) return t;
  
  if (Array.isArray(a)) return ARR;
  if (a===null) return NULL;
  if (a===undefined) return UNDEF;
  
  if (a.hasOwnProperty(CALL)) return CALL;
  if (a.hasOwnProperty(HANDLER)) return HANDLER;
  
  return OBJ;
}


// Generally useful functions on arrays.
const zip = (a, b) => a.map((d, i) => [d, b[i]]);
const add = (a, b) => zip(a,b).map(d => d[0] + d[1]);
const dot = (a, b) => zip(a,b).map(c => d[0] * d[1]);
const mul = (arr, c) => arr.map(d => c * d);
// These functions on arrays return scalars
const get = (arr, pos) => pos.length ? get(arr[pos.shift()], pos) : arr;
const all = (arr) => arr.reduce((a,b) => (a !== null && a===b) ? a : false, arr[0]);
const eq  = (a, b) => a.length === b.length && all(zip(a,b).map(d => d[0] === d[1]));
// This is a very simple curry for two variables. Pareto principal!
const curry = (f, a) => b => f(a,b);

(() => {
  	//Type tests - these are wierd because they will fail on module load in node!
	let testValues = ['',1,[],{},()=>{},null,undefined];
	let expected = ["string", "number", "array", "object", "function", "null", "undefined"];
	let results = testValues.map(a => getType(a));
	assert(eq(expected, results));
})()


const objectMap = (object, mapFn) => {
    return Object.keys(object).reduce((result, key) =>{
        result[key] = mapFn(key, object[key])
        return result
    }, {})
}

// END UTILITY SECTION



function rtree(){
	const arr = [];
	const add = d => arr.push(d);
	return {add, arr}
}

function test(){
  // define test helpers
  const equals = (a, b) => assert(a===b, `${a} not equal to ${b}`);
  const throws = fn => {let a = false; try{fn()} catch(e){a=true}; assert(a, 'fn did not throw')};


  // define & run module/unit tests
  const r = rtree();
  assert(getType(r) === OBJ, 'rtree is an object');
  assert(r.hasOwnProperty('add') && getType(r.add) === FUN, 'rtree has an "add" function property');
  assert(r.hasOwnProperty('arr') && getType(r.arr) === ARR, 'rtree has an "arr" array property');

  equals(r.arr.length, 0);
  r.add('a');
  equals(r.arr.length, 1);
  r.add('a');
  equals(r.arr.length, 2);
}

test();

console.log('Success!')
