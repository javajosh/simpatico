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
const isInstance = a =>isCore(a) && a.hasOwnProperty('nodeId') && isNum(a.nodeId);
const isType = a =>    isCore(a) && a.hasOwnProperty('type') && typeof a['type'] === 'string';

// Take an array with sprinkled integers and turn it into a tree of related elements
function stree(
  arr = [{}],
  rowReducer=combine,         rowResidue={},
  summaryReducer=combine, summaryResidue={}
) {
  const rows = [[]];
  const nodes = [];
  const residues = [rowResidue];
  let summary = summaryResidue;
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

    const updateResidues = true;

    if (isObj(d) && d.hasOwnProperty('neu')){
      // Special handling for neu messages - delegate to neu() and
      neu(d);
    } else if (isNum(d) && d >= 0 ){
      // Positive numbers mean the target is a node
      // Add a new row with the first elt integer d pointing to parent node.
      // Add the residue of the parent node as the residue of this (empty) row
      if (d >= nodes.length) throw 'invalid parent node ' + d;
      // add a new row
      currRow = [d];
      residues.push(residues[currRowIndex]);
      currRowIndex = rows.length;
      rows.push(currRow);
    } else if(isNum(d) && d < 0) {
      // Negative numbers means the target is a row.
      // Modify currRowIndex to -d and update currRow, too.
      if (-d >= rows.length) throw 'invalid row ' + d;
      currRow = rows[-d];
      currRowIndex = -d;
    } else {
      // Non-number means we're adding a value. Often, it's an object.
      // nodeToRowMap stays in lockstep with nodes, making it easy to find a node within the row structure.
      nodeToRowMap.push([currRowIndex, currRow.length]);
      if (updateResidues) updateResidueAndSummary(d);
      currRow.push(d);
      nodes.push(d);
      // residues.push(d);
    }
    return true;
  }

  function updateResidueAndSummary(d){
    if (d=== '') return;
    // Update caches for residue and summary.
    // This also serves as validation - messages are validated against previous residue!
    // Since messages modify residue, combine is what rich hickey termed a "transducer" -
    // a reducer that changes during the reduction.
    const core = residues[currRowIndex];
    try {
      const newCore = rowReducer(core, d);
      residues[currRowIndex] = newCore;
      console.log('d', d, '\n', 'before:', core, '\n', 'after', newCore);
      // summary = residues.reduce(summaryReducer, summaryResidue);
    } catch (e) {
      const msg = `cannot combine op ${JSON.stringify(d)} with core ${core}`
      e = Object.assign(e, {msg});
      throw e;
    }
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
        const msg = `cannot combine op ${JSON.stringify(op)} op i ${opi} at branch i ${branchi} and core ${JSON.stringify(core)}`
        e = Object.assign(e, {msg});
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
export {stree}
