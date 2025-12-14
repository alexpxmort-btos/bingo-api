import { Controller, Post, Param, Body } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post(':roomCode/draw')
  drawNumber(
    @Param('roomCode') roomCode: string,
    @Body() body: { hostId: string },
  ) {
    return this.gameService.drawNumber(roomCode, body.hostId);
  }

  @Post(':roomCode/validate-bingo')
  validateBingo(
    @Param('roomCode') roomCode: string,
    @Body() body: { cardId: string; visitorId: string },
  ) {
    return this.gameService.validateBingo(roomCode, body.cardId, body.visitorId);
  }
}

