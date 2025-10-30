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
}

export function CardHand({
  cards,
  selectedCard,
  onCardClick,
  faceDown = false,
  label,
  size = 'medium',
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
          cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              selected={selectedCard?.id === card.id}
              onClick={onCardClick ? () => onCardClick(card) : undefined}
              faceDown={faceDown}
              size={size}
            />
          ))
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
