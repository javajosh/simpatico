// Static file-server
// =====================================================
import fs from 'fs';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';

const ports = {http:8080, ws: 8081};
console.log('Josh', process.cwd());

http.createServer((req, res) => {
  console.log(req.url);
  if (req.url === '/') req.url = '/index.html';
  fs.readFile(process.cwd() + req.url, (err,data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(ports.http);


// WebSocket server
// =====================================================

const wss = new WebSocketServer({ port: ports.ws });

const connections = [];

wss.on('connection', ws => {
  // Compute the connection ID,
  const id = connections.length;

  // Announce new ID to all connections.
  connections.forEach(conn => {
    conn.send(`0 > ${id}`);
    console.log(`Announce new connection message => ${id}`);
  });
  // Store the connection for later.
  connections.push(ws);

  // Register a callback for messages sent from that connection.
  // In this simple case, just do maximum fan out and broadcast to all connections.
  ws.on('message', message => {
    // Broadcast every message to every client.
    connections.forEach(conn => {
      // message ? message : "NOT PROVIDED";
      try{
        if (conn.readyState !== WebSocket.OPEN) return;
        const msg = `${id} > ${message}`;
        conn.send(msg); // Q: can this ever block?
        console.log(`Broadcast message => ${msg}`);
      } catch(e) {
        console.error(e);
      }
    });
  });
  // TODO clean up connections when they are lost, otherwise is a (slow) memory leak.
});

// TODO - add HTTPS; simulate other domain names with hosts file;
console.log(`Listening for http on port ${ports.http} and websockets on port ${ports.ws}. Start http://localhost:8080/ `)


// A WebSocket client  - see index.html
// =====================================================
/* <script>
    const url = 'ws://localhost:8081/';
    const conn = new WebSocket(url);
    conn.onopen = () => conn.send("I'm here!");
    conn.onmessage = e => console.log(e.data);
    conn.send("well, that was fun. bye.");
    conn.close();
  </script>
*/

