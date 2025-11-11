import axios from 'axios';

describe('API E2E Tests', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await axios.get(`${API_URL}/api/health`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('status', 'healthy');
      expect(res.data).toHaveProperty('message', 'Lord Commander API is running');
      expect(res.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health/status', () => {
    it('should return detailed status', async () => {
      const res = await axios.get(`${API_URL}/api/health/status`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('version', '1.0.0');
      expect(res.data).toHaveProperty('environment');
      expect(res.data).toHaveProperty('uptime');
      expect(res.data).toHaveProperty('services');
    });
  });

  describe('GET /api/commands', () => {
    it('should return available commands', async () => {
      const res = await axios.get(`${API_URL}/api/commands`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('commands');
      expect(res.data).toHaveProperty('count');
      expect(Array.isArray(res.data.commands)).toBe(true);
    });
  });
});
