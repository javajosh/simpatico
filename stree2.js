import {combine, combineReducer} from './combine2.js'

const DEBUG = false;
// Utilities I could take from core but I want to keep this file standalone.
// Note that the combine imports above are only used for default parms and can be easily removed.
const isNum = d => Number.isInteger(d);
const peek = (arr) => {
  if (arr.length === 1) return arr[0];
  return arr[arr.length - 1];
}

/**
 * An stree arranges messages in a tree structure, where each message is a branch, and each branch is a row.
 * The tree is represented as an array of rows, where each row is an array of nodes.
 * Operations have a stateless and stateful version with the stateful version being the default, faster, and less reliable.
 *
 * The primary mutation operation is "add".
 * The most interesting query operation is "branches", which returns the tree as an array of arrays of nodes,
 * and residues which maps each branch to a reduction of the messages in the branch.
 * The most convenient way to check state is with the `assertionsHandler`.
 *
 * @param ops An array that describes the tree. If an element is a number, it is a node index. If it is a negative number, it is a row index. Otherwise, it is a message to be handled.
 * @param rowReducer The reduction function that combines messages in the row to produce a new core.
 * @param rowResidue The starting value to use for the residue of the first row.
 * @returns {{add: (function(*=): boolean), nodes: *[], residueForNode: (function(*=): *), residues: {}[], rows: *[][], branches: (function(): *[][]), branchTips: (function(): number[]), allBranchesReachable: (function(*=): boolean)}}
 */
function stree(
  ops = [{}],
  rowReducer = combineReducer,
  rowResidue = {},
) {
  const rows = [[]];
  const nodes = [];
  const residues = [rowResidue];
  let currRow = rows[0];

  // Support cheap(er) creation of branch state from row state
  // Given a node index, give me the row that contains the node up to the node.
  // We can do this statelessly with indexOf, but this is much faster.
  let currRowIndex = 0;
  let nodeToRowMap = [];
  const getPartialRow = (nodei) => {
    const [rowi, coli] = nodeToRowMap[nodei];
    const row = rows[rowi];
    return row.slice(0, coli + 1); // tricky: slice does not include the last elt!
  }

  addAll(ops);

  //Add each op, and rethrow any errors including the index of the op
  function addAll(ops){
    ops.forEach((op, opi) => {
      try {
        add(op);
      } catch (e) {
        const msg = `cannot add op ${JSON.stringify(op)} op i ${opi}`;
        e = Object.assign(e, {msg});
        throw e;
      }
    });
  }

  function add(d) {
    const targetIsNode = isNum(d) && d >= 0;
    const targetIsRow = isNum(d) && d < 0;

    if (targetIsNode){ // and we're gonna make a new row, a new branch
      if (d >= nodes.length) throw 'invalid parent node ' + d;
      currRowIndex = rows.length;
      currRow = [d];
      rows.push(currRow);
      const branch = branchForNode(d);
      const residue = branch.reduce(rowReducer, rowResidue);
      residues.push(residue);
    } else if (targetIsRow) { // and we're gonna to point currRow to new row, and wait for the next add() call.
      if (-d >= rows.length) throw 'invalid row ' + d;
      currRow = rows[-d];
      currRowIndex = -d;
    } else { // d is data, so add it to nodes[], currRow[] and other data-structures.
      nodeToRowMap.push([currRowIndex, currRow.length]);
      currRow.push(d);
      nodes.push(d);
      residues[currRowIndex] = computeNewResidue(d, residues[currRowIndex]);
    }
    return true;
  }

  /**
   * Update caches for residue.
   * This also serves as validation - messages are validated against previous residue!
   * Since messages modify residue, combine is what rich hickey termed a "transducer" -
   * a reducer that changes during the reduction.
   * @param d
   * @param prevResidue
   */
  function computeNewResidue(d, prevResidue){
    let newResidue;
    try {
      // all kinds of things can go wrong.
      newResidue = rowReducer(prevResidue, d);
    } catch (e) {
      const msg = `cannot combine op ${JSON.stringify(d)} with core ${prevResidue}`
      e = Object.assign(e, {msg});
      throw e;
    }
    if (DEBUG) console.debug(
      'stree2.hs:updateResidueAndSummary()', 'd', d, '\n',
      'prevResidue:', prevResidue, '\n',
      'newResidue', newResidue, '\n',
    );
    return newResidue;
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
      result = [...partial, ...result]; // this is very wasteful compared to the linked node approach
    }
    return result;
  }

  function branchForNode(nodei) {
    return rowToBranch(getPartialRow(nodei));
  }

  const branches = () => rows.map(rowToBranch);

  // Return true if the given core can reach all points on all branches of this tree.
  const allBranchesReachable = (core) => branches().every((branch, branchi) => {
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

  return {
    add, addAll,
    allBranchesReachable,
    branchForNode,
    rows,
    nodes,
    residues,
    currRowIndex,
    branches,
    branchTips,
  };
}
export {stree}
