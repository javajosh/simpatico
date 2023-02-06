// Reflector is a static file server and a web socket server
// =====================================================
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import WebSocket, { WebSocketServer } from 'ws';
// Sadly json cannot just be imported.
const info = JSON.parse(fs.readFileSync('./package.json'));
const args = process.argv.slice(2);

console.info(`reflector.js [${info.version}] started at [${new Date().toUTCString()}] from directory [${process.cwd()}] with args [${args}]`);

// Process reflector config. Override with e.g. node reflector.js "{https:443, host:simpatico.local, cert:localhost.crt, key:localhost.key}"
const configDefault = {
  http: 8080,
  https: 8443,
  ws: 8081,
  host: 'localhost',
  cert: './localhost.crt',
  key: './localhost.key',
};

// Treat input as JSON without proper quotes, which is more convenient to author in a CLI
// NB: I may replace this with more standard, simple, bash environment variables.
const configString = args.length ? args[0]
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
    .replace(/:(['"])?([a-zA-Z0-9\\.]+)(['"])?/g, ':"$2"')
  : "{}";
const config = Object.assign(configDefault, JSON.parse(configString));
const isLocal = config.host === 'localhost';
console.info(`computed config: [${JSON.stringify(config)}] isLocal is [${isLocal}]`);



// todo: add gzip compression. see https://nodejs.org/api/zlib.html#compressing-http-requests-and-responses
// Create an HTTP server - locally, http is THE server; deployed, http is a redirect to https
try{
  http.createServer ({keepAlive:'true', headersTimeout:100}, isLocal ? serverLogic : httpRedirectServerLogic).listen(config.http);
} catch (e) {
  console.error('abort: problem spinning up http server', e);
  throw (e);
}
// Create an HTTPS server if not running locally.
let httpsServer = null;
if (!isLocal) {
  try {
    const cert = fs.readFileSync(config.cert);
    const key = fs.readFileSync(config.key);
    httpsServer = https.createServer({hostname: config.host, key, cert}, serverLogic).listen(config.https);
    // We are bound to port 443 (and probably 80) so we can drop privileges
    // process.setuid('simpatico');
    // process.setgid('simpatico');
  } catch (e) {
    console.error('abort: problem spinning up https server', e);
    throw (e);
  }
}

function httpRedirectServerLogic (req, res) {
  // Let letsencrypt check my control of the domain.
  // See https://eff-certbot.readthedocs.io/en/stable/using.html#webroot
  if (req.url.startsWith('/.well-known/acme-challenge')){
    res.writeHead(200);
    res.end(fs.readFileSync(req.url));
    return;
  }
  // Everything else, redirect permanently to https
  const redirectUrl = `https://${req.hostname}:${config.https}${req.url}`;
  res.writeHead(307, {Location: redirectUrl});
  res.end()
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
  }
  // Strip parameters to find the underlying file.
  if (req.url.indexOf('?') > -1) {
    req.url = req.url.substr(0,req.url.indexOf('?'));
  }
  if (req.url.indexOf('.') === -1) {
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
        // https://getpocket.com/read/3784699081
        // Enable SharedArrayBuffer
        {'Cross-Origin-Opener-Policy' : 'same-origin'},
        {'Cross-Origin-Embedder-Policy' : 'require-corp'},
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
  "wasm": "application/wasm"
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

// Create a webSocket server, sharing https connectivity if not locally running.
const wssArg = isLocal ? { port: config.ws } : {server: httpsServer};
const wss = new WebSocketServer(wssArg);
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

const url = isLocal ? `http://${config.host}:${config.http}` : `https://${config.host}:${config.https}`;
console.info("Log format is [iso date] [req.socket.remoteAddress] [req.headers[user-agent]] [req.url]");
console.info(`Intitialization complete. Open ${url}`);

