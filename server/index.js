const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createLobby,
  joinLobby,
  getLobby,
  startGame: markGameStarted,
  lobbies
} = require('./lobbyManager');

const {
  initGame,
  startRound,
  submitCV,
  submitVote,
  finalizeRound,
  getGameState,
  games
} = require('./gameManager');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Create lobby
  socket.on('create_lobby', (username, callback) => {
    const player = { id: socket.id, name: username };
    const lobby = createLobby(player);
    socket.join(lobby.code);
    callback(lobby);
    io.to(lobby.code).emit('lobby_update', lobby);
  });

  // Join lobby
  socket.on('join_lobby', (code, username, callback) => {
    const player = { id: socket.id, name: username };
    const lobby = joinLobby(code, player);
    if (!lobby) return callback({ error: 'Lobby not found or game already started' });

    socket.join(code);
    callback(lobby);
    io.to(code).emit('lobby_update', lobby);
  });

  // Rejoin after reconnect
  socket.on('rejoin_lobby', ({ code, username }, callback) => {
    const lobby = getLobby(code);
    if (!lobby) return callback({ error: 'Lobby not found' });

    const existing = lobby.players.find(p => p.name === username);
    if (!existing) return callback({ error: 'Player not in lobby' });

    existing.id = socket.id;
    lobby.connectedSockets.add(socket.id);
    socket.join(code);
    callback(lobby);
    io.to(code).emit('lobby_update', lobby);
  });

  // Get game state after reconnect
  socket.on('get_game_state', ({ code, username }, callback) => {
    const state = getGameState(code, username);
    if (!state) return callback({ error: 'No game found' });
    callback(state);
  });

  // Start game
  socket.on("start_game", (code) => {
    const lobby = getLobby(code);
    if (!lobby) return;

    if (socket.id !== lobby.createdBy) {
      socket.emit("start_denied", { reason: "Only the lobby creator can start the game." });
      return;
    }

    if (lobby.players.length < 3) {
      socket.emit("start_denied", { reason: "You need at least 3 players to start the game." });
      return;
    }

    markGameStarted(code);
    initGame(code, lobby.players);
    io.to(code).emit("game_started");
    startRound(code, io);
  });

  // Player submits CV
  socket.on("submit_cv", ({ lobbyCode, cvId }) => {
    submitCV(lobbyCode, socket.id, cvId, io);
  });

  // Player votes to discard
  socket.on("vote_discard", ({ lobbyCode, votedCvId }) => {
    const result = submitVote(lobbyCode, socket.id, votedCvId);
    if (result) {
      io.to(lobbyCode).emit("voting_result", result);
      io.to(lobbyCode).emit("start_choosing", {
        submissions: result.remainingCVs
      });
    }
  });

  socket.on('start_next_round', ({ lobbyCode }) => {
    startRound(lobbyCode, io);
  });  

  // CEO chooses candidate
  socket.on("ceo_choose", ({ lobbyCode, chosenCvId }) => {
    const result = finalizeRound(lobbyCode, chosenCvId, io);
  
    // Emit updated lobby with points
    const updatedLobby = getLobby(lobbyCode);
    if (updatedLobby && games[lobbyCode]) {
      updatedLobby.players = games[lobbyCode].players; // sync scored players
      io.to(lobbyCode).emit('lobby_update', updatedLobby); // ✅ emit update
    }
  
    if (result?.gameOver) {
      io.to(lobbyCode).emit("game_over", {
        winner: result.winner,
        scores: result.scores
      });
    } else {
      // Instead of immediately starting, show the hired CV first
      const hiredCv = result.hiredCv; // <- need to add this in finalizeRound()
      const job = result.job;
    
      io.to(lobbyCode).emit("hired_result", {
        hiredCv,
        job,
        ceoId: games[lobbyCode].players[games[lobbyCode].ceoIndex].id // Send current CEO id
      });
    }    
  });
  

  // Handle disconnect and cleanup
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [code, lobby] of Object.entries(lobbies)) {
      if (lobby.connectedSockets?.has(socket.id)) {
        lobby.connectedSockets.delete(socket.id);
        if (lobby.connectedSockets.size === 0) {
          console.log(`Lobby ${code} is now empty. Cleaning up.`);
          delete lobbies[code];
          delete games[code];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
