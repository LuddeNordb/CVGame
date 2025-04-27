import React, { useEffect, useState } from 'react';
import socket from './socket';

function App() {
  const [username, setUsername] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [currentLobby, setCurrentLobby] = useState(null);
  const [error, setError] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);


  // Game state
  const [currentJob, setCurrentJob] = useState(null);
  const [cvHand, setCvHand] = useState([]);
  const [isCEO, setIsCEO] = useState(false);
  const [ceoId, setCeoId] = useState(null);
  const [winner, setWinner] = useState(null);
  const [finalScores, setFinalScores] = useState([]);
  const [cvSubmitted, setCvSubmitted] = useState(false);
  const [phase, setPhase] = useState(null); // 'submitting' | 'voting' | 'choosing'
  const [submissions, setSubmissions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [chosenCvId, setChosenCvId] = useState(null);

  // --- COMPONENTS ---
  const Scoreboard = ({ players, socketId }) => {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200 animate-slide-in-down"
        style={{ transition: 'transform 0.4s ease, opacity 0.4s ease' }}
      >
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
  };
  
  

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionStatus('connected');

      const storedUsername = localStorage.getItem('username');
      const code = localStorage.getItem('lobbyCode');

      if (storedUsername && code) {
        setUsername(storedUsername);

        socket.emit('rejoin_lobby', { code, username: storedUsername }, (response) => {
          if (!response.error) {
            setCurrentLobby(response);
            setLobbyCode(code);

            socket.emit('get_game_state', { code, username: storedUsername}, (state) => {
              if (!state.error) {
                setGameStarted(state.gameStarted);
                setCurrentJob(state.job);
                setIsCEO(state.isCEO);
                setCeoId(state.ceoId); // ✅ fix here
                setPhase(state.phase);
                setSubmissions(state.submissions)
                setCvHand(state.cvHand);
              }
              setLoading(false);
            });            
          } else {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('start_voting', ({ submissions }) => {
      setPhase('voting');
      setSubmissions(submissions);
    });
    
    socket.on('start_choosing', ({ submissions }) => {
      setPhase('choosing');
      setSubmissions(submissions);
    });    

    socket.on('lobby_update', (lobby) => {
      setCurrentLobby(lobby);
    });

    socket.on('game_started', () => {
      setGameStarted(true);
    });

    socket.on('round_started', ({ job, ceoId, cvHands }) => {
      setCurrentJob(job);
      setChosenCvId(null);
      setCeoId(ceoId);
      setIsCEO(socket.id === ceoId);
      const hand = cvHands[username] || [];
      setCvHand(hand);
      setCvSubmitted(false);
      setPhase('submitting');
      // ✅ Trigger animate-in
      setAnimateIn(false);
      setTimeout(() => setAnimateIn(true), 50); // slight delay to trigger CSS transition
    });
    

    socket.on('game_over', ({ winner, scores }) => {
      setWinner(winner);
      setFinalScores(scores);
    });

    socket.on("start_denied", ({ reason }) => {
      setError(reason);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('lobby_update');
      socket.off('game_started');
      socket.off('round_started');
      socket.off('game_over');
      socket.off('start_denied');
      socket.off('start_voting');
      socket.off('start_choosing');
    };
  }, [username]);

  const handleCreate = () => {
    if (!username) return;
    socket.emit('create_lobby', username, (lobby) => {
      localStorage.setItem('username', username);
      localStorage.setItem('lobbyCode', lobby.code);
      setCurrentLobby(lobby);
      setLobbyCode(lobby.code);
      setError('');
    });
  };

  const handleJoin = () => {
    if (!username || !lobbyCode) return;
    socket.emit('join_lobby', lobbyCode.toUpperCase(), username, (response) => {
      if (response.error || !response.code) {
        setError("Unable to join: game already in progress or lobby not found.");
      } else {
        localStorage.setItem('username', username);
        localStorage.setItem('lobbyCode', response.code);
        setCurrentLobby(response);
        setError('');
      }
    });
  };

  const handleStartGame = () => {
    if (currentLobby) {
      socket.emit('start_game', currentLobby.code);
    }
  };

  const handleSubmitCV = (cvId) => {
    if (cvSubmitted || !currentLobby?.code) return; // prevent resubmitting
    socket.emit('submit_cv', { lobbyCode: currentLobby.code, cvId });
    setCvSubmitted(true); // ✅ mark as submitted
    setAnimateIn(false); // reset animation
  };
  

  // --- LOADING ---
  if (loading) {
    return <div className="p-6 text-center">🔄 Loading game state...</div>;
  }

  // --- WIN SCREEN ---
  if (winner) {
    return (
      <div className="p-6 text-center text-xl">
        🎉 <strong>{winner.name}</strong> wins the game!
        <h2 className="mt-4 text-lg font-semibold">Final Scores:</h2>
        <ul className="mt-2">
          {finalScores.map((p) => (
            <li key={p.id}>{p.name}: {p.points}</li>
          ))}
        </ul>
      </div>
    );
  }

  // --- LOBBY UI ---
  if (!gameStarted) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Multiplayer Hiring Game</h1>
        <div className="text-sm text-gray-500 mb-4">Status: {connectionStatus}</div>

        {!currentLobby ? (
          <>
            <input
              className="border p-2 mb-2 w-full rounded"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="flex gap-2 mb-2">
              <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 rounded">
                Create Lobby
              </button>
              <button onClick={handleJoin} className="bg-green-500 text-white px-4 py-2 rounded">
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
                  {ceoId === p.id && <span className="text-yellow-500 font-semibold"> (CEO)</span>}
                </li>
              ))}
            </ul>
            {currentLobby.players?.length >= 3 &&
              currentLobby.createdBy === socket.id && (
                <button
                  onClick={handleStartGame}
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

  // --- IN-GAME UI ---
if (currentJob) {
  // PHASE: SUBMITTING (non-CEO)
  if (phase === 'submitting' && !isCEO) {
    return (
      <>
      <Scoreboard players={currentLobby.players} socketId={socket.id} />
      <div className="pt-24 px-6">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">🧑‍💼 Job: {currentJob.title}</h2>
        {ceoId && currentLobby?.players?.length > 0 && (
        <p className="text-sm mb-4 text-gray-700">
          👑 CEO this round:{' '}
          <strong>
            {currentLobby.players.find((p) => p.id === ceoId)?.name || 'Unknown'}
          </strong>
        </p>
      )}
        <h3 className="mb-2">Choose a CV to submit:</h3>
        {cvHand.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {cvHand.map((cv) => (
              <div
                key={cv.id}
                className={`border p-4 rounded bg-white shadow transition duration-500 transform ${
                  animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                } ${cvSubmitted ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'}`}
              >
                <p className="font-bold text-lg mb-2">{cv.name}</p>
                <ul className="text-sm text-gray-700">
                  {Object.entries(cv.traits).map(([trait, value]) => (
                    <li key={trait}>{trait}: {value}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubmitCV(cv.id)}
                  disabled={cvSubmitted}
                  className={`mt-3 w-full font-semibold py-2 px-4 rounded ${
                    cvSubmitted
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {cvSubmitted ? 'Submitted' : 'Submit CV'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">🔄 Restoring your CV hand...</p>
        )}
        {cvSubmitted && (
          <div className="mt-4 text-green-600 font-semibold text-center">
            ✅ Your CV has been submitted!
          </div>
        )}
      </div>
      </div>
      </>
    );
  }

  // PHASE: VOTING (non-CEO)
  if (phase === 'voting' && !isCEO) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">🗳 Vote to discard one candidate</h2>
        <p className="mb-6 text-sm text-gray-600">You cannot vote for your own submission.</p>
  
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {submissions.map((cv) => {
            const isOwnSubmission = cv.submittedBy === username;
            return (
              <div
                key={cv.id}
                className={`border p-4 rounded bg-white shadow transition duration-300 transform ${
                  isOwnSubmission ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                <p className="font-bold text-lg mb-2">{cv.name}</p>
                <ul className="text-sm text-gray-700 mb-2">
                  {Object.entries(cv.traits).map(([trait, value]) => (
                    <li key={trait}>
                      <span className="capitalize">{trait}</span>: {value}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-400 italic mb-2">Submitted by: {cv.submittedBy}</p>
                <button
                  onClick={() => {
                    if (isOwnSubmission || hasVoted) return;
                    socket.emit('vote_discard', {
                      lobbyCode: currentLobby.code,
                      votedCvId: cv.id
                    });
                    setHasVoted(true);
                  }}
                  disabled={isOwnSubmission || hasVoted}
                  className={`mt-2 w-full font-semibold py-2 px-4 rounded ${
                    isOwnSubmission || hasVoted
                      ? 'bg-gray-300 text-white cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isOwnSubmission ? 'Cannot vote own' : 'Vote to Discard'}
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

  // PHASE: CHOOSING (CEO only)
  if (phase === 'choosing' && isCEO) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">👑 Choose who to hire for: {currentJob.title}</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {submissions.map((cv) => (
            <div
              key={cv.id}
              className={`border p-4 rounded bg-white shadow transition duration-300 transform ${
                chosenCvId
                  ? cv.id === chosenCvId
                    ? 'border-green-500 ring-2 ring-green-400 scale-105'
                    : 'opacity-50 pointer-events-none'
                  : 'hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <p className="font-bold text-lg mb-2">{cv.name}</p>
              <ul className="text-sm text-gray-700 mb-2">
                {Object.entries(cv.traits).map(([trait, value]) => (
                  <li key={trait}>
                    <span className="capitalize">{trait}</span>: {value}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 italic mb-2">Submitted by: {cv.submittedBy}</p>
              <button
                onClick={() => {
                  if (chosenCvId) return;
                  setChosenCvId(cv.id);
                  socket.emit('ceo_choose', {
                    lobbyCode: currentLobby.code,
                    chosenCvId: cv.id
                  });
                }}
                disabled={chosenCvId !== null}
                className={`mt-2 w-full font-semibold py-2 px-4 rounded ${
                  chosenCvId === cv.id
                    ? 'bg-green-600 text-white'
                    : chosenCvId
                    ? 'bg-gray-300 text-white cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {chosenCvId === cv.id ? '✔️ Hired' : 'Hire this candidate'}
              </button>
            </div>
          ))}
        </div>
  
        {chosenCvId && (
          <div className="mt-4 text-green-600 text-center font-semibold">
            ✅ You hired a candidate!
          </div>
        )}
      </div>
    );
  }
}
return (
  <div className="p-6 text-center">
    <h2 className="text-xl font-bold mb-2">⏳ Waiting for the next step...</h2>
    <p className="text-sm text-gray-600">
      {phase === 'submitting' && isCEO
        ? 'Waiting for players to submit their CVs.'
        : phase === 'voting' && isCEO
        ? 'Players are voting to discard a CV.'
        : phase === 'choosing' && !isCEO
        ? 'Waiting for the CEO to make a decision.'
        : "Hang tight — things are in motion."}
    </p>
  </div>
);
}

export default App;
