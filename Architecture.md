DATA FLOW OVERVIEW:
Every drawing action by a user (like a brush stroke) is captured on the client (via Canvas events), serialized into a data object, sent to the server through WebSocket,
broadcast to all connected clients, rendered instantly on each client’s canvas
+-------------+          +-----------------+          +-------------+
|   User A    |  ----->  |   Node.js Server|  ----->  |   User B    |
| (draws line)| (stroke) | (broadcast via  | (stroke) | (renders    |
|             |          |   Socket.IO)    |          |  received)  |
+-------------+          +-----------------+          +-------------+

       ^                                                       |
       |                                                       |
       +---------------------- feedback -----------------------+
WEB SOCKET PROTOCOL:
Client → Server (room:join)
Client → Server (stroke:apply)
Server → Client (stroke:apply)
Server → Client (connect/disconnect)
UNDO REDO STRATEGY:
Currently, the app supports local undo placeholders, but is architected for global shared history.
PERFORMANCE DECISIONS:
Line Segment Batching: Each stroke is sent as start–end points, not individual pixels
Client-side Prediction: Draw locally first, then sync
WebSocket Compression Disabled: (Socket.IO default) for small messages
Efficient Redraw Logic :No full-canvas redraw; only incremental
CORS-Free Deployment Config: cors: { origin: "*" }
Forced WebSocket Transport: transports: ["websocket"]
CONFLICT RESOLUTION:
Since multiple users can draw at the same location simultaneously, we adopted a "last-write-wins" approach. Minor overlaps
are possible but visually negligible — and it feels instant and collaborative rather than restrictive.
