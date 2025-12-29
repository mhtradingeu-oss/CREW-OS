import { health, ready } from './health.controller.js';

describe('health.controller', () => {
  it('health includes correlationId if enabled', async () => {
    const req: any = { context: { correlationId: 'abc' } };
    const res: any = { json: jest.fn() };
    process.env.HEALTH_INCLUDE_CORRELATION_ID = 'true';
    await health(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ correlationId: 'abc' }));
  });

  it('health omits correlationId if disabled', async () => {
    const req: any = { context: { correlationId: 'abc' } };
    const res: any = { json: jest.fn() };
    process.env.HEALTH_INCLUDE_CORRELATION_ID = 'false';
    await health(req, res);
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ correlationId: 'abc' }));
  });

  it('ready returns 404 if disabled', async () => {
    const req: any = { context: { correlationId: 'abc' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    process.env.READINESS_ENABLED = 'false';
    await ready(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'not_ready' }));
  });
});
