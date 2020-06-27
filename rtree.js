import A from './core.js'
import {combine} from './combine.js'

const {ARR} = A.preds;
const {assert} = A.asserts;
const {peek} = A.arrays;
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

 Row focus is just a number. This is the default.
 Branching focus is an array: [row,col] or [node]

 row ={row, parent, values, residue}
 */
export default (base = {}, reducer = combine, writeRowToResidue=true, summarize= a=>a ) => {

  let foc = 0; // focus can also be an array
  const values = [base];
  const rows = [{row:0, parent: null, values:[0], residue: base}];

  if (writeRowToResidue) rows[0].residue.row = 0;

  const add = (value, assertion) => {
    const i = values.length;
    values.push(value);

    const branching = ARR(foc);
    if (!branching){
      const row = rows[foc];
      row.values.push(i);
      row.residue = reducer(row.residue, value);
    } else {
      // The interesting case - we are branching!
      // TODO support column coordinates?
      const [rowi, coli] = foc;
      const parentRow = rows[rowi];
      const residue = reducer(parentRow.residue, value);
      if (writeRowToResidue) residue.row = rows.length;
      foc = rows.length;
      rows.push({
        row: rows.length,
        parent: peek(parentRow.values),
        values: [i],
        residue,
      });
    }
    if (assertion) assertion(residue()); //TODO: make this better.
    return print();
  }

  // TODO design - decide if supporting columns is actually worth the complexity. I think no..
  // to fully support columns requires a partial reduction that looks something like:
  // partial = (rowi, coli) => row=rows[rowi]; row.values.slice(0,coli).reduce(reducer, partial(row.parent))

  const focus = (a) => {
    assert(a >= 0 && a < rows.length, `focus must be between [0, ${rows.length-1}]`);
    foc = ARR(a) ? [a,rows[a].values.length-1] : a;
    return print();
  }

  const residue = (f=foc) => ARR(f) ? rows[f[0]].residue : rows[f].residue;
  const residues = () => rows.map(row=>row.residue);

  const printRow = (row) => `${row.row} - [${row.parent === null ? 'n' : row.parent}] ${row.values.join(' ')} {${summarize(row.residue)}}`;
  const print = ()=> rows.map(printRow).join('\n') + `\nfocus: ${foc}`;

  const rowValues = (f=foc) => rows[f].values.map(i=>values[i]);

  return {values, rows, add, focus, residue, residues, print, rowValues};
}
