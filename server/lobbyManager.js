const { nanoid } = require('nanoid');

const lobbies = {};

function createLobby(player) {
  const code = nanoid(6).toUpperCase();
  const lobby = {
    code,
    players: [player],
    createdAt: Date.now(),
    gameStarted: false,
    connectedSockets: new Set([player.id]),
    createdBy: player.id // mark the creator
  };
  lobbies[code] = lobby;
  return lobby;
}

function joinLobby(code, player) {
  const lobby = lobbies[code];
  if (!lobby || lobby.gameStarted) return null;

  // Prevent duplicate players by name
  if (lobby.players.find(p => p.name === player.name)) return null;

  lobby.players.push(player);
  lobby.connectedSockets.add(player.id);
  return lobby;
}

function getLobby(code) {
  return lobbies[code];
}

function startGame(code) {
  const lobby = lobbies[code];
  if (lobby) {
    lobby.gameStarted = true;
  }
}

module.exports = {
  createLobby,
  joinLobby,
  getLobby,
  startGame,
  lobbies
};
