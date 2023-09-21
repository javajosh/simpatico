import showdown from './showdown.js';

let DEBUG = false;

// Signal to the litmd converter that we don't want to execute the code.
// by starting the code block with one of these strings.
const dontExecuteScript = '///';
const dontExecuteHtml = '<!---';
const dontExecuteCss = '/***';

const markdownDefaultImports= `
  import * as c from "/core.js";
  import {combine, combineReducer, assertHandler, logHandler} from "/combine2.js";
  import {stree} from "/stree2.js";
  const etc = []; // stupid, yes. but funny, [...etc]
  const {assert, assertEquals, assertThrows, is, as, log, debug} = c;
`;

const scriptPassThroughExtension = {
  type: 'output',
  filter:  (htmlDocument, converter, options) => {
    return htmlDocument.replace(/<pre><code class="js.*>([\s\S]+?)<\/code><\/pre>/gm, (match, code) => {
      const displayString = `<details><summary>js</summary><pre><code class="js language-js">${code}</code></pre></details>`;
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
      const displayString = `<details><summary>html</summary><pre><code class="html language-html">${code}</code></pre></details>`;
      code = code.trim();
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
      const displayString = `<details><summary>css</summary><pre><code class="css language-css">${code}</code></pre></details>`;
      code = code.trim();
      code = unescapeHtml(code);
      const doNotExecute = code.startsWith(dontExecuteCss);
      const executeString = `<style>${code}</style>`;
      const output =  (doNotExecute ? '' : '\n' + executeString) + displayString;

      if (DEBUG) console.log('litmd.js: cssPassThroughExtension', output);
      return output;
    })
  }
};

// Instantiate a singleton litmd converter that lives as long as the module/app.
const litmd = makeMarkdownConverter();

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


/**
 *  Build an HTML document from a literate litmd string.
 *  A literate litmd string can contain header fields, wrapped in html comments so they render on github.
 *  This whole thing is brittle and needs to be redone properly.
 *
 * @param maybeMarkdownString
 * @param fileName  the full path to the file, used to generate a default title if the markdownString doesn't have one.
 * @returns {string}
 */
function buildHtmlFromLiterateMarkdown(maybeMarkdownString, fileName=''){

  if (typeof maybeMarkdownString === 'string' || !fileName.endsWith('.md')){
    return maybeMarkdownString;
  }

  let header ='';
  let body = '';

  const markdownString = maybeMarkdownString.toString().trim();
  const hasExplicitHTMLHeader = markdownString.startsWith("<!--<!DOCTYPE html>");

  if (hasExplicitHTMLHeader){
    // strip the comments around <!--<!DOCTYPE html> and </head>-->
    // see https://regex101.com/r/QyIlcj/2
    const regex = /<!--<!DOCTYPE html>\W*<head\b[^>]*>(.*)<\/head>-->(.*)/s;
    const group = regex.exec(markdownString);
    header = `<!DOCTYPE html><head>${group[1].trim()}</head>`;
    body = group[2].trim();
  } else {
    header = defaultHtmlHeader(fileName);
    body = markdownString;
  }
  return header + litmd.makeHtml(body) + defaultHtmlFooter();
}

/**
 * Build a default header for litmd files that don't have one.
 *
 * @param fileName - the full file name
 * @returns {string}
 */
function defaultHtmlHeader(fileName) {
  const bareFileName = fileName.replace(/^.*(4`1\\|\/|:)/, '').split('.')[0];
  const title = 'Simpatico: ' + bareFileName;
  return `<!DOCTYPE html>
<head lang="en" color-mode="user">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='DodgerBlue' />
  </svg>"/>
  <script src="/testable.js" type="module"></script>

  <title>${title}</title>
  <meta name="keywords" content="JavaScript, ES6, functional, simpatico, minimalist">
  <meta name="author" content="jbr">
  <link rel="stylesheet" type="text/css" href="/style.css">
  <link rel="stylesheet" href="/kata/highlight.github-dark.css">
  <script type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    hljs.registerLanguage('javascript', javascript);
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
      });
    });
  </script>
</head>
    `;
}

function defaultHtmlFooter(author='jbr', year=new Date().getFullYear()) {
  return `<p>Copyright ${author} ${year}</p>`;
}

function unescapeHtml(string){
  return string.replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}


export {buildHtmlFromLiterateMarkdown};
