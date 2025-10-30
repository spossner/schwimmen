import type { Player } from '../types/game';
import { css } from '../../styled-system/css';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  yourPlayerId?: string;
}

export function PlayerList({ players, currentPlayerId, yourPlayerId }: PlayerListProps) {
  return (
    <div
      className={css({
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: 'lg',
        minWidth: '250px',
      })}
    >
      <h3
        className={css({
          fontSize: 'lg',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: 'gray.800',
        })}
      >
        Players
      </h3>
      <div
        className={css({
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        })}
      >
        {players.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isYou = player.id === yourPlayerId;

          return (
            <div
              key={player.id}
              className={css({
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: player.isEliminated
                  ? 'gray.200'
                  : isCurrentPlayer ? 'blue.50' : 'gray.50',
                border: '2px solid',
                borderColor: isCurrentPlayer && !player.isEliminated ? 'blue.400' : 'transparent',
                transition: 'all 0.2s',
                opacity: player.isEliminated ? 0.6 : 1,
              })}
            >
              <div
                className={css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                })}
              >
                <div className={css({ display: 'flex', alignItems: 'center', gap: '8px' })}>
                  <span
                    className={css({
                      fontWeight: 'semibold',
                      color: player.isEliminated ? 'gray.400' : 'gray.800',
                      textDecoration: player.isEliminated ? 'line-through' : 'none',
                    })}
                  >
                    {player.name}
                    {isYou && ' (You)'}
                  </span>
                  {player.isAI && (
                    <span
                      className={css({
                        fontSize: 'xs',
                        backgroundColor: 'purple.100',
                        color: 'purple.700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'semibold',
                      })}
                    >
                      AI
                    </span>
                  )}
                  {player.isDealer && (
                    <span
                      className={css({
                        fontSize: 'xs',
                        backgroundColor: 'yellow.100',
                        color: 'yellow.800',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'semibold',
                      })}
                    >
                      Dealer
                    </span>
                  )}
                </div>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '4px' })}>
                  <span
                    className={css({
                      fontSize: 'sm',
                      color: 'gray.600',
                      fontWeight: 'medium',
                    })}
                  >
                    Lives:
                  </span>
                  <div className={css({ display: 'flex', gap: '4px' })}>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={css({
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: i < player.lives ? 'red.500' : 'gray.300',
                          border: '2px solid',
                          borderColor: i < player.lives ? 'red.600' : 'gray.400',
                        })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {player.isEliminated && (
                <div
                  className={css({
                    marginTop: '8px',
                    fontSize: 'xs',
                    color: 'red.700',
                    backgroundColor: 'red.100',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'semibold',
                    textAlign: 'center',
                  })}
                >
                  ❌ Eliminated
                </div>
              )}
              {player.isSwimming && !player.isEliminated && (
                <div
                  className={css({
                    marginTop: '8px',
                    fontSize: 'xs',
                    color: 'orange.700',
                    backgroundColor: 'orange.100',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'semibold',
                    textAlign: 'center',
                  })}
                >
                  🏊 Swimming! (Next loss = out)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
