import { game_start } from "./game.js";
import { sendMessage, addMessageListener, removeMessageListener } from "./game_soket.js";
import { addCleanupListener } from "./game_shared.js";

let ctx: CanvasRenderingContext2D | null = null;
let gameConfig: any = null;
let gameState: any = null;
let gameId: string = "";
let inputInterval: any = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let keyupHandler: ((e: KeyboardEvent) => void) | null = null;
let gameUpdateListener: ((msg: any) => void) | null = null;
let gameFinishListener: ((msg: any) => void) | null = null;

const getElement = (id: string) => document.getElementById(id);

export function cleanupTournamentMatch() {
  if (keydownHandler) window.removeEventListener("keydown", keydownHandler);
  if (keyupHandler) window.removeEventListener("keyup", keyupHandler);
  if (gameUpdateListener) removeMessageListener(gameUpdateListener);
  if (gameFinishListener) removeMessageListener(gameFinishListener);
  if (inputInterval) clearInterval(inputInterval);
  const container = getElement("game-container");
  if (container) container.innerHTML = '';
  ctx = null;
}

function setupTournamentInput(gId: string, pId: string) {
  const moves = { up: false, down: false };
  window.focus();
  keydownHandler = (e: KeyboardEvent) => {
    if (e.key === "w" || e.key === "W") moves.up = true;
    if (e.key === "s" || e.key === "S") moves.down = true;
    sendInput();
  };
  keyupHandler = (e: KeyboardEvent) => {
    if (e.key === "w" || e.key === "W") moves.up = false;
    if (e.key === "s" || e.key === "S") moves.down = false;
    sendInput();
  };
  const sendInput = () => {
    sendMessage("game_update", { gameId: gId, playerId: pId, input: { ...moves } });
  };
  window.addEventListener("keydown", keydownHandler);
  window.addEventListener("keyup", keyupHandler);
}

async function fetchUserDetails(userId: string): Promise<{ username: string, avatar: string } | null> {
  try {
    const token = localStorage.getItem('jwt_token');
    const res = await fetch(`/api/auth/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export function createTournamentListener(userId: number, tournamentId: string, navigateCallback: (path: string) => void) {

  const views = {
    lobby: getElement("view-lobby"),
    bracket: getElement("view-bracket"),
    game: getElement("view-game")
  };
  const els = {
    bracketTitle: getElement("bracket-round-title"),
    bracketContent: getElement("big-bracket-content"),
    timer: getElement("timer-count"),
    readyOverlay: getElement("ready-overlay"),
    readyBtn: getElement("game-ready-btn") as HTMLButtonElement,
    gameLabel: getElement("game-round-label"),
    matchInfo: getElement("game-match-info")
  };

  let currentMatchId: string | null = null;

  const switchView = (view: 'lobby' | 'bracket' | 'game') => {
    if (views.lobby) views.lobby.style.display = view === 'lobby' ? 'block' : 'none';
    if (views.bracket) views.bracket.style.display = view === 'bracket' ? 'flex' : 'none';
    if (views.game) views.game.style.display = view === 'game' ? 'block' : 'none';
  };

  const resolveUser = async (pid: string) => {
    const pidStr = String(pid);
    const isMe = pidStr === String(userId);
    let user = { name: `Player ${pidStr.substring(0,4)}`, avatar: '../images/avatars/unknown.jpg', isMe, id: pidStr };
    const data = await fetchUserDetails(pidStr);
    if (data) {
      user.name = data.username;
      user.avatar = data.avatar || user.avatar;
    }
    if (isMe) user.name += " (You)";
    return user;
  };

  const createMatchHTML = (p1: any, p2: any, label: string) => `
    <div class="bracket-section-title">${label}</div>
    <div class="big-match-card">
      <div class="big-player ${p1.isMe ? 'text-yellow-400 font-bold' : ''}">
        <img src="${p1.avatar}" class="big-avatar ${p1.isMe ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}">
        <span class="big-name">${p1.name}</span>
      </div>
      <div class="big-vs">VS</div>
      <div class="big-player ${p2.isMe ? 'text-yellow-400 font-bold' : ''}">
        <img src="${p2.avatar}" class="big-avatar ${p2.isMe ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}">
        <span class="big-name">${p2.name}</span>
      </div>
    </div>
  `;

  const resolveAndRenderBracket = async (p1Id: string, p2Id: string, p3Id?: string, p4Id?: string) => {
    const u1 = await resolveUser(p1Id);
    const u2 = await resolveUser(p2Id);
    let html = createMatchHTML(u1, u2, p3Id ? "Semi-Final 1" : "Grand Final");
    let amIPlaying = u1.isMe || u2.isMe;

    if (p3Id && p4Id) {
      const u3 = await resolveUser(p3Id);
      const u4 = await resolveUser(p4Id);
      html += createMatchHTML(u3, u4, "Semi-Final 2");
      amIPlaying = amIPlaying || u3.isMe || u4.isMe;
    }

    return { html, amIPlaying, users: [u1, u2] };
  };

  const setupGameView = (p1: any, p2: any) => {
    if (!els.matchInfo) return;
    els.matchInfo.innerHTML = `
      <div class="flex flex-col items-center">
         <img src="${p1.avatar}" class="w-24 h-24 rounded-full border-4 ${p1.isMe ? 'border-emerald-500' : 'border-gray-500'} shadow-lg mb-3 object-cover">
         <span class="text-xl font-bold text-white">${p1.name}</span>
      </div>
      <div class="text-6xl font-black text-white/20 italic">VS</div>
      <div class="flex flex-col items-center">
         <img src="${p2.avatar}" class="w-24 h-24 rounded-full border-4 ${p2.isMe ? 'border-emerald-500' : 'border-red-500'} shadow-lg mb-3 object-cover">
         <span class="text-xl font-bold text-white">${p2.name}</span>
      </div>
    `;
  };

  const initGameConfig = (msg: any) => {
    cleanupTournamentMatch();
    gameConfig = {
      gameId: msg.payload.gameId,
      mode: msg.payload.mode,
      canvas: msg.payload.canvas,
      paddle: msg.payload.paddle,
      ball: msg.payload.ball
    };
    gameState = { paddles: msg.payload.paddles, ball: msg.payload.ball };
    gameId = msg.payload.gameId;

    const container = getElement("game-container");
    if (container) {
      container.innerHTML = '';
      const canvas = document.createElement("canvas");
      canvas.id = "game-id";
      canvas.width = gameConfig.canvas.width;
      canvas.height = gameConfig.canvas.height;
      canvas.style.backgroundColor = gameConfig.canvas.color;
      container.appendChild(canvas);
      ctx = canvas.getContext("2d");
    }

    setupTournamentInput(gameId, String(userId));

    gameUpdateListener = (updateMsg: any) => {
      if (updateMsg.type === "game_update" && ctx) {
        gameState.paddles = updateMsg.payload.paddles;
        gameState.ball = updateMsg.payload.ball;
        const scoreEl = getElement("tournament-score");
        if (scoreEl) scoreEl.innerText = `${gameState.paddles.left.score} - ${gameState.paddles.right.score}`;
        ctx.clearRect(0, 0, gameConfig.canvas.width, gameConfig.canvas.height);
        game_start(gameConfig, gameState, ctx);
      }
    };
    addMessageListener(gameUpdateListener);

    gameFinishListener = (finishMsg: any) => {
       if (finishMsg.type === "game_finish") {
           console.log("🏁 Match Finished");
           cleanupTournamentMatch();
           if (els.gameLabel) els.gameLabel.innerText = "Match Ended";
       }
    };
    addMessageListener(gameFinishListener);
    sendMessage("player_ready", { gameId: gameId, playerId: String(userId) });
  };

  const runCountdown = (seconds: number, onComplete: () => void) => {
    let count = seconds;
    if(els.timer) els.timer.innerText = String(count);
    const interval = setInterval(() => {
      count--;
      if(els.timer) els.timer.innerText = String(count);
      if (count <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);
  };

  return (msg: any) => {
    if (msg.type === "game_config") {
        currentMatchId = msg.payload.gameId;
        if (els.readyBtn) {
            els.readyBtn.onclick = () => {
                sendMessage("player_ready", { gameId: currentMatchId, playerId: String(userId) });
                els.readyBtn!.innerHTML = "Waiting...";
                els.readyBtn!.disabled = true;
                els.readyBtn!.style.opacity = "0.5";
                initGameConfig(msg);
                setTimeout(() => { if(els.readyOverlay) els.readyOverlay.style.display = 'none'; }, 500);
            };
        }
        return;
    }

    switch (msg.type) {
      case "tournament_semi-finals":
        switchView('bracket');
        if(els.bracketTitle) els.bracketTitle.innerText = "SEMI-FINALS";

        resolveAndRenderBracket(
          msg.payload.semi1.players[0], msg.payload.semi1.players[1],
          msg.payload.semi2.players[0], msg.payload.semi2.players[1]
        ).then(({ html, amIPlaying }) => {
          if(els.bracketContent) els.bracketContent.innerHTML = html;

          let p1 = null, p2 = null;
          resolveUser(msg.payload.semi1.players[0]).then(u1 => {
            resolveUser(msg.payload.semi1.players[1]).then(u2 => {
                 if(u1.isMe || u2.isMe) setupGameView(u1, u2);
            });
          });
          resolveUser(msg.payload.semi2.players[0]).then(u3 => {
             resolveUser(msg.payload.semi2.players[1]).then(u4 => {
                 if(u3.isMe || u4.isMe) setupGameView(u3, u4);
             });
          });

          runCountdown(10, () => {
            if (amIPlaying) {
                switchView('game');
                if(els.readyOverlay) els.readyOverlay.style.display = "flex";
                if(els.readyBtn) {
                    els.readyBtn.innerHTML = "I AM READY! ⚔️";
                    els.readyBtn.disabled = false;
                    els.readyBtn.style.opacity = "1";
                }
            }
          });
        });
        break;

      case "tournament_final":
        switchView('bracket');
        if(els.bracketTitle) els.bracketTitle.innerText = "GRAND FINAL";

        resolveAndRenderBracket(
          msg.payload.final.players[0], msg.payload.final.players[1]
        ).then(({ html, amIPlaying, users }) => {
          if(els.bracketContent) els.bracketContent.innerHTML = html;

          runCountdown(5, () => {
             if (amIPlaying) {
                switchView('game');
                setupGameView(users[0], users[1]);
                if(els.readyOverlay) els.readyOverlay.style.display = "flex";
                if(els.readyBtn) {
                     els.readyBtn.innerHTML = "READY FOR FINAL!";
                     els.readyBtn.disabled = false;
                     els.readyBtn.style.opacity = "1";
                }
             }
          });
        });
        break;

      case "tournament_finish":
        switchView('bracket');
        if(els.bracketTitle) els.bracketTitle.innerText = "CHAMPION";

        resolveUser(msg.payload.winner).then(winner => {
             if(els.bracketContent) {
                 els.bracketContent.innerHTML = `
                    <div class="flex flex-col items-center animate-bounce mt-10">
                        <div class="text-6xl mb-4">👑</div>
                        <img src="${winner.avatar}" class="w-40 h-40 rounded-full border-4 border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.6)] object-cover">
                        <h2 class="text-4xl font-bold text-yellow-400 mt-4">${winner.name}</h2>
                    </div>
                 `;
             }
        });

        setTimeout(() => {
            localStorage.removeItem('activeTournamentId');
            navigateCallback("dashboard/game/tournament");
        }, 5000);
        break;
    }
  };
}

export function setupTournamentGameListeners(
  tournamentListener: (msg: any) => void
): void {
  addMessageListener(tournamentListener);
  addCleanupListener(() => {
    removeMessageListener(tournamentListener);
    cleanupTournamentMatch();
  });
}