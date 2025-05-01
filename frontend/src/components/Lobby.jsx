import React from 'react';

function Lobby({ username, setUsername, lobbyCode, setLobbyCode, currentLobby, error, onCreateLobby, onJoinLobby, onStartGame, socketId }) {
    const canStartGame = currentLobby?.players?.length >= 3 && currentLobby?.createdBy === username;

    return (
    <div className="p-6 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Multiplayer Hiring Game</h1>
      <div className="text-sm text-gray-500 mb-4">Lobby Status</div>

      {!currentLobby ? (
        <>
          <input
            className="border p-2 mb-2 w-full rounded"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="flex gap-2 mb-2">
            <button onClick={onCreateLobby} className="bg-blue-500 text-white px-4 py-2 rounded">
              Create Lobby
            </button>
            <button onClick={onJoinLobby} className="bg-green-500 text-white px-4 py-2 rounded">
              Join Lobby
            </button>
          </div>
          <input
            className="border p-2 mb-2 w-full rounded"
            placeholder="Lobby Code"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value)}
          />
          {error && <div className="text-red-500">{error}</div>}
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-2">Lobby Code: {currentLobby.code}</h2>
          <ul className="mb-4 text-left">
            {currentLobby.players?.map((p) => (
              <li key={p.id}>
                👤 {p.name}
              </li>
            ))}
          </ul>
          {canStartGame && (
              <button
                onClick={onStartGame}
                className="bg-purple-600 text-white px-4 py-2 rounded"
              >
                Start Game
              </button>
            )}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      )}
    </div>
  );
}

export default Lobby;
