import { Card } from './Card';

export type BingoRule = 'line' | 'column' | 'full';

export interface Visitor {
  visitorId: string;
  nickname: string;
  joinedAt: Date;
}

export interface GameProps {
  id: string;
  roomId: string;
  drawnNumbers: number[];
  cards: Card[];
  rules: BingoRule[];
  winner: string | null;
  isFinished: boolean;
  startedAt: Date;
}

export class Game {
  public readonly id: string;
  public readonly roomId: string;
  public drawnNumbers: number[];
  public cards: Card[];
  public readonly rules: BingoRule[];
  public winner: string | null;
  public isFinished: boolean;
  public readonly startedAt: Date;

  constructor(props: GameProps) {
    this.id = props.id;
    this.roomId = props.roomId;
    this.drawnNumbers = props.drawnNumbers;
    this.cards = props.cards;
    this.rules = props.rules;
    this.winner = props.winner;
    this.isFinished = props.isFinished;
    this.startedAt = props.startedAt;
  }

  static create(visitors: Visitor[], rules: BingoRule[]): Game {
    const id = `game-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const cards = visitors.map(visitor => 
      Card.generate(visitor.visitorId, visitor.nickname)
    );

    return new Game({
      id,
      roomId: '',
      drawnNumbers: [],
      cards,
      rules,
      winner: null,
      isFinished: false,
      startedAt: new Date()
    });
  }

  drawNumber(): number {
    if (this.isFinished) {
      throw new Error('Jogo já terminou');
    }

    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
      .filter(n => !this.drawnNumbers.includes(n));

    if (availableNumbers.length === 0) {
      throw new Error('Todos os números já foram sorteados');
    }

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers[randomIndex];
    
    this.drawnNumbers.push(number);
    this.markNumberInCards(number);
    this.checkWinners();

    return number;
  }

  private markNumberInCards(number: number): void {
    this.cards.forEach(card => card.markNumber(number));
  }

  private checkWinners(): void {
    for (const card of this.cards) {
      if (this.checkCardWins(card)) {
        this.winner = card.ownerId;
        this.isFinished = true;
        return;
      }
    }
  }

  private checkCardWins(card: Card): boolean {
    for (const rule of this.rules) {
      switch (rule) {
        case 'line':
          for (let i = 0; i < 5; i++) {
            if (card.checkLine(i)) return true;
          }
          break;
        case 'column':
          for (let i = 0; i < 5; i++) {
            if (card.checkColumn(i)) return true;
          }
          break;
        case 'full':
          if (card.checkFull()) return true;
          break;
      }
    }
    return false;
  }

  validateBingo(cardId: string): boolean {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return false;
    if (this.isFinished && this.winner === card.ownerId) return true;
    return this.checkCardWins(card);
  }
}

