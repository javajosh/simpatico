// Simpatico has three parts: combine, the rtree, and friendly functions.
// but first we need to normalize the environment in a readable, terse way.

'use strict';

// A safer stringify that takes into account circular references.,
const tryToStringify = obj => {
  if (typeof obj !== 'object') return obj;
  let result = '<Circular>';
  try{ result = JSON.stringify(obj); } catch (ignored) {}
  return result;
}
const now = a => a ? Date.now() - a : Date.now()
const log = console.log.bind(console)
const debug = console.debug.bind(console)
const info = console.info.bind(console)
const error = a => {throw new Error(a)}
const assert = (a, msg) => a ? true : error(msg)
const and = (a,b) => !!a && !!b
const or = (a,b) => !!a || !!b
const equals = (a,b) => typeof a === 'object' ? tryToStringify(a) === tryToStringify(b) : a === b;
const identity = a => a
const all = arr => arr.reduce(and, true)
const any = arr => arr.reduce(or, false)
const same = arr => arr.reduce(equals, arr[0])
const peek = arr => arr.length ? arr[arr.length - 1] : null
const push = (arr, a) => {arr.push(a); return arr} //mutating
const  hasProp = (a, prop) => a.hasOwnProperty(prop)
const propType = (a, prop) => getType(a[prop])
const getProp = (a, prop) => hasProp(a, prop) ? a[prop] : null;
const mapObject = (a,fn) => Object.fromEntries(Object.entries(a).map(fn))
const assertEquals = (actual, expected, msg) => {
  assert(equals(actual, expected),
    `got [${tryToStringify(actual)}] expected [${tryToStringify(expected)}]${msg ? ' msg:' + msg : ''}`
  )
};
const assertThrows = fn => {
  ASSERT.FUN(fn); let throws = false; let result;
  try { result = fn() } catch (e) { throws = true }
  assert(throws, `Expected fn to throw, but it didn't and returned ${result}`);
};


const TYPES = {
  // These are the 7 basic JS types, excluding void
  UNDEF: 'undefined',
  NUL: 'null',
  STR: 'string',
  NUM: 'number',
  BOOL: 'boolean',
  FUN: 'function',
  OBJ: 'object',

  // Special types
  ARR: 'array',
  ANY: 'any',
  ELT: 'element', //useful in browsers

  //Simpatico types
  CORE: 'handlers', //a core has handlers
  HANDLER: 'handle', //a hander has a handle function
  MSG: 'handler', //a message points to a handler
};

const getType = (a) => {
  const {UNDEF,NUL,STR,FUN,OBJ,ARR,ELT,CORE,HANDLER,MSG} = TYPES;

  let t = typeof a;
  if (t !== OBJ)  return t;

  if (a === null) return NUL;
  if (Array.isArray(a)) return ARR;
  if ( // this is probably insufficient.
    typeof window  !== 'undefined' &&
    typeof Element !== 'undefined' &&
    a instanceof Element
  )
    return ELT;

  // Simpatico stuff
  if (propType(a, HANDLER) === FUN) return HANDLER;
  if (propType(a, MSG) === STR) return MSG;

  return OBJ;
};

// These type predicates are a map from TYPES to an object where the keys
// are [lower cased - maybe?] and the values are functions that check getType
const PREDS = mapObject(TYPES,([k,v])=>[k, a => getType(a) === v])
const ASSERT = mapObject(TYPES,([k,v])=>[k, (a, msg) => assert(getType(a) === v, msg)]);

// Cast a string to a particular type
const cast = (type, str) => {
  const {STR,NUM,BOOL} = TYPES;
  assert(PREDS.STR(str), `string value required; called with [${getType(str)}]`);

  switch (type) {
    case STR:
      return str;
    case NUM:
      const result = 1 * str;
      if (Number.isNaN(result)) throw new Error(`Cannot convert ${str} into a number`);
      return result;
    case BOOL:
      return (str === 'true');
    default:
      throw `casting to type ${type} not supported`
  }
};


// The first part of Simpatico is the combine function.
// Integrate msg into target, producing a new target.
// Note that there are mutating versions of this floating around,
// and this version misses the very nice feature of showing the message cascade
const combine = (target, msg, rules=getRules()) => {
  const {UNDEF,NUL,STR,NUM,BOOL,FUN,OBJ,ARR,ELT,ANY,CORE,HANDLER,MSG} = TYPES;
  let ttarget = getType(target);
  let tmsg = getType(msg);

  // In some cases we erase type (set to "ANY")
  // This saves us from repetative rule writing
  if (ttarget === NUL){
    tmsg = ANY;
  } else if (tmsg !== NUL) {
    // Functions just invoke, so erase the counter type
    if      (tmsg    === FUN) ttarget = ANY;
    else if (ttarget === FUN) tmsg = ANY;
    // Arrays push, so erase the message type
    else if (ttarget === ARR && tmsg !== ARR) tmsg = ANY;
  }

  // Lookup the rule, throw if you can't find it.
  const ruleKey = ttarget + tmsg;
  const rule = rules[ruleKey];
  if (!rule) {
    throw `rule not found. rule[${ruleKey}] target[${tryToStringify(target)}] msg[${tryToStringify(msg)}]`;
  }

  // Invoke the rule and return
  // debug('combine()=>', 'rule:', ruleKey, 'target:', target, 'msg:', msg );
  const result = rule(target, msg);
  // debug(`result[${tryToStringify(result)}] rule[${ruleKey}] target[${tryToStringify(target)}] msg[${tryToStringify(msg)}]` );
  return result;
}

const getRules = () => {
  //Rules for combining things. The first arg is the target, second the message
  //We proceed from the "natural" types to the synthetic types introduced by Simpatico.
   /* Docs Comments on the basic rules:
    Null means "clear". For booleans, it means "toggle".
    We cannot push null to an array because that will clear the array.
    Arrays immutable concat (this is one way to get a null in there!)
  */
  const {UNDEF,NUL,STR,NUM,BOOL,FUN,OBJ,ARR,ELT,ANY,CORE,HANDLER,MSG} = TYPES;
  const rules = {};
  rules[NUL+ANY]  = (_,b) => b;

  rules[STR+STR]  = (_,b) => b;
  rules[STR+NUL]  = ()    => '';

  rules[NUM+NUM]  = (a,b) => a + b;
  rules[NUM+STR]  = (_,b) => cast(NUM, b);
  rules[NUM+NUL]  = ()    => 0;

  rules[BOOL+BOOL]= (a,b) => b;
  rules[BOOL+STR] = (_,b) => cast(BOOL, b);
  rules[BOOL+NUL] = (a,_) => !a;

  rules[ARR+ARR]  = (a,b) => a.concat(b);
  rules[ARR+ANY]  = (a,b) => [...a,b];
  rules[ARR+NUL]  = ()    => [];

  rules[FUN+ANY]  = (a,b) => a(b);
  rules[ANY+FUN]  = (a,b) => b(a);

  rules[OBJ+OBJ]  = (a,b) => {
    // B is defensively copied, mutated and returned, not A!
    b = Object.assign({},b);
    for (let prop in a){
      b[prop] = b.hasOwnProperty(prop) ?
        combine(a[prop],b[prop]): //recurse
        a[prop];
    }
    return b;
  };

  //Gotcha: handler invocation does some limited mutation!
  //mutation: core.msgs will get a push,
  //mutation: msg will get an id, time and children
  //mutation: all results will get the id of the parent
  rules[OBJ+MSG] = (core, msg) => {
    const {UNDEF, ARR, OBJ} = PREDS;

    // World event - defensively copy because we mutate
    if (UNDEF(msg.parent)) msg = Object.assign({}, msg);

    msg.id = core.msgs.length;
    // msg.time = now(); // this makes the display quite chatty
    core.msgs.push(msg);

    //Find the named handler
    const handler = core.handlers[msg.handler];
    if (!handler) throw `handler not found for call ${JSON.stringify(msg)}`;

    // Invoke the handler.
    // Results should always be an array, so help sloppy handlers
    let results = handler[HANDLER](core, msg);
    if (UNDEF(results)) results = [];
    if (!ARR(results))  results = [results];

    // Build up some more info about the message cascade.
    msg.children = results;

    //Recurse for each result
    for (const result of results){
      // Store the id of the parent to avoid cycles that stop stringification
      if (OBJ(result)) result.parent = msg.id;
      core = combine(core, result); //recurse
    }
    return core;
  };

  //handler registration
  rules[OBJ+HANDLER] = (core, handler) => {
    core = combine(core, {handlers:{}, msgs:[]});
    core.handlers[handler.name] = handler;
    return core;
  };
  return rules;
};

// Convenience functions that wrap combine
const combineAll = (arr, core={}) => arr.reduce(combine, core)
const S = (...args) => combineAll(Array.from(args))


/** Docs
   This rtree is implemented with arrays.
   The data-structure looks like this:

   0 - 0 1 2 3 8 {}
   1 - 2 4 5 {}
   2 - 6 7 {}
   focus: 0

   The first column is the row number (included for readability)
   The next number is the parent node for the row.
   The next numbers indicate the values in the order they came in.
   The last object is the residue of the row all the way back to root.

   For example, row 1 {} is ∫[0 1 2 4 5], and row 2 {} is ∫[0 1 2 6 7]

   The RTree has a mutable state, the focus, which determines what happens on the next add.

  Row focus is just a number. This is the default.
  Branching focus is an array: [row,col] or [node]

  row ={row, parent, values, residue}
*/
const rtree = (base = {}, reducer = combine, writeRowToResidue=true, summarize= a=>a ) => {
  const {ARR} = PREDS;
  let foc = 0; // focus can also be an array
  const values = [base];
  const rows = [{row:0, parent: null, values:[0], residue: base}];

  if (writeRowToResidue) rows[0].residue.row = 0;

  const add = (value, assertion) => {
    const i = values.length;
    values.push(value);

    const branching = ARR(foc);
    if (!branching){
      const row = rows[foc];
      row.values.push(i);
      row.residue = reducer(row.residue, value);
    } else {
      // The interesting case - we are branching!
      // TODO support column coordinates?
      const [rowi, coli] = foc;
      const parentRow = rows[rowi];
      const residue = reducer(parentRow.residue, value);
      if (writeRowToResidue) residue.row = rows.length;
      foc = rows.length;
      rows.push({
        row: rows.length,
        parent: peek(parentRow.values),
        values: [i],
        residue,
      });
    }
    if (assertion) assertion(residue()); //TODO: make this better.
    return print();
  }

  // TODO design - decide if supporting columns is actually worth the complexity. I think no..
  // to fully support columns requires a partial reduction that looks something like:
  // partial = (rowi, coli) => row=rows[rowi]; row.values.slice(0,coli).reduce(reducer, partial(row.parent))

  const focus = (a) => {
    assert(a >= 0 && a < rows.length, `focus must be between [0, ${rows.length-1}]`);
    foc = ARR(a) ? [a,rows[a].values.length-1] : a;
    return print();
  }

  const residue = (f=foc) => ARR(f) ? rows[f[0]].residue : rows[f].residue;
  const residues = () => rows.map(row=>row.residue);

  const printRow = (row) => `${row.row} - [${row.parent === null ? 'n' : row.parent}] ${row.values.join(' ')} {${summarize(row.residue)}}`;
  const print = ()=> rows.map(printRow).join('\n') + `\nfocus: ${foc}`;

  const rowValues = (f=foc) => rows[f].values.map(i=>values[i]);

  return {values, rows, add, focus, residue, residues, print, rowValues};
}


/** Docs
  Clock with a requestAnimationFrame() pump
  The basic raf pattern is fn(){stuff; raf(fn)}.
  Generally this is preferred
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

/**
  SVG is my favorite browser display technology for applications. But it's
  pretty hard to use natively. Here are some helper functions that make it
  easier to use!

  TODO: add better support for complex attributes like transform and path
  TODO: this doesn't really fit here in the mainline, perhaps factor it out
*/
const SVG = {
  // Scatter Object properties to Element attributes
  // Do not set an attribute if it isn't different
  scatter : (elt, obj) => {
    ASSERT.ELT(elt) && ASSERT.OBJ(obj);
    for (const key in obj){
      const old = elt.getAttribute(key);
      if (obj[key] + '' !== old)
        elt.setAttribute(key, obj[key]);
    }
  },
  // Gather Element attributes to Object properties
  // Only gather attributes when we have a named property
  // Cast the atttribute according to be consistent with the type of the object value
  gather : (elt, obj) => {
    ASSERT.ELT(elt) && ASSERT.OBJ(obj);
    for (const key in obj){
      if (!elt.hasAttribute(key)) continue;
      const val = elt.getAttribute(key);
      const type = getType(obj[key]);
      obj[key] = cast(type, val);
    }
    return obj;
  },
  // TODO is this worth the complexity?
  parseTransform: (elt) => {
    const result = {};
    const transformList = elt.transform.baseVal;
    for (let transform of transformList){
      const m = transform.matrix;
      switch (transform.type) {
        case 2: result.translate = {x:m.e, y:m.f}; break;
        case 3: result.scale = {x:m.a, y:m.d}; break;
        case 4: result.rotate = {angle: transform.angle}; break; //TODO handle rotate(angle, x, y) form
        case 5: break; // TODO skewX()
        case 6: break; // TODO skewY(()
        case 1: break; // probably the matrix form.
        default:
      }
    }
    return result;
  },
  renderTransform: obj => {
    let result = '';
    Object.entries(obj).forEach(([key, value]) => {
      const inside = Object.values(value).join(',');
      result += `${key}(${inside})`;
    });
    return result;
  },
  intersectRect : (elt1, elt2) => {
    elt1 = elt1.getBoundingClientRect();
    elt2 = elt2.getBoundingClientRect();
    return !(elt2.left > elt1.right  ||
             elt2.top  > elt1.bottom ||
             elt1.left > elt2.right  ||
             elt1.top  > elt2.bottom);
  },
  // Poly is a list of points in {x,y} format
  isPointInPoly :(poly, point) => {
    const {x,y} = point;
    const len = poly.length;
    for(i = -1, j = len - 1; ++i < len; j = i){
      const {x:xi, y:yi} = poly[i];
      const {x:xj, y:yj} = poly[j];
      if ((
        (yi <= y && y < yj) ||  // y sits between two adjacent y's of the poly
        (yj <= y && y < yi)
      ) && (x <                 // x is less than...some mysterious number!
        xi + (xj - xi) * (y - yi) / (yj - yi)
      )) return true;
    }
    return false;
  }
}

// Tests - SVG
// let radius = document.getElementsByClassName('radius')[0]
// let transform = SVG.parseTransform(radius)
// let transformString = SVG.renderTransform(transform)

// TODO: Define more devices: keyboard, mouse. And also: screen, disk, and network

// Let's do some friendly functions!
// It's tempting to use something like JSON Schema, but that does too much, and it's big
// How far can be get being naive?

// TODO make this consisten with the earlier preds
const preds = {
  str: a => typeof a === 'string',
  num: a => typeof a === 'number',
  bool: a => typeof a === 'boolean',
  fun: a => typeof a === 'function',
  obj: a => typeof a === 'object' && !Array.isArray(a),
  arr: a => Array.isArray(a),
  int: a => typeof a === 'number' && Math.floor(a) === a,
  between: (lo, hi, a) => {
    ASSERT.NUM(lo) && ASSERT.NUM(hi) && assert(lo <= hi);
    if (PREDS.STR(a) || PREDS.ARR(a)) a = a.length;
    return (PREDS.NUM(a)) ? lo <= a && a <= hi : false;
  },
  optional: a => true,
  equals: (a,b) => a === b,
  email: a => preds.str(a) && a.match(/@/),
  hasKey: (a,b) => preds.obj(a) && preds.str(b) && a.hasOwnProperty(b),
  contains: (a,b) => preds.arr(a) && a.includes(b),
}

const testPattern = {
  a: ['num', 'between', 0, 10],
  b: ['str'],
  c: ['optional', 'str', 'between', 0, 10],
  d: {
    e: ['num', 'between', 0, 10],
    f: ['optional', 'str', 'between', 3, 8],
  }
};

// Here's a value that matches
const testValid = {
  a: 5,
  b: 'hi',
  d: {
    e: 3,
    f: 'abcd'
  }
};

// Here's one that doesn't
const testNotValid = {
  a: 5,
  b: 'hi',
  d: {
    e: 11, //this one fails.
    f: 'abcd'
  }
};

/** docs
  Validate against a pattern obj. Return undefined if pass; return a descriptive object if failed. Special cases:
    value != object => nothing passes (return pattern)
    pattern = null => nothing passes (return {})
    pattern = {} => everything passes (return undefined)

*/
const validate = (patternObj, valueObj) => {
  //gotcha: do not use getType predicate because handler !== object, etc
  const isObj = a => typeof a === 'object' && !Array.isArray(a);

  if (!isObj(valueObj)) return patternObj;
  if (patternObj === null) return {};
  if (patternObj === {}) return undefined;

  assert(isObj(patternObj), `pattern must be an object but was ${tryToStringify(patternObj)}`)

  const result = {};
  let objPass = true;

  for (const [patternKey, patternValue] of Object.entries(patternObj)) {
    const value = valueObj[patternKey];
    let pass = true;
    let failReasons = undefined;

    if (isObj(patternValue)) {
      failReasons = validate(patternValue, value); //recurse
    } else if (PREDS.ARR(patternValue)){
      failReasons = checkValue(patternValue, value); //normal case
    } else { // scalar case
      failReasons = (value === patternValue) ? undefined : ['equals', patternValue];
    }

    pass = !failReasons;
    if (!pass) result[patternKey] = failReasons;
    objPass = objPass && pass;
  }
  return objPass ? undefined : result;
}

// Check the value against the array. If pass, return the value; if fail, return an array of failures.
const checkValue = (predArray, value) => {
  const failedPreds = [];
  let pass = true;
  let allPass = true;

  // Loop through the predicates.
  for (let i = 0; i < predArray.length; i++){
    let pred = predArray[i].toLowerCase(); // case of preds doesn't matter

    if (pred === 'between'){
      const lo = predArray[i+1];
      const hi = predArray[i+2];
      // Between when applied to an array checks its length
      value = PREDS.ARR(value) ? value.length : value;
      pass = preds.between(lo, hi, value);
      i += 2;
      if (!pass) {
        failedPreds.push(pred, lo, hi);
      }
    } else if (pred === 'optional'){ //optional means we skip if it's missing
      if (PREDS.UNDEF(value)) {
        return undefined;
      }
    } else { // TODO add support for descriptive values?
      pass = PREDS[pred.toUpperCase()](value);
      if (!pass) failedPreds.push(pred);
    }
    allPass = allPass && pass;
  }
  return allPass ? undefined : failedPreds;
};

// Tests checkValue()

// The normal happy cases
assertEquals(checkValue(['str'], 'a'), undefined);
assertEquals(checkValue(['num'], 1), undefined);
assertEquals(checkValue(['bool'], false), undefined);
assertEquals(checkValue(['between', 0, 3], 2), undefined);
assertEquals(checkValue(['optional'], undefined), undefined);

// Bad scalar matches
assertEquals(checkValue(['num'], 'a'), ['num']);
assertEquals(checkValue(['str'], 1), ['str']);
assertEquals(checkValue(['between', 0, 3], 4), ['between', 0, 3]);

// Optional doesn't mean you can supply a bad value!
assertEquals(checkValue(['optional', 'num'], 'a'), ['num']);
assertEquals(checkValue(['optional', 'between', 0, 3], 4), ['between', 0, 3]);
assertEquals(checkValue(['optional', 'num', 'between', 0, 3], 'a'), ['num']);

assertEquals(checkValue(['optional', 'num', 'between', 0, 10], 5), undefined);

// Tests validate()

// single key
assertEquals(validate({a: ['num']}, {a: 1}), undefined, 'passed key');
assertEquals(validate({a: ['num']}, {a: 'a'}), {a: ['num']}, 'failed key');
assertEquals(validate({a: ['num']}, {}), {a: ['num']}, 'missing non-optional');

// multi key
assertEquals(validate({a: ['num'], b:['num']}, {a: 1, b:1}), undefined, 'multi-key success');
assertEquals(validate({a: ['num'], b:['num']}, {a: 1, b:''}), {b:['num']}, 'multi-key fail');

// special cases
assertEquals(validate({},{everything:'passes'}), undefined);
assertEquals(validate(null, {everything:'fails'}), {});
assertEquals(validate({a:['num']}, 'every non-obj value fails'), {a:['num']});

assertEquals(validate({a: 'dec', b:['optional', 'num', 'between', 0, 10]}, {a:'dec'}), undefined);
assertEquals(validate({handler: 'dec', b:['optional', 'num', 'between', 0, 10]}, {handler:'dec'}), undefined);


assertEquals(validate({
  e: ['num', 'between', 0, 10],
  f: ['optional', 'str', 'between', 3, 8],
}, { e: 11, f: "abcd" }), {
  e: ['between', 0, 10]
});

// nested object
assertEquals(validate({a:['num'], b:{c:['num']}}, {a: 1, b:{c:  1}}), undefined);
assertEquals(validate({a:['num'], b:{c:['num']}}, {a: 1, b:{c: ''}}), {b:{c:['num']}});

// the full monty
assertEquals(validate(testPattern, testValid), undefined, 'full monty should be valid');
assertEquals(validate(testPattern, testNotValid), {d:{e:['between', 0, 10]}}, 'full monty should NOT be valid');



/** docs
  A simple friendly function. Note that friendly functions can only take one object arg.
  It's better if they don't return objects if they execute normally, since this clashes with the descriptive failure mode
  We will see that in a handler context these conditions are very natural and easy
*/
const friendly = input => {
  const pattern = {a:['bool']};
  if (!validate(pattern, input)){ // concern: It's not intuitive to check !validate. rename to 'invalid'?
    return 2;
  } else {
    return pattern;
  }
}

assertEquals(friendly(), {a:['bool']})
assertEquals(friendly(1), {a:['bool']})
assertEquals(friendly({a:1}), {a:['bool']})
assertEquals(friendly({b:true}), {a:['bool']})
assertEquals(friendly({a:true}), 2)

// Let's build a little countdown latch
const latch = rtree({count: 100});

latch.add({
  name: 'dec',
  desc: 'A counter that goes to 0 in different intervals',
  pattern: {amount:['optional', 'num', 'between', 0, 10]},
  example: {handler: 'dec', amount: 5},
  dec: {count: -1},
  handle: function(ctx, msg){ // function is a sad syntactical price to pay for the efficiency of "this.pattern"
    const {pattern, dec} = this;
    if (ctx.count <=0) throw `halted because count ${ctx.count} <=0`;
    if (ctx.err) throw `halted with error ${tryToStringify(ctx.err.failures)}`;
    const failures = validate(pattern, msg);
    return failures ? {err: {msg, failures}} :
         msg.amount ? {count: -msg.amount} : dec;
  }
});

// Tests
latch.add({handler: 'dec'}, r => assertEquals(r.count, 99));
latch.add({handler: 'dec', amount: 5}, r => assertEquals(r.count, 94));
latch.add({handler: 'dec', amount: 50},r => assertEquals(r.err.failures, {amount:['between', 0, 10]}));
assertThrows(()=>latch.add({handler: 'dec', amount: 3}));

// The simplest tictactoe implementation
let t3 = rtree({
    turn: 1,
    moves: [],
    winner: -1,
  }, combine, true,
  r=>`msgs:${r.msgs.length} turn:${r.turn} winner:${r.winner}` //summarize function to help t3.print()
);
t3.add({
  name: 'move',
  example: {handler: 'move', val: 8},
  pattern: {val:['between', 0, 8]},
  handle: function (ctx, msg) {
    assert(ctx.winner === -1, `Game already won by player ${ctx.winner}!`);
    const failures = validate(this.pattern, msg);
    const move = msg.val;
    // TODO: add this to pattern, add includes to predicates.
    assert(!ctx.moves.includes(move));
    return [{turn: 1}, {moves: move}, {handler: 'computeWinner'}];
  },
});

/*0 1 2
  3 4 5
  6 7 8*/
t3.add({
  name: 'computeWinner',
  example: {handler: 'computeWinner'},
  desc: 'find the winner using regular expressions',
  winConditions: '012-345-678-036-147-258-048-246'.split('-'),
  handle: function(ctx, msg){
    if (ctx.winner !== -1) return;
    // Odd moves are for player one, even for player two
    const p0 = ctx.moves.filter((move, i) => i % 2 - 1).sort().join('');
    const p1 = ctx.moves.filter((move, i) => i % 2).sort().join('');
    for (const pattern of this.winConditions){
      if (p0.match(pattern)) return {winner: 1};
      if (p1.match(pattern)) return {winner: 2};
    }
  }
});

const makeMove = (game, move) => game.add({handler: 'move', val:move});
const makeMoves = (game, moves) => moves.forEach(move => makeMove(game, move));

makeMoves(t3, [0,3,1,8,2]);
// Game is won, so no more moves are allowed.
assertThrows(()=>makeMove(t3, 7));



// Let's do some particle stuff. You can move a particle with the mouse and
// it will change color if you intersect the target. Note that this isn't general
// because if the collision is caused by the other particle's motion, it won't be
// detected here. Yet another reason to define a coupling reduction between rows...
let particle = rtree({x:0,y:0});
particle.add({ particleElt: document.getElementById('particle')});
particle.add({ targetElt: document.getElementById('target')});
particle.add({name:'move', handle: function(ctx, msg) {
  if (ctx.halted) return;
  const {x, y, dx,dy} = msg.event;
  const {scatter, intersectRect} = SVG;
  // we have to convert the event to the svg coordinate system, which is centered on 500 500 and inverted. the left is 0, or -1.0. The middle is 500 or 0.
  const coords = {cx: (x-500)/500, cy:-(y-500)/500};
  const result = {x:coords.cx,y:coords.cy};
  const intersects = intersectRect(ctx.particleElt, ctx.targetElt);
  scatter(ctx.particleElt, coords);
  scatter(ctx.particleElt, intersects ? {fill:'red'} : {fill:'green'} );

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

window.onmousemove = e => particle.add({handler:'move', event:EVENTS.mousemove(e)});