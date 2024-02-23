/**
Example usage:
 const ws = new MockWebSocket('ws://example.com');

 ws.onopen = () => {
  console.log('Connection opened');
};

 ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

 ws.onclose = () => {
  console.log('Connection closed');
};

 ws.send('Hello, server!');
*/
class MockWebSocket {

  static CONNECTING = 0;
  static OPENING = 1;
  static OPEN = 2;
  static CLOSING = 3;
  static CLOSED = 4;
  static NEXT_ID = 0;

  constructor(url, delay=1000) {
    this.url = url;
    this.delay = delay;
    this.id = MockWebSocket.NEXT_ID++;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;

    this.connect();
  }

  connect() {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPENING;
      if (this.onopen) {
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          this.onopen();
        }, this.delay); // Simulating delay between OPENING and OPEN
      }
    }, this.delay); // Simulating connection delay
  }

  send(data) {
    if (this.readyState === MockWebSocket.OPEN) {
      console.log('Sent:', data);
    } else {
      console.error('Error: Connection not open.');
    }
  }

  close() {
    if (this.readyState === MockWebSocket.OPEN) {
      this.readyState = MockWebSocket.CLOSING;
      console.log('Socket closing');
      setTimeout(() => {
        this.readyState = MockWebSocket.CLOSED;
      }, this.delay); // Simulating delay between CLOSING and CLOSED
    } else {
      console.error('Error: Connection not open.');
    }
  }

  // Simulate a message receipt
  receive(message) {
    if (this.readyState === MockWebSocket.OPEN && this.onmessage) {
      this.onmessage({ data: message });
    }
  }

  // Simulate a remote message close
  remoteClose() {
    if (this.readyState === MockWebSocket.OPEN) {
      this.readyState = MockWebSocket.CLOSING;

      setTimeout(() => {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
          this.onclose();
        }
      }, this.delay); // Simulating delay between CLOSING and CLOSED
    }
  }
}

export {MockWebSocket}
