export interface CounterRepository {
  getCount(): number;
  saveCount(value: number): void;
}
