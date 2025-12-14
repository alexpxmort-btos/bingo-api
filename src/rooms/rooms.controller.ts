import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.createRoom(createRoomDto);
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.roomsService.getRoom(code);
  }

  @Post('join')
  join(@Body() joinRoomDto: JoinRoomDto) {
    return this.roomsService.joinRoom(joinRoomDto);
  }

  @Post(':code/start')
  startGame(@Param('code') code: string, @Body() body: { hostId: string }) {
    return this.roomsService.startGame(code, body.hostId);
  }
}

