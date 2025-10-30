import type { Card, Rank, Suit, Player, ScoreResult, RoundResult } from '../types/game';

// Card value mapping for scoring
export const CARD_VALUES: Record<Rank, number> = {
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 10,
  'Q': 10,
  'K': 10,
  'A': 11,
};

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Creates a standard 32-card deck (German deck: 7-Ace in 4 suits)
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
      });
    }
  }
  return deck;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculates the score for a hand of 3 cards
 * Returns the best possible score
 */
export function calculateScore(hand: Card[]): ScoreResult {
  if (hand.length !== 3) {
    throw new Error('Hand must contain exactly 3 cards');
  }

  // Check for three of a kind (same rank, different suits)
  const ranks = hand.map(c => c.rank);
  const isThreeOfKind = ranks[0] === ranks[1] && ranks[1] === ranks[2];

  if (isThreeOfKind) {
    return {
      playerId: '', // Will be set by caller
      score: 30.5,
      hand,
      scoringCards: hand,
      isThreeOfKind: true,
    };
  }

  // Calculate best score from same suit
  let bestScore = 0;
  let bestScoringCards: Card[] = [];

  for (const suit of SUITS) {
    const sameSuitCards = hand.filter(c => c.suit === suit);
    if (sameSuitCards.length > 0) {
      const score = sameSuitCards.reduce((sum, card) => sum + CARD_VALUES[card.rank], 0);
      if (score > bestScore) {
        bestScore = score;
        bestScoringCards = sameSuitCards;
      }
    }
  }

  // If no same suit, just take highest single card
  if (bestScoringCards.length === 0) {
    bestScoringCards = [hand.reduce((best, card) =>
      CARD_VALUES[card.rank] > CARD_VALUES[best.rank] ? card : best
    )];
    bestScore = CARD_VALUES[bestScoringCards[0].rank];
  }

  return {
    playerId: '',
    score: bestScore,
    hand,
    scoringCards: bestScoringCards,
    isThreeOfKind: false,
  };
}

/**
 * Checks if a hand contains three aces
 */
export function hasThreeAces(hand: Card[]): boolean {
  if (hand.length !== 3) return false;
  return hand.every(card => card.rank === 'A');
}

/**
 * Determines round results - who loses lives
 */
export function determineRoundResults(players: Player[]): RoundResult {
  // Only consider active (non-eliminated) players
  const activePlayers = players.filter(p => !p.isEliminated);

  // Check for three aces first
  const threeAcesPlayer = activePlayers.find(p => hasThreeAces(p.hand));
  if (threeAcesPlayer) {
    return {
      scores: players.map(p => ({
        ...calculateScore(p.hand),
        playerId: p.id,
      })),
      loserIds: activePlayers.filter(p => p.id !== threeAcesPlayer.id).map(p => p.id),
      threeAcesPlayerId: threeAcesPlayer.id,
    };
  }

  // Calculate scores for all players
  const scores = players.map(player => ({
    ...calculateScore(player.hand),
    playerId: player.id,
  }));

  // Find minimum score among active players only
  const activeScores = scores.filter(s => activePlayers.some(p => p.id === s.playerId));
  const minScore = Math.min(...activeScores.map(s => s.score));

  // All active players with minimum score lose a life
  const loserIds = activeScores
    .filter(s => s.score === minScore)
    .map(s => s.playerId);

  return {
    scores,
    loserIds,
    threeAcesPlayerId: null,
  };
}

/**
 * Deals cards to all players and creates dealer sets
 * Returns updated deck, player hands, and dealer sets
 */
export function dealCards(players: Player[], deck: Card[]): {
  deck: Card[];
  playerHands: Map<string, Card[]>;
  dealerSets: [Card[], Card[]];
} {
  const shuffled = shuffleDeck(deck);
  let currentIndex = 0;

  const playerHands = new Map<string, Card[]>();

  // Deal 3 cards to each active player (except dealer)
  for (const player of players) {
    if (!player.isDealer && !player.isEliminated) {
      playerHands.set(player.id, shuffled.slice(currentIndex, currentIndex + 3));
      currentIndex += 3;
    }
  }

  // Deal two sets of 3 cards for dealer (only if dealer is not eliminated)
  const dealer = players.find(p => p.isDealer);
  let dealerSet1: Card[] = [];
  let dealerSet2: Card[] = [];

  if (dealer && !dealer.isEliminated) {
    dealerSet1 = shuffled.slice(currentIndex, currentIndex + 3);
    currentIndex += 3;
    dealerSet2 = shuffled.slice(currentIndex, currentIndex + 3);
    currentIndex += 3;
  }

  // Remaining cards are the deck
  const remainingDeck = shuffled.slice(currentIndex);

  return {
    deck: remainingDeck,
    playerHands,
    dealerSets: [dealerSet1, dealerSet2],
  };
}

/**
 * Validates if a player action is legal
 */
export function isValidAction(
  _player: Player,
  action: string,
  hasFirstRoundCompleted: boolean
): boolean {
  // Can always skip or exchange
  if (action === 'skip' || action === 'exchange-one' || action === 'exchange-all') {
    return true;
  }

  // Can only close round after first full round
  if (action === 'close-round') {
    return hasFirstRoundCompleted;
  }

  return false;
}

/**
 * Gets the next player index (circular)
 */
export function getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
  return (currentIndex + 1) % totalPlayers;
}

/**
 * Updates player lives after round
 */
export function updatePlayerLives(players: Player[], loserIds: string[]): Player[] {
  return players.map(player => {
    if (loserIds.includes(player.id)) {
      const newLives = player.lives - 1;

      // If already swimming (0 lives) and loses again, they're eliminated
      if (player.isSwimming && newLives < 0) {
        return {
          ...player,
          lives: 0,
          isSwimming: true,
          isEliminated: true,
        };
      }

      // If reaches 0 lives, they're swimming
      return {
        ...player,
        lives: Math.max(0, newLives),
        isSwimming: newLives === 0,
        isEliminated: false,
      };
    }
    return player;
  });
}

/**
 * Checks if game should end (only one player not eliminated)
 */
export function shouldGameEnd(players: Player[]): boolean {
  const activePlayers = players.filter(p => !p.isEliminated);
  return activePlayers.length <= 1;
}

/**
 * Gets player who should be next dealer (a loser from previous round, but not eliminated)
 */
export function getNextDealerIndex(players: Player[], loserIds: string[]): number {
  // Find first loser in player order who is not eliminated
  const loserIndex = players.findIndex(p => loserIds.includes(p.id) && !p.isEliminated);

  // If no non-eliminated loser found, find first non-eliminated player
  if (loserIndex < 0) {
    return players.findIndex(p => !p.isEliminated);
  }

  return loserIndex;
}
