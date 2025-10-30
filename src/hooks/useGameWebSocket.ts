import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameState, Card, PlayerAction, GameConfig } from '../types/game';

interface GameWebSocketState {
  gameState: GameState | null;
  yourPlayerId: string | null;
  roomId: string | null;
  connected: boolean;
  error: string | null;
}

interface GameWebSocketActions {
  createGame: (config: GameConfig, playerName: string) => void;
  joinGame: (roomId: string, playerName: string) => void;
  startRound: () => void;
  makeAction: (action: PlayerAction, cardToExchange?: Card, publicCardToTake?: Card) => void;
  makeDealerDecision: (keepSeenSet: boolean) => void;
  continueGame: () => void;
}

export function useGameWebSocket(): [GameWebSocketState, GameWebSocketActions] {
  const [state, setState] = useState<GameWebSocketState>({
    gameState: null,
    yourPlayerId: null,
    roomId: null,
    connected: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    // Use environment variable for WebSocket URL in production, or auto-detect for local dev
    const wsUrl = import.meta.env.VITE_WS_URL ||
                  `ws://${window.location.hostname}:3002`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to server');
      setState((prev) => ({ ...prev, connected: true, error: null }));
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setState((prev) => ({ ...prev, connected: false }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setState((prev) => ({ ...prev, error: 'Connection error' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'game-created') {
          setState((prev) => ({
            ...prev,
            roomId: message.roomId,
            yourPlayerId: message.playerId,
          }));
        } else if (message.type === 'game-joined') {
          setState((prev) => ({
            ...prev,
            roomId: message.roomId,
            yourPlayerId: message.playerId,
          }));
        } else if (message.type === 'game-state') {
          setState((prev) => ({
            ...prev,
            gameState: message.gameState,
            yourPlayerId: message.yourPlayerId,
          }));
        } else if (message.type === 'error') {
          setState((prev) => ({ ...prev, error: message.message }));
          alert(message.message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  // Actions
  const createGame = useCallback((config: GameConfig, playerName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'create-game',
        config,
        playerName,
      }));
    }
  }, []);

  const joinGame = useCallback((roomId: string, playerName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join-game',
        roomId,
        playerName,
      }));
    }
  }, []);

  const startRound = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start-round',
      }));
    }
  }, []);

  const makeAction = useCallback((
    action: PlayerAction,
    cardToExchange?: Card,
    publicCardToTake?: Card
  ) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'player-action',
        action,
        cardToExchange,
        publicCardToTake,
      }));
    }
  }, []);

  const makeDealerDecision = useCallback((keepSeenSet: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'dealer-decision',
        keepSeenSet,
      }));
    }
  }, []);

  const continueGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'continue-game',
      }));
    }
  }, []);

  return [
    state,
    {
      createGame,
      joinGame,
      startRound,
      makeAction,
      makeDealerDecision,
      continueGame,
    },
  ];
}
