import type { CounterRepository } from '../domain/counter-repository';

export function createMemoryCounterRepository(): CounterRepository {
  let count = 0;
  return { getCount: () => count, saveCount: value => { count = value; } };
}
