import { Room } from '../entities/Room';
import { Visitor } from '../entities/Game';
import { IRoomRepository } from '../repositories/room.repository.interface';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class RoomService {
  constructor(private roomRepository: IRoomRepository) {}

  async createRoom(
    hostId: string,
    hostName: string,
    name: string,
    maxCards: number,
    rules: string[]
  ): Promise<Room> {
    const code = generateRoomCode();
    
    // O host é automaticamente adicionado como visitante
    const hostVisitor: Visitor = {
      visitorId: hostId,
      nickname: hostName,
      joinedAt: new Date(),
    };
    
    const room = new Room({
      id: `room-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      hostId,
      hostName,
      code,
      maxCards,
      rules: rules as any[],
      visitors: [hostVisitor], // Host já está na sala
      game: null,
      createdAt: new Date(),
      isActive: true
    });

    await this.roomRepository.create(room);
    return room;
  }

  async joinRoom(roomCode: string, visitor: Visitor): Promise<Room> {
    const room = await this.roomRepository.findById(roomCode);
    if (!room) {
      throw new Error('Sala não encontrada');
    }
    if (!room.isActive) {
      throw new Error('Sala não está ativa');
    }

    room.addVisitor(visitor);
    await this.roomRepository.update(room);
    return room;
  }

  async startGame(roomId: string, hostId: string): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new Error('Sala não encontrada');
    }
    if (room.hostId !== hostId) {
      throw new Error('Apenas o host pode iniciar o jogo');
    }

    room.startGame();
    await this.roomRepository.update(room);
    return room;
  }

  async drawNumber(roomId: string, hostId: string): Promise<number> {
    const room = await this.roomRepository.findById(roomId);
    if (!room || !room.game) {
      throw new Error('Jogo não encontrado');
    }
    if (room.hostId !== hostId) {
      throw new Error('Apenas o host pode sortear números');
    }

    const number = room.game.drawNumber();
    await this.roomRepository.update(room);
    return number;
  }
}

