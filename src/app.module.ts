import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoomsModule } from './rooms/rooms.module';
import { GameModule } from './game/game.module';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna as variáveis de ambiente disponíveis globalmente
      envFilePath: '.env', // Caminho do arquivo .env
    }),
    RoomsModule,
    GameModule,
  ],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class AppModule {}

