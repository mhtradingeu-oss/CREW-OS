import request from 'supertest';
import { createApp } from '../app';

describe('API Rate Limiting', () => {
  const app = createApp();
  it('should return 429 after exceeding the rate limit', async () => {
    let lastStatus = 200;
    let res;
    for (let i = 0; i < 120; i++) {
      res = await request(app).get('/api/v1/users');
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect([200, 429]).toContain(lastStatus);
    if (lastStatus !== 429) {
      // One more should definitely be rate limited
      res = await request(app).get('/api/v1/users');
      expect(res.status).toBe(429);
      expect(res.text).toMatch(/rate limit/i);
    }
  });
});
