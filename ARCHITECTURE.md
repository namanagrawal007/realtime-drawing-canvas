# Collaborative Drawing App - Architecture

## Overview
A real-time collaborative drawing application where multiple users can draw simultaneously on the same canvas. Built with Vanilla JS/HTML/CSS frontend and Node.js/Socket.io backend.

## System Architecture

### Backend Architecture

```
server.js (Entry Point)
├── Express HTTP Server
├── Socket.io Server
└── RoomManager
    ├── Rooms Map
    │   ├── Room A
    │   │   ├── DrawingState
    │   │   │   ├── strokes[]
    │   │   │   └── undoneStrokes[]
    │   │   └── users Map
    │   └── Room B
    │       └── ...
    └── API Handlers
        ├── join-room
        ├── draw-stroke
        ├── cursor-move
        ├── undo/redo
        ├── clear-canvas
        └── disconnect
```

#### Key Backend Components

**server.js**
- Initializes Express and Socket.io servers
- Manages WebSocket connections and events
- Handles room joining, drawing synchronization, and user management

**rooms.js (RoomManager)**
- Manages isolated drawing rooms
- Tracks users in each room
- Delegates drawing state to DrawingState instances
- Handles user join/leave logic

**drawing-state.js (DrawingState)**
- Maintains array of strokes for a room
- Implements undo stack (removed strokes)
- Implements redo stack (undone strokes)
- Provides methods to add/remove strokes and manage history

### Frontend Architecture

```
index.html
├── Header (Toolbar)
│   ├── Tool Selection (Brush, Eraser)
│   ├── Color Picker
│   ├── Stroke Width Control
│   ├── Action Buttons (Undo, Redo, Clear)
│   └── Stats Display (FPS, Latency, User Count)
├── Canvas Container
│   ├── Drawing Canvas (Primary)
│   └── Cursor Canvas (Overlay - read-only)
├── Sidebar (Online Users List)
└── Join Modal (Initial Entry)

style.css (Styling)
├── Light Theme Colors
├── Responsive Layout
├── Toolbar Styling
├── Canvas Styling
└── Sidebar Styling

JavaScript Modules
├── canvas.js (CanvasManager)
├── websocket.js (WebSocketManager)
└── main.js (App Initialization & Control Logic)
```

#### Key Frontend Components

**canvas.js (CanvasManager)**
- Manages 2D canvas drawing operations
- Handles brush and eraser tools
- Tracks stroke points and draws them progressively
- Manages other users' cursor display
- Calculates and displays FPS
- Handles touch and mouse events

**websocket.js (WebSocketManager)**
- Establishes Socket.io connection
- Emits drawing events (strokes, cursor movement, undo/redo)
- Receives remote drawing updates
- Tracks network latency with ping/pong
- Manages user list and connection state

**main.js**
- Initializes CanvasManager and WebSocketManager
- Sets up UI event handlers
- Connects backend callbacks to frontend rendering
- Manages tool selection and settings
- Updates statistics display

## Data Flow

### Drawing Stroke Flow

```
User Draws
    ↓
canvas.js: startDrawing() → draw() → stopDrawing()
    ↓
Stroke created with: {tool, color, width, points[]}
    ↓
onStrokeComplete callback triggered
    ↓
websocket.js: emitStroke(stroke)
    ↓
Socket.io: emit('draw-stroke', stroke)
    ↓
server.js: receive 'draw-stroke' event
    ↓
DrawingState: addStroke(stroke)
    ↓
Broadcast to room: socket.to(roomId).emit('draw-stroke', stroke)
    ↓
Other clients: receive 'draw-stroke'
    ↓
websocket.js: onDrawStroke callback
    ↓
canvas.js: addRemoteStroke(stroke)
    ↓
Render on remote canvas
```

### Undo/Redo Flow

```
User presses Ctrl+Z
    ↓
main.js: undoBtn.click()
    ↓
websocket.js: emitUndo()
    ↓
server.js: receive 'undo' event
    ↓
DrawingState: undo() → pop from strokes, push to undoneStrokes
    ↓
Broadcast: io.to(roomId).emit('undo', strokeIndex)
    ↓
All clients (including sender): receive 'undo'
    ↓
canvas.js: removeLastStroke()
    ↓
Redraw all remaining strokes
```

### Cursor Tracking Flow

```
User moves mouse
    ↓
canvas.js: draw() → onCursorMove(pos)
    ↓
websocket.js: emitCursorMove(x, y)
    ↓
Socket.io: emit('cursor-move', {x, y})
    ↓
server.js: broadcast to room with userId
    ↓
Other clients: receive 'cursor-move'
    ↓
websocket.js: onCursorMove callback
    ↓
canvas.js: updateOtherCursor(userId, username, color, x, y)
    ↓
Animation loop: drawCursors()
    ↓
Render cursor on cursor canvas overlay
```

## Room Management

- Rooms are created on-demand when first user joins
- Each room has isolated DrawingState
- Each room tracks connected users
- Rooms are deleted when last user leaves
- Users receive full canvas state (all strokes) on join
- New users see current drawing immediately

## Synchronization Strategy

**Eventual Consistency:**
- New users joining receive full stroke history
- Undo/redo operations are broadcast to all users
- Clear canvas is broadcast to all users

**Stroke Ordering:**
- Strokes are added sequentially to maintain order
- All clients render in same order
- No conflicts or race conditions

**Cursor Position:**
- Cursor positions are ephemeral (not persisted)
- Updated frequently (on mouse move)
- No critical if some updates are lost

## Performance Considerations

**Canvas Rendering:**
- Strokes drawn incrementally (not full redraw each frame)
- Separate cursor canvas overlay prevents redraw of drawing
- Animation loop runs at 60fps (requestAnimationFrame)

**Network Optimization:**
- Cursor updates sent only on mouse move (not throttled but selective)
- Full stroke sent only after completion (batch points)
- Latency measured every 2 seconds

**Memory Management:**
- Strokes stored in memory (suitable for session-length drawings)
- Old completed strokes kept for undo/redo
- No automatic cleanup (user must clear canvas)

## State Consistency

**Global State:**
- All users in same room see identical drawing state
- Undo/redo operations are synchronized globally
- No local-only undo/redo (all operations are global)

**User-Specific State:**
- Tool selection (brush/eraser) is local
- Color picker selection is local
- Stroke width is local
- Cursor display is computed from received positions

## Error Handling

**Connection Loss:**
- Socket.io automatic reconnection
- User removed from room after disconnect
- Other users notified of departure

**Invalid Operations:**
- Empty strokes ignored
- Undo on empty state handled gracefully
- Redo with no undone strokes handled gracefully

## Scalability

**Current Implementation:**
- Single server instance
- In-memory room storage
- Suitable for small to medium concurrent users

**Limitations:**
- No persistence (drawings lost on server restart)
- No horizontal scaling
- Memory grows with number of strokes

**Future Enhancements:**
- Database persistence (Supabase)
- Drawing history snapshots
- Horizontal scaling with Redis
- Rate limiting per user
