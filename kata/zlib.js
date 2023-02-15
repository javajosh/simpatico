// Kata for using streams and zlip in node.
// Adapted from https://nodejs.org/api/zlib.html#compressing-http-requests-and-responses
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream';
import { createReadStream, createWriteStream } from 'node:fs';

function zipFile(inFileName, outFileNameOverride) {
  const outFileName = outFileNameOverride ? outFileNameOverride : inFileName + '.gz';
  const gzip = createGzip();
  const source = createReadStream(inFileName);
  const destination = createWriteStream(outFileName);

  // I feel like I have to relearn streams every time I see them.
  // This probably means I don't really understand them
  // https://nodejs.org/api/stream.html
  pipeline(source, gzip, destination, (err) => {
    if (err) {
      console.error('An error occurred:', err);
      process.exitCode = 1;
    }
  });
}


// If called directly from the command line, compress the first argument filename
// output using the optional 2nd argument.
if (process.argv[1] === 'zlib.js'){
  const inArg = process.argv[2], outArg = process.argv[3];
  zipFile (inArg, outArg)
}

// Tests
// zipFile('index.html');
// Check that there is now an index.html.gz

export {zipFile}
