import fs from 'fs';
import child_process from 'child_process';
import * as url from 'node:url';
import path from 'path';


const scriptDir = path.dirname(import.meta.url.replace('file://', ''));
const invocationDir = process.env.INIT_CWD; // process.cwd() always reports root
const relativePath = path.relative(scriptDir, invocationDir) ? path.relative(scriptDir, invocationDir) + '/' : '';

// Define parameters - todo support command line override
let conf = {
  authorName: 'Josh',
  authorLocation: 'the East Coast of USA',
  blogTitle: 'Simpatico Blog',
  blogDescription: 'Logging my thoughts as I develop Simpatico',
  preferredEditor: '',
  currentDate: new Date().toLocaleDateString(),
  NOTE_FILE_PATTERN: /^([0-9]*)(?:-(?:.*))?\.md$/,
  blogURL: `https://simpatico.io/${relativePath}`,
};
conf = Object.assign(conf, {
  notePreamble: `# ${conf.authorName} from ${conf.authorLocation} on ${conf.currentDate}\n\n`,
  blogHeader: `# ${conf.blogTitle}
Click [here](${relativePath}/overview.md) to see ALL entries at once.
`
});


const peek = (arr, fallback=null) => (arr && arr.length) ? arr[arr.length-1] : fallback;
const getMaxValue = (max=0, num) => (num > max) ? num : max;
const extractNoteNumber = (filename, notePattern) => +peek(filename.match(notePattern), 0);
const findGreatestNoteNumber = (fileNames, notePattern) => fileNames.map(nn => extractNoteNumber(nn, notePattern)).reduce(getMaxValue);

const fileNames = fs.readdirSync(invocationDir).filter(name => name.endsWith('.md') || name.endsWith('.html'));

const generateIndexFile = (fileNames) => {
  const content = fileNames.map((fileName, index) =>
    `${index + 1}. [${fileName.replace('.md', '')}](${ '/' + relativePath + fileName})`)
    .join('\n');

  fs.writeFileSync(`${invocationDir}/index.md`, conf.blogHeader + content);
  console.log(`created ${invocationDir}/index.md`);
};

// TODO add a description by looking at filecontents
// TODO add <pubDate>${timestamp}</pubDate> with file timestamp
const generateRssFile = (fileNames) => {
  const rssContent = `
      <rss version="2.0">
          <channel>
              <title>${conf.blogTitle}</title>
              <link>${conf.blogURL}</link>
              <description>${conf.blogDescription}</description>
              ${fileNames.map((fileName) => `
                <item>
                  <title>${fileName.replace('.md', '')}</title>
                  <link>${conf.blogURL +  fileName}</link>
                  <description>${fileName}</description>
                </item>`
              ).join('\n')}
          </channel>
      </rss>
  `;
  fs.writeFileSync(`${invocationDir}/rss.xml`, rssContent);
  console.log(`created ${invocationDir}/rss.xml`);
};

const generateNewPost = (fileName, content = conf.notePreamble) => {
  if (!fileName){
    const lastNoteId = findGreatestNoteNumber(fileNames, conf.NOTE_FILE_PATTERN);
    fileName = (lastNoteId + 1) + '.md';
  }
  fs.writeFileSync(`${invocationDir}/${fileName}`, content);
  console.log(`created ${fileName}`);
  return fileName;
};


const handleCommands = (commands) => {
  let fileName;
  if (commands.includes('new')) {
    fileName = generateNewPost();
    fileNames.concat(fileName);
  }
  if (commands.includes('index')) {
    generateIndexFile(fileNames);
  }
  if (commands.includes('rss')) {
    generateRssFile(fileNames);
  }
  if (commands.includes('edit')) {
    if (conf.preferredEditor && fileName){
      // See https://www.jetbrains.com/help/idea/working-with-the-ide-features-from-command-line.html for how to get 'idea' working as an editor
      child_process.spawn(conf.preferredEditor, [fileName]);
    }

  }
};

// Export functions for external use
export { generateNewPost, generateIndexFile, generateRssFile, handleCommands, fileNames };

// Check if script is being run as a CLI script
if (url.fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Please provide at least one command: new, index, rss, edit');
    console.log({scriptDir, invocationDir, relativePath, conf});
  } else {
    handleCommands(args);
  }
}

