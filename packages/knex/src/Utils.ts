/**
 * Require a module on behalf of @mikro-orm/knex
 */
export function requireModule(id: string) {
  return require(id);
}
