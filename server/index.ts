import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { GameState, Player, Card, PlayerAction, GameConfig } from '../src/types/game';
import {
  createDeck,
  dealCards,
  determineRoundResults,
  updatePlayerLives,
  shouldGameEnd,
  getNextDealerIndex,
  getNextPlayerIndex,
  hasThreeAces,
} from '../src/utils/gameLogic';
import { getAIAction, getAIDealerDecision } from '../src/utils/aiStrategy';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

interface Client {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface GameRoom {
  id: string;
  gameState: GameState;
  clients: Map<string, Client>;
}

const rooms = new Map<string, GameRoom>();
const clients = new Map<WebSocket, Client>();

// Message types
type ClientMessage =
  | { type: 'create-game'; config: GameConfig; playerName: string }
  | { type: 'join-game'; roomId: string; playerName: string }
  | { type: 'player-action'; action: PlayerAction; cardToExchange?: Card; publicCardToTake?: Card }
  | { type: 'dealer-decision'; keepSeenSet: boolean }
  | { type: 'start-round' }
  | { type: 'continue-game' };

type ServerMessage =
  | { type: 'game-created'; roomId: string; playerId: string }
  | { type: 'game-joined'; playerId: string; roomId: string }
  | { type: 'game-state'; gameState: GameState; yourPlayerId: string }
  | { type: 'error'; message: string }
  | { type: 'ai-action'; playerId: string; action: PlayerAction };

// Create a new game room
function createGameRoom(config: GameConfig, creatorName: string): GameRoom {
  const roomId = Math.random().toString(36).substring(7);

  const players: Player[] = [];

  // Add human players
  for (let i = 0; i < config.humanPlayers; i++) {
    players.push({
      id: `player-${i}`,
      name: i === 0 ? creatorName : `Player ${i + 1}`,
      isAI: false,
      lives: config.startingLives,
      hand: [],
      isSwimming: false,
      isEliminated: false,
      isDealer: i === 0, // First player is dealer
      hasClosedRound: false,
    });
  }

  // Add AI players
  for (let i = 0; i < config.aiPlayers; i++) {
    players.push({
      id: `ai-${i}`,
      name: `AI ${i + 1}`,
      isAI: true,
      lives: config.startingLives,
      hand: [],
      isSwimming: false,
      isEliminated: false,
      isDealer: false,
      hasClosedRound: false,
    });
  }

  const gameState: GameState = {
    players,
    publicCards: [],
    deck: createDeck(),
    currentPlayerIndex: 0,
    dealerIndex: 0,
    phase: 'setup',
    roundNumber: 0,
    dealerSets: null,
    seenSetIndex: null,
    playersWhoActedAfterClose: new Set(),
    roundClosedByPlayerId: null,
    lastAction: null,
  };

  const room: GameRoom = {
    id: roomId,
    gameState,
    clients: new Map(),
  };

  rooms.set(roomId, room);
  return room;
}

// Broadcast game state to all clients in a room
function broadcastGameState(room: GameRoom) {
  room.clients.forEach((client) => {
    // Send personalized game state (hide other players' cards)
    const personalizedState = getPersonalizedGameState(room.gameState, client.playerId);
    const message: ServerMessage = {
      type: 'game-state',
      gameState: personalizedState,
      yourPlayerId: client.playerId,
    };
    client.ws.send(JSON.stringify(message));
  });
}

// Get game state with hidden cards for other players
function getPersonalizedGameState(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map(p => {
      if (p.id === playerId || p.isAI) {
        return p;
      }
      // Hide other human players' cards
      return {
        ...p,
        hand: state.phase === 'scoring' || state.phase === 'round-end' ? p.hand : [],
      };
    }),
  };
}

// Start dealing phase
function startDealingPhase(room: GameRoom) {
  const { gameState } = room;
  gameState.phase = 'dealing';
  gameState.roundNumber += 1;

  // Reset player states
  gameState.players = gameState.players.map(p => ({
    ...p,
    hand: [],
    hasClosedRound: false,
  }));

  const { deck, playerHands, dealerSets } = dealCards(gameState.players, createDeck());

  gameState.deck = deck;
  gameState.dealerSets = dealerSets;
  gameState.playersWhoActedAfterClose = new Set();
  gameState.roundClosedByPlayerId = null;

  // Assign hands to players
  gameState.players = gameState.players.map(p => {
    if (p.isDealer) {
      return p; // Dealer gets hand after decision
    }
    return {
      ...p,
      hand: playerHands.get(p.id) || [],
    };
  });

  // Dealer sees one set (randomly chosen)
  gameState.seenSetIndex = Math.random() < 0.5 ? 0 : 1;
  gameState.phase = 'dealer-decision';

  broadcastGameState(room);

  // If dealer is AI, make decision automatically
  const dealer = gameState.players[gameState.dealerIndex];
  if (dealer.isAI && gameState.dealerSets && gameState.seenSetIndex !== null) {
    setTimeout(() => {
      handleAIDealerDecision(room);
    }, 1500);
  }
}

// Handle AI dealer decision
function handleAIDealerDecision(room: GameRoom) {
  const { gameState } = room;
  if (!gameState.dealerSets || gameState.seenSetIndex === null) return;

  const seenSet = gameState.dealerSets[gameState.seenSetIndex];
  const { keepSeenSet } = getAIDealerDecision(seenSet, gameState.seenSetIndex);

  processDealerDecision(room, keepSeenSet);
}

// Process dealer decision
function processDealerDecision(room: GameRoom, keepSeenSet: boolean) {
  const { gameState } = room;
  if (!gameState.dealerSets || gameState.seenSetIndex === null) return;

  const keptSet = keepSeenSet
    ? gameState.dealerSets[gameState.seenSetIndex]
    : gameState.dealerSets[1 - gameState.seenSetIndex];
  const publicSet = keepSeenSet
    ? gameState.dealerSets[1 - gameState.seenSetIndex]
    : gameState.dealerSets[gameState.seenSetIndex];

  // Assign dealer's hand
  gameState.players = gameState.players.map(p => {
    if (p.isDealer) {
      return { ...p, hand: keptSet };
    }
    return p;
  });

  gameState.publicCards = publicSet;
  gameState.phase = 'playing';
  gameState.currentPlayerIndex = getNextPlayerIndex(gameState.dealerIndex, gameState.players.length);

  broadcastGameState(room);

  // Start AI turn if next player is AI
  processNextTurn(room);
}

// Process player action
function processPlayerAction(
  room: GameRoom,
  playerId: string,
  action: PlayerAction,
  cardToExchange?: Card,
  publicCardToTake?: Card
) {
  const { gameState } = room;
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);

  if (playerIndex !== gameState.currentPlayerIndex) {
    return; // Not this player's turn
  }

  const player = gameState.players[playerIndex];

  // Can't take actions if eliminated
  if (player.isEliminated) {
    return;
  }

  // Process action
  if (action === 'skip') {
    // Do nothing
  } else if (action === 'exchange-one' && cardToExchange && publicCardToTake) {
    // Exchange one card
    const handIndex = player.hand.findIndex(c => c.id === cardToExchange.id);
    const publicIndex = gameState.publicCards.findIndex(c => c.id === publicCardToTake.id);

    if (handIndex >= 0 && publicIndex >= 0) {
      const temp = player.hand[handIndex];
      player.hand[handIndex] = gameState.publicCards[publicIndex];
      gameState.publicCards[publicIndex] = temp;
    }
  } else if (action === 'exchange-all') {
    // Exchange all cards
    const temp = [...player.hand];
    player.hand = [...gameState.publicCards];
    gameState.publicCards = temp;
  } else if (action === 'close-round') {
    gameState.phase = 'last-round';
    gameState.roundClosedByPlayerId = playerId;
    player.hasClosedRound = true;
  }

  // Check for three aces
  if (hasThreeAces(player.hand)) {
    finishRound(room, playerId);
    return;
  }

  // Record action
  gameState.lastAction = {
    playerId,
    action,
    timestamp: Date.now(),
  };

  // Mark player as acted if in last round
  if (gameState.phase === 'last-round') {
    gameState.playersWhoActedAfterClose.add(playerId);

    // Check if all players have acted
    const playersAfterCloser = getPlayersAfterRoundCloser(gameState);
    const allActed = playersAfterCloser.every(p =>
      gameState.playersWhoActedAfterClose.has(p.id)
    );

    if (allActed) {
      finishRound(room, null);
      return;
    }
  }

  // Move to next player
  gameState.currentPlayerIndex = getNextPlayerIndex(
    gameState.currentPlayerIndex,
    gameState.players.length
  );

  broadcastGameState(room);
  processNextTurn(room);
}

// Get players who need to act after round closer
function getPlayersAfterRoundCloser(gameState: GameState): Player[] {
  const closerIndex = gameState.players.findIndex(
    p => p.id === gameState.roundClosedByPlayerId
  );
  if (closerIndex < 0) return [];

  const result: Player[] = [];
  let index = getNextPlayerIndex(closerIndex, gameState.players.length);

  while (index !== closerIndex) {
    result.push(gameState.players[index]);
    index = getNextPlayerIndex(index, gameState.players.length);
  }

  return result;
}

// Process AI turn
function processNextTurn(room: GameRoom) {
  const { gameState } = room;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Skip eliminated players
  if (currentPlayer.isEliminated) {
    gameState.currentPlayerIndex = getNextPlayerIndex(
      gameState.currentPlayerIndex,
      gameState.players.length
    );
    broadcastGameState(room);
    processNextTurn(room);
    return;
  }

  if (currentPlayer.isAI && (gameState.phase === 'playing' || gameState.phase === 'last-round')) {
    setTimeout(() => {
      const hasFirstRoundCompleted = gameState.roundNumber > 0 ||
        gameState.currentPlayerIndex >= gameState.players.length;

      const aiDecision = getAIAction(
        currentPlayer,
        gameState.publicCards,
        hasFirstRoundCompleted,
        gameState.phase === 'last-round'
      );

      processPlayerAction(
        room,
        currentPlayer.id,
        aiDecision.action,
        aiDecision.cardToExchange,
        aiDecision.publicCardToTake
      );
    }, 1000 + Math.random() * 1000); // Random delay 1-2 seconds
  }
}

// Finish round and score
function finishRound(room: GameRoom, _threeAcesPlayerId: string | null) {
  const { gameState } = room;
  gameState.phase = 'scoring';

  const roundResult = determineRoundResults(gameState.players);

  // Update lives
  gameState.players = updatePlayerLives(gameState.players, roundResult.loserIds);

  // Set next dealer (one of the losers)
  gameState.dealerIndex = getNextDealerIndex(gameState.players, roundResult.loserIds);
  gameState.players = gameState.players.map((p, i) => ({
    ...p,
    isDealer: i === gameState.dealerIndex,
  }));

  // Check if game should end
  if (shouldGameEnd(gameState.players)) {
    gameState.phase = 'game-end';
  } else {
    gameState.phase = 'round-end';
  }

  broadcastGameState(room);
}

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (data: string) => {
    try {
      const message: ClientMessage = JSON.parse(data);

      if (message.type === 'create-game') {
        const room = createGameRoom(message.config, message.playerName);
        const playerId = room.gameState.players[0].id; // Creator is first player

        const client: Client = {
          ws,
          playerId,
          roomId: room.id,
        };

        clients.set(ws, client);
        room.clients.set(playerId, client);

        ws.send(JSON.stringify({
          type: 'game-created',
          roomId: room.id,
          playerId,
        }));

        broadcastGameState(room);
      } else if (message.type === 'join-game') {
        // Case-insensitive room ID lookup
        const roomId = message.roomId.toLowerCase();
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          return;
        }

        // Find first human player without a connection
        const availablePlayer = room.gameState.players.find(
          p => !p.isAI && !room.clients.has(p.id)
        );

        if (!availablePlayer) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
          return;
        }

        availablePlayer.name = message.playerName;

        const client: Client = {
          ws,
          playerId: availablePlayer.id,
          roomId: room.id,
        };

        clients.set(ws, client);
        room.clients.set(availablePlayer.id, client);

        ws.send(JSON.stringify({
          type: 'game-joined',
          playerId: availablePlayer.id,
          roomId: room.id,
        }));

        broadcastGameState(room);
      } else if (message.type === 'start-round') {
        const client = clients.get(ws);
        if (!client) return;

        const room = rooms.get(client.roomId);
        if (!room) return;

        startDealingPhase(room);
      } else if (message.type === 'dealer-decision') {
        const client = clients.get(ws);
        if (!client) return;

        const room = rooms.get(client.roomId);
        if (!room) return;

        processDealerDecision(room, message.keepSeenSet);
      } else if (message.type === 'player-action') {
        const client = clients.get(ws);
        if (!client) return;

        const room = rooms.get(client.roomId);
        if (!room) return;

        processPlayerAction(
          room,
          client.playerId,
          message.action,
          message.cardToExchange,
          message.publicCardToTake
        );
      } else if (message.type === 'continue-game') {
        const client = clients.get(ws);
        if (!client) return;

        const room = rooms.get(client.roomId);
        if (!room) return;

        startDealingPhase(room);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      const room = rooms.get(client.roomId);
      if (room) {
        room.clients.delete(client.playerId);
      }
      clients.delete(ws);
    }
    console.log('Client disconnected');
  });
});

const PORT = Number(process.env.PORT) || 3002;

if (process.env.NODE_ENV === 'production') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WebSocket server running on 0.0.0.0:${PORT}`);
  });
} else {
  server.listen(PORT, () => {
    console.log(`WebSocket server running on localhost:${PORT}`);
  });
}
