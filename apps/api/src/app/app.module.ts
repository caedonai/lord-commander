import { Module } from '@nestjs/common';
import { CommandsModule } from '../commands/commands.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [CommandsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
