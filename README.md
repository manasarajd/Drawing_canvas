# Drawing_canvas
A real-time multi-user drawing application where people can draw together on a shared canvas — live!
Built with Vanilla JavaScript, HTML5 Canvas, and Node.js + Socket.IO.

LIVE DEMO: https://drawing-canvas-hpxe.onrender.com
Open it in two different tabs or browsers — draw on one, and see it appear instantly on the other 

OVERVIEW:
This project was created as part of an assignment to test real-time synchronization, canvas rendering efficiency, and clean architecture without relying on heavy frontend frameworks.

It supports:

-->Live collaborative drawing (real-time updates via WebSockets)

-->Multiple users drawing simultaneously on the same canvas

-->Brush & Eraser tools

-->Adjustable color and stroke width

-->Undo / Redo placeholders (future global history support)

-->User connection indicators

-->Robust WebSocket connection handling (auto-reconnect, error recovery)

FEATURES BREAKDOWN:
Canvas Drawing	--> Users can draw smooth, continuous strokes using mouse input.
Eraser Tool -->	Erase parts of the drawing using background-colored strokes.
Color Picker & Width Control -->	Choose any brush color and line width dynamically.
Real-Time Sync -->	Every stroke is broadcast to all connected clients instantly via Socket.IO.
User Management -->	Each connected client is tracked via unique socket.id.
Global Undo/Redo -->	(Architecture-ready) — central history maintained per session.
Connection Resilience -->	Reconnects automatically if network drops.
TECH STACK:
Frontend layer:	HTML5, CSS3, Vanilla JS	Canvas rendering, UI controls
Real-time Engine:	Socket.IO	WebSocket-based live sync
Backend layer:	Node.js (Express + HTTP)	WebSocket server + static file hosting
Hosting layer:	Render	Persistent WebSocket-compatible hosting
PROJECT STRUCTURE:
Drawing_canvas/
├── client/
│   ├── index.html          
│   ├── style.css           
│   ├── canvas.js           
│   ├── websocket.js        
│   └── main.js             
├── server/
│   ├── server.js           
│   ├── rooms.js            
│   └── drawing-state.js    
├── package.json            
├── package-lock.json
└── README.md               

SETUP INSTRUCTIONS:
Run Locally
1.Clone the repository
git clone https://github.com/manasarajd/Drawing_canvas.git
cd Drawing_canvas
2.Install dependencies
npm install
3.Start the server
npm start
4.Open the app
http://localhost:3000
Open the URL in two browser windows — both will see each other’s drawings live!
Deploy on Render (or similar)
1.Push this repo to GitHub.
2.On Render, create a New Web Service.
3.Use these settings:
Build Command =	npm install
Start Command	= npm start
Environment Variable =	PORT = 3000

4.Click Deploy Web Service.

5.Wait for deployment → You’ll get a URL like:
https://drawing-canvas-hpxe.onrender.com

How It Works
Canvas Logic (Client Side)
The client captures mouse events (mousedown, mousemove, mouseup).
Each line segment is rendered locally and sent via WebSocket.
Other clients receive that event and draw it on their own canvas.
WebSocket Communication (Socket.IO)
Client emits:
Net.sendStroke({ x0, y0, x1, y1, color, width });
Server broadcasts:
socket.broadcast.emit("stroke:apply", stroke);
Clients listen:
Net.on("stroke:apply", (stroke) => {
  Canvas.drawLine(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.width);
});
Known Limitations:
Undo/Redo currently local — not synchronized globally yet.
No persistent drawing state (refresh clears canvas).
User cursors not yet broadcast.
Some delay on large stroke bursts under high latency.

Future Enhancements:
Add cursor indicators for all connected users.
Implement server-side drawing history and global undo/redo.
Multi-room support (separate canvases per group).
Add pressure sensitivity for touch devices.
Save canvas to image file or cloud storage.

Known Issues & Troubleshooting:
Symptom	Likely Cause	Fix
connecting... never changes	Wrong socket URL / CORS issue	Use window.location.origin and enable CORS in server
No drawing sync	socket.broadcast.emit missing	Check server/server.js logic
Vercel deployment fails	Vercel doesn’t support persistent WebSockets	Use Render, Railway, or Glitch
White screen	Missing /client static path	Ensure express.static is set correctly

License:
This project is licensed under the MIT License — feel free to fork, learn, and build on it!

Final Note:
This project was built to demonstrate real-time architecture mastery using simple, pure web technologies.
No frameworks, no magic — just raw JavaScript, WebSockets, and creative problem solving.

If you’re viewing this on GitHub, try the live demo — and draw something cool! 
