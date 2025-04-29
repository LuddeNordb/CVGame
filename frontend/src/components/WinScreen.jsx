import React from 'react';

function WinScreen({ winner, scores }) {
  return (
    <div className="p-6 text-center text-xl">
      🎉 <strong>{winner.name}</strong> wins the game!
      <h2 className="mt-4 text-lg font-semibold">Final Scores:</h2>
      <ul className="mt-2">
        {scores.map((p) => (
          <li key={p.id}>{p.name}: {p.points}</li>
        ))}
      </ul>
    </div>
  );
}

export default WinScreen;
