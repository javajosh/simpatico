// Static file-server
// =====================================================
const fs = require('fs');
const http = require('http');

const ports = {http:8080, ws: 8081};

http.createServer((req, res) => {
  console.log(req.url);
  if (req.url === '/') req.url = '/index.html';
  fs.readFile(__dirname + req.url, (err,data) => {
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
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: ports.ws });

const connections = [];

wss.on('connection', ws => {
  // Compute the connection ID, broadcast to all connections.
  const id = connections.length;
  connections.forEach(conn=>conn.send(`Connection made id ${id}`));
  connections.push(ws);

  // Listen for messages on each connection.
  ws.on('message', message => {
    // Broadcast every message to every client.
    connections.forEach(conn=>conn.send(`${id}> ${message}`));
    console.log(`Broadcast message => ${id}> ${message}`);
  });

});

console.log(`Listening for http on port ${ports.http} and websockets on port ${ports.ws}`)


// A WebSocket client  - see index.html
// =====================================================
/* <script>
    const url = 'ws://localhost:8081/';
    const conn = new WebSocket(url);
    conn.onopen = () => conn.send('hey');
    conn.onmessage = e => console.log(e.data);
    conn.send('well, that was fun.');
  </script>
*/

