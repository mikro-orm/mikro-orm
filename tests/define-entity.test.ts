import { defineEntity, InferEntity } from '@mikro-orm/core';
import { IsExact, assert } from 'conditional-type-checks';

describe('defineEntity', () => {
  it('should define entity', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string }>>(true);
  });

  it('should define entity with json', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        settings: p.json<{ theme: string }>(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string; settings: { theme: string } }>>(true);
  });

  it('should define entity with nullable property', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().nullable(),
        settings: p.json<{ theme: string }>().nullable(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string | null | undefined; settings: { theme: string } | null | undefined }>>(true);
  });

  it('should define entity with many to one relation', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        friend: () => p.manyToOne(User),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string; friend: IUser }>>(true);
    assert<IsExact<IUser['friend']['friend']['friend']['name'], string>>(true);
  });
});
