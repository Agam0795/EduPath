// Simple Server-Sent Events (SSE) manager for marks updates
const clientsByStudent = new Map(); // studentId -> Set<res>

function subscribe(studentId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write('\n');

  const set = clientsByStudent.get(studentId) || new Set();
  set.add(res);
  clientsByStudent.set(studentId, set);

  const cleanup = () => {
    set.delete(res);
    if (set.size === 0) clientsByStudent.delete(studentId);
  };

  reqOnClose(res, cleanup);
}

function reqOnClose(res, cb) {
  // Node's response has 'close' event when client disconnects
  res.on('close', cb);
  res.on('finish', cb);
}

function publish(studentId, event, payload) {
  const set = clientsByStudent.get(studentId);
  if (!set || set.size === 0) return;
  const data = JSON.stringify({ event, payload, ts: Date.now() });
  for (const res of set) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      // ignore individual send errors
    }
  }
}

module.exports = { subscribe, publish };
