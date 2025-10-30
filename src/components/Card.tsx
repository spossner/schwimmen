import type { Card as CardType } from '../types/game';
import { css } from '../../styled-system/css';

interface CardProps {
  card: CardType | null;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: '#e74c3c',
  diamonds: '#e74c3c',
  clubs: '#2c3e50',
  spades: '#2c3e50',
};

export function Card({ card, selected = false, onClick, faceDown = false, size = 'medium' }: CardProps) {
  if (!card) {
    return (
      <div
        className={css({
          width: size === 'small' ? '60px' : size === 'large' ? '120px' : '90px',
          height: size === 'small' ? '84px' : size === 'large' ? '168px' : '126px',
          borderRadius: '8px',
          border: '2px dashed',
          borderColor: 'gray.300',
          backgroundColor: 'gray.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'gray.400',
          fontSize: size === 'small' ? 'xs' : size === 'large' ? 'lg' : 'sm',
        })}
      >
        Empty
      </div>
    );
  }

  const suitSymbol = suitSymbols[card.suit];
  const suitColor = suitColors[card.suit];

  if (faceDown) {
    return (
      <div
        className={css({
          width: size === 'small' ? '60px' : size === 'large' ? '120px' : '90px',
          height: size === 'small' ? '84px' : size === 'large' ? '168px' : '126px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '2px solid',
          borderColor: 'gray.700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          transition: 'transform 0.2s',
          _hover: onClick ? { transform: 'translateY(-4px)' } : {},
        })}
        onClick={onClick}
      >
        <div
          className={css({
            width: '80%',
            height: '80%',
            border: '2px solid white',
            borderRadius: '4px',
            opacity: 0.3,
          })}
        />
      </div>
    );
  }

  return (
    <div
      className={css({
        width: size === 'small' ? '60px' : size === 'large' ? '120px' : '90px',
        height: size === 'small' ? '84px' : size === 'large' ? '168px' : '126px',
        borderRadius: '8px',
        backgroundColor: 'white',
        border: '2px solid',
        borderColor: selected ? 'blue.500' : 'gray.300',
        boxShadow: selected ? 'lg' : 'md',
        display: 'flex',
        flexDirection: 'column',
        padding: size === 'small' ? '6px' : size === 'large' ? '12px' : '8px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s',
        _hover: onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 'xl',
              borderColor: 'blue.400',
            }
          : {},
      })}
      onClick={onClick}
    >
      {/* Top rank and suit - horizontal */}
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: size === 'small' ? '2px' : '4px',
          fontSize: size === 'small' ? 'md' : size === 'large' ? '2xl' : 'xl',
          fontWeight: 'bold',
          lineHeight: '1',
        })}
        style={{ color: suitColor }}
      >
        <div>{card.rank}</div>
        <div className={css({ fontSize: size === 'small' ? 'sm' : size === 'large' ? 'xl' : 'lg' })}>
          {suitSymbol}
        </div>
      </div>

      {/* Center suit symbol */}
      <div
        className={css({
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'small' ? '3xl' : size === 'large' ? '6xl' : '4xl',
          overflow: 'hidden',
        })}
        style={{ color: suitColor }}
      >
        {suitSymbol}
      </div>

      {/* Bottom rank and suit (rotated) - horizontal */}
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: size === 'small' ? '2px' : '4px',
          fontSize: size === 'small' ? 'md' : size === 'large' ? '2xl' : 'xl',
          fontWeight: 'bold',
          lineHeight: '1',
          transform: 'rotate(180deg)',
          alignSelf: 'flex-end',
        })}
        style={{ color: suitColor }}
      >
        <div>{card.rank}</div>
        <div className={css({ fontSize: size === 'small' ? 'sm' : size === 'large' ? 'xl' : 'lg' })}>
          {suitSymbol}
        </div>
      </div>
    </div>
  );
}
