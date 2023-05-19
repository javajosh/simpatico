import { exec } from 'child_process';

const url = 'https://simpatico.local:8443/acceptance';
const command = `chromium --headless --dump-dom --virtual-time-budget=2000 ${url} `;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`error: ${error},'stderror', ${stderr}`);
  } else {
    const content = extractBodyContent(stdout);
    if (content !== null && content !== ''){
      console.error('foo', content);
    }
  }
});

function extractBodyContent(html) {
  const bodyRegex = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
  const match = bodyRegex.exec(html);
  return match && match[1] ? match[1].trim() : null;
}
