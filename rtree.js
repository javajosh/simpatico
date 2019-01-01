function rTree(residue = {}, combine = Object.assign) {
  const nodes = [{}];
  const branches = [];
  const residues = [{}];

  let target = 0;
  
  const move = (nodeCode) => {
    if (!int(nodeCode)) throw `nodeCode should be an int, but '${nodeIndex}' wasn't`;

    if (nodeCode <= 0){
      if (!between(nodeCode, 0, branches.length)){
        throw `branch nodeCode ${nodeCode} outside allowed interval (-${branches.length},0] [-branches.length,0]`
      }
      target = branches[-nodeCode]; //so, negative codes point to a branch;
    } else if (between(nodeCode, 1, nodes.length)){
      target = nodeCode //positive codes point to a node
    } else {
      throw `nodeCode out of bounds ${parent}; use negative numbers for branches`;
    }
  };
  const add = (node) => {
    if (target === nodes.length - 1)
    nodes.push(node);
    relations.push
    measurements.push({t: Date.now() , measurement});
    state = num(measurement) ? combine(state, m);
  };

  return {add, state};
}

// Push with an optional parent. If given (and not eq arr.len-1) then wrap the payload in
// an array of length two. This implies that we cannot/should not support arrays as raw payloads
// which is fine because I only see this as needing numbers and objects.
function push2(arr, payload, branches, parent){
  if (int(parent)) arr.push([arr[parent], payload])
  const node = parent ? {payload, branches}
  arr.push(parent ? [parent, payload] : payload)
}

let a = rTree();
// play in dev console.
a.add()

// const load = () => {return window.localStorage.get('')};
// const save = data => {};
