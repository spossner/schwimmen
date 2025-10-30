// Card suits and ranks
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Unique identifier for the card
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  lives: number;
  hand: Card[];
  isSwimming: boolean; // 0 lives left
  isEliminated: boolean; // Out of the game
  isDealer: boolean;
  hasClosedRound: boolean;
}

export type GamePhase =
  | 'setup'           // Selecting players
  | 'dealing'         // Dealer is dealing cards
  | 'dealer-decision' // Dealer choosing which set to keep
  | 'playing'         // Normal turn-based play
  | 'last-round'      // Round closed, everyone gets last turn
  | 'scoring'         // Revealing and scoring hands
  | 'round-end'       // Showing results
  | 'game-end';       // Game over

export type PlayerAction =
  | 'skip'
  | 'exchange-one'
  | 'exchange-all'
  | 'close-round';

export interface GameState {
  players: Player[];
  publicCards: Card[];
  deck: Card[];
  currentPlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  roundNumber: number;
  dealerSets: [Card[], Card[]] | null; // Two sets of 3 cards for dealer decision
  seenSetIndex: number | null; // Which set the dealer has seen (0 or 1)
  playersWhoActedAfterClose: Set<string>; // Track who has acted in last round
  roundClosedByPlayerId: string | null;
  lastAction: {
    playerId: string;
    playerName: string;
    action: PlayerAction;
    takenCardIds?: string[]; // IDs of cards taken from public pile
    putCardIds?: string[]; // IDs of cards put back to public pile
    timestamp: number;
  } | null;
}

export interface GameConfig {
  humanPlayers: number;
  aiPlayers: number;
  startingLives: number;
}

export interface ScoreResult {
  playerId: string;
  score: number;
  hand: Card[];
  scoringCards: Card[]; // The 3 cards that contributed to the score
  isThreeOfKind: boolean; // true if score is from 3 of a kind (30.5)
}

export interface RoundResult {
  scores: ScoreResult[];
  loserIds: string[]; // Players with lowest score who lose a life
  threeAcesPlayerId: string | null; // If someone got 3 aces
}
