// Reflector is a static file server and a web socket server
// =====================================================
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import WebSocket, { WebSocketServer } from 'ws';

// todo: tls. more convenient with an nginx proxy, but violates minimalism standard.
// let tls;
// try {
//   tls = await import('node:tls');
// } catch (err) {
//   console.log('Cannot start without tls support; use a different node build.');
//   return;
// }

// Example: node reflector.js "{http:8080, host:foobar}"
const configDefault = {http: 8080, ws: 8081, host: 'localhost'};
const args = process.argv.slice(2);
// Treat input as JSON without proper quotes, which is more convenient to author in a CLI
// Note I may replace this with more standard, simple, bash environment variables.
const configString = args.length ? args[0]
  .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
  .replace(/:(['"])?([a-zA-Z0-9\\.]+)(['"])?/g, ':"$2"')
  : "{}";

const config = Object.assign(configDefault, JSON.parse(configString));
console.log('Reflector v0.0.3', config);
console.log("UTC", new Date().toUTCString(), process.cwd(), args);

// Create an HTTP server
try{
  http.createServer ({keepAlive:'true', headersTimeout:100}, serverLogic).listen(config.http);
} catch (e) {
  console.warn('problem spinning up http server', e);
}
// Create an HTTPS server
try{
  const cert = fs.readFileSync('/etc/letsencrypt/live/simpatico.io/fullchain.pem');
  const key = fs.readFileSync('/etc/letsencrypt/live/simpatico.io/privkey.pem');
  https.createServer({hostname:'simpatico.io', port: 443, key, cert}, serverLogic).listen(config.https);
  // We are bound to port 443 (and probably 80) so we can drop privileges
  process.setuid('simpatico');
  process.setgid('simpatico');
} catch (e){
  console.warn('problem spinning up https server', e);
}

function serverLogic(req, res) {
  // if the request is malformed, return a 500 and log
  if (!req.headers.hasOwnProperty("user-agent")) {
    const e1 = new Error();
    Object.assign(e1, {
      code: 500,
      log: 'missing user-agent header',
      msg: 'user-agent header required',
    });
    console.error(e1.log);
    res.writeHead(e1.code);
    res.end(e1.msg);
    return;
  }

  // Log the (valid) request
  console.log(
    new Date().toISOString(),
    req.socket.remoteAddress.replace(/^.*:/, ''),
    req.headers["user-agent"].substr(0, 20),
    req.url,
  );

  // Normalize the url
  if (req.url === '/') {
    // Treat root as a request for index.html
    req.url = '/index.html';
  } else if (req.url.indexOf('.') === -1) {
    // Treat locations without an extension as html, allowing short urls like simpatico.io/wp
    req.url += ".html"
  }

  // Read the file asynchronously
  const fileName = process.cwd() + req.url;
  fs.readFile(fileName, (err, data) => {
    if (err) { // assume all errors are a 404. KISS
      const e2 = new Error();
      Object.assign(e2, {
        code: 404,
        log: 'resource not found',
        msg: 'insert cute fail whale type picture here',
      });
      console.error(e2.log);
      res.writeHead(e2.code);
      res.end(e2.msg);
      return;
    }
    // Send the response
    res.writeHead(
      200,
      Object.assign(
        getContentTypeHeader(req.url),
        getCacheHeaders(req.url),
      )
    );
    res.end(data);
  });
  // End of the server logic function!
}



// A simple file-extension/MIME-type map. Not great but it avoids a huge dependency.
const mime = {
  "html": "text/html",
  "js"  : "application/javascript",
  "json": "application/json",
  "css" : "text/css",
  "svg" : "image/svg",
}
const getContentTypeHeader = (filename, defaultMimeType='text') => {
  const ext = path.extname(filename).slice(1);
  const type = mime[ext] ? mime[ext] : defaultMimeType;
  return {"content-type": type};
}

// For primary resources, use an etag
// For sub-resources, cache forever and rely on unique urls to update.
const getCacheHeaders = (filename) => {
  const result = {};
  const isPrimaryResource = filename.endsWith('html');
  if (isPrimaryResource){
    //result["e-tag"] = "a hash of some kind";
  } else {
    // If we cache forever we need to embed hashes in the subresource names.
    // This means parsing and rewriting html, which can be annoyingly complicated.
    // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
    // {"cache-control": "private, max-age=2592000"},
  }
  return result;
}


// Create a webSocket server
const wss = new WebSocketServer({ port: config.ws });
const connections = [];
wss.on('connection', ws => {
  // Compute the connection ID,
  const id = connections.length;

  // Announce new ID to all connections from this, the root process.
  connections.forEach(conn => {
    conn.send(`0 > ${id}`);
    console.debug(`Announce new connection message => ${id}`);
  });
  // Store the connection for later.
  connections.push(ws);

  // Register a callback for messages sent from that connection.
  // Simplest case: broadcast every msg to all connections!
  ws.on('message', message => {
    connections.forEach(conn => {
      try{
        // Connections can die without us knowing.
        if (conn.readyState !== WebSocket.OPEN) {
          // maybe delete the connection from the array?
          return;
        }
        const msg = `${id} > ${message}`;
        conn.send(msg); // Q: can this ever block?
        console.debug(`Broadcast message => ${msg}`);
      } catch(e) {
        // Q: what all can go wrong here?
        console.error(e);
      }
    });
  });
  // TODO clean up connections when they are lost, otherwise is a (slow) memory leak.
});

// // TODO - add HTTPS; simulate other domain names with hosts file;
// console.log(`Listening for http on port ${config.http} and websockets on port ${config.ws}. Open http://${config.host}:${config.http}`);
// console.log("Log format:", "Date().toISOString() | req.socket.remoteAddress | req.headers[\"user-agent\"].substr(0,20) | req.url ");
