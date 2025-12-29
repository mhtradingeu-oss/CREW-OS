import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

(async () => {
  let lastStatus = 200;
  let res;
  for (let i = 0; i < 120; i++) {
    res = await request(app).get('/api/v1/users');
    lastStatus = res.status;
    if (lastStatus === 429) break;
  }
  console.log('Last status after 120 requests:', lastStatus);
  if (lastStatus !== 429) {
    res = await request(app).get('/api/v1/users');
    console.log('Status after one more request:', res.status);
    if (res.status === 429) {
      console.log('Rate limiting is working: received 429');
    } else {
      console.log('Rate limiting did NOT trigger as expected.');
    }
  } else {
    console.log('Rate limiting triggered within 120 requests.');
  }
})();
