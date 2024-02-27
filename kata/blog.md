# Blog
2024

A simple static site generator that supports RSS.

# Test harness

```html
<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 40 70"
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
const urlPathPrefix = '/kata/';
// For now, getting this from the output of the blog.js script
const urls = [
  'angular.md','asynchrony.md','blog.md','css.md','d3.md','docker.md','head.md','html.html',
  'htmx.md','index.html','kata.md','lint.md','markdown.html','mermaid.html','mvp.html','physics.md',
  'postgres.md','proximity-coherence.md','qr.html','regex.md','time.html','tls.md','tmux.md','video.md'
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
