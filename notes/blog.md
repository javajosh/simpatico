# Blog
2024

A simple static site generator that supports RSS.

# Test harness

```html
<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 40 120"
  style="border: 1px solid gray; pointer-events: visible; max-width: 100%; height: auto"
  id="iframe-svg"
>
</svg>
```
## Usage
  1. Copy the `blog.js` script into the directory you want to turn into a blog.
  2. Run the script with `node blog.js`.
  3. The script will generate `index.md`, `rss.xml`, and a new blog post like `1.md`.
  4. When you run it again, it will regenerate and create a new file with an incrementing integer filename.

## Limitations
Currently `blog.js` does NOT:
  1. Support slugs
  2. Support draft
  3. Support blurbs in the index and feed.
  4. Override config on the command line (you must edit the script)
  5. Not generating a new file by default (need to add a 'new' command)

## Test harness generating code
```js
import {svg} from '/simpatico.js';

const iframeSvg = svg.elt('iframe-svg');
// NB: adjust viewbox of svg to add more rows of content
const urlPathPrefix = '/notes/';
// For now, getting this from the output of the blog.js script
const urls = [
  'ai.md','app_loop.html','javascript.md','blog.md','bpm-finder.html','browser-events.html','browser-topics.html','cat-tail-theory.md','chat.md','combine.md','crypto.md','d3-draw.md','d3-rectangles.html','devx.md','distractions.md','enough.md','foobar.html','git.md','ignition.md','index.md','inspiration.md','jrest.md','last-write-wins.html','linux.md','maximalism.md','memory.html','methods.md','minimalism.md','music.md','oh-my-zsh.md','overlap-rectangles-svg-canvas.html','postgres.md','predicates.html','pwa.md','rules.md','spring.md','square.html','stree.md','stree2.md','structure.md','svg-minimal-dragging.html','tools.md','tufte-css.html','vibe.md','webaudio.md','webgl-experiment.html'
].map(url => urlPathPrefix + url);
console.log(urls.length/4);

const clickableIframe = (url, {x,y}) => `
  <g transform="translate(${x} ${y})">
    <rect width="10" height="10" fill="white"/>
    <foreignObject id="embedded-iframe" width="500px" height="500px" transform="scale(.02)">
      <iframe width="500px" height="500px" src="${url}" style="overflow:hidden" scrolling="no"></iframe>
    </foreignObject>
    <rect onclick="window.location='${url}'" width="10" height="10" fill-opacity="0"/>
  </g>
`;

const pos = (index, cols=4, W=10, H=10) => {
  const x = index % cols * W;
  const y = Math.floor(index / cols) * H;
  return { x, y };
}
const iframeAtIndex = (url, i) => clickableIframe(url, pos(i));
const html = urls.map(iframeAtIndex).reduce((a,b) => a + b, '');
iframeSvg.innerHTML = html;

```
## Blog generating code

```js
/// DO NOT EXECUTE - this is for node
import fs from 'fs';
import child_process from 'child_process';

// Define parameters - todo support command line override
const authorName = 'Josh';
const authorLocation= 'USA';
const urlPathPrefix = '/notes/';
const blogURL = 'https://simpatico.io' + urlPathPrefix;
const blogTitle = 'Simpatico Notes';
const blogDescription = 'Notes about Simpatico development';
const preferredEditor = '';
const currentDate = new Date().toLocaleDateString();
const noteTitle = `# ${authorName} from ${authorLocation} on ${currentDate}\n\n`;
const NOTE_FILE_PATTERN = /^([0-9]*)(?:-(?:.*))?\.md$/; //capture the number prefix, ignore stub after optional dash

const blogHeader = `# ${blogTitle}
Click [here](blog.md) to see ALL entries at once.
`;

const peek = (arr, fallback=null) => (arr && arr.length) ? arr[arr.length-1] : fallback;
const getMaxValue = (max=0, num) => (num > max) ? num : max;
const extractNoteNumber = (filename, notePattern) => +peek(filename.match(notePattern), 0);
const findGreatestNoteNumber = (fileNames, notePattern) => fileNames.map(nn => extractNoteNumber(nn, notePattern)).reduce(getMaxValue);

const generateIndexFile = (fileNames) => {
  const content = fileNames.map((fileName, index) => `${index + 1}. [${fileName.replace('.md', '')}](${urlPathPrefix + fileName})`).join('\n');
  fs.writeFileSync(`index.md`, blogHeader + content);
};

// TODO add a description by looking at filecontents
const generateRssFile = (fileNames) => {
  const rssContent = `
      <rss version="2.0">
          <channel>
              <title>${blogTitle}</title>
              <link>${blogURL}</link>
              <description>${blogDescription}</description>
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
generateIndexFile(fileNames.concat(fileName));
generateRssFile(fileNames.concat(fileName));

// load the new blog post in an editor
if (preferredEditor) child_process.spawn(preferredEditor, [fileName]);
console.log(`created ${fileName}`);
console.log(fileNames.map(f => `'${f}'`).join(','))

```
