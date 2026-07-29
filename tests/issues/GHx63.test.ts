import { UnderscoreNamingStrategy } from '@mikro-orm/core';

// a custom migration name ends up as part of a class identifier, so characters that are
// not valid there (spaces, dashes, dots) used to produce a migration file that never compiled
describe('custom migration names produce valid class identifiers', () => {
  const namingStrategy = new UnderscoreNamingStrategy();
  const timestamp = '20260729120000';

  test.each([
    ['add user table', 'Migration20260729120000_add_user_table'],
    ['add-user-table', 'Migration20260729120000_add_user_table'],
    ['add.user', 'Migration20260729120000_add_user'],
    ['2024 stuff', 'Migration20260729120000_2024_stuff'],
    ['add_user_table', 'Migration20260729120000_add_user_table'],
    ['añadir', 'Migration20260729120000_añadir'],
    ['add 🎉', 'Migration20260729120000_add_'],
    ['a$b', 'Migration20260729120000_a$b'],
    ['---', 'Migration20260729120000__'],
  ])('%s', (name, expected) => {
    const className = namingStrategy.classToMigrationName(timestamp, name);

    expect(className).toBe(expected);
    expect(() => new Function(`class ${className} {}`)).not.toThrow();
  });

  test('no custom name', () => {
    expect(namingStrategy.classToMigrationName(timestamp)).toBe('Migration20260729120000');
  });
});
