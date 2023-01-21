// Reflector is a static file server and a web socket server
// =====================================================
import fs from 'node:fs';
import http from 'node:http';
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
const configString = args.length ? args[0]
  .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
  .replace(/:(['"])?([a-zA-Z0-9\\.]+)(['"])?/g, ':"$2"')
  : "{}";

const config = Object.assign(configDefault, JSON.parse(configString));
console.log('Reflector v0.0.3', config);
console.log("UTC", new Date().toUTCString(), process.cwd(), args);

// Http file server
http.createServer((req, res) => {
  console.log(req.socket.remoteAddress, req.url, req.headers["user-agent"].substr(0,15));
  if (req.url === '/') req.url = '/index.html';
  fs.readFile(process.cwd() + req.url, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('insert cute fail whale type picture here');
      console.error(JSON.stringify(err));
      return;
    }
    res.writeHead(200, getMimeTypeHeader(req.url));
    res.end(data);
  });
}).listen(config.http);
// A simple file-extension/MIME-type map. Not great but it avoids a huge dependency.
const mime = {
  "html": "text/html",
  "js"  : "application/javascript",
  "json": "application/json",
  "css" : "text/css",
  "svg" : "image/svg",
}
const getMimeTypeHeader = (filename, defaultMimeType='text') => {
  const ext = path.extname(filename).slice(1);
  const type = mime[ext] ? mime[ext] : defaultMimeType;
  return {"content-type": type};
}


// WebSocket server
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

// TODO - add HTTPS; simulate other domain names with hosts file;
console.log(`Listening for http on port ${config.http} and websockets on port ${config.ws}.
 Start http://${config.host}:${config.http}/`)

