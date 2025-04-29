import { useEffect, useState } from 'react';
import socket from '../socket';

export function useSocketHandlers({ username, setUsername, lobbyCode, setLobbyCode, setCurrentLobby, setConnectionStatus, setLoading, setError }) {
  const [gameState, setGameState] = useState({
    gameStarted: false,
    phase: null,
    isCEO: false,
    ceoId: null,
    cvHand: [],
    submissions: [],
    winner: null,
    finalScores: [],
    currentJob: null,
    cvSubmitted: false,
    hiredCv: null,
    hiredJob: null,
    hasVoted: false,
    waitingNextRound: false,
  });

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionStatus('connected');

      const storedUsername = localStorage.getItem('username');
      const storedCode = localStorage.getItem('lobbyCode');
      if (storedUsername && storedCode) {
        setUsername(storedUsername);
        socket.emit('rejoin_lobby', { code: storedCode, username: storedUsername }, (response) => {
          if (!response.error) {
            setCurrentLobby(response);
            setLobbyCode(storedCode);
            socket.emit('get_game_state', { code: storedCode, username: storedUsername }, (state) => {
              if (!state.error) {
                setGameState(prev => ({ ...prev, ...state }));
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

    socket.on('lobby_update', setCurrentLobby);
    socket.on('game_started', () => setGameState(prev => ({ ...prev, gameStarted: true })));
    socket.on('round_started', ({ job, ceoId, cvHands }) => {
      setGameState(prev => ({
        ...prev,
        currentJob: job,
        ceoId,
        isCEO: socket.id === ceoId,
        cvHand: cvHands[username] || [],
        phase: 'submitting',
        cvSubmitted: false,
      }));
    });
    socket.on('start_voting', ({ submissions }) => {
      setGameState(prev => ({ ...prev, phase: 'voting', submissions }));
    });
    socket.on('start_choosing', ({ submissions }) => {
      setGameState(prev => ({ ...prev, phase: 'choosing', submissions }));
    });
    socket.on('hired_result', ({ hiredCv, job, ceoId }) => {
      setGameState(prev => ({
        ...prev,
        hiredCv,
        hiredJob: job,
        phase: 'hired_result',
        ceoId,
      }));
    });
    socket.on('game_over', ({ winner, scores }) => {
      setGameState(prev => ({
        ...prev,
        winner,
        finalScores: scores,
      }));
    });
    socket.on('start_denied', ({ reason }) => {
      setError(reason);
    });

    return () => {
      socket.off();
    };
  }, [username]);

  const handleCreateLobby = () => {
    if (!username) return;
    socket.emit('create_lobby', username, (lobby) => {
      localStorage.setItem('username', username);
      localStorage.setItem('lobbyCode', lobby.code);
      setCurrentLobby(lobby);
      setLobbyCode(lobby.code);
      setError('');
    });
  };

  const handleJoinLobby = () => {
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
    if (lobbyCode) {
      socket.emit('start_game', lobbyCode);
    }
  };

  const handleSubmitCV = (cvId) => {
    if (!gameState.cvSubmitted && lobbyCode) {
      socket.emit('submit_cv', { lobbyCode, cvId });
      setGameState(prev => ({ ...prev, cvSubmitted: true }));
    }
  };

  const handleNextRound = () => {
    setGameState(prev => ({ ...prev, waitingNextRound: true }));
    socket.emit('start_next_round', { lobbyCode });
  };

  return {
    gameState,
    handleCreateLobby,
    handleJoinLobby,
    handleStartGame,
    handleSubmitCV,
    handleNextRound,
  };
}
