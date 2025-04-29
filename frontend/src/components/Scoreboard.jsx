import React from 'react';

function Scoreboard({ players, socketId }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200 animate-slide-in-down">
      <div className="max-w-screen-lg mx-auto px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">🏆 Scoreboard</h3>
        <div className="flex flex-wrap gap-3 text-sm text-gray-800">
          {players.map((p) => (
            <div
              key={p.id}
              className={`px-3 py-1 border rounded shadow-sm ${
                p.id === socketId ? 'bg-yellow-100 font-bold' : 'bg-white'
              }`}
            >
              {p.name}: <strong>{p.points ?? 0}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;
