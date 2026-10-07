import type { CounterRepository } from '../domain/counter-repository';

export function createCounterUseCases(repository: CounterRepository) {
  return {
    getCount: () => repository.getCount(),
    increment: () => {
      const value = repository.getCount() + 1;
      repository.saveCount(value);
      return value;
    },
    reset: () => { repository.saveCount(0); return 0; },
  };
}

export type CounterUseCases = ReturnType<typeof createCounterUseCases>;
