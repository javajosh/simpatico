import {stringifyWithFunctions, parseWithFunctions, peek} from "./core.js";
import {combineReducer} from "./combine2.js";

/**
 * A serializable n-ary tree with a well defined reduction defined on all nodes.
 *
 * @param value if an array or string, reconstitute stree from contents. if other, use as root.
 * @param reducer reducer used to compute the residue of a node. default is combineReducer
 * @returns {[]|string|*}
 */
function stree3(value, reducer = combineReducer) {
  if (Array.isArray(value)) {
    return fromArray(value, reducer);
  }
  if (typeof value === 'string'){
    return fromString(value, reducer);
  }
  const root = {value, parent: null};
  const branches = [root];
  const nodes = [root];
  let lastNode = root;
  // initialize the branchResidue cache
  const branchResidues = [root.value];

  /**
   * Add a value to an n-ary tree.
   * Return the node that wraps these parameters.
   * Updates both branches[] and lastNode
   * The parent can be specified as either a node or an index into nodes.
   * If the reducer is not commutative, the order of the children matters.
   * If the reducer fails (throws), the node is not added and the lastNode is not updated.
   *
   * @param value The value associated with the node. Set to lastNode for future calls. Note that it will be Object.freeze'd
   * @param parent The node considered as a parent. Can be null for root. If it's an integer, treated as index of parent in nodes
   * @returns {{parent, value}}
   */
  function add(value, parent = lastNode) {
    if (typeof parent === 'number'){
      parent = nodes[parent];
    }
    Object.freeze(value);
    const node = {value, parent};

    // add or update branch residue
    const branchIndex = branches.indexOf(parent);
    if (branchIndex === -1) {
      // add a new residue first so that residue isn't tricked into using the residue cache
      branchResidues.push(residue(node));
      branches.push(node);
    } else {
      branches[branchIndex] = node;
      // update the old residue - this operation is cheaper than recomputing the residue using nodePath
      branchResidues[branchIndex] = reducer(branchResidues[branchIndex], value);
    }

    // update local state and return
    lastNode = node;
    nodes.push(node);
    return node;
  }

  /**
   * The array of all nodes from root to the specified node, inclusive.
   *
   * @param node The node to start with
   * @returns {*[]} An array of nodes between `node` and root, inclusive
   */
  function nodePath(node = lastNode) {
    let nodePath = [node];
    while (node.parent) {
      nodePath.push(node.parent);
      node = node.parent;
    }
    return nodePath.reverse();
  }

  /**
   * The residue of a node is the reduction of the path from root to the node.
   *
   * @param node
   * @returns {*}
   */
  function residue(node = lastNode) {
    // check if the node is a branch, and if so return the cached residue rather than recomputing it.
    const residueIndex = branches.indexOf(node);
    if (residueIndex === -1){
      return nodePath(node).map(n => n.value).reduce(reducer, value);
    } else {
      return branchResidues[residueIndex];
    }

  }

  /**
   * Return a representation of the n-ary tree as [{}, {}, 0, {}, {}].
   * The objects are values, and the integers parent node indexes.
   *
   * The inverse of fromArray()
   * Example: [{a: 0}, {a: 1}, {a: 2}, {a: 3}, 1, {a: 4}];
   *
   * @returns {[{}|number]}
   */
  function toArray() {
    const arr = [root.value];
    let prevNode = root;
    let currNode = root;
    for (let i = 1; i < nodes.length; i++) {
      currNode = nodes[i];
      if (currNode.parent !== prevNode){
        arr.push(nodes.indexOf(currNode.parent))
      }
      arr.push(currNode.value);
      prevNode = currNode;
    }
    return arr;
  }

  /**
   * Produce an stree from the given array.
   * The inverse of toArray().
   * private
   *
   * @param arr where number types are treated as parent node index.
   * @param reducer
   * @returns a new stree
   */
  function fromArray(arr, reducer) {
    const stree = stree3(arr[0], reducer);
    let value, parent;
    for (let i = 1; i < arr.length; i++) {
      value = arr[i];
      if (typeof value === 'number'){
        parent = stree.nodes[value];
        value = arr[++i]; // note the index skip
        stree.add(value, parent);
      } else {
        stree.add(value);
      }
    }
    return stree;
  }

  /**
   * Compute a string representation of the stree, including function bodies as strings
   * inverse is fromString().
   *
   * @returns {string} a string representation of the stree, including function bodies as strings.
   */
  function toString() {
    return stringifyWithFunctions(toArray());
  }

  /**
   * Reconstitute the stree from a string representation.
   * inverse is toString().
   * private.
   *
   * @param str
   * @param reducer
   * @returns stree
   */
  function fromString(str, reducer){
    return fromArray(parseWithFunctions(str), reducer);
  }

  return {add, nodePath, residue, toArray, toString, branches, nodes, root};
}

export {stree3}
