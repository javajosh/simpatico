import https from "https";
import fs from "node:fs";

const { execSync } = require('child_process');

const textFile = 'file.txt';
const lineToAppend = `Unique line: ${Date.now()}`;
const port = 8443;

// An aborted attempt to rewrite test_cache.sh in node

// Check if the text file exists, if not create it
if (!fs.existsSync(textFile)) {
  fs.writeFileSync(textFile, '<title>Test</title>\n');
}

// Append a unique line of text to the text file
fs.appendFileSync(textFile, `\n${lineToAppend}`);

  // Make an HTTPS request to read the file
  try {
    const response = await fetch(`https://simpatico.local:${port}/${textFile}`, {
      agent: new https.Agent({ rejectUnauthorized: false }),
    });

    if (response.ok) {
      const fileContent = await response.text();

      if (fileContent.includes(lineToAppend)) {
        console.log(fileContent);
      } else {
        console.error('Error: Unique line not found in the file.');
      }
    } else {
      console.error(`Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Stop the server
    https.close(() => {
      console.log('Server stopped');
    });
  }
