import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let _service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
    _service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('message', 'Lord Commander API is running');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('getStatus', () => {
    it('should return detailed status', () => {
      const result = controller.getStatus();
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('database', 'healthy');
    });
  });
});
