import type { Card, Player, PlayerAction } from '../types/game';
import { calculateScore, hasThreeAces } from './gameLogic';

/**
 * AI strategy for making decisions
 * Uses a scoring-based approach with some randomness
 */

interface ActionEvaluation {
  action: PlayerAction;
  expectedScore: number;
  confidence: number; // 0-1, how confident AI is in this action
}

/**
 * Evaluates potential score if we exchange one card
 */
function evaluateExchangeOne(hand: Card[], publicCards: Card[]): {
  bestCard: Card | null;
  bestPublicCard: Card | null;
  expectedScore: number;
} {
  let bestScore = calculateScore(hand).score;
  let bestCard: Card | null = null;
  let bestPublicCard: Card | null = null;

  // Try exchanging each hand card with each public card
  for (let i = 0; i < hand.length; i++) {
    for (const publicCard of publicCards) {
      const newHand = [...hand];
      newHand[i] = publicCard;
      const score = calculateScore(newHand).score;

      if (score > bestScore) {
        bestScore = score;
        bestCard = hand[i];
        bestPublicCard = publicCard;
      }
    }
  }

  return {
    bestCard,
    bestPublicCard,
    expectedScore: bestScore,
  };
}

/**
 * Evaluates score if we exchange all cards
 */
function evaluateExchangeAll(publicCards: Card[]): number {
  return calculateScore(publicCards).score;
}

/**
 * AI decides which action to take
 */
export function getAIAction(
  player: Player,
  publicCards: Card[],
  hasFirstRoundCompleted: boolean,
  isLastRound: boolean
): {
  action: PlayerAction;
  cardToExchange?: Card;
  publicCardToTake?: Card;
} {
  const currentScore = calculateScore(player.hand).score;

  // Check if we have three aces - always skip (we win immediately)
  if (hasThreeAces(player.hand)) {
    return { action: 'skip' };
  }

  // Evaluate different actions
  const exchangeOneResult = evaluateExchangeOne(player.hand, publicCards);
  const exchangeAllScore = evaluateExchangeAll(publicCards);

  const evaluations: ActionEvaluation[] = [
    {
      action: 'skip',
      expectedScore: currentScore,
      confidence: currentScore >= 28 ? 0.9 : 0.3, // High confidence if we have good cards
    },
    {
      action: 'exchange-one',
      expectedScore: exchangeOneResult.expectedScore,
      confidence: exchangeOneResult.bestCard ? 0.7 : 0,
    },
    {
      action: 'exchange-all',
      expectedScore: exchangeAllScore,
      confidence: 0.6,
    },
  ];

  // Add close-round option if available
  if (hasFirstRoundCompleted && !isLastRound) {
    // Close round if we have a good score (27+) or if it's getting risky
    const shouldClose = currentScore >= 27 || (currentScore >= 24 && Math.random() > 0.5);
    if (shouldClose) {
      evaluations.push({
        action: 'close-round',
        expectedScore: currentScore,
        confidence: currentScore >= 29 ? 0.95 : 0.7,
      });
    }
  }

  // Decision logic with some randomness
  // Sort by expected score, but factor in confidence
  evaluations.sort((a, b) => {
    const scoreA = a.expectedScore * a.confidence;
    const scoreB = b.expectedScore * b.confidence;
    return scoreB - scoreA;
  });

  const bestEval = evaluations[0];

  // Add some randomness - sometimes pick second best option
  const chosenEval = Math.random() < 0.85 ? bestEval : evaluations[Math.min(1, evaluations.length - 1)];

  // Return the chosen action with details
  if (chosenEval.action === 'exchange-one' && exchangeOneResult.bestCard && exchangeOneResult.bestPublicCard) {
    return {
      action: 'exchange-one',
      cardToExchange: exchangeOneResult.bestCard,
      publicCardToTake: exchangeOneResult.bestPublicCard,
    };
  }

  return {
    action: chosenEval.action,
  };
}

/**
 * AI dealer decides which set to keep
 * Returns the index of the set to keep as their hand (0 or 1)
 */
export function getAIDealerDecision(
  seenSet: Card[],
  _seenSetIndex: number
): {
  keepSeenSet: boolean;
  confidence: number;
} {
  const seenScore = calculateScore(seenSet).score;

  // Decision thresholds
  const EXCELLENT_SCORE = 29;
  const GOOD_SCORE = 25;
  const ACCEPTABLE_SCORE = 20;

  // Check for three aces
  if (hasThreeAces(seenSet)) {
    return { keepSeenSet: true, confidence: 1.0 };
  }

  // If seen set is excellent, definitely keep it
  if (seenScore >= EXCELLENT_SCORE) {
    return { keepSeenSet: true, confidence: 0.95 };
  }

  // If seen set is good, probably keep it
  if (seenScore >= GOOD_SCORE) {
    return { keepSeenSet: true, confidence: 0.75 };
  }

  // If seen set is acceptable, maybe keep it
  if (seenScore >= ACCEPTABLE_SCORE) {
    // 50/50 chance, with slight preference to keep
    return { keepSeenSet: Math.random() > 0.4, confidence: 0.5 };
  }

  // If seen set is poor, probably take the unknown set
  return { keepSeenSet: false, confidence: 0.7 };
}

/**
 * Evaluates the strength of a hand for strategic decisions
 */
export function evaluateHandStrength(hand: Card[]): {
  score: number;
  strength: 'excellent' | 'good' | 'fair' | 'poor';
  shouldRisk: boolean; // Whether to risk exchanging
} {
  const score = calculateScore(hand).score;

  let strength: 'excellent' | 'good' | 'fair' | 'poor';
  let shouldRisk: boolean;

  if (score >= 29) {
    strength = 'excellent';
    shouldRisk = false;
  } else if (score >= 25) {
    strength = 'good';
    shouldRisk = false;
  } else if (score >= 20) {
    strength = 'fair';
    shouldRisk = true;
  } else {
    strength = 'poor';
    shouldRisk = true;
  }

  return { score, strength, shouldRisk };
}

/**
 * Gets a hint for human players
 */
export function getPlayerHint(
  hand: Card[],
  publicCards: Card[],
  hasFirstRoundCompleted: boolean
): string {
  const currentScore = calculateScore(hand).score;
  const exchangeOneResult = evaluateExchangeOne(hand, publicCards);
  const exchangeAllScore = evaluateExchangeAll(publicCards);

  if (hasThreeAces(hand)) {
    return "You have three Aces! Skip to win the round!";
  }

  if (currentScore >= 31) {
    return "Perfect hand! Skip to win.";
  }

  if (currentScore >= 29) {
    return "Excellent hand! Consider skipping or closing the round.";
  }

  if (exchangeOneResult.expectedScore > currentScore + 5) {
    return `Consider exchanging ${exchangeOneResult.bestCard?.rank} of ${exchangeOneResult.bestCard?.suit} for ${exchangeOneResult.bestPublicCard?.rank} of ${exchangeOneResult.bestPublicCard?.suit}.`;
  }

  if (exchangeAllScore > currentScore + 5) {
    return `Public cards score ${exchangeAllScore.toFixed(1)}. Consider exchanging all.`;
  }

  if (currentScore >= 25 && hasFirstRoundCompleted) {
    return "You have a good hand. Consider closing the round.";
  }

  return "Evaluate your options carefully.";
}
