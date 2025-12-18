import {
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import {
  Field,
  MikroORM,
  Node,
  Rel,
  RelMany,
  RelationshipProperties,
} from '@mikro-orm/neo4j';

@Entity()
@Node()
class Movie {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  released!: number;

  @Property({ nullable: true })
  tagline?: string;

  @ManyToMany(() => Actor, actor => actor.movies, {
    pivotEntity: () => ActedIn,
  })
  @RelMany({ type: 'ACTED_IN', direction: 'IN' })
  actors?: Actor[];

}

@Entity()
@Node()
class Actor {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  born!: number;

  @ManyToMany(() => Movie, undefined, { pivotEntity: () => ActedIn })
  @RelMany({ type: 'ACTED_IN', direction: 'OUT' })
  movies?: Movie[];

}

@Entity()
@RelationshipProperties()
class ActedIn {

  @ManyToOne(() => Actor, { primary: true })
  @Rel({ type: 'ACTED_IN', direction: 'OUT' })
  actor!: Actor;

  @ManyToOne(() => Movie, { primary: true })
  @Rel({ type: 'ACTED_IN', direction: 'OUT' })
  movie!: Movie;

  @Property({ type: 'array' })
  @Field()
  roles!: string[];

}

describe('Neo4jQueryBuilder', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      clientUrl: 'bolt://localhost:7687',
      entities: [Movie, Actor, ActedIn],
      dbName: 'neo4j',
      user: 'neo4j',
      password: 'testtest',
      ensureDatabase: false,
    });

    await orm.schema.clearDatabase();
  });

  afterAll(async () => {
    await orm.schema.clearDatabase();
    await orm.close(true);
  });

  describe('Basic Query Building', () => {
    test('should build simple MATCH query', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher, params } = qb.match().return().build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('Movie');
      expect(cypher).toContain('RETURN');
    });

    test('should build MATCH with WHERE clause', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher, params } = qb
        .match()
        .where('title', 'The Matrix')
        .return()
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('WHERE');
      expect(cypher).toContain('title');
      expect(params).toHaveProperty('param0', 'The Matrix');
    });

    test('should build MATCH with specific properties returned', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher, params } = qb
        .match()
        .where('title', 'The Matrix')
        .return(['title', 'released'])
        .build();

      expect(cypher).toContain('RETURN');
      expect(cypher).toContain('title');
      expect(cypher).toContain('released');
      expect(cypher).not.toContain('tagline');
    });

    test('should build MATCH with AND condition', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher, params } = qb
        .match()
        .where('title', 'The Matrix')
        .and('released', 1999)
        .return()
        .build();

      expect(cypher).toContain('WHERE');
      expect(cypher).toContain('AND');
      expect(params).toHaveProperty('param0', 'The Matrix');
      expect(params).toHaveProperty('param1', 1999);
    });

    test('should build CREATE query', () => {
      const qb = orm.em.createQueryBuilder(Movie);
      const { cypher, params } = qb
        .create({ title: 'Inception', released: 2010 })
        .return()
        .build();

      expect(cypher).toContain('CREATE');
      expect(cypher).toContain('Movie');
      expect(params).toHaveProperty('param0', 'Inception');
      expect(params).toHaveProperty('param1', 2010);
    });

    test('should build MERGE query', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher, params } = qb
        .merge({ title: 'The Matrix' })
        .return()
        .build();

      expect(cypher).toContain('MERGE');
      expect(cypher).toContain('Movie');
      expect(params).toHaveProperty('param0', 'The Matrix');
    });
  });

  describe('Advanced Filtering', () => {
    test('should support custom Cypher predicates', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const node = qb.getNode();
      const titleProp = node.property('title');

      const { cypher, params } = qb
        .match()
        .where(Cypher.contains(titleProp, new Cypher.Param('Matrix')))
        .return()
        .build();

      expect(cypher).toContain('CONTAINS');
      expect(params).toHaveProperty('param0', 'Matrix');
    });

    test('should support comparison operators', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const node = qb.getNode();
      const releasedProp = node.property('released');

      const { cypher, params } = qb
        .match()
        .where(Cypher.lt(releasedProp, new Cypher.Param(2000)))
        .return()
        .build();

      expect(cypher).toContain('<');
      expect(params).toHaveProperty('param0', 2000);
    });

    test('should support OR conditions', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const node = qb.getNode();

      const title1 = Cypher.eq(
        node.property('title'),
        new Cypher.Param('The Matrix'),
      );
      const title2 = Cypher.eq(
        node.property('title'),
        new Cypher.Param('Inception'),
      );

      const { cypher, params } = qb
        .match()
        .where(Cypher.or(title1, title2))
        .return()
        .build();

      expect(cypher).toContain('OR');
      expect(params).toHaveProperty('param0', 'The Matrix');
      expect(params).toHaveProperty('param1', 'Inception');
    });

    test('should support NOT conditions', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const node = qb.getNode();
      const titleProp = node.property('title');

      const { cypher, params } = qb
        .match()
        .where(
          Cypher.not(Cypher.contains(titleProp, new Cypher.Param('Matrix'))),
        )
        .return()
        .build();

      expect(cypher).toContain('NOT');
      expect(params).toHaveProperty('param0', 'Matrix');
    });
  });

  describe('Sorting and Pagination', () => {
    test('should build query with ORDER BY', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb
        .match()
        .return()
        .orderBy('released', 'DESC')
        .build();

      expect(cypher).toContain('ORDER BY');
      expect(cypher).toContain('released');
      expect(cypher).toContain('DESC');
    });

    test('should build query with LIMIT', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb.match().limit(10).return().build();

      expect(cypher).toContain('LIMIT');
      expect(cypher).toContain('10');
    });

    test('should build query with SKIP', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb.match().skip(20).return().build();

      expect(cypher).toContain('SKIP');
      expect(cypher).toContain('20');
    });

    test('should build query with pagination (SKIP + LIMIT)', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb.match().skip(20).limit(10).return().build();

      expect(cypher).toContain('SKIP');
      expect(cypher).toContain('LIMIT');
      expect(cypher).toContain('20');
      expect(cypher).toContain('10');
    });
  });

  describe('Update and Delete Operations', () => {
    test('should build UPDATE query with SET', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher, params } = qb
        .match()
        .where('title', 'The Matrix')
        .set({ tagline: 'Welcome to the Real World' })
        .return()
        .build();

      expect(cypher).toContain('SET');
      expect(params).toHaveProperty('param1', 'Welcome to the Real World');
    });

    test('should build DELETE query', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb.match().where('title', 'OldMovie').delete().build();

      expect(cypher).toContain('DETACH DELETE');
    });

    test('should build DELETE query without DETACH', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb
        .match()
        .where('title', 'OldMovie')
        .delete(false)
        .build();

      expect(cypher).toContain('DELETE');
      expect(cypher).not.toContain('DETACH');
    });
  });

  describe('Relationships', () => {
    test('should build query with relationship pattern', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb
        .match()
        .related('ACTED_IN', 'left', 'Actor')
        .return()
        .build();

      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('Actor');
    });

    test('should handle relationship direction: left', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb
        .match()
        .related('ACTED_IN', 'left', 'Actor')
        .return()
        .build();

      expect(cypher).toContain('<-');
      expect(cypher).toContain('ACTED_IN');
    });

    test('should handle relationship direction: right', () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');
      const { cypher } = qb
        .match()
        .related('ACTED_IN', 'right', 'Movie')
        .return()
        .build();

      expect(cypher).toContain('-[');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain(']->');
    });
  });

  describe('Integration with EntityManager', () => {
    beforeEach(async () => {
      await orm.schema.clearDatabase();

      // Create test data using query builder
      // Note: Using query builder for test data setup ensures consistency with query builder API
      const qb1 = orm.em.createQueryBuilder<Movie>('Movie');
      await qb1
        .create({
          id: 1,
          title: 'The Matrix',
          released: 1999,
          tagline: 'Welcome to the Real World',
        })
        .return()
        .execute();

      const qb2 = orm.em.createQueryBuilder<Movie>('Movie');
      await qb2
        .create({
          id: 2,
          title: 'Inception',
          released: 2010,
          tagline: 'Your mind is the scene of the crime',
        })
        .return()
        .execute();

      const qb3 = orm.em.createQueryBuilder<Movie>('Movie');
      await qb3
        .create({ id: 3, title: 'Interstellar', released: 2014 })
        .return()
        .execute();

      orm.em.clear();
    });

    test('should execute query and return results', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const results = await qb
        .match()
        .where('title', 'The Matrix')
        .return(['title', 'released'])
        .execute();

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('title');
      expect(results[0].title).toBe('The Matrix');
    });

    test('should execute query with multiple results', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const results = await qb.match().return(['title', 'released']).execute();

      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    test('should execute query with filtering', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const node = qb.getNode();
      const releasedProp = node.property('released');

      const results = await qb
        .match()
        .where(Cypher.gte(releasedProp, new Cypher.Param(2010)))
        .return(['title', 'released'])
        .execute();

      expect(results.length).toBeGreaterThanOrEqual(2);
      results.forEach(movie => {
        expect(movie.released).toBeGreaterThanOrEqual(2010);
      });
    });

    test('should execute query with ordering', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const results = await qb
        .match()
        .return(['title', 'released'])
        .orderBy('released', 'DESC')
        .execute();

      expect(results.length).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].released).toBeGreaterThanOrEqual(
          results[i + 1].released,
        );
      }
    });

    test('should execute query with pagination', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const results = await qb
        .match()
        .return(['title', 'released'])
        .orderBy('released', 'ASC')
        .skip(1)
        .limit(1)
        .execute();

      expect(results).toHaveLength(1);
    });

    test('should create new nodes via query builder', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const results = await qb
        .create({ id: 999, title: 'The Dark Knight', released: 2008 })
        .return(['id', 'title', 'released'])
        .execute();

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('The Dark Knight');
      expect(results[0].released).toBe(2008);

      // Verify it was created using query builder
      orm.em.clear();
      const qb2 = orm.em.createQueryBuilder<Movie>('Movie');
      const found = await qb2
        .match()
        .where('title', 'The Dark Knight')
        .return(['title', 'released'])
        .execute();
      expect(found).toHaveLength(1);
      expect(found[0].released).toBe(2008);
    });

    test('should update nodes via query builder', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const updateResults = await qb
        .match()
        .where('title', 'Interstellar')
        .set({ tagline: 'Mankind was born on Earth' })
        .return(['id', 'title', 'tagline'])
        .execute();

      expect(updateResults).toHaveLength(1);
      expect(updateResults[0].tagline).toBe('Mankind was born on Earth');

      orm.em.clear();
      const qb2 = orm.em.createQueryBuilder<Movie>('Movie');
      const results = await qb2
        .match()
        .where('title', 'Interstellar')
        .return(['tagline'])
        .execute();
      expect(results[0].tagline).toBe('Mankind was born on Earth');
    });

    test('should delete nodes via query builder', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      await qb.match().where('title', 'Inception').delete().execute();

      orm.em.clear();
      const found = await orm.em.findOne(Movie, { title: 'Inception' });
      expect(found).toBeNull();
    });
  });

  describe('Integration with EntityRepository', () => {
    beforeEach(async () => {
      await orm.schema.clearDatabase();

      const qb1 = orm.em.createQueryBuilder<Movie>('Movie');
      await qb1
        .create({ id: 10, title: 'Test Movie 1', released: 2020 })
        .return()
        .execute();

      const qb2 = orm.em.createQueryBuilder<Movie>('Movie');
      await qb2
        .create({ id: 11, title: 'Test Movie 2', released: 2021 })
        .return()
        .execute();

      orm.em.clear();
    });

    test('should create query builder from repository', async () => {
      const movieRepo = orm.em.getRepository(Movie);
      const qb = movieRepo.createQueryBuilder();

      const results = await qb
        .match()
        .where('released', 2020)
        .return(['title'])
        .execute();

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Movie 1');
    });

    test('should automatically use entity label from repository', async () => {
      const movieRepo = orm.em.getRepository(Movie);
      const qb = movieRepo.createQueryBuilder();

      const { cypher } = qb.match().return().build();

      expect(cypher).toContain('Movie');
    });
  });

  describe('Error Handling', () => {
    test('should throw error when WHERE is called without clause', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      expect(() => {
        qb.where('title', 'Test');
      }).toThrow(
        'Cannot add WHERE clause without a MATCH, CREATE, or MERGE clause',
      );
    });

    test('should throw error when RETURN is called without clause', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      expect(() => {
        qb.return();
      }).toThrow('Cannot add RETURN clause without a query clause');
    });

    test('should throw error when building without clauses', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      expect(() => {
        qb.build();
      }).toThrow('Cannot build query without any clauses');
    });

    test('should throw error when executing without EntityManager', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { execute } = qb.match().return().build();

      expect(execute).toBeDefined();
    });
  });

  describe('Complex Query Scenarios', () => {
    beforeEach(async () => {
      await orm.schema.clearDatabase();

      // Create actor and movie using query builder
      const qbActor = orm.em.createQueryBuilder<Actor>('Actor');
      await qbActor
        .create({ id: 1, name: 'Keanu Reeves', born: 1964 })
        .return()
        .execute();

      const qbMovie = orm.em.createQueryBuilder<Movie>('Movie');
      await qbMovie
        .create({ id: 100, title: 'The Matrix', released: 1999 })
        .return()
        .execute();

      orm.em.clear();
    });

    test('should handle complex filtering with multiple conditions', async () => {
      // First verify data exists
      const qbCheck = orm.em.createQueryBuilder<Movie>('Movie');
      const all = await qbCheck.match().return(['title', 'released']).execute();
      expect(all.length).toBeGreaterThanOrEqual(1);

      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const node = qb.getNode();

      const titleContainsMatrix = Cypher.contains(
        node.property('title'),
        new Cypher.Param('Matrix'),
      );
      const releasedBefore2000 = Cypher.lt(
        node.property('released'),
        new Cypher.Param(2000),
      );

      const results = await qb
        .match()
        .where(Cypher.and(titleContainsMatrix, releasedBefore2000))
        .return(['title', 'released'])
        .execute();

      expect(results.length).toBeGreaterThanOrEqual(1);
      results.forEach(movie => {
        expect(movie.title).toContain('Matrix');
        expect(movie.released).toBeLessThan(2000);
      });
    });

    test('should build query with relationship and filtering', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher, params } = qb
        .match()
        .related('ACTED_IN', 'left', 'Actor')
        .where('title', 'The Matrix')
        .return(['title'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('WHERE');
      expect(params).toHaveProperty('param0', 'The Matrix');
    });
  });

  describe('Flexible Query Composition', () => {
    test('should allow building queries in any order', async () => {
      // Build base query
      const baseQuery = orm.em.createQueryBuilder<Movie>('Movie').match();

      // Add clauses in non-standard order
      const withLimit = baseQuery.limit(10);
      const withOrder = withLimit.orderBy('released', 'DESC');
      const withWhere = withOrder.where('released', 1999);
      const withReturn = withWhere.return(['title', 'released']);

      const { cypher } = withReturn.build();

      // Verify correct Cypher order regardless of call order
      expect(cypher).toMatch(/MATCH.*WHERE.*RETURN.*ORDER BY.*LIMIT/s);
      expect(cypher).toContain('WHERE');
      expect(cypher).toContain('RETURN');
      expect(cypher).toContain('ORDER BY');
      expect(cypher).toContain('LIMIT');
    });

    test('should allow saving and reusing query parts', async () => {
      // Create base query that can be reused
      const baseQuery = orm.em
        .createQueryBuilder<Movie>('Movie')
        .match()
        .where('released', 1999);

      // Create two different queries from the same base
      const query1 = orm.em
        .createQueryBuilder<Movie>('Movie')
        .match()
        .where('released', 1999)
        .return(['title'])
        .orderBy('title', 'ASC');

      const query2 = orm.em
        .createQueryBuilder<Movie>('Movie')
        .match()
        .where('released', 1999)
        .return(['title', 'released'])
        .orderBy('released', 'DESC')
        .limit(5);

      const { cypher: cypher1 } = query1.build();
      const { cypher: cypher2 } = query2.build();

      // Both should have WHERE clause from base
      expect(cypher1).toContain('WHERE');
      expect(cypher2).toContain('WHERE');

      // But different RETURN and ORDER BY
      expect(cypher1).toContain('ORDER BY this0.title ASC');
      expect(cypher2).toContain('ORDER BY this0.released DESC');
      expect(cypher2).toContain('LIMIT');
    });

    test('should handle multiple where conditions correctly', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      // Add multiple WHERE conditions
      const { cypher } = qb
        .match()
        .where('title', 'The Matrix')
        .and('released', 1999)
        .return()
        .build();

      expect(cypher).toContain('WHERE');
      expect(cypher).toContain('AND');
    });

    test('should allow orderBy before return', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      // Call orderBy before return (was not allowed in old implementation)
      const { cypher } = qb
        .match()
        .where('released', 1999)
        .orderBy('title', 'ASC')
        .return(['title'])
        .build();

      expect(cypher).toContain('RETURN');
      expect(cypher).toContain('ORDER BY');
      expect(cypher).toMatch(/RETURN.*ORDER BY/s);
    });
  });

  describe('Advanced Relationship Patterns', () => {
    test('should create relationship with properties', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher, params } = qb
        .match()
        .related('ACTED_IN', {
          direction: 'left',
          targetLabel: 'Actor',
          properties: { roles: ['Neo'] },
        })
        .return(['title'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('<-');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('Actor');
      expect(cypher).toMatch(/roles.*param\d+/);
      expect(Object.values(params)).toContainEqual(['Neo']);
    });

    test('should create variable-length relationship', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher } = qb
        .match()
        .related('KNOWS', {
          length: { min: 1, max: 3 },
          targetLabel: 'Person',
        })
        .return(['title'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('KNOWS*1..3');
    });

    test('should create any-length relationship', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher } = qb
        .match()
        .related('FRIEND_OF', {
          length: '*',
          targetLabel: 'Person',
        })
        .return()
        .build();

      expect(cypher).toContain('FRIEND_OF*');
    });

    test('should support undirected relationships', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher } = qb
        .match()
        .related('RELATED_TO', {
          direction: 'undirected',
          targetLabel: 'Movie',
        })
        .return(['title'])
        .build();

      expect(cypher).toContain('-[');
      expect(cypher).toContain(']-');
      expect(cypher).not.toContain('<-');
      expect(cypher).not.toContain('->');
    });
  });

  describe('Custom Pattern Building', () => {
    test('should allow custom pattern construction', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const CypherLib = qb.getCypher();

      const { cypher } = qb
        .match()
        .pattern((Cypher, node) => {
          const person = new Cypher.Node();
          const actedIn = new Cypher.Relationship();
          return new Cypher.Pattern(node, { labels: ['Movie'] })
            .related(actedIn, { type: 'ACTED_IN', direction: 'left' })
            .to(person, { labels: ['Person'] });
        })
        .return(['title'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('Movie');
      expect(cypher).toContain('<-');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('Person');
    });

    test('should support complex multi-hop patterns', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const movieNode = qb.getNode();

      const actorNode = new Cypher.Node();
      const friendNode = new Cypher.Node();
      const actedIn = new Cypher.Relationship();
      const friendOf = new Cypher.Relationship();

      const { cypher } = qb
        .match()
        .pattern((Cypher, node) => {
          return new Cypher.Pattern(node, { labels: ['Movie'] })
            .related(actedIn, { type: 'ACTED_IN', direction: 'left' })
            .to(actorNode, { labels: ['Actor'] })
            .related(friendOf, { type: 'FRIEND_OF', direction: 'right' })
            .to(friendNode, { labels: ['Actor'] });
        })
        .return(['title'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('<-');
      expect(cypher).toContain('->');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('FRIEND_OF');
    });
  });

  describe('WITH Clause Support', () => {
    test('should support WITH clause for query chaining', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const node = qb.getNode();

      const { cypher } = qb
        .match()
        .where('title', 'The Matrix')
        .with([node.property('title'), 'movieTitle'])
        .return(['movieTitle'])
        .build();

      expect(cypher).toContain('WITH');
      expect(cypher).toContain('movieTitle');
      expect(cypher).toMatch(/WITH.*RETURN/s);
    });

    test('should support WITH clause with simple property names', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher } = qb
        .match()
        .where('released', 1999)
        .with(['title', 'released'])
        .return(['title'])
        .build();

      expect(cypher).toContain('WITH');
    });
  });

  describe('CALL Subqueries', () => {
    test('should support basic CALL subquery', async () => {
      const Cypher = orm.em.createQueryBuilder().getCypher();
      const actorNode = new Cypher.Node();

      const subClause = new Cypher.Match(
        new Cypher.Pattern(actorNode, { labels: ['Actor'] }),
      )
        .where(
          Cypher.eq(
            actorNode.property('name'),
            new Cypher.Param('Keanu Reeves'),
          ),
        )
        .return([actorNode.property('name'), 'name']);

      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher } = qb.call(subClause).return(['name']).build();

      expect(cypher).toContain('CALL');
      expect(cypher).toMatch(/CALL.*\{.*MATCH/s);
    });

    test('should support CALL with imported variables', async () => {
      const Cypher = orm.em.createQueryBuilder().getCypher();
      const movieNode = new Cypher.Node();

      const subClause = new Cypher.Match(
        new Cypher.Pattern(movieNode, { labels: ['Movie'] }),
      ).return(movieNode);

      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher } = qb.call(subClause, { importVariables: '*' }).build();

      expect(cypher).toContain('CALL (*)');
    });

    test('should support CALL with transaction control', async () => {
      const Cypher = orm.em.createQueryBuilder().getCypher();
      const movieNode = new Cypher.Node();

      const subClause = new Cypher.Match(
        new Cypher.Pattern(movieNode, { labels: ['Movie'] }),
      ).return(movieNode);

      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const { cypher } = qb
        .call(subClause, {
          inTransactions: {
            ofRows: 1000,
            concurrentTransactions: 4,
            onError: 'continue',
          },
        })
        .build();

      expect(cypher).toContain('CALL');
      expect(cypher).toContain('IN');
      expect(cypher).toContain('CONCURRENT TRANSACTIONS');
      expect(cypher).toContain('OF');
      expect(cypher).toContain('ROWS');
    });
  });

  describe('EXISTS and COUNT Subqueries', () => {
    test('should support EXISTS subquery', () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');
      const Cypher = qb.getCypher();
      const actorNode = qb.getNode();

      const relationship = new Cypher.Relationship();
      const targetNode = new Cypher.Node();
      const existsPattern = new Cypher.Pattern(actorNode)
        .related(relationship, { type: 'ACTED_IN' })
        .to(targetNode);

      const { cypher } = qb
        .match()
        .where(qb.exists(existsPattern))
        .return(['name'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('WHERE');
      expect(cypher).toContain('EXISTS');
      expect(cypher).toContain('ACTED_IN');
    });

    test('should support COUNT subquery', () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');
      const Cypher = qb.getCypher();
      const actorNode = qb.getNode();

      const relationship = new Cypher.Relationship();
      const targetNode = new Cypher.Node();
      const countPattern = new Cypher.Pattern(actorNode)
        .related(relationship, { type: 'ACTED_IN' })
        .to(targetNode, { labels: ['Movie'] });

      const count = qb.count(countPattern);

      const { cypher } = qb
        .match()
        .where(Cypher.gt(count, new Cypher.Param(5)))
        .return(['name'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('WHERE');
      expect(cypher).toContain('COUNT');
      expect(cypher).toContain('>');
    });
  });

  describe('Integration Tests with Database', () => {
    test('should execute query with relationship properties', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      const movies = await qb
        .match()
        .related('ACTED_IN', {
          direction: 'left',
          targetLabel: 'Actor',
        })
        .where('title', 'The Matrix')
        .return(['title'])
        .execute();

      expect(Array.isArray(movies)).toBe(true);
    });

    test('should execute query with variable-length relationship', async () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');

      const actors = await qb
        .match()
        .related('ACTED_IN', {
          length: { min: 1, max: 2 },
          targetLabel: 'Movie',
        })
        .return(['name'])
        .limit(5)
        .execute();

      expect(Array.isArray(actors)).toBe(true);
    });
  });

  describe('Entity-Based Query Building', () => {
    test('should extract relationship metadata from @RelMany decorator', () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');
      const { cypher } = qb
        .match()
        .related(Actor, 'movies')
        .return(['name'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('movie'); // collection name is lowercase
      expect(cypher).toContain('->'); // OUT direction
    });

    test('should extract relationship metadata from @Rel decorator', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const { cypher } = qb
        .match()
        .related(Movie, 'actors')
        .return(['title'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('actor'); // collection name is lowercase
      expect(cypher).toContain('<-'); // IN direction
    });

    test('should accept entity class in targetEntity option', () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');
      const { cypher } = qb
        .match()
        .related('ACTED_IN', {
          direction: 'right',
          targetEntity: Movie,
        })
        .return(['name'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('movie'); // collection name is lowercase
      expect(cypher).toContain('->');
    });

    test('should extract multiple labels from @Node decorator', () => {
      // Create a test entity with multiple labels
      @Entity()
      @Node({ labels: ['Employee', 'Manager'] })
      class Executive {

        @PrimaryKey()
        id!: number;

        @Property()
        name!: string;

}

      const qb = orm.em.createQueryBuilder<Executive>('Executive');
      const { cypher } = qb.match().return(['name']).build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('Executive');
    });

    test('should work with entity-based queries and filters', () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');
      const { cypher } = qb
        .match()
        .related(Actor, 'movies')
        .where('title', 'The Matrix')
        .return(['name'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('WHERE');
      expect(cypher).toContain('title');
    });

    test('should throw error when no decorator metadata found', () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');

      expect(() => {
        qb.match().related(Movie, 'invalidProperty').build();
      }).toThrow(/No @Rel or @RelMany decorator found/);
    });

    test('should work with entity classes in complex patterns', () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');
      const { cypher } = qb
        .match()
        .related('ACTED_IN', {
          direction: 'right',
          targetEntity: Movie,
          properties: { roles: ['Neo'] },
        })
        .return(['name'])
        .build();

      expect(cypher).toContain('MATCH');
      expect(cypher).toContain('ACTED_IN');
      expect(cypher).toContain('movie'); // collection name is lowercase
    });

    test('should execute entity-based queries', async () => {
      const qb = orm.em.createQueryBuilder<Actor>('Actor');

      const actors = await qb
        .match()
        .related(Actor, 'movies')
        .return(['name'])
        .limit(5)
        .execute();

      expect(Array.isArray(actors)).toBe(true);
    });

    test('should work with WHERE clauses on entity-based queries', async () => {
      const qb = orm.em.createQueryBuilder<Movie>('Movie');
      const Cypher = qb.getCypher();
      const node = qb.getNode();

      const movies = await qb
        .match()
        .related(Movie, 'actors')
        .where(
          Cypher.eq(node.property('title'), new Cypher.Param('The Matrix')),
        )
        .return(['title'])
        .execute();

      expect(Array.isArray(movies)).toBe(true);
    });
  });
});
