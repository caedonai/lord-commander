import { Controller, Get } from '@nestjs/common';
import type { AppService } from './app.service';

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('status')
  getStatus() {
    return this.appService.getStatus();
  }
}
