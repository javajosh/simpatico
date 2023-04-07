import showdown from './showdown.js';

let DEBUG = true;

// This is a function, not a string, so that it can be called above before it's defined.
const markdownDefaultImports= `
  import {assertEquals, assertThrows} from "/core.js";
  import {combine, assertHandler, logHandler} from "/combine2.js";
  import {stree} from "/stree2.js";
  const etc = [];
  //const elt = id => document.getElementById(id);
`;

const scriptPassThroughExtension = {
  type: 'output',
  filter:  (htmlDocument, converter, options) => {
    return htmlDocument.replace(/<pre><code class="js.*>([\s\S]+?)<\/code><\/pre>/gm, (match, code) => {
      const displayString = `<pre><code class="js language-js">${code}</code></pre>`;
      code = code.trim();
      code = unescapeHtml(code);
      const doNotExecute = code.startsWith('//');
      const hasImports = code.startsWith('import');
      const executeString = `
        <script type="module">
          ${hasImports ? '' : options.defaultImport}
          ${code}
        </script>
        `;
      const output =  displayString + (doNotExecute ? '' : '\n' + executeString);
      if (DEBUG) console.log('markdown.js: scriptPassThroughExtension', output);
      return output;
    });
  }
};

const htmlPassThroughExtension = {
  type: 'output',
  filter:  (htmlDocument, converter, options) => {
    return htmlDocument.replace(/<pre><code class="html.*>([\s\S]+?)<\/code><\/pre>/gm, (match, code) => {
      // showdown tags html as js for some reason, so we use a heuristic to distinguish.
      const displayString = `<pre><code class="html language-html">${code}</code></pre>`;
      const executeString = unescapeHtml(code);
      const doNotExecute = executeString.startsWith('<!--');
      const output =  displayString + (doNotExecute ? '' : '\n' + executeString);

      if (DEBUG) console.log('markdown.js: htmlPassThroughExtension', output);
      return output;
    })
  }
};

const cssPassThroughExtension = {
  type: 'output',
  filter:  (htmlDocument, converter, options) => {
    return htmlDocument.replace(/<pre><code class="css.*>([\s\S]+?)<\/code><\/pre>/gm, (match, code) => {
      // showdown tags html as js for some reason, so we use a heuristic to distinguish.
      const displayString = `<pre><code class="css language-css">${code}</code></pre>`;
      code = unescapeHtml(code);
      const doNotExecute = code.startsWith('/*');
      const executeString = `<style>${code}</style>`;
      const output =  displayString + (doNotExecute ? '' : '\n' + executeString);

      if (DEBUG) console.log('markdown.js: cssPassThroughExtension', output);
      return output;
    })
  }
};

const makeMarkdownConverter = (options={}) => {
  showdown.extension('scriptPassThroughExtension', scriptPassThroughExtension);
  showdown.extension('htmlPassThroughExtension', htmlPassThroughExtension);
  showdown.extension('cssPassThroughExtension', cssPassThroughExtension);

  const result = new showdown.Converter(
    Object.assign({
        backslashEscapesHTMLTags: true,
        parseImgDimensions: true,
        strikethrough: true,
        simpleLineBreaks: false,
        tables: true,
        flavor: 'github',
        tasklists: true,
        ghMentions: true,
        ghMentionsLink: 'https://twitter.com/{u}/profile',
        defaultImport: markdownDefaultImports,
        extensions: ['scriptPassThroughExtension', 'htmlPassThroughExtension', 'cssPassThroughExtension'],
      },
      options)
  );
  if (DEBUG) console.log('markdown.js: makeMarkdownConverter', result);
  return result;
}
// Instantiate a singleton markdown converter that lives as long as the module/app.
let markdown = makeMarkdownConverter();

/**
 *  Build an HTML document from a literate markdown string.
 *  A literate markdown string can contain header fields, wrapped in html comments so they render on github.
 *  This whole thing is brittle and needs to be redone properly.
 *
 * @param markdownString
 * @param fileName  used to generate a default title if the markdownString doesn't have one.
 * @returns {string}
 */
function buildHtmlFromLiterateMarkdown(markdownString, fileName=''){
  if (typeof markdownString !== 'string') throw `arg must be of type string but was of type ${typeof markdownString} with value [${markdownString}]`;
  markdown = makeMarkdownConverter();
  const firstCut = markdownString.split('</head>-->');
  let header = firstCut[0];
  let body = '';
  const hasHeader = header.length > 0;
  if (hasHeader){
    header = header.replace('<!--', '') + '</head>';
    body = firstCut[1];
  } else {
    header = defaultHtmlHeader(fileName);
    body = markdownString;
  }

  if (DEBUG) console.log('markdown.js: buildHtmlFromLiterateMarkdown', header, 'body', body);
  return header + markdown.makeHtml(body) + htmlFooter();
}

/**
 * Build a default header for markdown files that don't have one.
 * @param fileName
 * @returns {string}
 */
function defaultHtmlHeader(fileName) {
  const bareFileName = fileName.replace(/^.*(4`1\\|\/|:)/, '').split('.')[0];
  const title = 'Simpatico: ' + bareFileName;
  return `<!DOCTYPE html>
      <title>${title}</title>
      <link rel="stylesheet" href="style.css">
     `;
}

function htmlFooter(author='jbr', year='2023') {
  return `<p>Copyright ${author} ${year}</p>`;
}

function unescapeHtml(string){
  return string.replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function removeWrapper(text, open="<!--", close="-->") {
  // Regular expression to strip HTML comments
  // See: https://regex101.com/r/SvRZth/1
  const regex = new RegExp(`${open}\\s*([\\s\\S]*?)\\s*${close}`);
  const match = regex.exec(text);
  const html = match[1];
  return html;
}

export {buildHtmlFromLiterateMarkdown};
