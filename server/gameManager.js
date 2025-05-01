const { nanoid } = require('nanoid');

const { JOBS } = require('./data/jobs.js');
const { CVS } = require('./data/cvs.js');

function pickCVs(deck,f,t) {
  return deck.slice(f, t);
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
    state: 'waiting',
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
  f=0; t=3;
  const shuffled = [...CVS].sort(() => 0.5 - Math.random());
  game.players.forEach(p => {
    if (p.id !== ceo.id) {
      game.cvHands[p.name] = pickCVs(shuffled,f,t); // ✅ use name
    }
    f+=3; t+=3;
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
    console.log("Voter ID:", voterId, "Voted CV ID:", votedCvId, "Lobby Code:", lobbyCode);
    const game = games[lobbyCode];
    if (!game || game.state !== 'voting') return;
    console.log('step1')
    const voter = game.players.find(p => p.id === voterId);
    if (!voter) return;
    console.log('step2')
    const ownSubmission = game.submissions.find(s => s.playerName === voter.name);
    if (ownSubmission?.cvId === votedCvId) return; // Can't vote against your own CV
    console.log('step3')
    const alreadyVoted = game.votes.find(v => v.voterName === voter.name);
    if (!alreadyVoted) {
      game.votes.push({ voterName: voter.name, votedCvId });
    }
    console.log('step4')
    console.log("Votes:", game.votes);
    const nonCEOPlayers = game.players.filter(p => p.name !== game.players[game.ceoIndex].name);
    if (game.votes.length === nonCEOPlayers.length) {
      // Tally votes
      const tally = {};
      for (const vote of game.votes) {
        tally[vote.votedCvId] = (tally[vote.votedCvId] || 0) + 1;
      }
      console.log("Tally:", tally);
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
  
    if (chosenPlayer.points >= 5) {
      return {
        gameOver: true,
        winner: chosenPlayer,
        scores: game.players.map(p => ({ id: p.id, name: p.name, points: p.points }))
      };
    }
  
    advanceCEO(game);
    game.state = 'hired_result';

    // 🛠 Add hiredCv to game state
    const chosenCv = CVS.find(c => c.id === chosenCvId);
    game.hiredCv = chosenCv;
    game.hiredJob = game.currentJob;

    // ✅ Return hired info for "hired_result" screen
    return {
    gameOver: false,
    hiredCv: chosenCv,
    job: game.currentJob
    };

  }
  
  

function advanceCEO(game) {
  game.ceoIndex = (game.ceoIndex + 1) % game.players.length;
}

function resetGame(lobbyCode) {
    const game = games[lobbyCode];
    if (!game) return;
    
    game.winner = null;
    game.round = 0;
    game.state = 'waiting';
    game.submissions = [];
    game.votes = [];
    game.discardedCvId = null;
    game.cvHands = {};
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
    
  
    const response = {
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

    if (game.state === 'hired_result') {
        response.hiredCv = game.hiredCv || null;
        response.hiredJob = game.currentJob || null;
      }

    return response;
  }
  

module.exports = {
  games,
  initGame,
  startRound,
  submitCV,
  submitVote,
  finalizeRound,
  getGameState,
  resetGame,
};
