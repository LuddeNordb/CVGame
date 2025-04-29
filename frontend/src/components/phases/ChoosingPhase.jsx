import React from 'react';

function ChoosingPhase({ submissions, chosenCvId, onChooseCv }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">👑 Choose who to hire</h2>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {submissions.map((cv) => (
          <div key={cv.id} className={`border p-4 rounded bg-white shadow ${
            chosenCvId ? (cv.id === chosenCvId ? 'border-green-500 ring-2 ring-green-400' : 'opacity-50') : ''
          }`}>
            <p className="font-bold text-lg mb-2">?</p>
            <ul className="text-sm text-gray-700 mb-2">
              {Object.entries(cv.traits).map(([trait, value]) => (
                <li key={trait}><span className="capitalize">{trait}</span>: {value}</li>
              ))}
            </ul>
            <button
              onClick={() => !chosenCvId && onChooseCv(cv.id)}
              disabled={chosenCvId !== null}
              className="mt-2 w-full font-semibold py-2 px-4 rounded bg-green-600 hover:bg-green-700 text-white"
            >
              {chosenCvId === cv.id ? '✔️ Hired' : 'Hire this Candidate'}
            </button>
          </div>
        ))}
      </div>

      {chosenCvId && (
        <div className="mt-4 text-green-600 text-center font-semibold">
          ✅ Candidate hired!
        </div>
      )}
    </div>
  );
}

export default ChoosingPhase;
