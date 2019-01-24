function createGame(initialState, debug = true){
  const X = 1, O = 2;
  const board = initialState || [[0,0,0],[0,0,0],[0,0,0]];
  let turn = true;
  let count = 0;
  
  const getCurrentPlayer = () => turn ? X : O;
  const place = (x,y) => {
    board[x][y] = getCurrentPlayer(); 
    turn = !turn;
  }
  const isSpotAvailable = (x,y) => board[x][y] === 0;
  const getBoard = () => board;
  const getWinner = (board) => {
    
    return null;
  };
  const move = (x,y) => {
    if (getWinner()) throw new Error(`Someone already won!`);
    if (!isSpotAvailable(x,y)) throw new Error(`Move not available [${x},${y}]!`);
    place(x,y);
    if (debug) console.log(count++, board);
  }
  if (debug) console.log(count++, board);
  return {move, getCurrentPlayer, getBoard}
}

const g1 = createGame();
g1.move(0,0); 
g1.move(0,1);


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

const R = [0,1], D=[1,0], A=[1,1], B=[-1,1];
const add = (a,b) => [a[0]+b[0], a[1]+b[1]];
const get = (arr, pos) => arr[pos[0], pos[1]];
const all = (arr) => arr.reduce((a,b) => (a !== null && a===b) ? a : false, arr[0]);
console.log('add', add([1,2], [3,4]));
console.log('get', [2,5,1], [1,1])

const pos = [0,0];
const line = [0,0,0];
let spot = get(board, pos);


