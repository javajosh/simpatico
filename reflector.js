// Reflector is a static file server and a web socket server
// =====================================================
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import WebSocket, { WebSocketServer } from 'ws';

// let tls;
// try {
//   tls = await import('node:tls');
// } catch (err) {
//   console.log('Cannot start without tls support; use a different node build.');
//   return;
// }

const ports = {http: 8080, ws: 8081};
console.log('Reflector v0.0.3', ports);
console.log("UTC", new Date().toUTCString(), process.cwd());

// Http file server
http.createServer((req, res) => {
  console.log(req.url);
  if (req.url === '/') req.url = '/index.html';
  fs.readFile(process.cwd() + req.url, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200, getMimeTypeHeader(req.url));
    res.end(data);
  });
}).listen(ports.http);
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
const wss = new WebSocketServer({ port: ports.ws });
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
console.log(`Listening for http on port ${ports.http} and websockets on port ${ports.ws}. Start http://localhost:8080/ `)

