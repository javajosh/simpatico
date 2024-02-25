import { exec } from 'child_process';

// Headless chrome is invoked with the dump-dom flag, which we'll use to check results.
const command = (url) => `chromium --headless --dump-dom --disable-gpu --virtual-time-budget=2000 ${url} `;

// The acceptance page knows to check for headless chrome via user agent headers.
// If the tests pass, the body is cleaned out.
// TODO: change this behavior/protocol to add logging output to DOM
const defaultUrl = 'https://simpatico.local:8443/acceptance';

// Get the body content of an HTML string.
// TODO: look for specific test output nodes.
const extractBodyContent = (html) => {
  const bodyRegex = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
  const match = bodyRegex.exec(html);
  return match && match[1] ? match[1].trim() : null;
}

// Run the headless chrome command asynchronously
// Get the --dump-dom in the stdout handler.
// Note that error/stderror refer only to the external chrome process and not the internals of the tab.
// (for that you need to start chrome with debbugging enabled and connect to that port, which is what puppeteer does.)
const runAcceptance = (url=defaultUrl) => {
  exec(command(url), (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error},'stderror', ${stderr}`);
    } else {
      const content = extractBodyContent(stdout);
      if (content !== null && content !== '') {
        console.error('body content not empty', content);
      } else {
        console.log('success')
      }
    }
  });
};

// Support running this module directly from the command line, as well as incorporating it into another process.
// This is a bit hacky, but honestly acceptance.js is very tightly coupled to acceptence.md
// So supporting an alternative url on the command line is kind of window dressing
const isRunFromCommandline = () => process.argv[1].endsWith('acceptance.js');

if (isRunFromCommandline()) {
  const [node, acceptance, url=defaultUrl] = process.argv;
  console.debug(`running acceptance test with command line ${command(url)}`);
  runAcceptance(url);
}

export default runAcceptance;
