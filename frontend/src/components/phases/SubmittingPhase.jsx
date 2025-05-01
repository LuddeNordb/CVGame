import React from 'react';

function SubmittingPhase({ currentJob, ceoName, cvHand, onSubmitCV, cvSubmitted }) {
  return (
    <div className="pt-24 px-6">
      <p className="text-sm mb-4 text-gray-700">👑 CEO this round: <strong>{ceoName}</strong></p>
      <h2 className="text-xl font-bold mb-2">Job description:</h2>
      <p className="text-sm mb-4 text-gray-700">{currentJob?.traits.Description}</p>
      <p className="text-sm mb-4 text-gray-700">{currentJob?.traits.bullet}</p>

      <h3 className="mb-2">Choose a CV to submit:</h3>
      {cvHand.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {cvHand.map((cv) => (
            <div key={cv.id} className="border p-4 rounded bg-white shadow">
              <p className="font-bold text-lg mb-2">?</p>
              <ul className="text-sm text-gray-700">
                {Object.entries(cv.traits).map(([trait, value]) => (
                  <li key={trait}><span className="font-bold">{trait}</span>: {value}</li>
                ))}
              </ul>
              <button
                onClick={() => onSubmitCV(cv.id)}
                disabled={cvSubmitted}
                className={`mt-3 w-full font-semibold py-2 px-4 rounded ${
                  cvSubmitted ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {cvSubmitted ? 'Submitted' : 'Submit CV'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Loading CVs...</p>
      )}
    </div>
  );
}

export default SubmittingPhase;
