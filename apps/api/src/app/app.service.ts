import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string; message: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Lord Commander API is running',
    };
  }

  getStatus(): {
    version: string;
    environment: string;
    uptime: number;
    services: Record<string, string>;
  } {
    return {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        database: 'healthy',
        cache: 'healthy',
        storage: 'healthy',
      },
    };
  }
}
