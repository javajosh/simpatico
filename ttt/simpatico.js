'use strict'; // TODO: add linter support. Would catch unused variable issues.

const STRING = 'string', ANY = '',
      NUM = 'number', OBJ = 'object',
      FUN = 'function', ARR = 'array',
      NULL = 'null', UNDEF = 'undefined',
      CALL = 'call', HANDLER = 'handler';

function assert(pred, msg){
  if (!pred) throw msg;
}

function arrEquals(a,b){
  if (a.length != b.length) return false;
  for (let i = 0; i< a.length; i++){
    if (a[i] !== b[i]) return false;
  }
  return true;
}

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

//Type tests
let tests = ['',1,[],{},()=>{},null,undefined];
let expected = ["string", "number", "array", "object", "function", "null", "undefined"];
let result = tests.map(a=>getType(a));
assert(arrEquals(expected, result));


// Form a doubly-linked list where the payload is a reduction over combine since root.
function S(prev={}, curr={}, debug=true){
  let prev_r = prev.r || {};
  let curr_r = combine(prev_r, curr);
  let m = {prev:prev, curr:curr, r:curr_r};
  if (debug) console.log(m.curr, m.r);
  return m;
}
//To get the message list for the current residue, we walk back to the root.
function msgs(s){
  let result = [];
  while(s.prev){
    result.push(s.curr);
    s = s.prev;
  }
  return result;
}

//Rules for combining things. The first arg is the target
//We proceed from the "natural" types to the synthetic types introduced by Simpatico.
const rules = {};
rules[STRING+STRING] = (s1,s2) => s2;
rules[NUM+NUM] = (i1,i2) => i1 + i2;
rules[NUM+NULL] = () => 0;
rules[ARR+ARR] = (arr1,arr2) => arr1.concat(arr2);
rules[ARR+NULL] = () => [];
rules[ARR+ANY] = (arr,o) => arr.push(o);
rules[FUN+OBJ] = (f,o) => f(o);
rules[FUN+FUN] = (f1,f2) => f2;
rules[OBJ+OBJ] = (b,a) => {
  b = Object.assign({},b);
  for (let prop in a){
    b[prop] = b.hasOwnProperty(prop) ?
      combine(a[prop],b[prop]): a[prop]; //recurse
  }
  return b;
};
rules[OBJ+CALL] = (r, call)=>{ //handler invocation
  if (getType(call.pre) === FUN) call.pre(r,call);
  let handler = r.handlers[call.call];
  if (!handler) throw `handler not found for call ${call}`;
  let results = handler[HANDLER](r,call);
  if (getType(results) !== ARR) results = [results];
  for (let i =0; i< results.length; i++){
    let result = results[i];
    r = combine(r, result);
  }
  if (getType(call.post) === FUN) call.post(r,call);
  return r;
};
rules[OBJ+HANDLER] = (r, handler)=>{ //handler registration
  r = combine(r, {handlers:{}});
  r.handlers[handler.name] = handler;
  let result = handler.init(r);
  r = combine(r, result);
  return r;
};

//Add a into b
function combine(b,a){
  let tb = getType(b), ta = getType(a);
  let ruleKey = (tb === ARR && (ta !== ARR && ta !== NULL)) ? ARR+ANY : tb + ta;
  let rule = rules[ruleKey];
  if (!rule) throw `rule not found for types ${ruleKey} values ${b} ${a}`;
  return rule(b,a);
}


//That's it, let's test!
let a = {a:1};
let b = {b:2};
let c = {f:{double: function(o){return o.a *2}}};
let d = {f:{halve: function(o){return o.a/2}}};
let e = {f:{double: {a:2}}}; //this is an invocation.
let f = {
  name:'double',
  init:(r)=>{answer:0},
  handler:(r,o)=>{answer:o.a*2},
};
let g = {call:'double', a:2};
let h = {
  name:'quad',
  init:(r)=>{answer:0},
  handler:(r,o)=>  [
    {call:'double', a:o.a},
    {call:'double', a:o.a},
  ]
};
let i = {call:'quad', a:2};

let assertionHandler = {
  name:'assert',
  // init: (r)=>{r.fail{}},
  example: {
    call: 'assert',
    'value is 1': r => r.value === 1,
    'a is less than b': r => r.a < r.b,
  },
  isCollapsed: o => {
    for (let prop in o){
      if (prop === CALL) continue;
      let assertion = o[prop];
      if (getType(assertion) === FUN) {
        return false;
      }
    }
    return true;
  },
  // init:(r)=>{return {assert:0}},
  handler:(r,o)=>{
    return combine(o, r);
  }};

let s = S();
s = S(s,a);
s = S(s,b);
s = S(s,c);
s = S(s,d);
s = S(s,e);
s = S(s,f);
// s = S(s,g);
s = S(s,h);
s = S(s,i);

console.log(msgs(s));

//A Core is a collection of related residues, represented by the tip of each branch of messages.
//Branches are created by moving backward up the chain and then adding a new message.
function Core(tip={}){
  this.tips = [];
  this.input = [];
  this.tip = tip;
  this.offset = 0;
  this.add = (msg, targetMsg = this.tip) => {
    this.input.push(msg);
    targetMsg = S(targetMsg, msg, false);
    if (this.offset) {
      this.tips.push(this.tip);
      this.offset = 0;
    }
    return this;
  };
  this.state = () => this.tip.r;
  this.back = offset => {
    this.offset = offset;
    while(offset-- && this.tip.prev) 
      this.tip = this.tip.prev;
    return this;
  };
  this.select = (tipIndex) => {
    this.tip = this.tips[tipIndex];
    this.offset = 0;
    return this;
  }
  this.msgs = () => msgs(this.tip);
  this.test = (core)=>{
    let tests = this.tips;
    for (let test of tests){
      let steps = test.msgs();
      for (let step of steps){
        core.add(step); //may want to wrap this
        //can either interleave calls and assertions.
        //or combine them.
      }
    }
  }
}

//Basic core tests:
let core = new Core();
core.add(a).add(b).add(c);
console.log('core state', core.state());
core.back(1);
console.log(core);
core.add(d);
console.log(core);
core.select(0).add(e);
console.log(core, core.msgs());
