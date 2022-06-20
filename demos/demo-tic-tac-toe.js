import rtree from '../rtree.js';
import {combine} from '../combine.js';
import {validate} from "../friendly";
import C from '../core';

const {assert, assertThrows} = C.asserts;

// The simplest tictactoe implementation
let t3 = rtree({
    turn: 1,
    moves: [],
    winner: -1,
  }, combine, true,
  r=>`msgs:${r.msgs.length} turn:${r.turn} winner:${r.winner}` //summarize function to help t3.print()
);
t3.add({
  name: 'move',
  example: {handler: 'move', val: 8},
  pattern: {val:['between', 0, 8]},
  handle: function (ctx, msg) {
    assert(ctx.winner === -1, `Game already won by player ${ctx.winner}!`);
    const failures = validate(this.pattern, msg);
    const move = msg.val;
    // TODO: add this to pattern, add includes to predicates.
    assert(!ctx.moves.includes(move));
    return [{turn: 1}, {moves: move}, {handler: 'computeWinner'}];
  },
});

/*0 1 2
  3 4 5
  6 7 8*/
t3.add({
  name: 'computeWinner',
  example: {handler: 'computeWinner'},
  desc: 'find the winner using regular expressions',
  winConditions: '012-345-678-036-147-258-048-246'.split('-'),
  handle: function(ctx, msg){
    if (ctx.winner !== -1) return;
    // Odd moves are for player one, even for player two
    const p0 = ctx.moves.filter((move, i) => i % 2 - 1).sort().join('');
    const p1 = ctx.moves.filter((move, i) => i % 2).sort().join('');
    for (const pattern of this.winConditions){
      if (p0.match(pattern)) return {winner: 1};
      if (p1.match(pattern)) return {winner: 2};
    }
  }
});

const makeMove = (game, move) => game.add({handler: 'move', val:move});
const makeMoves = (game, moves) => moves.forEach(move => makeMove(game, move));

makeMoves(t3, [0,3,1,8,2]);
// Game is won, so no more moves are allowed.
assertThrows(()=>makeMove(t3, 7));
