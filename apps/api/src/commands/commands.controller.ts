import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import type { CommandsService } from './commands.service';

@Controller('commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Get()
  getAvailableCommands() {
    return this.commandsService.getAvailableCommands();
  }

  @Get(':name')
  getCommandInfo(@Param('name') name: string) {
    return this.commandsService.getCommandInfo(name);
  }

  @Post(':name/execute')
  @HttpCode(HttpStatus.OK)
  async executeCommand(
    @Param('name') name: string,
    @Body() payload: { args?: string[]; options?: Record<string, unknown> }
  ) {
    return this.commandsService.executeCommand(name, payload.args, payload.options);
  }

  @Get('history/recent')
  getRecentExecutions() {
    return this.commandsService.getExecutionHistory();
  }
}
