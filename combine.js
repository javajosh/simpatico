'use strict';

install(window, TYPES);

const combineAll = (state, arr) => arr.reduce(combine, state);

const combine = (target, msg, print=false) => {
  let ttarget = getType(target);
  let tmsg = getType(msg);

  if (ttarget == NULL){
    tmsg = ANY;
  } else if (tmsg !== NULL){
    if      (tmsg === FUN) ttarget = ANY;
    else if (ttarget === FUN) tmsg = ANY;
    else if (ttarget === ARR && tmsg !== ARR) tmsg = ANY;
  }

  const ruleKey = ttarget + tmsg;
  const rule = rules[ruleKey];
  if (!rule) throw `rule not found for ruleKey ${ruleKey} target ${JSON.stringify(target)} and msg ${JSON.stringify(msg)}`;
  if (print) log(`combining target ${JSON.stringify(target)} and msg ${JSON.stringify(msg)} with ruleKey ${ruleKey}` );
  const result = rule(target, msg);
  return result;
}

//Rules for combining things. The first arg is the target
//We proceed from the "natural" types to the synthetic types introduced by Simpatico.
const rules = {};
rules[NULL+ANY] = (_,b) => b;

rules[STR+STR]  = (_,b) => b;
rules[STR+NULL] = ()    => '';

rules[NUM+NUM]  = (a,b) => a + b;
rules[NUM+STR]  = (_,b) => cast(TYPES.NUM, b);
rules[NUM+NULL] = ()    => 0;

rules[BOOL+BOOL]= (a,b) => b;
rules[BOOL+STR] = (_,b) => cast(TYPES.BOOL, b);
rules[BOOL+NULL]= (a,_) => !a;

rules[ARR+ARR]  = (a,b) => a.concat(b);
rules[ARR+ANY]  = (a,b) => {a.push(b); return a;};
rules[ARR+NULL] = ()    => [];

rules[FUN+ANY]  = (a,b) => a(b);
rules[ANY+FUN]  = (a,b) => b(a);

rules[OBJ+OBJ]  = (a,b) => {
  b = Object.assign({},b);
  for (let prop in a){
    b[prop] = b.hasOwnProperty(prop) ?
      combine(a[prop],b[prop]): //recurse
      a[prop]; 
  }
  return b;
};

rules[OBJ+MSG] = (core, msg) => { //handler invocation
  let handler = core.handlers[msg.msg];
  if (!handler) throw `handler not found for call ${JSON.stringify(msg)}`;

  let results = handler[HANDLER](core, msg);
  if (predicates.undef(results)) results = [];
  if (!predicates.arr(results)) results = [results];

  for (const result of results) 
    core = combine(core, result); //recurse

  return core;
};

rules[OBJ+HANDLER] = (core, handler) => { //handler registration
  core = combine(core, {handlers:{}});
  core.handlers[handler.name] = handler;
  return core;
};
