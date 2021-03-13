// Decided against running this as a system script directly, and instead rely on a bash wrapper if I want true convenience.
// Why? Because I don't know how people install node, and so the directive will probably fail anyway!
const fs = require('fs');
const child_process = require("child_process");

const name = 'Josh Rehman';
const place = 'Florida';
const path = '.';
const editor = 'subl';
const time = new Date().toDateString();
const title = `${time}, ${name} in ${place}\n\n`;
const NOTE_PATTERN = /^([0-9]*)\.md$/;

const greatestNoteNumberImperative = strings => {
	let max = 0, captures = [];
	for (let i = 0; i < strings.length; i++){
		captures = strings[i].match(NOTE_PATTERN);
		if (captures && captures.length && +captures[1] > max) max = +captures[1];
	}
	return max;
}

// Here is the functional way. It's twice as slow, much better decomposition, and harder to read for some,
// easier to read for others. The first two functions are quite general and reusable. The pieces are far
// more interdependent; the imperative function is relatively self-sufficient.
// It's also worth noting that it uses more of the Array standard library, map() and reduce().
const peek = (arr, fallback=null) => (arr && arr.length) ? arr[arr.length-1] : fallback
const toMax = (max=0, num) => (num > max) ? num : max
const toNoteNumber = (filename, notePattern) => +peek(filename.match(notePattern), 0)
const greatestNoteNumberFunctional = noteNames => noteNames.map(nn => toNoteNumber(nn, NOTE_PATTERN)).reduce(toMax)

const greatestNoteNumber = true ? greatestNoteNumberImperative : greatestNoteNumberFunctional;

const CALLBACK = 0, ASYNCAWAIT = 1, RXJS = 2;
// const outputstyle = CALLBACK;
const outputstyle = ASYNCAWAIT;
if (outputstyle === CALLBACK) {
  fs.readdir(path, (ignored, filenames) => {
  	const filename = `${greatestNoteNumber(filenames) + 1}.md`;
  	fs.open(filename, 'w', (err, fd) => {
  		fs.appendFile(fd, title, 'utf8', () => {
  			child_process.spawn(editor, [filename]);
  			console.log(`created ${filename}`);
  		});
  	});
  });
}
if(outputstyle === ASYNCAWAIT){
  const { promisify } = require("util");
  const writeFile = promisify(fs.writeFile);
  const readDir = promisify(fs.readdir);
  async function main() {
    const fileNames = await readDir(".");
    const noteId = greatestNoteNumber(fileNames) + 1;
    const fileName = noteId + '.md';
    await writeFile(fileName, `Note ${noteId}: ${title}`);
    child_process.spawn(editor, [fileName]);
    console.log(`created ${fileName}`);
  }
  try {
    main();
  } catch (e) {
    throw e;
    // console.error(error);
  }
}



let s = ``
