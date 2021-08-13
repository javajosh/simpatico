import {now, as}  from './core.js';
import combine from './combine.js';


export default (startValue= {}, reducer = combine) => {
  const ROOT = {
    id: 0,
    time: now(),
    branch: 0,
    parent: null,
    children: [],
    value: startValue,
    residue: startValue,
  };

  const ms = [ROOT];
  const branches = [ROOT];
  let focus = 0;

  const getFocus = () => focus;
  const read = () => (focus > 0) ? ms[focus] : branches[-focus];
  const residue = () => read().residue;
  const setFocus = i => {
    as.between(-branches.length - 1, ms.length - 1 , i);
    focus = i;
    return read();
  };

  const add = (value) => {
    const parent = read();
    const residue = reducer(parent.residue, value);
    const branch = (focus <= 0) ? parent.branch : -branches.length;

    const m = {
      id: ms.length,
      time: now(),
      children: [],
      branch,
      parent,
      value,
      residue,
    };
    // TODO: check that no sibling ms have the same value.
    parent.children.push(m);

    if (branch === parent.branch){
      branches[-branch] = m;
    } else {
      focus = -branches.length;
      branches.push(m);
    }

    ms.push(m);
    return m;
  }
  return {setFocus, getFocus, read, residue, add, ms, branches};
}
