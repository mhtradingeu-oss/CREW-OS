import { jest } from "@jest/globals";
import { financeService } from "../../modules/finance/finance.service.js";
import { publish } from "../../core/events/event-bus.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
if (!hasDatabase) {
  console.warn("Skipping FinanceService integration tests: DATABASE_URL not configured");
}

beforeAll(async () => {});
afterAll(async () => {});
afterEach(async () => {
  jest.clearAllMocks();
});

const financeDescribe = hasDatabase ? describe : describe.skip;

financeDescribe('FinanceService Integration', () => {
  it('creates and persists a finance record, emits event', async () => {
    const input = { amount: 1000, currency: 'USD' };
    const created = await financeService.create(input);
    expect(created.amount).toBe(input.amount);
    expect(created.currency).toBe(input.currency);
    const found = await financeService.getById(created.id);
    expect(found).not.toBeNull();
    expect(found.amount).toBe(input.amount);
    expect(publish).toHaveBeenCalled();
  });

  it('updates a finance record and persists changes', async () => {
    const input = { amount: 500, currency: 'USD' };
    const created = await financeService.create(input);
    const update = { amount: 750 };
    const updated = await financeService.update(created.id, update);
    expect(updated.amount).toBe(750);
    const found = await financeService.getById(created.id);
    expect(found.amount).toBe(750);
  });
});
