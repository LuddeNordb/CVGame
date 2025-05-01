import React from 'react';

function VotingPhase({ submissions, username, hasVoted, onVoteDiscard, ceoName, currentJob }) {
  return (
    <div className="p-6">
      <p className="text-sm mb-4 text-gray-700">👑 CEO this round: <strong>{ceoName}</strong></p>
      <h2 className="text-xl font-bold mb-2">Job description:</h2>
      <p className="text-sm mb-4 text-gray-700">{currentJob?.traits.Description}</p>
      <p className="text-sm mb-4 text-gray-700">{currentJob?.traits.bullet}</p>

      <h2 className="text-xl font-bold mb-4">🗳 Vote to discard one candidate</h2>
      <p className="mb-6 text-sm text-gray-600">You cannot vote for your own submission.</p>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {submissions.map((cv) => {
          const isOwn = cv.submittedBy === username;
          return (
            <div key={cv.id} className={`border p-4 rounded bg-white shadow ${isOwn ? 'opacity-50' : ''}`}>
              <p className="font-bold text-lg mb-2">?</p>
              <ul className="text-sm text-gray-700 mb-2">
                {Object.entries(cv.traits).map(([trait, value]) => (
                  <li key={trait}><span className="font-bold">{trait}</span>: {value}</li>
                ))}
              </ul>
              <button
                onClick={() => !isOwn && !hasVoted && onVoteDiscard(cv.id)}
                disabled={isOwn || hasVoted}
                className={`mt-2 w-full font-semibold py-2 px-4 rounded ${
                  isOwn || hasVoted ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {isOwn ? 'Your submission' : 'Vote to Discard'}
              </button>
            </div>
          );
        })}
      </div>

      {hasVoted && (
        <div className="mt-4 text-green-600 text-center font-semibold">
          ✅ Vote submitted!
        </div>
      )}
    </div>
  );
}

export default VotingPhase;
