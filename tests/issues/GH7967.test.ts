import { defineEntity, InferEntity, InferKyselyTable, p } from '@mikro-orm/postgresql';
import { expectTypeOf } from 'vitest';

// https://github.com/mikro-orm/mikro-orm/issues/7967
// `.array()` marks a column as a native array (e.g. postgres text[]). The em.create
// inference already treats such a column as `Value[]`, but the Kysely inference used to
// ignore the `array` flag, so plain `.array()` columns surfaced as the element type there.
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    emails: p.text().array(),
    emailsOverrideAsString: p.text().array().$type<string>(),
  },
});

type IUser = InferEntity<typeof User>;
interface UserTable extends InferKyselyTable<typeof User> {}

test('array columns infer as arrays for both em.create and kysely', () => {
  expectTypeOf<IUser['emails']>().toEqualTypeOf<string[]>();
  expectTypeOf<IUser['emailsOverrideAsString']>().toEqualTypeOf<string[]>();

  expectTypeOf<UserTable['emails']>().toEqualTypeOf<string[]>();
  expectTypeOf<UserTable['emails_override_as_string']>().toEqualTypeOf<string[]>();
});
