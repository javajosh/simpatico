import {tryToStringify, hasProp} from '../core.js';
import {validate} from '../friendly.js'
import stree from '../stree.js';


// Let's build a little countdown latch
const latch = stree({count: 100});

latch.add({
  name: 'dec',
  desc: 'A counter that goes to 0 in different intervals',
  pattern: {msg: 'dec', amount:['optional', 'num', 'between', 0, 100]},
  example: {msg: 'dec', amount: 5},
  dec: {count: -1},
  handle: function(ctx, msg){ // 'function' is the price of using 'this'
    const {pattern, dec} = this;

    if (ctx.count <= 0) throw `halted because count ${ctx.count} <=0`;
    if (ctx.err)        throw `halted with error ${tryToStringify(ctx.err.failures)} for msg ${tryToStringify(ctx.err.msg)}`;

    const failures = validate(pattern, msg);

    if (failures) return {err: {msg, failures}};
    if (hasProp(msg, 'amount')) return {count: -msg.amount};

    return dec;
  }
});

export default latch;
