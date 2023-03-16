// A much simpler combine not for production use - just playing with some ideas.

import {assertEquals, mapObject} from './core.js';

const DEBUG = false;
const isNum = d => Number.isInteger(d);
const isStr = d => typeof d === 'string';
const isArray = d => Array.isArray(d);
const isObj = a => typeof a === 'object' && !isArray(a);
const isScalar = a => !isArray(a) && !isObj(a);
const peek = (arr, def=null) => {
  if (!isArray(arr) || arr.length === 0) return def;
  if (arr.length === 1) return arr[0];
  return arr[arr.length - 1];
}
const isCore = a =>    typeof a === 'object' && a.hasOwnProperty('handlers') && typeof a['handlers'] === 'object';
const isHandler = a => typeof a === 'object' && a.hasOwnProperty('handle')   && typeof a['handle'  ] === 'function';
const isMsg = a =>     typeof a === 'object' && a.hasOwnProperty('handler')  && typeof a['handler' ] === 'string';
const isInstance = a =>isCore(a) && a.hasOwnProperty('nodeId') && isNum(a);
const isType = a =>    isCore(a) && a.hasOwnProperty('type') && typeof a['type'] === 'string';

const assertHandler = { handle: (core, msg) => {
  Object.entries(msg).forEach(([key, msgValue]) => {
    if (key === 'handler' || key === 'parent') return; // skip the handler name itself
    if (core.hasOwnProperty(key)) assertEquals(msgValue, core[key]);
    else throw 'core is missing asserted property ' + key;
  });
  return [{}];
}};

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
    return a.map((ai, i) => combine(ai, b[i]));
  }

  // if the target is an array, push the argument onto the array
  if (Array.isArray(a) && !Array.isArray(b)) {
    a.push(b);
    return a;
  }

  // If both args are plain objects, combine every shared key, and add the non-shared keys, too.
  if (isObj(a) && isObj(b)) {
    if (isCore(a) && isMsg(b)){
      if (!isHandler(a.handlers[b.handler])) throw `Unable to find valid handler ${b.handler} in core ${a}`;
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

  throw `unable to combine ${a} and ${b} types ${typeof a} ${typeof b}`
}

// Take an array with sprinkled integers and turn it into a tree of related elements
function stree(arr = [{}], rowReducer=combine, summaryReducer=combine) {
  const rows = [[]];
  const nodes = [];
  const residues = [];
  let summary = {};
  let currRow = rows[0];

  // Support cheap(er) creation of branch state from row state
  // Given a node index, give me the row that contains the node up to the node.
  // We can do this statelessly with indexOf, but this is much faster.
  let currRowIndex = 0;
  let nodeToRowMap = [];
  const getPartialRow = nodei => {
    const [rowi, coli] = nodeToRowMap[nodei];
    const row = rows[rowi];
    return row.slice(0, coli + 1); // tricky: slice does not include the last elt!
  }

  arr.every(add);

  function add(d) {
    if (isNum(d) && d >= 0 ){
      // Positive numbers mean the target is a node
      if (d >= nodes.length) throw 'invalid parent node ' + d;
      currRow = [d];
      currRowIndex = rows.length;
      rows.push(currRow);
    } else if(isNum(d) && d < 0) {
      // Negative numbers means the target is a row.
      if (-d >= rows.length) throw 'invalid row ' + d;
      currRow = rows[-d];
      currRowIndex = -d;
    } else {
      // Special handling for neu messages - delegate to neu() and
      if (isObj(d) && d.hasOwnProperty('neu')){
        neu(d);
        return true;
      }
      // Support for efficient branches()
      nodeToRowMap.push([currRowIndex, currRow.length]);

      // The primary purpose, adding things to the current row and nodes.
      currRow.push(d);
      nodes.push(d);

      // Update caches for residue and summary.
      try {
        residues[currRowIndex] = rowReducer(residues[currRowIndex], d);
        summary = residues.reduce(summaryReducer, {});
      } catch (e) {

      }
    }
    return true;
  }


  // Given either a type name or type row, create a new instance row.
  // A more handy way to make instances than the raw add(node) interface.
  // Trees that only instantiate using this method have some nice properties.
  // Note:  'new' is a reserved word in JavaScript so we use the German 'neu'.
  function neu(d){
    let type, rowNum, residue, parentNodeId, newNodeId;

    if (isNum(d)){
      rowNum = -d;
      residue = residues[rowNum];
      // We can take out 'isInstance' for some interesting alternative type systems.
      if (!isType(residue) || isInstance(residue)) throw `row ${d} cannot be instantiated with neu()`;
    } else if (isStr(d)){
      type = d;
      let found = null;
      residues.every((r, i) => {
        if (isType(r) && !isInstance(r) && r.type === type) { found = i; return false; }
        return true;
      });
      if (!isNum(found)) throw `type ${d} not found`;
      rowNum = found;
    }

    residue = residues[rowNum];
    if (!isType(residue)) throw `row ${rowNum} is not a type and cannot be instantiated with neu()`;
    type = residue.type;
    parentNodeId = nodes.indexOf(peek(rows[rowNum]));
    newNodeId = nodes.length;
    add(parentNodeId);
    add({
      nodeId: newNodeId,
      rowId: rows.length - 1,
      type,
      version: parentNodeId
    });
    return rowNum;
  }

  const branchTips = () => rows.map(row => {
    let node = peek(row);
    return nodes.indexOf(node);
  });

  // Prepend partial rows until root.
  const branches = () => rows.map(row => {
    let result = [...row], partial = [...row], nodei;
    while (isNum(result[0])) {
      nodei = result.shift();
      partial = getPartialRow(nodei);
      result = [...partial, ...result];
    }
    return result;
  });

  // Return true if the given core can reach all points on all branches of this tree.
  const allBranchesReachable = core => branches().every((branch, branchi) => {
    let state = core; // reset the core before every branch
    return branch.every((op, opi) => {
      try {
        state = combine(state, op);
        return true;
      } catch (e) {
        console.error(`cannot combine op ${JSON.stringify(op)} op i ${opi} at branch i ${branchi} and core ${JSON.stringify(core)}`);
        debugger;
        throw e;
      }
    });
  });

  // These are the stateless methods to compute residue and summary. Very compute intensive.
  // Map each branch to a residue by reducing the branch under combine
  // const residues = (reduction=combine, start={}) => branches().map(branch => branch.reduce(reduction, start));
  // Combine all the residues into a summary, by default using combine for both reductions
  // const summary = (r1=combine, r2=combine, s1={}, s2={}) => residues(r1, s1).reduce(r2, s2);

  return {
    add,
    neu,
    allBranchesReachable,
    rows,
    nodes,
    residues,
    summary,
    branches,
    branchTips,
  };
}

export {combine, stree, assertHandler}
