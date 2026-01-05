

// Deterministic clock for tests
export class DeterministicClock {
  private now: number;
  constructor(start: number = 1700000000000) { // Arbitrary fixed epoch
    this.now = start;
  }
  advance(ms: number = 1) {
    this.now += ms;
    return this.now;
  }
  getNow() {
    return this.now;
  }
 
  mockDateNow() {
  jest.spyOn(Date, 'now').mockImplementation(() => this.getNow());
}
 
 
  restore() {
    (Date.now as jest.Mock).mockRestore?.();
  }
}
