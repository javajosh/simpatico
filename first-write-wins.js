let f = document.querySelector('form');
let output = document.querySelector('div#output');
let summary = document.querySelector('div#summary');
let fd = new FormData();

// Utility method that combines two FormDatas into a third.
function combineFormData(fd1, fd2) {
  const result = new FormData();
  for (let [key, value] of fd1.entries())
    result.append(key, value);
  for (let [key, value] of fd2.entries())
    result.append(key, value);
  return result;
}

// HTML helpers for building tables.
const w = (tag, d) => `<${tag}>${d}</${tag}>`;
const th = d => w('th', d);
const td = d => w('td', d);
const tr = (arr, t) => w('tr', arr.map(t).join(''));
const table = (arr, th, tr, td) =>
    w('table', tr(arr[0], th) + arr.splice(1).map(a => tr(a, td)).join(''));

function renderFormDataAsArray(fd) {
  // Render it as a 2D array with the 0th row being unique keys.
  let uniqueKeys = Array.from(new Set(fd.keys())); // thanks for Set, ES6!
  let result = [ uniqueKeys ];                     // stash headers
  let rowWidth = uniqueKeys.length; // create a new row every rowWidth entries
  let row = [];
  let i = 0;
  for (let value of fd.values()) {
    if ((i++ % rowWidth) === 0) { // allocate a new row
      row = [];
      result.push(row);
    }
    row.push(value);
  }
  return result;
}

// Given an ordered list of values, return the last not-null, empty value.
function lastWriteWins(arr) {
  if (!Array.isArray(arr))
    return arr;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] != null && (arr[i] != ''))
      return arr[i];
  }
  return null;
}

// Get the columns of a 2D array, e.g. transpose
function transpose(arr) {
  let len = arr.length;
  let width = arr[0].length;
  let cols = [];
  let col;
  for (let i = 0; i < width; i++) {
    col = [];
    for (let j = 0; j < len; j++)
      col.push(arr[j][i]);
    cols.push(col);
  }
  return cols;
}

function summarize(arr) {
  let cols = transpose(arr);
  let row = cols.map(lastWriteWins);
  return row;
}

// Render FormData into an HTML string.
function renderFormDataAsHTML(fd) {
  let formDataArray = renderFormDataAsArray(fd);
  return table(formDataArray, th, tr, td);
}

const clickSummary = e => ({x : e.pageX, y : e.pageY, t : e.timeStamp});

function compute() {
  let formDataArray = renderFormDataAsArray(fd);
  let headers = formDataArray.shift(); // drop the headers
  let sum = summarize(formDataArray);
  summary.innerHTML = table([ headers, sum ], th, tr, td);
}

function randomlyDeleteProperties(obj) {
  let result = {};
  let keys = Object.keys(obj);
  let count = Math.floor(keys.length / 2);
  let keepSet = chance.pickset(keys, count);
  if (keepSet.length === 0)
    return obj;
  for (let i = 0; i < keepSet.length; i++) {
    result[keepSet[i]] = obj[keepSet[i]];
  }
  return result;
}

// Make random form entries in object form.
function makeRandomInput() {
  return {
    userId : chance.integer({min : 0, max : 1000}),
    timeStamp : Date.now(),
    id : chance.integer({min : 0, max : 1000}),
    first : chance.first(),
    last : chance.last(),
    dob : chance.birthday({string : true})
  };
}

// Scatter to the form any properties the object shared with named fields.
function scatterToForm(obj, form) {
  // console.log(obj, form.elements.length)
  let elt;
  for (let i = 0; i < form.elements.length; i++) {
    elt = form.elements[i];
    if (elt.type === 'button')
      continue;
    elt.value = obj.hasOwnProperty(elt.name) ? obj[elt.name] : null;
  }
}

// Added for symmetry with scatterToForm - somewhat redundant with FormData
function gatherFromForm(form) {
  let result = {};
  for (let i = 0; i < form.elements.length; i++) {
    obj[form.elements[i].name] = form.elements[i].value;
  }
  return result;
}

// Steady state event handling
function clickAdd(e) {
  let newFd = combineFormData(fd, new FormData(f));
  let newOutput = renderFormDataAsHTML(newFd);
  fd = newFd;
  output.innerHTML = newOutput;
  compute();
  scatterToForm(randomlyDeleteProperties(makeRandomInput()), f);
}

function clickReset(e) {
  output.innerHTML = '';
  summary.innerHTML = '';
  fd = new FormData();
  scatterToForm(makeRandomInput(), f);
}

// Kick it off with a random scatter
scatterToForm(makeRandomInput(), f);
