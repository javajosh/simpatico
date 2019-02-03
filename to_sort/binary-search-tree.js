const root = {d: 8}

const add = (parent, d) => {
  if(d < parent.d) 
    if (parent.left)
      add(parent.left, d)
    else
      parent.left={d, parent}
  if(d > parent.d) 
    if (parent.right)
      add(parent.right, d)
    else
      parent.right={d, parent}
  if(d===parent.d) return
}

const print = (node) => {
  /* It's a state machine! One move leads to other possibilities.
    move = L
    L -> L || UR
    UR -> P && (R || UR)
    R -> L || R || UL
    UL -> UR
  */
  let move = 'L';
  
  while(node){
    console.log(node.d, move);
    const L = !!node.left, R = !!node.right, 
          UR = node.parent && node.parent.d > node.d,
          UL = node.parent && node.parent.d < node.d;
          
    if (move === 'L'){
      if (L) {
        node = node.left
      } if (UR) {
        node = node.parent;
        move = 'UR';
      } else {
        node = null;
      }
    } else if (move === 'UR'){
      console.log(node.d);
      if (R){
        node = node.right;
      } else if (UR){
        node = node.parent;
        move = 'UR';
      } else {
        node = null;
      }
    } else if (move === 'R'){
      if (L){
        node = node.left;
        move = 'L'
      } else if (R){
        node = node.right;
      } else if (UL){
        node = node.parent;
        move = 'UL';
      } else {
        node = null;
      }
    } else if (move === 'UL'){
      if (UR){
        node = node.parent;
        move = 'UR';
      } else {
        node = null;
      }
    } else {
      node = null;
    }
  }
}

add(root, 6);
add(root, 7);
add(root, 8);
add(root, 9);
console.log(root);
print(root)