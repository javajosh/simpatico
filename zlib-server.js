// server example
// Running a gzip operation on every request is quite expensive.
// It would be much more efficient to cache the compressed buffer.

import * as zlib from 'node:zlib';
import http from 'node:http';
import fs from 'node:fs';
import { pipeline } from 'node:stream';

const PORT = 8084;
const DEBUG = true;

http.createServer((request, response) => {
  // In this simplified example, we only
  const raw = fs.createReadStream('index.html');
  // Store both a compressed and an uncompressed version of the resource.
  response.setHeader('Vary', 'Accept-Encoding');

  let acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  } else if (Array.isArray(acceptEncoding)){
    acceptEncoding = acceptEncoding.join(' ');
  }
  if (DEBUG) console.debug('acceptEncoding', acceptEncoding)

  const onError = (err) => {
    if (err) {
      // If an error occurs, there's not much we can do because
      // the server has already sent the 200 response code and
      // some amount of data has already been sent to the client.
      // The best we can do is terminate the response immediately
      // and log the error.
      response.end();
      console.error('An error occurred:', err);
    }
  };

  // Note: This is not a conformant accept-encoding parser.
  // See https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  if (/\bdeflate\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    pipeline(raw, zlib.createDeflate(), response, onError);
  } else if (/\bgzip\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'gzip' });
    pipeline(raw, zlib.createGzip(), response, onError);
  } else if (/\bbr\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'br' });
    pipeline(raw, zlib.createBrotliCompress(), response, onError);
  } else {
    response.writeHead(200, {});
    pipeline(raw, response, onError);
  }
}).listen(PORT);

console.log('server started', new Date().toISOString(), `http://localhost:${PORT}`);
