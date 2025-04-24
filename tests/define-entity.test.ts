import { defineEntity, EntityDTO, Hidden, InferEntity, Ref, Reference, ScalarReference } from '@mikro-orm/core';
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

  it('should define entity with reference scalar property', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().ref(),
        email: p.string().ref().ref(false),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: Ref<string>; email: string }>>(true);
  });

  it('should define entity with hidden property', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().hidden(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    type ToObject = EntityDTO<IUser>;
    assert<IsExact<IUser, { id: number; name: Hidden<string> }>>(true);
    assert<IsExact<ToObject, { id: number }>>(true);
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
    assert<IsExact<IUser, { id: number; name: string; friend: Reference<IUser> }>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IUser['friend']>['friend']>['friend']>['name'], string>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IUser['friend']>['friend']>['friend']>['name'], number>>(false);
  });
});


type UnwrapRef<T> = T extends ScalarReference<any> ? UnwrapScalarReference<T> :
  T extends Reference<any> ? UnwrapReference<T> :
  T;

type UnwrapScalarReference<T extends ScalarReference<any>> = T extends ScalarReference<infer Value> ? Value : T;

type UnwrapReference<T extends Reference<any>> = T extends Reference<infer Value> ? Value : T;
