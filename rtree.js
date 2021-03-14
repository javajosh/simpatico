import * as Core from './core.js';
import * as Combine from './combine.js';

const {ARR} = Core.default.preds;
const {assert} = Core.default.asserts;
const {peek} = Core.default.arrays;
const {now} = Core.default.utils;
const {combine} = Combine.default;

/** Docs
 This rtree is implemented with arrays.
 The data-structure looks like this:

 0 - 0 1 2 3 8 {}
 1 - 2 4 5 {}
 2 - 6 7 {}
 focus: 0

 The first column is the row number (included for readability)
 The next number is the parent node for the row.
 The next numbers indicate the values in the order they came in.
 The last object is the residue of the row all the way back to root.

 For example, row 1 {} is ∫[0 1 2 4 5], and row 2 {} is ∫[0 1 2 6 7]

 The RTree has a mutable state, the focus, which determines what happens on the next add.

 The focus can be on any node, using its index "i". Note that this implies that focus and input events happen in a set order, on the same timeline. We could make an arbitrary distinction between strings and numbers, and imagine a single timeline in which they are interleaved, giving rise to a peculiar, but quite compact (and useful) representation of a Tree. In this sense it can be seen as a reduction, or a folding of a list that looks like (a, b, c, 0, d, e, 1, f...) into something that looks like:

 Which in turn represents a tree with 3 branches.

 abc
 ade
 bf

 (One clever thing to do (possibly too clever!) is to target either an index or a row by using the negative coordinates to correspond to rows. This would make a very compact focus interface, 2D that takes only 1 integer!)

 Row focus is just a number. This is the default.
 Branching focus is an array: [row,col] or [node]

 row ={row, parent, values, residue}

 */
export const rtree = (startValue={}) => {
  let focus = 0;
  const ROOT = {id:0, branch:0, parent: null, value: startValue, time:now(), children:[], residue:startValue};
  const measurements= [ROOT];
  const branches = [ROOT];

  const setFocus = (index) => {read(index); focus=index}; //if the read doesn't throw, it's a good index.
  const getFocus = ()=>focus;
  // Focus is a split coord system with measurements being positive, branches being negative, and branch getting zero. This means that you cannot set focus to the root node, even though it's there. (You can still get to it from measurements[0])
  const read = (index=focus) => (index <= 0) ? branches[-index] : measurements[index];
  const add = (value) => {
    const parent = read();
    const measurement = {id:measurements.length, value, time:now(), children:[]};
    parent.children.push(measurement);
    measurement.parent = parent;
    // Compute the new residue
    measurement.residue = combine(parent.residue, value);
    if (focus <= 0) {
      //parent.residue = null; //clean up old references.
      measurement.branch = -focus;
      branches[-focus] = measurement;
    } else {
      focus = -branches.length;
      measurement.branch = -focus;
      branches.push(measurement);
    }
    measurements.push(measurement);
    return measurement;
  }
  return {read, add, measurements, branches, setFocus, getFocus, ROOT};
}



//   const printRow = (row) => `${row.row} - [${row.parent === null ? 'n' : row.parent}] ${row.values.join(' ')} {${summarize(row.residue)}}`;
//   const print = ()=> rows.map(printRow).join('\n') + `\nfocus: ${foc}`;

//   const rowValues = (f=foc) => rows[f].values.map(i=>values[i]);

//   return {values, rows, add, focus, residue, residues, print, rowValues};
// }
