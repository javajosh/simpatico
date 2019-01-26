// The createGame function returns the functions needed to examine and change the state.
// The state itself is stored in a closure. A nice property if you were to remove the wrapper
// you would still have (one) working game. The wrapper allows you to create more than
// one game.
function TicTacToe(initialState, debug = true){
  const X = 1, O = 2;
  const board = initialState || [[0,0,0],[0,0,0],[0,0,0]];
  let turn = debug ? true : Math.random() > .5;
  let count = 0;
  
  const getCurrentPlayer = () => turn ? X : O;
  const place = (x,y) => {
    board[x][y] = getCurrentPlayer(); 
    turn = !turn;
  }
  const isSpotAvailable = (x,y) => board[x][y] === 0;
  const getBoard = () => board;
  const getWinner = getWinner0;
  
  const move = (x,y) => {
    if (getWinner(getBoard(), [x,y])) throw new Error(`Someone already won!`);
    if (!isSpotAvailable(x,y)) throw new Error(`Move not available [${x},${y}]!`);
    place(x,y);
    if (debug) console.log(count++, getCurrentPlayer(), board);
  }
  if (debug) console.log(count++, board);
  return {move, getCurrentPlayer, getBoard}
}

// The simplest is to list all possibilities.
// The coolest is to use a magic square.
// The best is to express what "in a line" means.
// A good compromise is to breakdown the check into 3 phases
function getWinner0(board){
  return null;
}
function getWinner1(board){
  //phase 1, check across
  let start = null;
  let curr = null;
  let fail = false;
  for (let row in board){
    start = row[0];
    for(let i = 1; i < row.length; i++){
      curr = row[i];
      if (start !== row){
        fail = true;
        break;
      }
    }
    if (!fail) return start;
    
    start = null;
    curr = null;
    fail = false;
  }
}

// Generally useful functions on arrays.
const zip = (a, b) => a.map((d, i) => [d, b[i]]);
const add = (a, b) => zip(a,b).map(d => d[0] + d[1]);
const dot = (a, b) => zip(a,b).map(c => d[0] * d[1]);
const mul = (arr, c) => arr.map(d => d * c);
const addc = (arr, c) => arr.map(d => d + c);
// These functions on arrays return scalars
const get = (arr, pos) => pos.length ? get(arr[pos.shift()], pos) : arr;
const all = (arr) => arr.reduce((a,b) => (a !== null && a===b) ? a : false, arr[0]);
const eq  = (a, b) => a.length === b.length && all(zip(a,b).map(d => d[0] === d[1]));
const peek = (arr) => arr[arr.length-1];
// This is a very simple curry for two variables. Pareto principal!
const curry = (f, a) => b => f(a,b);
const compose = (f, g) => a => f(g(a))

// Some fast and dirty tests
console.log('add', add([1,2], [3,4]));
console.log('get', [[0,0],[0,3]], [1,1], get([[0,0],[2,4]], [1,0]));
console.log('all', all([true, true, true]), all([true, false, true]));
console.log('eq', all([1,2,3], [1,2,3]))

// Empty isn't used, but it turns out this string is really handy
const empty = [
  [[],[],[]],
  [[],[],[]],
  [[],[],[]]
];
// These are directional increments for 2D array
const dirs = [
  [[-1,-1],[0,-1],[1,-1]],
  [[-1, 0],[0, 0],[1, 0]],
  [[-1, 1],[0, 1],[1, 1]]
];
// We name them for convenience
const [
  [NW,N,NE],
  [W ,O, E],
  [SW,S,SE]
] = dirs;
console.log('Origin', O, 'N', N,'NW', NW, 'SE', SE);

// At this point we could implement the algorithm in a number of ways.
// With this stuff we can implement three phase solution in a declarative way
function getWinner2(board){
  const groups = {
    across: dirs,
    down: [[NW,W,SW],[N,O,S],[NE,E,SE]],
    diag: [[NW,O,SE], [NE,O,SW]],
  };
  // Is this really more readbale than just defining a lambda in map? You tell me...
  const getFromBoard = curry(get, board);
  for (let group in groups){
    for (let slice of group){
      const values = slice.map(getFromBoard);
      if (all(values)) return values[0];
    }
  }
}

// It's kind of annoying to have to build groups by hand, so let's automate that.
// Lets also optimize a little by only computing from the last move.
function getWinner3(board, move){
  const getFromBoard = curry(get, board);
  
  for (let group in groups){
    for (let slice of group){
      const values = slice.map(getFromBoard);
      if (all(values)) return values[0];
    }
  }
}


// We use native coordinates here, such that the 'leaf' arrays contain the coordinate of the array itself.
// The natural coordinates use only -1, 0 and 1 which can be obtained by subtracting 1 from every scalar.
const sketch = [
  [],
  [0],
  [[0]],
  [[0],[1]],
  [[0],[1],[2]], // 1-D 
  [ //2-D
    [[0,0],[1,0],[2,0]],
    [[0,1],[1,1],[2,1]],
    [[0,2],[1,2],[2,2]]
  ],
  [ //3-D
    [
      [[0,0,0],[1,0,0],[2,0,0]],
      [[0,1,0],[1,1,0],[2,1,0]],
      [[0,2,0],[1,2,0],[2,2,0]]
    ],
    [
      [[0,0,1],[1,0,1],[2,0,1]],
      [[0,1,1],[1,1,1],[2,1,1]],
      [[0,2,1],[1,2,1],[2,2,1]]
    ],
    [
      [[0,0,2],[1,0,2],[2,0,2]],
      [[0,1,2],[1,1,2],[2,1,2]],
      [[0,2,2],[1,2,2],[2,2,2]]
    ],
  ]
];

const copy1 = a => [...a];
const copy2 = a => a.slice();
const copy3 = a => JSON.parse(JSON.stringify(a));

console.log('copy1', copy1([1,2]), 'copy2', copy2([1,2]), 'copy3', copy3([1,2,[3,4]]));

// Okay so the basic idea is to copy the first element, then append and modify the copy.

let spot = [];
let clone;

let row = [];
for (let i = 0; i <= 2; i++){
  clone = copy3(spot);
  clone.push(i);
  row.push(clone);
}
console.log('row', JSON.stringify(row));

let board = [];
for (let i = 0; i <= 2; i++){
  clone = copy3(row);
  clone.map(spot => spot.push(i));
  board.push(clone);
}
console.log('board', JSON.stringify(board));

let cube = [];
for (let i = 0; i <= 2; i++){
  clone = copy3(board);
  clone.map(row => row.map(spot => spot.push(i)));
  cube.push(clone);
}
console.log('cube', JSON.stringify(cube));

let hypercube = [];
for (let i = 0; i <= 2; i++){
  clone = copy3(cube);
  clone.map(board => board.map(row => row.map(spot => spot.push(i))));
  hypercube.push(clone);
}
console.log('hypercube', JSON.stringify(hypercube));

let hyperhypercube = [];
for (let i = 0; i <= 2; i++){
  clone = copy3(hypercube);
  clone.map(cube => cube.map(board => board.map(row => row.map(spot => spot.push(i)))));
  hyperhypercube.push(clone);
}
console.log('hyperhypercube', JSON.stringify(hyperhypercube));

// So we are driving to a function that takes a dimensional parameter and builds
// a board of that dimension. Rather than name the dimensions, we can give them numbers,
// Then each dimension is used in subsequent dimensions, as is the map expression via compose.
// We might save some trouble by being smart about the zeroeth element here.

// const boards = [];
// const mappers = [];
// boards.push([]);
// mappers.push((spot, i) => spot.push(i));

// function nextBoard(){
//   const prevBoard = peek(boards);
//   const prevMapper = peek(mappers);
//   const board = [];
//   const mapper = a => a.map(prevMapper);
//   for (let i = 0; i <= 2; i++){
//     const clone = copy3(prevBoard);
//     prevMapper(clone);
//     next.push(clone);
//   }
//   boards.push(next);
// }

// Anyway, which spots are adjacent to a given spot? And how do we represent them?
// "Adjacent" means connected which means every spot off-by-one, or some combination of 
// off by one. The center of each board is maximally adjacent. For dimension N you have
// 3^N spots and the center has 3^N - 1 adjacents. For a normal board, that's 8. 
// The corner can be thought of as that minus the unreachables. So, our procedure for
// finding adjacency is assuming we're the center spot and then checking all possible offsets.
// A simple way to do this is to copy the board, then translate it to put our desired spot 
// in the center, then eliminate all spots that have an invalid address. What remains 
// are adjacent spots. An invalid addres is one that contains, in our case, outside of [0,2]

// Let's start with the 2-D case, for concreteness.

// // const adjacents(pos){ // pos is natural, 
//   // First, move the board to the center
//   add(board, [-1,-1]);
//   // Second, move to pos
//   add(board, pos);
// }






console.log('everything worked!')


