import fs from 'fs';
import child_process from 'child_process';

// Define parameters - todo support command line override
const authorName = 'Josh';
const authorLocation= 'the East Coast of USA';
const blogURL = 'https://simpatico.io/blog/';
const blogTitle = 'Simpatico Blog';
const blogDescription = 'Logging my thoughts as I develop Simpatico';
const urlPathPrefix = '/notes/';
const preferredEditor = '';
const currentDate = new Date().toLocaleDateString();
const noteTitle = `# ${authorName} from ${authorLocation} on ${currentDate}\n\n`;
const NOTE_FILE_PATTERN = /^([0-9]*)(?:-(?:.*))?\.md$/; //capture the number prefix, ignore stub after optional dash

const peek = (arr, fallback=null) => (arr && arr.length) ? arr[arr.length-1] : fallback;
const getMaxValue = (max=0, num) => (num > max) ? num : max;
const extractNoteNumber = (filename, notePattern) => +peek(filename.match(notePattern), 0);
const findGreatestNoteNumber = (fileNames, notePattern) => fileNames.map(nn => extractNoteNumber(nn, notePattern)).reduce(getMaxValue);

const generateIndexFile = (fileNames) => {
  const content = fileNames.map((fileName, index) => `${index + 1}. [${fileName.replace('.md', '')}](${urlPathPrefix + fileName})`).join('\n');
  fs.writeFileSync(`index.md`, `# ${blogTitle} \n\n${content}`);
};

// TODO add a description by looking at filecontents
const generateRssFile = (fileNames) => {
  const rssContent = `
      <rss version="2.0">
          <channel>
              <title>${blogTitle}</title>
              <link>${blogURL}</link>
              <description>RSS feed for my notes</description>
              ${fileNames.map((fileName, index) => {
                const timestamp = new Date().toUTCString(); // Get current timestamp
                return `<item><title>${fileName.replace('.md', '')}</title>
                      <link>${blogURL +  fileName}</link>
                      <description>${fileName}</description>
                      <pubDate>${timestamp}</pubDate></item>`;
              }).join('\n')}
          </channel>
      </rss>
  `;
  fs.writeFileSync('rss.xml', rssContent);
};

const fileNames = fs.readdirSync('.').filter(name => name.endsWith('.md') || name.endsWith('.html'));
const noteId = findGreatestNoteNumber(fileNames, NOTE_FILE_PATTERN) + 1;
const fileName = noteId + '.md';
fs.writeFileSync(fileName, `${noteTitle}`);

// regenerate index and rss files
generateIndexFile(fileNames);
generateRssFile(fileNames);

// load the new blog post in an editor
if (preferredEditor) child_process.spawn(preferredEditor, [fileName]);
console.log(`created ${fileName}`);
