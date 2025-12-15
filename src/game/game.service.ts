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

    // Validar se o jogo está em andamento
    if (room.game.isFinished) {
      throw new BadRequestException('O jogo já terminou');
    }

    // Validar se a cartela pertence ao visitante
    const card = room.game.cards.find(c => c.id === cardId);
    if (!card) {
      throw new NotFoundException('Cartela não encontrada');
    }

    if (card.ownerId !== visitorId) {
      throw new BadRequestException('Esta cartela não pertence a você');
    }

    // Validar se há números sorteados
    if (!room.game.drawnNumbers || room.game.drawnNumbers.length === 0) {
      throw new BadRequestException('Nenhum número foi sorteado ainda');
    }

    // Validar o bingo
    const isValid = room.game.validateBingo(cardId);
    
    if (isValid) {
      // Se for válido, o jogo já foi finalizado no método validateBingo
      const winnerCard = room.game.cards.find(c => c.id === cardId);
      this.appGateway.emitToRoom(roomCode, 'bingo-validated', {
        cardId,
        visitorId,
        isValid: true,
        winnerName: winnerCard?.ownerName || 'Desconhecido',
      });
    } else {
      this.appGateway.emitToRoom(roomCode, 'bingo-invalid', {
        cardId,
        visitorId,
        message: 'Bingo inválido. Verifique se você completou uma linha, coluna ou cartela cheia.',
      });
    }

    return { isValid };
  }
}

