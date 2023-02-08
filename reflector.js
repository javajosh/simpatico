import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import WebSocket, { WebSocketServer } from 'ws';

import { info, error, debug, mapObject, parseObjectLiteralString } from './core.js';
import { combine, combineAllArgs } from './combine.js';


// Our globals
const DEBUG = false;
const sensitive = {password: '******', jdbc: 'jdbc://******'};
const elide = (obj, hide=sensitive) => DEBUG ? obj : combine(obj, hide);
const connections = [];

const config = processConfig();
info(`reflector.js [${JSON.stringify(elide(config), null, 2)}]`);
const bindStatus = bindToPorts();
info( 'bound', bindStatus);
dropProcessPrivs();

const url = config.isLocalHost ? `http://${config.host}:${config.http}` : `https://${config.host}:${config.https}`;
info("File server format is [iso date] [req.socket.remoteAddress] [req.headers[user-agent]] [req.url]");
info(`Initialization complete. Open ${url}`);

function processConfig(envPrefix='REFL_') {
  //hardcoded defaults, usually best for new devs
  const baseConfig = {
    http: 8080,
    https: 8443,
    host: 'localhost',
    // ssl is disabled for localhost,
    // to generate these, see devops
    cert: './fullchain.pem',
    key: './privkey.pem',
    password: 'secret',
    //isLocalHost: true, //updated below
    //measured: {}, //updated below
  };
  const envConfig = mapObject(baseConfig, ([key,_]) => ([key, process.env[`${envPrefix}${key.toUpperCase()}`]]));
  const argConfig = parseObjectLiteralString(process.argv[2]);

  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const measured = { measured: {
    name: packageJson.name,
    version: packageJson.version,
    args: process.argv,
    cwd: process.cwd(),
    started: new Date().toUTCString(),
  }};
  // The big difference with Object.assign in this case is that undefined on later objects is treated as a noop
  const config = combineAllArgs(baseConfig, envConfig, argConfig, measured);
  config.isLocalHost = (config.host === 'localhost');

  if (DEBUG) debug('DEBUG',
    '\nbaseConfig', elide(baseConfig),
    '\nenvConfig', elide(envConfig),
    '\nmeasured', elide(measured),
    '\nconfig', elide(config),
  );
  return config;
}

function bindToPorts() {
  let httpServer;
  let httpsServer; //this ref used to connect the wss server
  const result = {http: 0, https: 0, ws: 0};
  // Create an HTTP server
  // When localhost, http is the ONLY server;
  // When not localhost, http just redirects to https
  try {
    const httpLogic = config.isLocalHost ? fileServerLogic() : httpRedirectServerLogic;
    const httpOptions = {
      keepAlive: 100,
      headersTimeout: 100
    }
    httpServer = http.createServer(
      httpOptions,
      httpLogic
    ).listen(config.http);
    result.http = config.http;
  } catch (e) {
    error('abort: problem spinning up http server', e);
    throw e;
  }

  // Try to create an HTTPS server if not localhost
  if (!config.isLocalHost) {
    try {
      const cert = fs.readFileSync(config.cert);
      const key = fs.readFileSync(config.key);
      httpsServer = https.createServer(
        {key, cert},
        fileServerLogic()
      ).listen(config.https);
      result.https = config.https;
    } catch (e) {
      console.error('abort: problem spinning up https server', e);
      throw e;
    }
  }
  // Create a webSocket server, sharing http/s connectivity if not locally running.
  const wssArg = config.isLocalHost ?
    {server: httpServer} :
    {server: httpsServer};
  try{
    const wss = new WebSocketServer(wssArg);
    wss.on('connection', chatServerLogic);
    result.ws = config.isLocalHost ? config.http : config.https;
  } catch (e) {
    console.error('abort: problem spinning up ws server', e);
    throw e;
  }
  return result;
}

function dropProcessPrivs() {
  // We are bound to port 443 (and probably 80) so we can drop privileges
  // process.setuid('simpatico');
  // process.setgid('simpatico');
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

function fileServerLogic() {
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
  return (req, res) => {
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

    // todo: add gzip compression. see https://nodejs.org/api/zlib.html#compressing-http-requests-and-responses
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
}

function chatServerLogic(ws) {
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
}
