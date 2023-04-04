import showdown from './showdown.js';

let DEBUG = true;

// This is a function, not a string, so that it can be called above before it's defined.
const markdownDefaultImports= `
  import {assertEquals, assertThrows} from "/core.js";
  import {combine, stree, assertHandler, logHandler} from "/combine2.js";
  const etc = [];
  //const elt = id => document.getElementById(id);
`;

const scriptPassThroughExtension = {
  type: 'output',
  filter:  (htmlDocument, converter, options) => {
    return htmlDocument.replace(/<pre><code class="js.*>([\s\S]+?)<\/code><\/pre>/gm, (match, code) => {
      const displayString = `<pre><code class="js language-js">${code}</code></pre>`;
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
  if (DEBUG) console.log(result);
  return result;
}

function unescapeHtml(string){
  return string.replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export default makeMarkdownConverter
