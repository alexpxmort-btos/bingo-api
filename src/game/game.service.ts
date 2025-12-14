import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RoomService, IRoomRepository } from '../domain';
import { AppGateway } from '../app.gateway';

@Injectable()
export class GameService {
  private roomService: RoomService;

  constructor(
    private appGateway: AppGateway,
    @Inject('IRoomRepository') 
    private roomRepository: IRoomRepository,
  ) {
    this.roomService = new RoomService(this.roomRepository);
  }

  async drawNumber(roomCode: string, hostId: string) {
    try {
      const number = await this.roomService.drawNumber(roomCode, hostId);
      
      // Recarregar a sala após o sorteio para garantir que temos os dados mais recentes
      const room = await this.roomRepository.findById(roomCode);
      
      if (room && room.game) {
        console.log(`🎲 Número sorteado: ${number}, Total: ${room.game.drawnNumbers.length}`);
        
        // Enviar evento geral com número sorteado
        this.appGateway.emitToRoom(roomCode, 'number-drawn', {
          number,
          drawnNumbers: room.game.drawnNumbers,
          winner: room.game.winner,
          isFinished: room.game.isFinished,
        });

        // Enviar cartela atualizada para cada participante individualmente
        room.game.cards.forEach(card => {
          this.appGateway.server.to(roomCode).emit(`card-updated-${card.ownerId}`, {
            card: {
              id: card.id,
              ownerId: card.ownerId,
              ownerName: card.ownerName,
              cells: card.cells,
            },
          });
        });

        if (room.game.isFinished && room.game.winner) {
          const winnerCard = room.game.cards.find(c => c.ownerId === room.game!.winner);
          console.log(`🏆 Bingo! Vencedor: ${winnerCard?.ownerName} (${room.game.winner})`);
          this.appGateway.emitToRoom(roomCode, 'bingo-won', {
            winner: room.game.winner,
            winnerName: winnerCard?.ownerName || 'Desconhecido',
          });
        }
      }

      return { number, drawnNumbers: room?.game?.drawnNumbers || [] };
    } catch (error: any) {
      console.error('❌ Erro ao sortear número:', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async validateBingo(roomCode: string, cardId: string, visitorId: string) {
    const room = await this.roomRepository.findById(roomCode);
    if (!room || !room.game) {
      throw new NotFoundException('Jogo não encontrado');
    }

    const isValid = room.game.validateBingo(cardId);
    
    if (isValid) {
      this.appGateway.emitToRoom(roomCode, 'bingo-validated', {
        cardId,
        visitorId,
        isValid,
      });
    } else {
      this.appGateway.emitToRoom(roomCode, 'bingo-invalid', {
        cardId,
        visitorId,
      });
    }

    return { isValid };
  }
}

