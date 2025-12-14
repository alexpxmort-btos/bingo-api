import { IsString, IsNumber, IsArray, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  hostId: string;

  @IsString()
  @IsNotEmpty()
  hostName: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  maxCards: number;

  @IsArray()
  @IsString({ each: true })
  rules: string[];
}

