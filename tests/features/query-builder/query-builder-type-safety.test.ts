import { MikroORM } from '@mikro-orm/mysql';
import { Author2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';

describe('QueryBuilder type safety', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMySql('mysql'));
  afterAll(async () => await orm.close(true));

  describe('context-aware field validation in where()', () => {

    test('should reject invalid property names after join alias', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a')
        .select('*')
        .leftJoin('a.books', 'b');

      // Valid: 'b.title' exists on Book2
      qb.where({ 'b.title': 'test' });

      // Type-only checks (no runtime validation for field names in where)
      if (false as boolean) {
        // @ts-expect-error - 'b.invalidProp' does not exist on Book2
        qb.where({ 'b.invalidProp': 'test' });

        // @ts-expect-error - 'b.titleXYZ' does not exist on Book2
        qb.andWhere({ 'b.titleXYZ': 'test' });
      }
    });

    test('should reject invalid property names in nested joins', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a')
        .select('*')
        .leftJoin('a.books', 'b')
        .leftJoin('b.tags', 't');

      // Valid paths
      qb.where({ 't.name': 'test' });
      qb.andWhere({ 'b.title': 'test' });

      // Type-only checks
      if (false as boolean) {
        // @ts-expect-error - 't.invalidProp' does not exist on BookTag2
        qb.where({ 't.invalidProp': 'test' });

        // @ts-expect-error - 'b.nonexistent' does not exist on Book2
        qb.andWhere({ 'b.nonexistent': 'test' });
      }
    });

    test('should reject invalid alias prefixes', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a')
        .select('*')
        .leftJoin('a.books', 'b');

      // Type-only checks
      if (false as boolean) {
        // @ts-expect-error - 'x' is not a valid alias
        qb.where({ 'x.title': 'test' });

        // @ts-expect-error - 'unknown' is not a valid alias
        qb.andWhere({ 'unknown.name': 'test' });
      }
    });

  });

  describe('join relation validation', () => {

    test('should reject invalid relations from context (compile + runtime)', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a')
        .select('*')
        .leftJoin('a.books', 'b');

      // Valid: 'b.tags' is a relation on Book2
      qb.leftJoin('b.tags', 't');

      // @ts-expect-error - 'b.invalidRelation' is not a relation on Book2
      expect(() => qb.clone().leftJoin('b.invalidRelation', 'x')).toThrow(/not a defined relation/);
    });

    test('should reject invalid root relation (compile + runtime)', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');

      // Valid relation
      qb.leftJoin('a.books', 'b');

      // @ts-expect-error - 'a.invalidRelation' is not a relation on Author2
      expect(() => qb.clone().leftJoin('a.invalidRelation', 'x')).toThrow(/not a defined relation/);
    });

  });

  describe('root alias field validation', () => {

    test('should reject invalid property names on root alias', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');

      // Valid: 'a.name' exists on Author2
      qb.where({ 'a.name': 'test' });

      // Type-only check
      if (false as boolean) {
        // @ts-expect-error - 'a.invalidProp' does not exist on Author2
        qb.where({ 'a.invalidProp': 'test' });
      }
    });

    test('should reject invalid root alias prefix', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');

      // Type-only check
      if (false as boolean) {
        // @ts-expect-error - 'x' is not the root alias
        qb.where({ 'x.name': 'test' });
      }
    });

  });

  describe('direct entity field validation', () => {

    test('should reject invalid direct property names', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');

      // Valid: 'name' exists on Author2
      qb.where({ name: 'test' });

      // Type-only check
      if (false as boolean) {
        // @ts-expect-error - 'invalidProp' does not exist on Author2
        qb.where({ invalidProp: 'test' });
      }
    });

  });

});
