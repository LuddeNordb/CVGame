import React from 'react';

function WaitingPhase({ phase, isCEO }) {
  const messages = {
    submitting: isCEO
      ? 'Waiting for players to submit their CVs.'
      : 'Submitting phase is ongoing...',
    voting: isCEO
      ? 'Players are voting to discard a CV.'
      : 'Voting phase ongoing...',
    choosing: isCEO
      ? 'Choosing the best candidate...'
      : 'CEO is choosing a candidate...',
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold mb-2">⏳ Waiting for next step...</h2>
      <p className="text-sm text-gray-600">{messages[phase] || "Hang tight..."}</p>
    </div>
  );
}

export default WaitingPhase;
