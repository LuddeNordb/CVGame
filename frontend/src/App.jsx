import React, { useState } from 'react';
import socket from './socket';
import { useSocketHandlers } from './hooks/useSocketHandlers';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import LoadingScreen from './components/LoadingScreen';
import WinScreen from './components/WinScreen';

function App() {
  const [username, setUsername] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [currentLobby, setCurrentLobby] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🛠 Now passing all needed states into the hook:
  const {
    gameState,
    handleCreateLobby,
    handleJoinLobby,
    handleStartGame,
    handleSubmitCV,
    handleNextRound,
    handleReturnToLobby,
  } = useSocketHandlers({
    username,
    setUsername,
    lobbyCode,
    setLobbyCode,
    setCurrentLobby,
    setConnectionStatus,
    setLoading,
    setError,
  });

  if (loading) return <LoadingScreen />;

  if (gameState.winner) return <WinScreen winner={gameState.winner} scores={gameState.finalScores} username={username} currentLobby={currentLobby} handleReturnToLobby={handleReturnToLobby} />;

  if (!gameState.gameStarted) {
    return (
      <Lobby
        username={username}
        setUsername={setUsername}
        lobbyCode={lobbyCode}
        setLobbyCode={setLobbyCode}
        currentLobby={currentLobby}
        error={error}
        onCreateLobby={handleCreateLobby}
        onJoinLobby={handleJoinLobby}
        onStartGame={handleStartGame}
        socketId={socket.id}  
        /*connectionStatus={connectionStatus}*/
      />
    );
  }

  return (
    <GameBoard
      gameState={gameState}
      currentLobby={currentLobby}
      username={username}
      onSubmitCV={handleSubmitCV}
      onNextRound={handleNextRound}
      socketId={socket.id}
    />
  );
}

export default App;
