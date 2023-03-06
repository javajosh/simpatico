import process from 'node:process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';

import WebSocket, { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import showdown from './showdown.js';

import { info, error, debug, mapObject, hasProp, parseObjectLiteralString } from './core.js';
import { combine, combineAllArgs } from './combine.js';

// Our global state
const DEBUG = false;
const sensitive = {password: '******', jdbc: '******'};
const elide = (obj, hide=sensitive) => DEBUG ? obj : combine(obj, hide);
const connections = [];

// Boot up
const config = processConfig();
info(`reflector.js [${JSON.stringify(elide(config), null, 2)}]`);
const bindStatus = bindToPorts();
info( 'bound', bindStatus);
const markdown = new showdown.Converter();
markdown.setFlavor('github');
markdown.setOption('backslashEscapesHTMLTags', true);
// We are bound to port 443 (and probably 80) so we can drop privileges
if (config.user) dropProcessPrivs(config.user);

// Welcome message
const url = config.isLocalHost ? `http://${config.host}:${config.http}` : `https://${config.host}:${config.https}`;
info("File server format is [iso date] [req.socket.remoteAddress] [req.headers[user-agent]] [req.url]");
info(`Initialization complete. Open ${url}`);

function processConfig(envPrefix='REFL_') {
  //hardcoded defaults, usually best for new devs
  const baseConfig = {
    http: 8080,
    https: 8443,
    host: 'localhost',
    cert: './fullchain.pem',
    key: './privkey.pem',
    user: null,
    useCache: false,
    password: 's3cret',
    // isLocalHost: true, //added below
    // measured: {},      //added below
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
      console.error('unable to start ssl/tls server; either bind to localhost or generate a self-signed cert according to devops/deploy.sh', e);
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

function dropProcessPrivs(user) {
  try{
    process.seteuid(user);
  } catch(e) {
    info('dropProcessPrivs', user, e);
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

function fileServerLogic() {
  // Make a file cache and watch for file changes to invalidate it.
  let cache = {};
  // See https://nodejs.org/docs/latest-v18.x/api/fs.html#fswatchfilename-options-listener
  // Sigh, this doesn't work on linux will need to use https://github.com/paulmillr/chokidar instead
  // fs.watch('.', {recursive: true, persistent: false}, (eventType, filename) => {delete cache[filename]});
  if (config.useCache) chokidar.watch('.', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: false
  }).on('change', path => {delete cache[path]})
    .on('unlink', path => {delete cache[path]});

  // A simple file-extension/MIME-type map. Not great but it avoids a huge dependency.
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  const mime = {
    "html": "text/html",
    "js"  : "application/javascript",
    "json": "application/json",
    "css" : "text/css",
    "svg" : "image/svg+xml",
    "wasm": "application/wasm",
    "pdf" : "application/pdf",
    "md"  : "text/html",
  }
  /**
   * Required for most browsers to use SharedArrayBuffer and load wasm.
   * See  https://getpocket.com/read/3784699081
   */
  const getCrossOriginHeaders = ()=> ({
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  });

  const getContentTypeHeader = (filename, defaultMimeType='text') => {
    const ext = path.extname(filename).slice(1);
    const type = mime[ext] ? mime[ext] : defaultMimeType;
    return {"content-type": type};
  }

  // For primary resources, use an etag
  // For sub-resources, cache forever and rely on unique urls to update.
  // See https://httpwg.org/specs/rfc9110.html#field.accept-encoding
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
  const getCacheHeaders = (filename) => {
    const result = {};
    const isPrimaryResource = filename.endsWith('html');
    if (isPrimaryResource){
      //result["e-tag"] = "a hash of some kind";
    } else {
      // {"cache-control": "private, max-age=2592000"},
    }
    return result;
  }

  return (req, res) => {
    const respondWithError = (err) => {
      console.error(err.log);
      res.writeHead(err.code);
      res.end(err.message);
    }
    const respondWithData = data => {
      res.writeHead(
        200,
        Object.assign(
          getContentTypeHeader(req.url),
          getCacheHeaders(req.url),
          getCrossOriginHeaders(),
        )
      );
      res.end(data);
    }

    const logRequest = () => {
      console.log(
        new Date().toISOString(),
        req.socket.remoteAddress.replace(/^.*:/, ''),
        req.headers["user-agent"].substr(0, 20),
        req.url,
      );
    }

    // Missing use-agent -> error
    if (!req.headers.hasOwnProperty("user-agent")) {
      respondWithError(combine(new Error(), {
        code: 500,
        log: 'missing user-agent header',
        message: 'user-agent header required',
      }));
      return;
    }

    // Normalize the url
    if (req.url.endsWith('/')) {
      // Treat directories (including root) as a request for index.html
      req.url += 'index.html';
    }
    // Strip parameters to find the underlying file.
    if (req.url.indexOf('?') > -1) {
      req.url = req.url.substr(0, req.url.indexOf('?'));
    }
    if (req.url.indexOf('.') === -1) {
      // Treat locations without an extension as html, allowing short urls like simpatico.io/wp
      req.url += ".html"
    }

    // Check the cache for the file, if not present read off disk and add to cache. If present, use cache.
    // todo: add gzip cache, too. see https://nodejs.org/api/zlib.html#compressing-http-requests-and-responses
    const fileName = process.cwd() + req.url;
    if (config.useCache && hasProp(cache, fileName)) {
      respondWithData(cache[fileName]);
    } else {
      fs.readFile(fileName, (err, data) => {
        if (DEBUG) debug('cache miss for', fileName);
        if (err) { // assume all errors are a 404. pareto
          respondWithError(Object.assign(new Error(), {
            code: 404,
            log: 'resource not found',
            message: 'Not found. \n' + failWhale,
          }));
          return;
        }
        if (fileName.endsWith('.md')){
          if (DEBUG) debug('making markdown', fileName, data);
          data = markdown.makeHtml(data + '');
          data = header(fileName.replace(/^.*(\\|\/|\:)/, '')) + data + footer;
        }
        if (config.useCache) {
          cache[fileName] = data;
        }
        respondWithData(data);
      });
    }
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
    // Ignore long messages
    if (message.length > 300) {
      ws.send('your message was too long');
      return;
    }

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

const failWhale = `
 ___        _  _       __      __ _           _
| __| __ _ (_)| |      \\ \\    / /| |_   __ _ | | ___
| _| / _\` || || |       \\ \\/\\/ / |   \\ / _\` || |/ -_)
|_|  \\__/_||_||_|        \\_/\\_/  |_||_|\\__/_||_|\\___|
  `
const header = (title='Simpatico') => `
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
`;
const footer = ``;
