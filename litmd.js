import showdown from './showdown.js';

let DEBUG = false;

// Signal to the litmd converter that we don't want to execute the code.
// by starting the code block with one of these strings.
const dontExecuteScript = '///';
const dontExecuteHtml = '<!---';
const dontExecuteCss = '/***';

const markdownDefaultImports= `
  import {assertEquals, assertThrows} from "/core.js";
  import {combine, assertHandler, logHandler} from "/combine2.js";
  import {stree} from "/stree2.js";
  const etc = []; // stupid, yes. but funny, [...etc]
`;

const scriptPassThroughExtension = {
  type: 'output',
  filter:  (htmlDocument, converter, options) => {
    return htmlDocument.replace(/<pre><code class="js.*>([\s\S]+?)<\/code><\/pre>/gm, (match, code) => {
      const displayString = `<pre><code class="js language-js">${code}</code></pre>`;
      code = code.trim();
      code = unescapeHtml(code);
      const doNotExecute = code.startsWith(dontExecuteScript);
      const executeString = `
        <script type="module">
          ${options.defaultImport}
          ${code}
        </script>
      `;
      const output =  (doNotExecute ? '' : '\n' + executeString) + displayString;
      if (DEBUG) console.log('litmd.js: scriptPassThroughExtension', output);
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
      const doNotExecute = executeString.startsWith(dontExecuteHtml);
      const output =  (doNotExecute ? '' : '\n' + executeString) + displayString;

      if (DEBUG) console.log('litmd.js: htmlPassThroughExtension', output);
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
      const doNotExecute = code.startsWith(dontExecuteCss);
      const executeString = `<style>${code}</style>`;
      const output =  (doNotExecute ? '' : '\n' + executeString) + displayString;

      if (DEBUG) console.log('litmd.js: cssPassThroughExtension', output);
      return output;
    })
  }
};

function makeMarkdownConverter (options={}) {
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
  if (DEBUG) console.log('litmd.js: makeMarkdownConverter', result);
  return result;
}
// Instantiate a singleton litmd converter that lives as long as the module/app.
const litmd = makeMarkdownConverter();

/**
 *  Build an HTML document from a literate litmd string.
 *  A literate litmd string can contain header fields, wrapped in html comments so they render on github.
 *  This whole thing is brittle and needs to be redone properly.
 *
 * @param maybeMarkdownString
 * @param fileName  used to generate a default title if the markdownString doesn't have one.
 * @returns {string}
 */
function buildHtmlFromLiterateMarkdown(maybeMarkdownString, fileName=''){
  if (typeof maybeMarkdownString === 'string' || !fileName.endsWith('.md'))
    return maybeMarkdownString;
  const markdownString = maybeMarkdownString.toString();

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

  if (DEBUG) console.log('litmd.js: buildHtmlFromLiterateMarkdown', 'header', header, 'body', body);
  return header + litmd.makeHtml(body) + htmlFooter();
}

/**
 * Build a default header for litmd files that don't have one.
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
