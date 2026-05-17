#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for routine-related types. `SqlTypeToTs` runs on every routine param via
 * `RoutineParamValue` → `RoutineArgsOf`, so its instantiation cost is multiplied by the
 * number of params. The `em.callRoutine` benches are what we actually care about — that's
 * the call site users hit.
 */

import { bench } from '@ark/attest';
import { Routine, type RoutineArgs, type RoutineReturn, ScalarReference, Type } from '@mikro-orm/core';

// ============================================
// em.callRoutine — the real call site
// ============================================
//
// `em.callRoutine` is typed as
// `<R extends Routine>(r: R, args: RoutineArgs<R>): Promise<RoutineReturn<R>>`.
// We mirror its signature so the benches measure the same chain users pay for.

// eslint-disable-next-line
async function callRoutine<R extends Routine>(_r: R, _args: RoutineArgs<R>): Promise<RoutineReturn<R>> {
  return undefined as any;
}

const HashUser = new Routine({
  name: 'hash_user',
  type: 'function',
  params: {
    name: { type: 'varchar(255)' },
    salt: { type: 'varchar(255)' },
  },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: 'SELECT SHA1(CONCAT(name, salt))',
});

bench('em.callRoutine - 2 string params, scalar return', () => {
  void callRoutine(HashUser, { name: 'jon', salt: 'pepper' });
}).types([192, 'instantiations']);

const AddRecord = new Routine({
  name: 'add_record',
  type: 'procedure',
  params: {
    p_name: { type: 'varchar(255)' },
    p_age: { type: 'int' },
    p_active: { type: 'boolean' },
    p_balance: { type: 'decimal(10,2)' },
    p_created_at: { type: 'timestamp' },
    p_payload: { type: 'jsonb' },
  },
  body: '...',
});

bench('em.callRoutine - 6 mixed primitive params', () => {
  void callRoutine(AddRecord, {
    p_name: 'jon',
    p_age: 30,
    p_active: true,
    p_balance: '100.00',
    p_created_at: new Date(),
    p_payload: { k: 'v' },
  });
}).types([491, 'instantiations']);

const FastPath = new Routine({
  name: 'fast_path',
  type: 'function',
  params: {
    a: { type: 'varchar(255)', runtimeType: 'string' },
    b: { type: 'int', runtimeType: 'number' },
    c: { type: 'boolean', runtimeType: 'boolean' },
    d: { type: 'timestamp', runtimeType: 'Date' },
  },
  returns: { runtimeType: 'string', columnType: 'text' },
  body: '...',
});

bench('em.callRoutine - explicit runtimeType short-circuits SqlTypeToTs', () => {
  void callRoutine(FastPath, { a: 'a', b: 1, c: true, d: new Date() });
}).types([167, 'instantiations']);

const WithRef = new Routine({
  name: 'with_ref',
  type: 'procedure',
  params: {
    p_in: { type: 'varchar(255)' },
    p_out: { type: 'int', direction: 'out', ref: true },
  },
  body: '...',
});

bench('em.callRoutine - OUT param wrapped in ScalarReference', () => {
  const out = new ScalarReference<number>();
  void callRoutine(WithRef, { p_in: 'jon', p_out: out });
}).types([247, 'instantiations']);

class JsonType extends Type<Record<string, unknown>, string> {
  override convertToDatabaseValue(value: Record<string, unknown>): string {
    return JSON.stringify(value);
  }

  override convertToJSValue(value: string): Record<string, unknown> {
    return JSON.parse(value);
  }
}

const TypedParams = new Routine({
  name: 'typed_params',
  type: 'function',
  params: {
    payload: { type: JsonType },
    label: { type: 'varchar(255)' },
  },
  returns: { runtimeType: 'string', columnType: 'text' },
  body: '...',
});

bench('em.callRoutine - Type class at param.type (TypeJsType branch)', () => {
  void callRoutine(TypedParams, { payload: { k: 'v' }, label: 'a' });
}).types([300, 'instantiations']);

const Wide = new Routine({
  name: 'wide_proc',
  type: 'procedure',
  params: {
    p01: { type: 'varchar(255)' },
    p02: { type: 'varchar(255)' },
    p03: { type: 'int' },
    p04: { type: 'int' },
    p05: { type: 'boolean' },
    p06: { type: 'boolean' },
    p07: { type: 'timestamp' },
    p08: { type: 'timestamp' },
    p09: { type: 'decimal(10,2)' },
    p10: { type: 'jsonb' },
    p11: { type: 'bytea' },
    p12: { type: 'text' },
  },
  body: '...',
});

bench('em.callRoutine - 12 params (wide proc)', () => {
  void callRoutine(Wide, {
    p01: 'a',
    p02: 'b',
    p03: 1,
    p04: 2,
    p05: true,
    p06: false,
    p07: new Date(),
    p08: new Date(),
    p09: '1.00',
    p10: { k: 'v' },
    p11: Buffer.alloc(0),
    p12: 'x',
  });
}).types([1118, 'instantiations']);
