import type { Card as CardType } from '../types/game';
import { Card } from './Card';
import { css } from '../../styled-system/css';

interface CardHandProps {
  cards: CardType[];
  selectedCard?: CardType | null;
  onCardClick?: (card: CardType) => void;
  faceDown?: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  animatingCardIds?: Set<string>;
  animationPhase?: 'none' | 'taking' | 'putting';
}

export function CardHand({
  cards,
  selectedCard,
  onCardClick,
  faceDown = false,
  label,
  size = 'medium',
  animatingCardIds,
  animationPhase = 'none',
}: CardHandProps) {
  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      })}
    >
      {label && (
        <div
          className={css({
            fontSize: 'sm',
            fontWeight: 'semibold',
            color: 'gray.700',
            textTransform: 'uppercase',
            letterSpacing: 'wide',
          })}
        >
          {label}
        </div>
      )}
      <div
        className={css({
          display: 'flex',
          gap: size === 'small' ? '6px' : size === 'large' ? '16px' : '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        })}
      >
        {cards.length > 0 ? (
          cards.map((card) => {
            const isAnimating = animatingCardIds?.has(card.id);
            return (
              <div
                key={card.id}
                className={css({
                  transition: 'all 0.4s ease-in-out',
                  transform: isAnimating && animationPhase === 'taking'
                    ? 'scale(1.15)'
                    : isAnimating && animationPhase === 'putting'
                    ? 'scale(1.15)'
                    : 'scale(1)',
                  filter: isAnimating
                    ? 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.8))'
                    : 'none',
                })}
              >
                <Card
                  card={card}
                  selected={selectedCard?.id === card.id}
                  onClick={onCardClick ? () => onCardClick(card) : undefined}
                  faceDown={faceDown}
                  size={size}
                />
              </div>
            );
          })
        ) : (
          <>
            <Card card={null} size={size} />
            <Card card={null} size={size} />
            <Card card={null} size={size} />
          </>
        )}
      </div>
    </div>
  );
}
