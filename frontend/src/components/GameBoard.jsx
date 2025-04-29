import React, { useState } from 'react';
import Scoreboard from './Scoreboard';
import SubmittingPhase from './phases/SubmittingPhase';
import VotingPhase from './phases/VotingPhase';
import ChoosingPhase from './phases/ChoosingPhase';
import WaitingPhase from './phases/WaitingPhase';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';
import socket from '../socket';


function GameBoard({ gameState, currentLobby, username, onSubmitCV, onNextRound, socketId }) {
  const [width, height] = useWindowSize();
  const [chosenCvId, setChosenCvId] = useState(null);
  const { phase, currentJob, isCEO, submissions, hiredCv, hiredJob, ceoId, waitingNextRound, cvHand, cvSubmitted, hasVoted } = gameState;

  const ceoName = currentLobby?.players?.find(p => p.id === ceoId)?.name || "Unknown";

  const handleVoteDiscard = (cvId) => {
    socket.emit('vote_discard', { lobbyCode: currentLobby.code, votedCvId: cvId });
  };

  const handleChooseCv = (cvId) => {
    setChosenCvId(cvId);
    socket.emit('ceo_choose', { lobbyCode: currentLobby.code, chosenCvId: cvId });
  };

  if (phase === 'hired_result') {
    return (
      <>
        <Confetti width={width} height={height} />
        <Scoreboard players={currentLobby.players} socketId={socketId} />
        <div className="pt-24 px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">🎉 Candidate Hired!</h2>
          <div className="max-w-md mx-auto border p-6 rounded bg-white shadow">
            <h3 className="text-lg font-semibold mb-2">{hiredCv?.name}</h3>
            <ul className="text-sm text-gray-700 mb-4">
              {hiredCv && Object.entries(hiredCv.traits).map(([trait, value]) => (
                <li key={trait}>{trait}: {value}</li>
              ))}
            </ul>
            <div className="text-sm text-gray-500 mb-2 italic">
              Hired for: <strong>{hiredJob?.title}</strong>
            </div>
          </div>

          {socket.id === ceoId && !waitingNextRound && (
            <button
              onClick={onNextRound}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded"
            >
              ➡️ Continue to Next Round
            </button>
          )}

          {waitingNextRound && (
            <div className="mt-6 text-gray-600">
              🔄 Waiting to start next round...
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Scoreboard players={currentLobby.players} socketId={socketId} />
      <div className="pt-24 px-6">
      {phase === 'submitting' && !isCEO ? (
        <SubmittingPhase
            currentJob={currentJob}
            ceoName={ceoName}
            cvHand={cvHand}
            onSubmitCV={onSubmitCV}
            cvSubmitted={cvSubmitted}
        />
        ) : phase === 'voting' && !isCEO ? (
        <VotingPhase
            submissions={submissions}
            username={username}
            hasVoted={hasVoted}
            onVoteDiscard={handleVoteDiscard}
        />
        ) : phase === 'choosing' && isCEO ? (
        <ChoosingPhase
            submissions={submissions}
            chosenCvId={chosenCvId}
            onChooseCv={handleChooseCv}
        />
        ) : (
        <WaitingPhase phase={phase} isCEO={isCEO} />
        )}
      </div>
    </>
  );
}

export default GameBoard;
