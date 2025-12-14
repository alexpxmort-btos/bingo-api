import { Game, BingoRule, Visitor } from './Game';

export interface RoomProps {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  code: string;
  maxCards: number;
  rules: BingoRule[];
  visitors: Visitor[];
  game: Game | null;
  createdAt: Date;
  isActive: boolean;
}

export class Room {
  public readonly id: string;
  public readonly name: string;
  public readonly hostId: string;
  public readonly hostName: string;
  public readonly code: string;
  public readonly maxCards: number;
  public readonly rules: BingoRule[];
  public visitors: Visitor[];
  public game: Game | null;
  public readonly createdAt: Date;
  public isActive: boolean;

  constructor(props: RoomProps) {
    this.id = props.id;
    this.name = props.name;
    this.hostId = props.hostId;
    this.hostName = props.hostName;
    this.code = props.code;
    this.maxCards = props.maxCards;
    this.rules = props.rules;
    this.visitors = props.visitors;
    this.game = props.game;
    this.createdAt = props.createdAt;
    this.isActive = props.isActive;
  }

  addVisitor(visitor: Visitor): void {
    if (this.visitors.length >= this.maxCards) {
      throw new Error('Sala cheia');
    }
    if (this.visitors.some(v => v.visitorId === visitor.visitorId)) {
      throw new Error('Visitante já está na sala');
    }
    this.visitors.push(visitor);
  }

  removeVisitor(visitorId: string): void {
    this.visitors = this.visitors.filter(v => v.visitorId !== visitorId);
  }

  startGame(): void {
    if (this.game) {
      throw new Error('Jogo já está em andamento');
    }
    if (this.visitors.length === 0) {
      throw new Error('Não há participantes na sala');
    }
    if (this.visitors.length < 1) {
      throw new Error('É necessário pelo menos 1 participante para iniciar o jogo');
    }
    this.game = Game.create(this.visitors, this.rules);
  }

  endGame(): void {
    if (!this.game) {
      throw new Error('Não há jogo em andamento');
    }
    this.game = null;
  }
}

