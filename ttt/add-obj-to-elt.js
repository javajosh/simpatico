function createProcess(initialState, elt){
  let state = initialState;
  //assert something about elt.
  return function process(state, msg){
    state = combine(state, msg);
    render(state, elt);
    return state;
  }
}


function combine(state, msg){
  return Object.assign({}, state, msg);
}

function render(state, elt){
  console.log(state, elt); //temporary
  elt.innerHTML= JSON.stringify(state); //if state is an object...
  return Object.assign(elt, state);
}

const START = {
  started: Date.now(),
}

let p1 = process({}, START, document.getElementById('foobar'));
p