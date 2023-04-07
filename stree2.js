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
    const targetingNode = isNum(d) && d >= 0;
    const targetingRow = isNum(d) && d < 0;

    if (targetingNode){
      if (d >= nodes.length) throw 'invalid parent node ' + d;
      // add a new row
      currRowIndex = rows.length;
      currRow = [d];
      rows.push(currRow);
      // create a residue for the new row
      residues.push(residueForNode(d));
    } else if(targetingRow) {
      if (-d >= rows.length) throw 'invalid row ' + d;
      // update row and row index
      currRow = rows[-d];
      currRowIndex = -d;
    } else {
      // d is data, so add it to nodes[], currRow[] and other data-structures.
      nodeToRowMap.push([currRowIndex, currRow.length]);
      currRow.push(d);
      nodes.push(d);
      updateResidueAndSummary(d);
    }
    return true;
  }

  /**
 *   Update caches for residue and summary.
     This also serves as validation - messages are validated against previous residue!
     Since messages modify residue, combine is what rich hickey termed a "transducer" -
     a reducer that changes during the reduction.

   * @param d
   */
  function updateResidueAndSummary(d){
    const prevResidue = residues[currRowIndex];
    let newResidue;
    try {
      newResidue = rowReducer(prevResidue, d);
    } catch (e) {
      const msg = `cannot combine op ${JSON.stringify(d)} with core ${core}`
      e = Object.assign(e, {msg});
      throw e;
    }
    residues[currRowIndex] = newResidue;
    summary = residues.reduce(summaryReducer, summaryResidue);
    console.log('stree2.hs:updateResidueAndSummary()', 'd', d, '\n', 'prevResidue:', prevResidue, '\n', 'newResidue', newResidue, '\n', 'summary', summary, '\n', 'residues', residues);
  }


  const branchTips = () => rows.map(row => {
    let node = peek(row);
    return nodes.indexOf(node);
  });

  // Prepend partial rows until root.
  function rowToBranch(row) {
    let result = [...row], partial = [...row], nodei;
    while (isNum(result[0])) {
      nodei = result.shift();
      partial = getPartialRow(nodei);
      result = [...partial, ...result]; // this is incredibly wasteful compared to the linked node approach
    }
    return result;
  }

  function residueForNode(nodei) {
    return rowToBranch(getPartialRow(nodei)).reduce(rowReducer, rowResidue);
  }

  const branches = () => rows.map(rowToBranch);

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
    allBranchesReachable,
    residueForNode,
    rows,
    nodes,
    residues,
    summary,
    branches,
    branchTips,
  };
}
export {stree}
