const { nanoid } = require('nanoid');

const JOBS = [
  { id: 'job1', title: 'Creative Director', traits: { creativity: 'Great', leadership: 'Ok' } },
  { id: 'job2', title: 'CTO', traits: { tech: 'Great', leadership: 'Great' } },
  { id: 'job3', title: 'Marketing Lead', traits: { creativity: 'Ok', leadership: 'Great' } }
];

const CVS = [
  { id: 'cv1', name: 'Ada Lovelace', traits: { tech: 'Great', creativity: 'Ok' } },
  { id: 'cv2', name: 'Alan Turing', traits: { tech: 'Great', leadership: 'Bad' } },
  { id: 'cv3', name: 'Grace Hopper', traits: { leadership: 'Great', creativity: 'Ok' } },
  { id: 'cv4', name: 'Steve Jobs', traits: { creativity: 'Great', leadership: 'Great' } },
  { id: 'cv5', name: 'Elon Musk', traits: { leadership: 'Great', creativity: 'Ok' } },
  { id: 'cv6', name: 'Marie Curie', traits: { tech: 'Great', creativity: 'Great' } }
];

function drawRandomCVs(n) {
  const shuffled = [...CVS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function getRandomJob() {
  return JOBS[Math.floor(Math.random() * JOBS.length)];
}

const games = {};

function initGame(lobbyCode, players) {
  const game = {
    lobbyCode,
    players: players.map(p => ({ ...p, points: 0 })),
    ceoIndex: 0,
    round: 0,
    state: 'waiting'
  };
  games[lobbyCode] = game;
  return game;
}

function startRound(lobbyCode, io) {
  const game = games[lobbyCode];
  if (!game) return;

  game.round++;
  game.state = 'submitting';
  const ceo = game.players[game.ceoIndex];
  const job = getRandomJob();
  game.currentJob = job;
  game.submissions = [];
  game.votes = [];
  game.discardedCvId = null;
  game.cvHands = {};

  game.players.forEach(p => {
    if (p.id !== ceo.id) {
      game.cvHands[p.name] = drawRandomCVs(3); // ✅ use name
    }
  });

  io.to(lobbyCode).emit("round_started", {
    job,
    ceoId: ceo.id,
    cvHands: game.cvHands
  });
}

function submitCV(lobbyCode, playerId, cvId, io) {
    const game = games[lobbyCode];
    if (!game || game.state !== 'submitting') return;
  
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;
    // Avoid duplicate submission
    const alreadySubmitted = game.submissions.find(s => s.playerName === player.name);
    if (!alreadySubmitted) {
      game.submissions.push({ playerName: player.name, cvId });
    }
  
    const nonCEOs = game.players.filter(p => p.name !== game.players[game.ceoIndex].name);
    console.log("NonCeo len:", nonCEOs.length);
    console.log("Submissions len:", game.submissions.length);
    if (game.submissions.length === nonCEOs.length) {
      if (nonCEOs.length >= 3) {
        game.state = 'voting';
        io.to(lobbyCode).emit("start_voting", {
          submissions: game.submissions.map(sub => ({
            ...CVS.find(c => c.id === sub.cvId),
            submittedBy: sub.playerName
          }))
        });
      } else {
        console.log("choosing:", game.submissions);
        game.state = 'choosing';
        io.to(lobbyCode).emit("start_choosing", {
          submissions: game.submissions.map(sub => ({
            ...CVS.find(c => c.id === sub.cvId),
            submittedBy: sub.playerName
          }))
        });
      }
    }
  }
  

  function submitVote(lobbyCode, voterId, votedCvId) {
    console.log("voterId:", voterId);
    const game = games[lobbyCode];
    if (!game || game.state !== 'voting') return;
  
    const voter = game.players.find(p => p.id === voterId);
    if (!voter) return;
  
    const ownSubmission = game.submissions.find(s => s.playerName === voter.name);
    if (ownSubmission?.cvId === votedCvId) return; // Can't vote against your own CV
  
    const alreadyVoted = game.votes.find(v => v.voterName === voter.name);
    if (!alreadyVoted) {
      game.votes.push({ voterName: voter.name, votedCvId });
    }
  
    const nonCEOPlayers = game.players.filter(p => p.name !== game.players[game.ceoIndex].name);
    if (game.votes.length === nonCEOPlayers.length) {
      // Tally votes
      const tally = {};
      for (const vote of game.votes) {
        tally[vote.votedCvId] = (tally[vote.votedCvId] || 0) + 1;
      }
  
      // Find the most voted CV
      const discardedCvId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
      game.discardedCvId = discardedCvId;
  
      // Move to CEO choosing
      const remaining = game.submissions.filter(s => s.cvId !== discardedCvId);
      game.state = 'choosing';
  
      return {
        remainingCVs: remaining.map(sub => ({
          ...CVS.find(c => c.id === sub.cvId),
          submittedBy: sub.playerName
        })),
        discardedCvId
      };
    }
  
    return null;
  }
  

  function finalizeRound(lobbyCode, chosenCvId, io) {
    const game = games[lobbyCode];
    if (!game) return;
  
    const chosenSubmission = game.submissions.find(s => s.cvId === chosenCvId);
    if (!chosenSubmission) return;
  
    const chosenPlayer = game.players.find(p => p.name === chosenSubmission.playerName);
    if (chosenPlayer) {
      chosenPlayer.points += 1;
    }
  
    const allCVs = game.submissions.map(sub => {
      const cv = CVS.find(c => c.id === sub.cvId);
      return { ...cv, submittedBy: sub.playerName };
    });
  
    io.to(lobbyCode).emit("round_result", {
      hiredCvId: chosenCvId,
      job: game.currentJob,
      allCVs,
      scores: game.players.map(p => ({ id: p.id, name: p.name, points: p.points }))
    });
  
    if (chosenPlayer.points >= 20) {
      return {
        gameOver: true,
        winner: chosenPlayer,
        scores: game.players.map(p => ({ id: p.id, name: p.name, points: p.points }))
      };
    }
  
    advanceCEO(game);
    game.state = 'waiting';
    return { gameOver: false };
  }
  

function advanceCEO(game) {
  game.ceoIndex = (game.ceoIndex + 1) % game.players.length;
}

function getGameState(lobbyCode, playerName) {
    const game = games[lobbyCode];
    if (!game) return null;
  
    const player = game.players.find(p => p.name === playerName);
    if (!player) return null;
  
    const ceo = game.players?.[game.ceoIndex]; // <- check CEO exists
    const isCEO = game.players[game.ceoIndex]?.name === player.name;
    const cvHand = game.cvHands?.[player.name] || [];
    
    const fullSubmissions = game.submissions.map((s) => {
        const cv = CVS.find((c) => c.id === s.cvId);
        return { ...cv, submittedBy: s.playerName || s.playerId || 'unknown' };
      });
    
  
    return {
      isCEO,
      ceoId: ceo?.id || null, // ✅ add this!
      job: game.currentJob,
      cvHand,
      phase: game.state,
      playerId: player.id,
      players: game.players,
      gameStarted: true,
      submissions: fullSubmissions, // ✅ added
    };
  }
  

module.exports = {
  games,
  initGame,
  startRound,
  submitCV,
  submitVote,
  finalizeRound,
  getGameState
};
