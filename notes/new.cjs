const fs = require('fs');
const { promisify } = require("util");
const child_process = require("child_process");

// To install
// curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
// source ~/.bashrc && nvm install node
// node new.cjs

const name = 'Josh';
const place= 'the East Coast of USA';
const path = '.';
const editor = '';
const time = new Date().toLocaleDateString();
const title = `# ${name} from ${place} on ${time}\n\n`;
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

const USE_IMPERATIVE = true;
const greatestNoteNumber = USE_IMPERATIVE ? greatestNoteNumberImperative : greatestNoteNumberFunctional;

const writeFile = promisify(fs.writeFile);
const readDir = promisify(fs.readdir);

async function main() {
  const fileNames = await readDir(path);
  const noteId = greatestNoteNumber(fileNames) + 1;
  const fileName = noteId + '.md';
  await writeFile(path + '/' + fileName, `${title}`);
  if (editor) child_process.spawn(editor, [fileName]);
  console.log(`created ${fileName}`);
}
main().then();
