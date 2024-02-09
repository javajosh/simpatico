import { combineReducer } from './combine.js';

// TODO support using node references in addition to indices
const stree = (startValue = {}, reducer = combineReducer) => {
  const ROOT = {
    id: 0,
    time: Date.now(),
    branch: 0,
    parent: null,
    children: [],
    value: startValue,
    residue: startValue,
  };

  let focus = 0;
  const ms = [ROOT];
  const branches = [ROOT];


  const getFocus = () => focus;
  const read = () => (focus > 0) ? ms[focus] : branches[-focus];
  const residue = () => read().residue;
  const getResidues = () => branches.map(branch => branch.residue);
  const setFocus = i => {
    if ( (-branches.length - 1 <= i) || (i <= ms.length - 1)){
      focus = i;
      return read();
    } else {
      throw 'Invalid focus value ' + i;
    }
  };

  const add = (value, newFocus=focus) => {
    // create the new message
    const parent = (newFocus === focus) ? read() : setFocus(newFocus);
    const residue = reducer(parent.residue, value);
    const branch = (focus <= 0) ? parent.branch : -branches.length;
    const m = {
      id: ms.length,
      time: Date.now(),
      children: [],
      branch,
      parent,
      value,
      residue,
    };
    parent.children.push(m);

    const existingBranch = branch === parent.branch;
    if (existingBranch){
      branches[-branch] = m;
      // delete parent.residue; // save some memory
    } else { // new branch
      focus = -branches.length;
      branches.push(m);
    }

    ms.push(m);
    return m;
  }



  return {setFocus, getFocus, read, residue, add, ms, branches, getResidues};
}
export {stree}
