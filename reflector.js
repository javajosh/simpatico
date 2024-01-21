import process from 'node:process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

import WebSocket, { WebSocketServer } from 'ws';
import chokidar from 'chokidar';

import { info, error, debug, mapObject, hasProp, parseObjectLiteralString, peek } from './core.js';
import { combine, combineAllArgs } from './combine.js';
import { stree3 as stree } from './stree3.js';
import {buildHtmlFromLiterateMarkdown} from './litmd.js';

const log = (...args) => {
  if (config.debug)
    console.log('reflector.js:log', ...args);
}

// Reflector global config
let DEBUG = true; // This is mutated by processConfig
const hiddenConfigFields = {password: '******', jdbc: '******'};
const elide = (obj, hide=hiddenConfigFields) => DEBUG ? obj : combine(obj, hide);

// Reflector global dynamic state
let cache = {}; // used by the http/s fileserver
initFileWatchingCacheInvalidator(cache);

// Reflector boot up - config and bind
const config = processConfig();
info(`reflector.js [${JSON.stringify(elide(config), null, 2)}]`);
const bindStatus = bindToPorts();
info( 'bound', bindStatus);

// We are bound to port 443 (and probably 80) so we can drop privileges
if (config.runAsUser) dropProcessPrivs(config.runAsUser);

// Reflector booted! Print out welcome message.
const url = `https://${config.hostname}:${config.https}`;
info("File server format is [iso date] [req.socket.remoteAddress] [req.headers[user-agent]] [req.url] (? => [normalized url)");
info(`Initialization complete. Open ${url}/working.md`);
if (process.send) process.send(config);

// ================================================================
// The remainder of the file are supporting functions for the above
// ================================================================
function processConfig(envPrefix='SIMP_') {
  //hardcoded defaults, usually best for new devs
  const baseConfig = {
    http: 8080,
    https: 8443,
    hostname: 'localhost',
    cert: './fullchain.pem',
    key: './privkey.pem',
    runAsUser: '',
    useCache: false,
    useGzip: true,
    useTls: false,
    password: 's3cret',
    logFileServerRequests: true,
    superCacheEnabled: false,
    debug: false,
    // measured: {},      //added below
  };
  const envConfig = mapObject(baseConfig, ([key,_]) => ([key, process.env[`${envPrefix}${key.toUpperCase()}`]]));
  const hasArgument = process.argv.length >= 3; // first arg is node, second arg is reflector, third arg are for us here.
  const argConfig = hasArgument ? parseObjectLiteralString(process.argv[2]) : {};

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

  // Mutate DEBUG to be consistent with conflig.debug
  DEBUG = config.debug;

  if (DEBUG) debug('DEBUG=true Here are all configs:',
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

  // We always bind to http
  // if we're using tls (the usual case), use redirect server logic
  // if we're not using tls (in a debugging situation, perhaps), use file server logic
  try {
    const httpLogic = config.useTls ?  httpRedirectServerLogic : fileServerLogic();
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

  if (config.useTls) {
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

  // Create a webSocket server, sharing http/s connectivity
  try{
    const wss = new WebSocketServer({server: config.useTls ? httpsServer : httpServer});
    wss.on('connection', chatServerLogic);
    result.ws = config.useTls ? config.https : config.http;
  } catch (e) {
    console.error('abort: problem spinning up ws server', e);
    throw e;
  }
  return result;
}

function dropProcessPrivs(user) {
  try{
    process.seteuid(user);
    info('dropProcessPrivs succeeded', user)
  } catch(e) {
    warn('dropProcessPrivs failed', user, e);
  }
}

function httpRedirectServerLogic (req, res) {
  if (DEBUG) console.debug(`http request: ${req.url}`)
  // Let letsencrypt check my control of the domain.
  // See https://eff-certbot.readthedocs.io/en/stable/using.html#webroot

  if (req.url.startsWith('/.well-known/acme-challenge')){
    res.writeHead(200);
    try{
      // do not allow arbitrary file access
      // See https://datatracker.ietf.org/doc/rfc8555/ section 8.3
      // test with { echo "GET /.well-known/acme-challenge/asdflk309234ldf"; echo "\n"; sleep 1; } | telnet simpatico.local 8080
      const validAcmeTokenRegex = /^[a-zA-Z0-9_-]+$/;
      const token = req.url.split('/')[3];
      if (!validAcmeTokenRegex.test(token)) {
        throw 'bad acme challenge token ' + token;
      } else{
        const fileName = process.cwd() + req.url;
        const localSecret = fs.readFileSync(fileName);
        res.end(localSecret);
      }
    } catch (e) {
      const err = `unable to serve acme challenge ${req.url} : ${e}`;
      console.error(err);
      res.writeHead(404, err);
      res.end();
    }

    return;
  }
  // Everything else, redirect permanently to https
  // test with { echo "GET /"; echo "\n"; sleep 1; } | telnet simpatico.local 8080
  const redirectUrl = `https://${config.hostname}:${config.https}${req.url}`;
  res.writeHead(308, {Location: redirectUrl});
  res.end()
}

function fileServerLogic() {
  // A simple file-extension/MIME-type map. Not great but it avoids a huge dependency.
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  const mime = {
    "html": "text/html",
    "js"  : "application/javascript",
    "mjs" : "application/javascript",
    "json": "application/json",
    "css" : "text/css",
    "svg" : "image/svg+xml",
    "wasm": "application/wasm",
    "pdf" : "application/pdf",
    "md"  : "text/html",
    "png" : "image/x-png",
    "jpg" : "image/jpeg",
    "jpeg": "image/jpeg",
    "woff2": "font/woff2", // see https://github.com/w3c/woff
  }
  /**
   * Required for most browsers to use SharedArrayBuffer and load wasm.
   * See  https://getpocket.com/read/3784699081
   */
  const getCrossOriginHeaders = ()=> ({
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  });

  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
  const getContentSecurityPolicyHeaders = () => ({
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src  'self' 'unsafe-inline'",
      "img-src 'self' data:"
    ].join(';')
  });

  const getContentTypeHeader = (filename, defaultMimeType='text') => {
    const ext = path.extname(filename).slice(1);
    const type = mime[ext] ? mime[ext] : defaultMimeType;
    const useGzip = config.useGzip && !isCompressedImage(filename);
    return {
      "Content-Type": type,
      "Content-Encoding": (useGzip ? "gzip" : ""),
    };
  }

  // For primary resources, use an etag
  // For sub-resources, cache forever and rely on unique urls to update.
  // See https://httpwg.org/specs/rfc9110.html#field.accept-encoding
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
  const getCacheHeaders = (filename, fileData) => {
    const result = {};
    const isPrimaryResource = filename.endsWith('.html') || filename.endsWith('.md');

    if (isPrimaryResource){
      // Tell the browser check for updates before using the cached version.
      // It will get a 304 not modified if the etag matches.
      result["ETag"] = crypto.createHash("sha256").update(fileData).digest("hex");
      result["Cache-Control"] = "no-cache";
    } else {
      // The browser caches sub-resources forever
      // We rely on cache-busting urls to update them.
      if (config.superCacheEnabled) {
        result["Cache-Control"] = "public, max-age=31536000, immutable";
      } else {
        result["Cache-Control"] = "no-cache";
      }
    }
    return result;
  }

  return (req, res) => {
    const respondWithError = (err) => {
      res.writeHead(err.code);
      res.end(err.message);
    }
    const respondWithData = data => {
      res.writeHead(
        200,
        Object.assign(
          getContentTypeHeader(urlToFileName(req.url)),
          getCacheHeaders(urlToFileName(req.url), data),
          getCrossOriginHeaders(),
          getContentSecurityPolicyHeaders(),
        )
      );
      res.end(data);
    }
    const respondWith304 = () => {
      res.writeHead(304);
      res.end('you have the most recent version');
    }
    const logRequest = req => {
      const fileName = urlToFileName(req.url);
      const normalized = (fileName !== req.url);
      // For some reason node 18 and 19 on unbuntu 22 just refused optional chaining syntax.
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
      console.log(
        new Date().toISOString(),
        req.socket.remoteAddress.replace(/^.*:/, ''),
        req.headers["user-agent"].substr(0, 20),
        req.url,
        (normalized ? '=>' + fileName : ''),
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

    if (config.logFileServerRequests) logRequest(req);

    /**
     * Turn url string into a specific filename.
     * 1. Strip arguments
     * 2. If it's a directory access, pick index.html or readme.md in that order of preference.
     * 3. If it's missing an extension, pick md or html in order of preference.
     * 4. If nothing matches, throw an exception and rely on calling code to 404.
     *
     * @param path The full URL being requested. E.g. '/chat' or '/svg'
     * @returns {string} A "normalized" URL e.g. '/chat.html' or '/svg.md'
     */
    function urlToFileName (path) {
      const cwd = process.cwd();
      // strip out parameters
      if (path.indexOf('?') > -1)   {
        path = path.substr(0, path.indexOf('?'));
      }
      const c = candidates(path);
      let found;
      c.map(candidate => {
        let candidatePath = cwd + '/' + candidate;
        if (fs.existsSync(candidatePath)) {
          found = candidatePath;
        }
      });
      if (found){
        return found;
      } else {
        throw 'no candidate found for path ' + path + ' ' + c;
      }
    }

    function candidates(path){
      if (path.endsWith('/')){
        return [path + 'index.md', path + 'index.html'];
      }
      const parts = path.split('/');
      if (parts.some(part => part.startsWith('.'))){
        throw 'invalid path: ' + path;
      }
      const last = peek(parts);
      const isFile = /\./.test(last);
      return (isFile) ?  [path] : [path + '.md', path + '.html', path + '/index.md', path + '/index.html'];
    }


    let fileName;
    try {
      fileName = urlToFileName(req.url);
    } catch (err){
      log(err.message);
      respondWithError(Object.assign(err, {
        code: 404,
        message: 'Resource not found. \n' + failWhale,
      }));
      return;
    }
    let data = '';
    let hash = '';
    if (config.useCache && hasProp(cache, fileName)) {
      data = cache[fileName];
      hash = sha256(data);
    } else {
      // We missed the cache, so initiate a read file.
      if (config.useCache)
        log('cache miss for', fileName);
      try {
        // This function isn't inlined because its also called in the sub-resource
        const fromDisk = readProcessCache(fileName);
        data = fromDisk.data;
        hash = fromDisk.hash;
      } catch (err) {
        log(err.message);
        respondWithError(Object.assign(err, {
          code: 500,
          message: 'Error processing resource. \n' + failWhale,
        }));
        return;
      }
    }


    // The browser may already have the most recent version.
    // TODO: store this hash in the cache somewhere.
    if (req.headers['if-none-match'] === hash){
      respondWith304();
    } else {
      respondWithData(data);
    }
  }
}
function readProcessCache(fileName) {
  // Grab the data from disk
  let data = fs.readFileSync(fileName);
  let hash = sha256(data);

  // 1. Convert literate markdown to html
  data = buildHtmlFromLiterateMarkdown(data, fileName);

  // 2. In html, replace sub-resource links with cache-busting urls
  if (config.superCacheEnabled) data = replaceSubResourceLinks(data, fileName);

  // 3. Gzip not already compressed resources.
  if (config.useGzip && !isCompressedImage(fileName))
    data = zlib.gzipSync(data);

  // 4. Cache it
  if (config.useCache)
    cache[fileName] = data;

  return {data, hash};
}

/**
 * find all the links to sub-resources and replace them with cache-busting urls
 * this is too ambiguous so we rely on the author to signal when to do this.
 *
 * @param maybeHTML
 * @param fileName
 * @returns {*}
 */
function replaceSubResourceLinks (maybeHTML, fileName){
  const isHTML = fileName.endsWith('.html');
  const isMD = fileName.endsWith('.md');
  if (!isHTML && !isMD) return maybeHTML;
  let html = maybeHTML.toString();

  // See https://regex101.com/r/r0XQMV/1
  const re = /(["`'])(.*?)\?\#\#\#\1(.*?)/g;

  // exec updates the lastIndex of the re on each invocation.
  // not how I would design it, but whatever.
  let match;
  while ((match = re.exec(html)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === re.lastIndex) {
      re.lastIndex++;
    }

    // The full url including placeholder path is the match itself
    // group 2 contains just the sub-resource path.
    if (match.length === 4) {
      const url = match[0];
      const resource = match[2];
      const subResourceHash = readProcessCache(resource);
      const newUrl = `"${resource}?${subResourceHash}"`;
      html = html.replace(url, newUrl);
    }
  }
  return html;
}

function sha256(data){
  return crypto.createHash("sha256").update(data).digest("hex");
}
function isCompressedImage(fileName) {
  return (
    fileName.endsWith('.png') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.gif')
  );
}
  function initFileWatchingCacheInvalidator(cache, watchRecursive='.', debug=DEBUG) {
  // Make a file cache and watch for file changes to invalidate it.
  // See https://nodejs.org/docs/latest-v18.x/api/fs.html#fswatchfilename-options-listener
  // fs.watch('.', {recursive: true, persistent: false}, (eventType, filename) => {delete cache[filename]});
  // Sigh, this doesn't work on linux will need to use https://github.com/paulmillr/chokidar instead
  chokidar.watch(watchRecursive, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  }).on('change', fileName => {
    const path = process.cwd() + '/' + fileName;
    delete cache[path];
    log(`cache invalidated "change" ${path}`);
  })
  .on('unlink', fileName => {
    const path = process.cwd() + '/' + fileName;
    delete cache[path];
    log(`cache invalidated "unlink" ${path}`);
  });
}

const connections = stree({});
/**
 * This is the main entry point for the chat server, triggered by a new connection.
 * This method makes use of global 'connections'
 *
 * @param ws - the new websocket connection
 */
function chatServerLogic(ws) {
  // Register the connection, always branch from root
  connections.add({ws}, 0);

  // Register a strategy for handling incoming messages in the steady state.
  ws.on('message', msg => handleMessage(msg, connections.branchIndex));
}


function handleMessage(message, branchIndex){
  const connection = connections.branchResidues[branchIndex];

  // Ignore long messages
  if (message.length > 300) {
    connection.ws.send('your message was too long');
    return;
  }
  // Broadcast to all connections
  //  NB: using a for-loop instead of foreach makes the stack traces nicer.
  for (let i = 0; i < connections.branchResidues.length; i++) {
    let conn = connections.branchResidues[i].ws;
    // normally we skip the sender, but for testing we can echo back to the sender.
    // if (conn.ws === ws) return;
    try{
      // Delete dead connections
      if (typeof conn === 'undefined' || conn.readyState !== WebSocket.OPEN) {
        log(`connection ${i} died, deleting`);
        // delete connections[i];
        continue;
      }
      // Prepend the sender id to the message.
      const msg = `${branchIndex} > ${message}`;
      // Send and log
      conn.send(msg);
      log('chatServerLogic', 'branchIndex', branchIndex, 'to', i, 'message', message + '');

    } catch(e) {
      // Q: what all can go wrong here?
      console.error(e);
    }
  }
}

const failWhale = `
 ___        _  _       __      __ _           _
| __| __ _ (_)| |      \\ \\    / /| |_   __ _ | | ___
| _| / _\` || || |       \\ \\/\\/ / |   \\ / _\` || |/ -_)
|_|  \\__/_||_||_|        \\_/\\_/  |_||_|\\__/_||_|\\___|
`;

