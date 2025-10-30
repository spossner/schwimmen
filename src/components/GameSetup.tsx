import { useState } from 'react';
import { css } from '../../styled-system/css';
import type { GameConfig } from '../types/game';

interface GameSetupProps {
  onCreateGame: (config: GameConfig, playerName: string) => void;
  onJoinGame: (roomId: string, playerName: string) => void;
}

export function GameSetup({ onCreateGame, onJoinGame }: GameSetupProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [humanPlayers, setHumanPlayers] = useState(2);
  const [aiPlayers, setAiPlayers] = useState(2);

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    const config: GameConfig = {
      humanPlayers,
      aiPlayers,
      startingLives: 3,
    };

    onCreateGame(config, playerName.trim());
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomId.trim()) {
      alert('Please enter room ID');
      return;
    }

    // Case-insensitive room ID
    onJoinGame(roomId.trim().toLowerCase(), playerName.trim());
  };

  return (
    <div
      className={css({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      })}
    >
      <div
        className={css({
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '2xl',
          maxWidth: '500px',
          width: '100%',
        })}
      >
        <h1
          className={css({
            fontSize: '3xl',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
            color: 'gray.800',
          })}
        >
          🏊 Schwimmen
        </h1>
        <p
          className={css({
            textAlign: 'center',
            color: 'gray.600',
            marginBottom: '24px',
          })}
        >
          The classic card game
        </p>

        {/* Mode selector */}
        <div
          className={css({
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            backgroundColor: 'gray.100',
            padding: '4px',
            borderRadius: '8px',
          })}
        >
          <button
            onClick={() => setMode('create')}
            className={css({
              flex: 1,
              padding: '12px',
              borderRadius: '6px',
              fontWeight: 'semibold',
              backgroundColor: mode === 'create' ? 'white' : 'transparent',
              color: mode === 'create' ? 'blue.600' : 'gray.600',
              boxShadow: mode === 'create' ? 'sm' : 'none',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
            })}
          >
            Create Game
          </button>
          <button
            onClick={() => setMode('join')}
            className={css({
              flex: 1,
              padding: '12px',
              borderRadius: '6px',
              fontWeight: 'semibold',
              backgroundColor: mode === 'join' ? 'white' : 'transparent',
              color: mode === 'join' ? 'blue.600' : 'gray.600',
              boxShadow: mode === 'join' ? 'sm' : 'none',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
            })}
          >
            Join Game
          </button>
        </div>

        {/* Player name input */}
        <div className={css({ marginBottom: '16px' })}>
          <label
            className={css({
              display: 'block',
              fontSize: 'sm',
              fontWeight: 'semibold',
              marginBottom: '8px',
              color: 'gray.700',
            })}
          >
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className={css({
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid',
              borderColor: 'gray.300',
              fontSize: 'md',
              _focus: {
                outline: 'none',
                borderColor: 'blue.500',
              },
            })}
          />
        </div>

        {mode === 'create' ? (
          <>
            {/* Human players */}
            <div className={css({ marginBottom: '16px' })}>
              <label
                className={css({
                  display: 'block',
                  fontSize: 'sm',
                  fontWeight: 'semibold',
                  marginBottom: '8px',
                  color: 'gray.700',
                })}
              >
                Human Players: {humanPlayers}
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={humanPlayers}
                onChange={(e) => setHumanPlayers(Number(e.target.value))}
                className={css({
                  width: '100%',
                })}
              />
              <div
                className={css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'xs',
                  color: 'gray.500',
                  marginTop: '4px',
                })}
              >
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>

            {/* AI players */}
            <div className={css({ marginBottom: '24px' })}>
              <label
                className={css({
                  display: 'block',
                  fontSize: 'sm',
                  fontWeight: 'semibold',
                  marginBottom: '8px',
                  color: 'gray.700',
                })}
              >
                AI Players: {aiPlayers}
              </label>
              <input
                type="range"
                min="0"
                max="4"
                value={aiPlayers}
                onChange={(e) => setAiPlayers(Number(e.target.value))}
                className={css({
                  width: '100%',
                })}
              />
              <div
                className={css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'xs',
                  color: 'gray.500',
                  marginTop: '4px',
                })}
              >
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>

            <button
              onClick={handleCreateGame}
              className={css({
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'blue.600',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 'lg',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                _hover: {
                  backgroundColor: 'blue.700',
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                },
              })}
            >
              Create Game
            </button>
          </>
        ) : (
          <>
            {/* Room ID input */}
            <div className={css({ marginBottom: '24px' })}>
              <label
                className={css({
                  display: 'block',
                  fontSize: 'sm',
                  fontWeight: 'semibold',
                  marginBottom: '8px',
                  color: 'gray.700',
                })}
              >
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID (case insensitive)"
                className={css({
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid',
                  borderColor: 'gray.300',
                  fontSize: 'md',
                  _focus: {
                    outline: 'none',
                    borderColor: 'blue.500',
                  },
                })}
              />
            </div>

            <button
              onClick={handleJoinGame}
              className={css({
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'green.600',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 'lg',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                _hover: {
                  backgroundColor: 'green.700',
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                },
              })}
            >
              Join Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}
