function rTree(residue = {}, combine = Object.assign) {
  const INIT = {t:Date.now(), type: 'INIT'};
  const measurements = [];
  let pos = 0;
  let state = {};
  
  const move = (parent) => ();
  const add = (measurement) => {
    measurements.push({t: Date.now() , measurement});
    state = num(measurement) ? combine(state, m);
  };

  return {add, state};
}

let a = rTree();
// play in dev console.
a.add()

// const load = () => {return window.localStorage.get('')};
// const save = data => {};
