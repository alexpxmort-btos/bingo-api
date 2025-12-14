import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RoomService, IRoomRepository, Visitor } from '../domain';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { AppGateway } from '../app.gateway';

@Injectable()
export class RoomsService {
  private roomService: RoomService;

  constructor(
    private appGateway: AppGateway,
    @Inject('IRoomRepository') 
    private roomRepository: IRoomRepository,
  ) {
    this.roomService = new RoomService(this.roomRepository);
  }

  async createRoom(createRoomDto: CreateRoomDto) {
    const room = await this.roomService.createRoom(
      createRoomDto.hostId,
      createRoomDto.hostName,
      createRoomDto.name,
      createRoomDto.maxCards,
      createRoomDto.rules,
    );

    return {
      id: room.id,
      name: room.name,
      code: room.code,
      maxCards: room.maxCards,
      rules: room.rules,
      createdAt: room.createdAt,
    };
  }

  async getRoom(roomCode: string) {
    const room = await this.roomRepository.findById(roomCode);
    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    return {
      id: room.id,
      name: room.name,
      code: room.code,
      hostId: room.hostId,
      hostName: room.hostName,
      maxCards: room.maxCards,
      rules: room.rules,
      visitors: room.visitors,
      game: room.game ? {
        id: room.game.id,
        drawnNumbers: room.game.drawnNumbers,
        isFinished: room.game.isFinished,
        winner: room.game.winner,
        startedAt: room.game.startedAt,
        cards: room.game.cards.map(card => ({
          id: card.id,
          ownerId: card.ownerId,
          ownerName: card.ownerName,
          cells: card.cells,
        })),
      } : null,
      isActive: room.isActive,
    };
  }

  async joinRoom(joinRoomDto: JoinRoomDto) {
    const visitor: Visitor = {
      visitorId: joinRoomDto.visitorId,
      nickname: joinRoomDto.nickname,
      joinedAt: new Date(),
    };

    try {
      const room = await this.roomService.joinRoom(joinRoomDto.roomCode, visitor);
      
      return {
        room: {
          id: room.id,
          name: room.name,
          code: room.code,
          visitors: room.visitors,
        },
        visitor,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async startGame(roomCode: string, hostId: string) {
    try {
      const room = await this.roomService.startGame(roomCode, hostId);
      if (!room.game) {
        throw new BadRequestException('Erro ao iniciar o jogo');
      }
      
      // Retornar todas as cartelas com células completas
      const cards = room.game.cards.map(card => ({
        id: card.id,
        ownerId: card.ownerId,
        ownerName: card.ownerName,
        cells: card.cells.map(row => 
          row.map(cell => ({
            number: cell.number,
            marked: cell.marked,
          }))
        ),
      }));
      
      // Enviar evento WebSocket para todos os participantes
      this.appGateway.emitToRoom(roomCode, 'game-started', {
        game: {
          id: room.game.id,
          drawnNumbers: room.game.drawnNumbers || [],
          isFinished: room.game.isFinished,
          startedAt: room.game.startedAt,
        },
      });
      
      // Enviar cartela individual para cada participante via WebSocket
      room.game.cards.forEach(card => {
        const cardData = {
          id: card.id,
          ownerId: card.ownerId,
          ownerName: card.ownerName,
          cells: card.cells.map(row => 
            row.map(cell => ({
              number: cell.number,
              marked: cell.marked,
            }))
          ),
        };
        
        // Enviar para o dono da cartela
        this.appGateway.server.to(roomCode).emit(`card-assigned-${card.ownerId}`, {
          card: cardData,
        });
      });
      
      return {
        game: {
          id: room.game.id,
          drawnNumbers: room.game.drawnNumbers,
          cards,
          isFinished: room.game.isFinished,
          startedAt: room.game.startedAt,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Erro ao iniciar o jogo');
    }
  }
}

