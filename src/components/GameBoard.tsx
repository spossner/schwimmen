import { useState, useMemo, useEffect } from 'react';
import { css } from '../../styled-system/css';
import type { GameState, Card, PlayerAction } from '../types/game';
import { CardHand } from './CardHand';
import { PlayerList } from './PlayerList';
import { calculateScore } from '../utils/gameLogic';

interface GameBoardProps {
  gameState: GameState;
  yourPlayerId: string;
  roomId: string;
  onStartRound: () => void;
  onMakeAction: (action: PlayerAction, cardToExchange?: Card, publicCardToTake?: Card) => void;
  onDealerDecision: (keepSeenSet: boolean) => void;
  onContinueGame: () => void;
}

export function GameBoard({
  gameState,
  yourPlayerId,
  roomId,
  onStartRound,
  onMakeAction,
  onDealerDecision,
  onContinueGame,
}: GameBoardProps) {
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [selectedPublicCard, setSelectedPublicCard] = useState<Card | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [animatingCardIds, setAnimatingCardIds] = useState<Set<string>>(new Set());
  const [animationPhase, setAnimationPhase] = useState<'none' | 'taking' | 'putting'>('none');
  const [displayedPublicCards, setDisplayedPublicCards] = useState<Card[]>([]);

  const yourPlayer = gameState.players.find((p) => p.id === yourPlayerId);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isYourTurn = currentPlayer?.id === yourPlayerId;
  const dealer = gameState.players.find((p) => p.isDealer);
  const isYouDealer = dealer?.id === yourPlayerId;
  const roundCloser = gameState.roundClosedByPlayerId
    ? gameState.players.find(p => p.id === gameState.roundClosedByPlayerId)
    : null;

  // Calculate your score
  const yourScore = useMemo(() => {
    if (yourPlayer && yourPlayer.hand.length === 3) {
      return calculateScore(yourPlayer.hand);
    }
    return null;
  }, [yourPlayer]);

  // Animate card exchanges
  useEffect(() => {
    if (gameState.lastAction && gameState.lastAction.action !== 'skip' && gameState.lastAction.takenCardIds) {
      const { playerName, action, takenCardIds, putCardIds } = gameState.lastAction;

      // Don't animate our own actions
      if (gameState.lastAction.playerId === yourPlayerId) {
        // Immediately update displayed cards for our own actions
        setDisplayedPublicCards(gameState.publicCards);
        return;
      }

      let message = '';
      if (action === 'exchange-one') {
        message = `${playerName} exchanged 1 card`;
      } else if (action === 'exchange-all') {
        message = `${playerName} exchanged all cards`;
      }

      if (message && takenCardIds && putCardIds) {
        setLastActionMessage(message);

        // Store the old public cards (before exchange) for animation
        // We need to reconstruct them based on takenCardIds
        const oldPublicCards = [...displayedPublicCards];

        // Phase 1: Highlight OLD cards being taken (grow and glow) - 2 seconds
        setAnimationPhase('taking');
        setAnimatingCardIds(new Set(takenCardIds));
        // Keep showing old cards
        setDisplayedPublicCards(oldPublicCards);

        // Phase 2: After 2000ms, swap to NEW cards and highlight them - 2 seconds
        const timer1 = setTimeout(() => {
          setAnimationPhase('putting');
          setAnimatingCardIds(new Set(putCardIds));
          // NOW update to the new public cards from gameState
          setDisplayedPublicCards(gameState.publicCards);
        }, 2000);

        // Phase 3: After 4000ms total, zoom back to normal
        const timer2 = setTimeout(() => {
          setAnimationPhase('none');
          setAnimatingCardIds(new Set());
        }, 4000);

        // Clear message after 4000ms
        const timer3 = setTimeout(() => {
          setLastActionMessage(null);
        }, 4000);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    } else if (gameState.lastAction?.action === 'close-round') {
      const { playerName } = gameState.lastAction;
      setLastActionMessage(`${playerName} closed the round!`);
      const timer = setTimeout(() => setLastActionMessage(null), 2000);
      return () => clearTimeout(timer);
    } else {
      // No animation, just update displayed cards
      setDisplayedPublicCards(gameState.publicCards);
    }
  }, [gameState.lastAction, yourPlayerId, gameState.publicCards]);

  // Initialize displayed public cards
  useEffect(() => {
    if (displayedPublicCards.length === 0) {
      setDisplayedPublicCards(gameState.publicCards);
    }
  }, [gameState.publicCards, displayedPublicCards.length]);

  // Can close round only after first full round
  const canCloseRound = gameState.roundNumber > 0 || gameState.currentPlayerIndex >= gameState.players.length;

  const handleExchangeOne = () => {
    if (selectedHandCard && selectedPublicCard) {
      onMakeAction('exchange-one', selectedHandCard, selectedPublicCard);
      setSelectedHandCard(null);
      setSelectedPublicCard(null);
    }
  };

  const handleExchangeAll = () => {
    onMakeAction('exchange-all');
    setSelectedHandCard(null);
    setSelectedPublicCard(null);
  };

  const handleSkip = () => {
    onMakeAction('skip');
    setSelectedHandCard(null);
    setSelectedPublicCard(null);
  };

  const handleCloseRound = () => {
    onMakeAction('close-round');
    setSelectedHandCard(null);
    setSelectedPublicCard(null);
  };

  // Setup phase
  if (gameState.phase === 'setup') {
    return (
      <div
        className={css({
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        })}
      >
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '2xl',
            textAlign: 'center',
            maxWidth: '600px',
          })}
        >
          <h2
            className={css({
              fontSize: '2xl',
              fontWeight: 'bold',
              marginBottom: '16px',
            })}
          >
            Game Ready!
          </h2>
          <div
            className={css({
              backgroundColor: 'blue.50',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
            })}
          >
            <p className={css({ fontSize: 'sm', color: 'gray.600', marginBottom: '8px' })}>
              Room ID:
            </p>
            <p
              className={css({
                fontSize: '2xl',
                fontWeight: 'bold',
                color: 'blue.600',
                fontFamily: 'monospace',
              })}
            >
              {roomId}
            </p>
          </div>

          <PlayerList players={gameState.players} yourPlayerId={yourPlayerId} />

          <button
            onClick={onStartRound}
            className={css({
              width: '100%',
              padding: '16px',
              marginTop: '24px',
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
              },
            })}
          >
            Start Round {gameState.roundNumber + 1}
          </button>
        </div>
      </div>
    );
  }

  // Dealer decision phase
  if (gameState.phase === 'dealer-decision' && isYouDealer && gameState.dealerSets && gameState.seenSetIndex !== null) {
    const seenSet = gameState.dealerSets[gameState.seenSetIndex];
    const seenScore = calculateScore(seenSet);

    return (
      <div
        className={css({
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        })}
      >
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '2xl',
            textAlign: 'center',
            maxWidth: '600px',
          })}
        >
          <h2
            className={css({
              fontSize: '2xl',
              fontWeight: 'bold',
              marginBottom: '8px',
            })}
          >
            Dealer Decision
          </h2>
          <p className={css({ color: 'gray.600', marginBottom: '24px' })}>
            You are the dealer. Choose which set to keep.
          </p>

          <div className={css({ marginBottom: '24px' })}>
            <p
              className={css({
                fontSize: 'sm',
                fontWeight: 'semibold',
                marginBottom: '12px',
                color: 'gray.700',
              })}
            >
              Seen Set (Score: {seenScore.score.toFixed(1)})
            </p>
            <CardHand cards={seenSet} size="large" />
          </div>

          <div
            className={css({
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
            })}
          >
            <button
              onClick={() => onDealerDecision(true)}
              className={css({
                flex: 1,
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'green.600',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                _hover: {
                  backgroundColor: 'green.700',
                  transform: 'translateY(-2px)',
                },
              })}
            >
              Keep This Set
            </button>
            <button
              onClick={() => onDealerDecision(false)}
              className={css({
                flex: 1,
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'blue.600',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                _hover: {
                  backgroundColor: 'blue.700',
                  transform: 'translateY(-2px)',
                },
              })}
            >
              Take Other Set
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for dealer decision
  if (gameState.phase === 'dealer-decision') {
    return (
      <div
        className={css({
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            Waiting for dealer...
          </h2>
          <p className={css({ color: 'gray.600' })}>
            {dealer?.name} is choosing their hand
          </p>
        </div>
      </div>
    );
  }

  // Scoring/Round end
  if (gameState.phase === 'scoring' || gameState.phase === 'round-end') {
    return (
      <div
        className={css({
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '2xl',
            maxWidth: '800px',
            width: '100%',
          })}
        >
          <h2
            className={css({
              fontSize: '2xl',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '24px',
            })}
          >
            Round {gameState.roundNumber} Results
          </h2>

          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '24px',
            })}
          >
            {gameState.players.map((player) => {
              const score = player.hand.length === 3 ? calculateScore(player.hand) : null;
              return (
                <div
                  key={player.id}
                  className={css({
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'gray.50',
                    border: '2px solid',
                    borderColor: player.id === yourPlayerId ? 'blue.400' : 'transparent',
                  })}
                >
                  <div
                    className={css({
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    })}
                  >
                    <span className={css({ fontWeight: 'bold' })}>
                      {player.name} {player.id === yourPlayerId && '(You)'}
                    </span>
                    <span
                      className={css({
                        fontSize: 'xl',
                        fontWeight: 'bold',
                        color: 'blue.600',
                      })}
                    >
                      Score: {score?.score.toFixed(1) || '0'}
                    </span>
                  </div>
                  <CardHand cards={player.hand} size="small" />
                </div>
              );
            })}
          </div>

          <PlayerList
            players={gameState.players}
            currentPlayerId={currentPlayer?.id}
            yourPlayerId={yourPlayerId}
          />

          {gameState.phase === 'round-end' && (
            <button
              onClick={onContinueGame}
              className={css({
                width: '100%',
                padding: '16px',
                marginTop: '24px',
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
                },
              })}
            >
              Next Round
            </button>
          )}
        </div>
      </div>
    );
  }

  // Game end
  if (gameState.phase === 'game-end') {
    const winner = gameState.players.reduce((best, p) =>
      p.lives > best.lives ? p : best
    );

    return (
      <div
        className={css({
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        })}
      >
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '2xl',
            textAlign: 'center',
            maxWidth: '600px',
          })}
        >
          <h2
            className={css({
              fontSize: '3xl',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: 'green.600',
            })}
          >
            Game Over!
          </h2>
          <p
            className={css({
              fontSize: 'xl',
              marginBottom: '24px',
              color: 'gray.700',
            })}
          >
            {winner.name} wins! {winner.id === yourPlayerId && '(You!)'}
          </p>

          <PlayerList players={gameState.players} yourPlayerId={yourPlayerId} />
        </div>
      </div>
    );
  }

  // Playing phase - main game board
  return (
    <div
      className={css({
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      })}
    >
      <div
        className={css({
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '20px',
        })}
      >
        {/* Sidebar */}
        <div>
          <div className={css({ marginBottom: '16px' })}>
            <div
              className={css({
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: 'md',
                marginBottom: '16px',
              })}
            >
              <p className={css({ fontSize: 'sm', color: 'gray.600', marginBottom: '4px' })}>
                Room ID:
              </p>
              <p
                className={css({
                  fontSize: 'lg',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  color: 'blue.600',
                })}
              >
                {roomId}
              </p>
            </div>

            <div
              className={css({
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: 'md',
                marginBottom: '16px',
              })}
            >
              <p className={css({ fontSize: 'sm', color: 'gray.600', marginBottom: '4px' })}>
                Round:
              </p>
              <p className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
                {gameState.roundNumber}
              </p>
            </div>

            {yourScore && (
              <div
                className={css({
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: 'md',
                  marginBottom: '16px',
                })}
              >
                <p className={css({ fontSize: 'sm', color: 'gray.600', marginBottom: '4px' })}>
                  Your Score:
                </p>
                <p
                  className={css({
                    fontSize: '2xl',
                    fontWeight: 'bold',
                    color: 'green.600',
                  })}
                >
                  {yourScore.score.toFixed(1)}
                </p>
              </div>
            )}
          </div>

          <PlayerList
            players={gameState.players}
            currentPlayerId={currentPlayer?.id}
            yourPlayerId={yourPlayerId}
          />
        </div>

        {/* Main play area */}
        <div className={css({ flex: 1 })}>
          <div
            className={css({
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '2xl',
            })}
          >
            {/* Status */}
            <div
              className={css({
                textAlign: 'center',
                marginBottom: '24px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isYourTurn ? 'green.50' : 'blue.50',
              })}
            >
              <p
                className={css({
                  fontSize: 'lg',
                  fontWeight: 'bold',
                  color: isYourTurn ? 'green.700' : 'blue.700',
                })}
              >
                {isYourTurn ? "Your Turn!" : `${currentPlayer?.name}'s Turn`}
              </p>
              {gameState.phase === 'last-round' && roundCloser && (
                <p
                  className={css({
                    fontSize: 'sm',
                    color: 'orange.700',
                    marginTop: '4px',
                    fontWeight: 'semibold',
                  })}
                >
                  Round closed by {roundCloser.name} - Last moves for everyone!
                </p>
              )}
            </div>

            {/* Last Action Animation */}
            {lastActionMessage && (
              <div
                className={css({
                  textAlign: 'center',
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'purple.100',
                  border: '2px solid',
                  borderColor: 'purple.400',
                  animation: 'fadeIn 0.3s ease-in-out',
                })}
              >
                <p
                  className={css({
                    fontSize: 'md',
                    fontWeight: 'bold',
                    color: 'purple.800',
                  })}
                >
                  {lastActionMessage}
                </p>
              </div>
            )}

            {/* Public cards */}
            <div className={css({ marginBottom: '32px' })}>
              <CardHand
                cards={displayedPublicCards}
                label="Public Cards"
                selectedCard={selectedPublicCard}
                onCardClick={isYourTurn ? setSelectedPublicCard : undefined}
                size="large"
                animatingCardIds={animatingCardIds}
                animationPhase={animationPhase}
              />
            </div>

            {/* Your hand */}
            {yourPlayer && (
              <div className={css({ marginBottom: '24px' })}>
                <CardHand
                  cards={yourPlayer.hand}
                  label="Your Hand"
                  selectedCard={selectedHandCard}
                  onCardClick={isYourTurn ? setSelectedHandCard : undefined}
                  size="large"
                />
              </div>
            )}

            {/* Action buttons */}
            {isYourTurn && (
              <div
                className={css({
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                })}
              >
                <button
                  onClick={handleSkip}
                  className={css({
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'gray.600',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    _hover: {
                      backgroundColor: 'gray.700',
                    },
                  })}
                >
                  Skip
                </button>

                <button
                  onClick={handleExchangeOne}
                  disabled={!selectedHandCard || !selectedPublicCard}
                  className={css({
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'blue.600',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    _hover: {
                      backgroundColor: 'blue.700',
                    },
                    _disabled: {
                      backgroundColor: 'gray.300',
                      cursor: 'not-allowed',
                    },
                  })}
                >
                  Exchange 1 Card
                </button>

                <button
                  onClick={handleExchangeAll}
                  className={css({
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'purple.600',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    _hover: {
                      backgroundColor: 'purple.700',
                    },
                  })}
                >
                  Exchange All
                </button>

                {canCloseRound && gameState.phase !== 'last-round' && (
                  <button
                    onClick={handleCloseRound}
                    className={css({
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'orange.600',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.2s',
                      _hover: {
                        backgroundColor: 'orange.700',
                      },
                    })}
                  >
                    Close Round
                  </button>
                )}
              </div>
            )}

            {selectedHandCard && selectedPublicCard && isYourTurn && (
              <div
                className={css({
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'blue.50',
                  textAlign: 'center',
                  color: 'blue.700',
                  fontSize: 'sm',
                })}
              >
                Will exchange {selectedHandCard.rank} of {selectedHandCard.suit} with{' '}
                {selectedPublicCard.rank} of {selectedPublicCard.suit}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
