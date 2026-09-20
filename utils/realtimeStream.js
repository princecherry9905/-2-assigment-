/**
 * EcoLoop 1-to-1 Realtime Event Stream Manager (Server-Sent Events)
 */

const clients = new Set();

exports.initSSE = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add connected client
  clients.add(res);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date() })}\n\n`);

  req.on('close', () => {
    clients.delete(res);
  });
};

exports.broadcast = (eventType, data) => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
};
