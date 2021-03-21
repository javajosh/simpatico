import Core from './core.js';
import Combine from './combine.js';

const {ARR} = Core.preds;
const {assert} = Core.asserts;
const {peek} = Core.arrays;
const {now} = Core.utils;
const {combine} = Combine;

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

export const rtree = (startValue= {}, reducer = combine) => {
  const ROOT = {
    id: 0, time: now(), branch: 0, parent: null, children: [],
    value: startValue, residue: startValue,
  };

  // The state of the RTree is in these two arrays and the focus.
  // The arrays will increase in size over time; focus will vary between
  // -branches and +measurements.
  const measurements = [ROOT];
  const branches = [ROOT];
  let focus = 0;

  // Focus is a split coord system with measurements being positive, branches being negative, and branch getting zero. This means that you cannot set focus to the root node, even though it's there. (You can still get to it from measurements[0])
  const setFocus = (index) => {read(index); focus = index}; //if the read doesn't throw, it's a good index.
  const getFocus = () => focus;
  const read = (index=focus) => (index <= 0) ? branches[-index] : measurements[index];
  const add = (value) => {
    // Create a bidirectional link between parent and measurement.
    const parent = read();
    const measurement = {id: measurements.length, value, time: now(), children: []};
    parent.children.push(measurement); // TODO: check that no sibling measurements have the same value.
    measurement.parent = parent;

    // Compute the new residue!
    measurement.residue = reducer(parent.residue, value);

    // If residue is mutable, then we should remove the parent residue.
    // parent.residue = null;

    if (focus <= 0) { // Updating an existing branch
      // Set the branch number on the measurement.
      measurement.branch = -focus;
      // Update the branch residue
      branches[-focus] = measurement;
    } else { // Creating a new branch
      focus = -branches.length;
      measurement.branch = -focus;
      branches.push(measurement);
    }
    measurements.push(measurement);
    return measurement;
  }
  return {setFocus, getFocus, read, add, measurements, branches, focus};
}



//   const printRow = (row) => `${row.row} - [${row.parent === null ? 'n' : row.parent}] ${row.values.join(' ')} {${summarize(row.residue)}}`;
//   const print = ()=> rows.map(printRow).join('\n') + `\nfocus: ${foc}`;

//   const rowValues = (f=foc) => rows[f].values.map(i=>values[i]);

//   return {values, rows, add, focus, residue, residues, print, rowValues};
// }
