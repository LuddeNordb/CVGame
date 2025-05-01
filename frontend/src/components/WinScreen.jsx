import React from 'react';

function WinScreen({ winner, scores, username, currentLobby, handleReturnToLobby }) {
  return (
    <div className="p-6 text-center text-xl">
      🎉 <strong>{winner.name}</strong> wins the game!
      <h2 className="mt-4 text-lg font-semibold">Final Scores:</h2>
      <ul className="mt-2">
        {scores.map((p) => (
          <li key={p.id}>{p.name}: {p.points}</li>
        ))}
      </ul>
      {username === currentLobby.createdBy && (
        <button
          onClick={handleReturnToLobby}
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
        >
          🔙 Return to Lobby
        </button>
      )}
    </div>
  );
}

export default WinScreen;
