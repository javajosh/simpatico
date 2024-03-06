import {stringifyWithFunctions, parseWithFunctions} from "./core.js";
import {combineRules} from "./combine.js";

/**
 * Create a serializable n-ary tree with a well defined reduction defined on all nodes.
 *
 * @param value if an array or string, reconstitute stree from contents. if other, use as root.
 * @param reducer reducer used to compute the residue of a node. default is combine
 * @param summarize an optional function that updates summary based on the new node
 * @returns {[]|string|*}
 */
function stree(value = {}, reducer = (a,b) => combineRules(a,b,null,true), summarize) {
  // handle special values, array and string, for deserialization initialization
  if (Array.isArray(value)) {
    return fromArray(value, reducer);
  }
  if (typeof value === 'string'){
    return fromString(value, reducer);
  }

  let summary;

  const root = {value, parent: null, residue: value, branchIndex: 0, id: 0, leaf:true,
    add:      a =>add(a, root),
    addAll:   a =>addAll(a, root),
    addLeaf:  a =>addLeaf(a, root),
    addLeafs: a =>addLeafs(a, root),
    getLeaf: () =>getLeaf(root),
    summary,
  };
  const branches = [root];
  const nodes = [root];
  let lastNode = root;
  if (summarize) summary = summarize(null, root);
  /**
   * Add a value to an n-ary tree.
   * Return the node that wraps these parameters.
   * Updates branches[] and lastNode
   * The parent can be specified as either a node or an index into nodes.
   * If the reducer is not commutative (combine isn't), the order of the children matters.
   * If the reducer fails (throws), the node is not added and the lastNode is not updated.
   *
   * @param value The value associated with the node. Set to lastNode for future calls. Note that it will be Object.freeze'd
   * @param parent The node considered as a parent. Can be null for root. If it's an integer, treated as index of parent in nodes
   * @returns {{parent, value, value}}
   */
    function add(value, parent = lastNode) {
      if (typeof parent === 'number'){
        parent = nodeByNumber(parent);
      }
      Object.freeze(value);
      const node = {value, parent, //residue, branchIndex, and id added below
        add: a =>add(a, node),
        addAll: a =>addAll(a, node),
        addLeaf: a =>addLeaf(a, node),
        addLeafs: a => addLeaf(a, node),
        getLeaf: () => getLeaf(node),
        summary,
      };

      if (parent.leaf) {
        node.residue = reducer(parent.residue, node.value);
        // Move msgs up to the stree node to not interfere with future residues.
        if (node.residue.msgs){
          node.msgs = node.residue.msgs;
          delete node.residue.msgs;
        }
        node.branchIndex = parent.branchIndex;
        // replace branch node
        branches[parent.branchIndex] = node;
        node.leaf = true;
        parent.leaf = false;
        // delete parent.residue; //deleting saves some memory and time computing residue. it also presence also signals "branchness".
      } else {
        node.residue = residue(node);
        node.branchIndex = branches.length;
        node.leaf = true;
        branches.push(node);
      }

      if (summarize) summary = summarize(summary, node);

      lastNode = node;
      node.id = nodes.length;
      nodes.push(node);
      return node;
    }

    function addAll(arrValue, parent = lastNode){
      if (typeof parent === 'number'){
        parent = nodeByNumber(parent);
      }
      for (value of arrValue){
        parent = add(value, parent)
      }
      return parent;
    }

    /**
     * Add a value as a leaf of the branch containing node
     * @param value
     * @param node
     */
    function addLeaf(value, node){
      const parent = branches[node.branchIndex];
      return add(value, parent);
    }
    /**
     * Add several values as a leaf of the branch containing node
     * @param value - an array of values
     * @param node
     */
    function addLeafs(values, node){
      const parent = branches[node.branchIndex];
      return addAll(values, parent);
    }
    function getLeaf(node){
      return branches[node.branchIndex];
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
    if (typeof node === 'number'){
      node = nodeByNumber(node);
    }
    return node.residue ? node.residue : nodePath(node).map(n => n.value).reduce(reducer);
  }

  function residues() {
    return branches.map(a => a.residue);
  }

  function nodeByNumber(num){
    let node;
    if (num === Number.POSITIVE_INFINITY){
      node = branches[0];
    } else {
      node = num >= 0 ? nodes[num] : branches[-num];
    }
    return node;
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
    const s = stree(arr[0], reducer);
    let value, parent;
    for (let i = 1; i < arr.length; i++) {
      value = arr[i];
      if (typeof value === 'number'){
        parent = s.nodeByNumber(value);
        value = arr[++i]; // note the index skip
        s.add(value, parent);
      } else {
        s.add(value);
      }
    }
    return s;
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
        arr.push(currNode.parent.id)
      }
      arr.push(currNode.value);
      prevNode = currNode;
    }
    return arr;
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


  return {add, addAll, nodePath, residue, residues, toArray, toString, nodeByNumber, branches, nodes, root, summary};
}



export {stree}
