'use strict';

install(window, TYPES);

const combine = (target, msg, print=false) => {
  let tmsg = getType(msg), ttarget = getType(target);
  if (ttarget === ARR){
    if (tmsg !== ARR && tmsg !== NULL) tmsg = ANY; 
  }
  if (ttarget === FUN){
    if (tmsg !== FUN && tmsg !== NULL) tmsg = ANY; 
  }
  const ruleKey = ttarget + tmsg;
  const rule = rules[ruleKey];
  if (!rule) throw `rule not found for ruleKey ${ruleKey} values ${JSON.stringify(target)} --- ${JSON.stringify(msg)}`;
  if (print) log(`combining target ${JSON.stringify(target)} and msg ${JSON.stringify(msg)} with ruleKey ${ruleKey}` );
  const result = rule(target, msg);
  return result;
}

//Rules for combining things. The first arg is the target
//We proceed from the "natural" types to the synthetic types introduced by Simpatico.
const rules = {};
rules[STR+STR] = (s1,s2) => s2;
rules[NUM+NUM] = (i1,i2) => i1 + i2;
rules[NUM+NULL] = () => 0;
rules[NUM+STR] = (n, s) => cast(TYPES.NUM, s);
rules[BOOL+BOOL] = (b1, b2) => b2;
rules[BOOL+STR] = (b, s) => cast(TYPES.BOOL, s);
rules[BOOL+NULL] = b => !b;
rules[ARR+ARR] = (arr1,arr2) => arr1.concat(arr2);
rules[ARR+NULL] = () => [];
rules[ARR+ANY] = (arr,a) => {arr.push(a); return arr;};
rules[FUN+ANY] = (fn,a) => fn(a);
rules[FUN+FUN] = (f1,f2) => a => f1(f2(a));
rules[FUN+NULL] = () => a => a;
rules[OBJ+OBJ] = (a,b) => {
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
  if (getType(results) !== ARR) results = [results];

  for (const result of results) 
    core = combine(core, result); //recurse

  return core;
};
rules[OBJ+HANDLER] = (core, handler) => { //handler registration
  core = combine(core, {handlers:{}});
  core.handlers[handler.name] = handler;
  return core;
};
