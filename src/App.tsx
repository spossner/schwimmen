import { GameSetup } from './components/GameSetup';
import { GameBoard } from './components/GameBoard';
import { useGameWebSocket } from './hooks/useGameWebSocket';
import { css } from '../styled-system/css';

export function App() {
  const [state, actions] = useGameWebSocket();

  // Show loading state while connecting
  if (!state.connected) {
    return (
      <div
        className={css({
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        })}
      >
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '2xl',
            textAlign: 'center',
          })}
        >
          <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', marginBottom: '16px' })}>
            Connecting to server...
          </h2>
          <div
            className={css({
              width: '50px',
              height: '50px',
              border: '4px solid',
              borderColor: 'gray.200',
              borderTopColor: 'blue.600',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            })}
          />
        </div>
      </div>
    );
  }

  // Show game setup if no game state
  if (!state.gameState || !state.roomId || !state.yourPlayerId) {
    return (
      <GameSetup
        onCreateGame={actions.createGame}
        onJoinGame={actions.joinGame}
      />
    );
  }

  // Show game board
  return (
    <GameBoard
      gameState={state.gameState}
      yourPlayerId={state.yourPlayerId}
      roomId={state.roomId}
      onStartRound={actions.startRound}
      onMakeAction={actions.makeAction}
      onDealerDecision={actions.makeDealerDecision}
      onContinueGame={actions.continueGame}
    />
  );
}
