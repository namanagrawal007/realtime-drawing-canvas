# Collaborative Drawing App

A real-time collaborative drawing application where multiple users can draw simultaneously on the same canvas with live cursor tracking, undo/redo, and performance monitoring.

## Features

### Drawing Tools
- **Brush** - Draw smooth freehand strokes
- **Eraser** - Erase portions of the drawing
- **Color Picker** - Select any color for drawing
- **Stroke Width** - Adjust brush thickness (1-50px)

### Real-Time Collaboration
- Multiple users draw simultaneously
- Live synchronization of strokes
- See other users' cursors with their names and colors
- Online user list with color indicators

### Undo/Redo
- Global undo/redo across all users
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
- Clear canvas for everyone
- Full stroke history maintained

### Performance Monitoring
- **FPS Counter** - Real-time frame rate display
- **Network Latency** - Ping/pong latency measurement
- **Online Users** - Live count of connected users

### User Experience
- Light, minimal UI theme
- Responsive design for all screen sizes
- Touch support (mobile-friendly)
- Join room system for multiple drawing sessions
- Auto-generated user colors

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd collaborative-drawing-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser:
   - Navigate to `http://localhost:3000`
   - Enter your name and room ID
   - Click "Join Room" to start drawing

## Usage

### Joining a Room

1. When you first load the app, a join modal appears
2. Enter your name (required)
3. Enter a room ID (optional, defaults to "default")
4. Click "Join Room"
5. Your color will be automatically assigned

### Drawing

1. **Select Tool**: Click the brush or eraser button in the toolbar
2. **Choose Color**: Click the color preview to open the color picker
3. **Adjust Width**: Use the stroke width slider (1-50px)
4. **Draw**: Click and drag on the canvas
5. **Watch Others**: See other users' cursors as they draw

### Editing

- **Undo**: Press Ctrl+Z (Cmd+Z on Mac) or click the undo button
- **Redo**: Press Ctrl+Shift+Z (Cmd+Shift+Z on Mac) or click the redo button
- **Clear Canvas**: Click the clear button (requires confirmation)

### Multiplayer Sessions

- Share your room ID with others
- They enter the same room ID to join your session
- All strokes are synced in real-time
- Users can join/leave anytime

## Project Structure

```
collaborative-drawing-app/
├── server.js              # Express + Socket.io server
├── rooms.js               # Room management system
├── drawing-state.js       # Drawing state and undo/redo logic
├── index.html             # HTML structure and UI
├── style.css              # Styling (light theme)
├── canvas.js              # Canvas drawing engine
├── websocket.js           # WebSocket client manager
├── main.js                # Application initialization
├── package.json           # Dependencies
└── README.md              # This file
```

## Technical Stack

### Frontend
- **Vanilla JavaScript** - No frameworks, pure JS
- **HTML5 Canvas** - For drawing operations
- **Socket.io Client** - Real-time communication
- **CSS3** - Styling and responsive layout

### Backend
- **Node.js** - Runtime environment
- **Express.js** - HTTP server
- **Socket.io** - WebSocket server
- **In-Memory Storage** - Room and drawing state

## Architecture

### Client-Server Communication

The app uses WebSocket (Socket.io) for real-time communication:

- **draw-stroke** - Emit when user completes a stroke
- **cursor-move** - Emit when user moves mouse
- **undo/redo** - Emit when user performs undo or redo
- **clear-canvas** - Emit when user clears the canvas
- **join-room** - Emit when user joins a room
- **ping/pong** - For latency measurement

### Room Management

- Each room is identified by a unique room ID
- Multiple isolated drawing sessions can run simultaneously
- Users joining a room receive full drawing history
- Rooms are automatically cleaned up when empty

### Drawing State

- Strokes are stored as arrays of points with metadata
- Metadata includes: tool type, color, and stroke width
- Undo removes the last stroke from the history
- Redo restores previously undone strokes

## Performance

- **60 FPS** - Smooth drawing and animation
- **Low Latency** - Optimized Socket.io communication
- **Touch Support** - Mobile and tablet friendly
- **Responsive** - Automatically scales to window size

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Shift+Z / Cmd+Shift+Z | Redo |

## Troubleshooting

### Can't connect to server
- Make sure the server is running: `npm start`
- Check that port 3000 is not in use
- Try opening `http://localhost:3000` in your browser

### Drawing not syncing
- Check your network connection
- Verify all users are in the same room ID
- Look at the latency counter to check connection quality

### Canvas is blank
- Try refreshing the page
- Clear browser cache
- Restart the server

### Performance issues
- Check the FPS counter
- Close other browser tabs
- Reduce stroke width for faster rendering
- Try a simpler room with fewer users

## Development

### Running in Development Mode
```bash
npm start
```

The server will start on `http://localhost:3000` with automatic reload support for static files.

### File Organization

- **Frontend**: All client files (*.js, *.css, *.html) are served statically
- **Backend**: Server logic split across rooms.js and drawing-state.js for modularity
- **Communication**: WebSocket events defined in websocket.js and server.js

## Future Enhancements

- [ ] Database persistence (Supabase)
- [ ] Drawing history and snapshots
- [ ] Image export (PNG/SVG)
- [ ] Layers support
- [ ] Text tool
- [ ] Shape tools (rectangle, circle, line)
- [ ] Freehand selection
- [ ] Flood fill tool
- [ ] Line and curve tools
- [ ] Horizontal scaling with Redis

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the ARCHITECTURE.md for technical details
3. Open an issue on the repository
