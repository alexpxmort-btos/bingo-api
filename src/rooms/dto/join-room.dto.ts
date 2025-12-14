import { IsString, IsNotEmpty } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomCode: string;

  @IsString()
  @IsNotEmpty()
  visitorId: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;
}

