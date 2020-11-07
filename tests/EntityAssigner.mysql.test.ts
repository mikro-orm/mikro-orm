import { MikroORM, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { Author2, Book2, BookTag2 } from './entities-sql';
import { Grandparent } from './entities-sql/Grandparent';
import { Parent } from './entities-sql/Parent';
import { Child } from './entities-sql/Child';

describe('EntityAssignerMySql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('assign() should update entity values [mysql]', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    await orm.em.persistAndFlush(book);
    expect(book.title).toBe('Book2');
    expect(book.author).toBe(jon);
    wrap(book).assign({ title: 'Better Book2 1', author: god, notExisting: true });
    expect(book.author).toBe(god);
    expect((book as any).notExisting).toBe(true);
    await orm.em.persistAndFlush(god);
    wrap(book).assign({ title: 'Better Book2 2', author: god.id });
    expect(book.author).toBe(god);
    wrap(book).assign({ title: 'Better Book2 3', author: jon.id });
    expect(book.title).toBe('Better Book2 3');
    expect(book.author).toBe(jon);
  });

  test('assign() should fix property types [mysql]', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    wrap(god).assign({ createdAt: '2018-01-01', termsAccepted: 1 });
    expect(god.createdAt).toEqual(new Date('2018-01-01'));
    expect(god.termsAccepted).toBe(true);

    const d1 = +new Date('2018-01-01');
    wrap(god).assign({ createdAt: '' + d1, termsAccepted: 0 });
    expect(god.createdAt).toEqual(new Date('2018-01-01'));
    expect(god.termsAccepted).toBe(false);

    wrap(god).assign({ createdAt: d1, termsAccepted: 0 });
    expect(god.createdAt).toEqual(new Date('2018-01-01'));

    const d2 = +new Date('2018-01-01 00:00:00.123');
    wrap(god).assign({ createdAt: '' + d2 });
    expect(god.createdAt).toEqual(new Date('2018-01-01 00:00:00.123'));

    wrap(god).assign({ createdAt: d2 });
    expect(god.createdAt).toEqual(new Date('2018-01-01 00:00:00.123'));
  });

  test('assign() should update entity collection [mysql]', async () => {
    const other = new BookTag2('other');
    await orm.em.persistAndFlush(other);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    const tag1 = new BookTag2('tag 1');
    const tag2 = new BookTag2('tag 2');
    const tag3 = new BookTag2('tag 3');
    book.tags.add(tag1, tag2, tag3);
    await orm.em.persistAndFlush(book);
    wrap(book).assign({ tags: [other.id] });
    expect(book.tags.getIdentifiers()).toMatchObject([other.id]);
    wrap(book).assign({ tags: [] });
    expect(book.tags.getIdentifiers()).toMatchObject([]);
    wrap(book).assign({ tags: [tag1.id, tag3.id] });
    expect(book.tags.getIdentifiers()).toMatchObject([tag1.id, tag3.id]);
    wrap(book).assign({ tags: [tag2] });
    expect(book.tags.getIdentifiers()).toMatchObject([tag2.id]);
    await orm.em.flush();

    orm.em.clear();
    const book2 = await orm.em.findOneOrFail(Book2, book.uuid);
    await book2.tags.init();
    expect(book2.tags.getIdentifiers()).toMatchObject([tag2.id]);
  });

  test('assign() should update not initialized collection [mysql]', async () => {
    const other = new BookTag2('other');
    await orm.em.persistAndFlush(other);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    const tag1 = new BookTag2('tag 1');
    const tag2 = new BookTag2('tag 2');
    const tag3 = new BookTag2('tag 3');
    book.tags.add(tag1, tag2, tag3);
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const book1 = await orm.em.findOneOrFail(Book2, book.uuid);
    wrap(book1).assign({ tags: [tag1.id, other.id] });
    await orm.em.flush();
    orm.em.clear();

    const book2 = await orm.em.findOneOrFail(Book2, book.uuid, ['tags']);
    expect(book2.tags.getIdentifiers()).toMatchObject([tag1.id, other.id]);
  });

  test('assign() allows mapping of deeply nested json objects and arrays [mysql]', async () => {

    const inputChild1 = {
      id: 'child1',
      name: 'child1',
    };

    const inputChild2 = {
      id: 'child2',
      name: 'child2',
    };

    const inputChild3 = {
      id: 'child3',
      name: 'child3',
    };

    const inputParent1 = {
      id: 'parent1',
      name: 'parent1',
      children: [inputChild1,inputChild2],
    };

    const inputParent2 = {
      id: 'parent2',
      name: 'parent2',
      children: [inputChild3],
    };

    const input = {
      id: 'grandparent1',
      name: 'grandparent1',
      children: [
        inputParent1,
        inputParent2,
      ],
    };

    const toSave = orm.em.create(Grandparent, input);

    await orm.em.persistAndFlush(toSave);

    const grandparent = await orm.em.findOneOrFail(Grandparent, input.id, { populate: ['children'] });
    expect(grandparent.name).toBe(input.name);
    expect(grandparent.children).toHaveLength(input.children.length);

    const parent1 = await orm.em.findOneOrFail(Parent, inputParent1.id, { populate: ['children'] });
    expect(parent1.name).toBe(parent1.name);
    expect(parent1.children).toHaveLength(inputParent1.children.length);

    const parent2 = await orm.em.findOneOrFail(Parent, inputParent2.id, { populate: ['children'] });
    expect(parent2.name).toBe(parent2.name);
    expect(parent2.children).toHaveLength(inputParent2.children.length);

    const child1 = await orm.em.findOneOrFail(Child, inputChild1.id);
    expect(child1.name).toBe(child1.name);
    const child2 = await orm.em.findOneOrFail(Child, inputChild2.id);
    expect(child2.name).toBe(child2.name);
    const child3 = await orm.em.findOneOrFail(Child, inputChild3.id);
    expect(child3.name).toBe(child3.name);
  });

  test('assign() allows removal and update of deeply nested json objects and arrays [mysql]', async () => {

    const inputChild1 = {
      id: 'child1',
      name: 'child1',
    };

    const inputChild2 = {
      id: 'child2',
      name: 'child2',
    };

    const inputChild3 = {
      id: 'child3',
      name: 'child3',
    };

    const inputParent1 = {
      id: 'parent1',
      name: 'parent1',
      children: [inputChild1,inputChild2],
    };

    const inputParent2 = {
      id: 'parent2',
      name: 'parent2',
      children: [inputChild3],
    };

    const input = {
      id: 'grandparent1',
      name: 'grandparent1',
      children: [
        inputParent1,
        inputParent2,
      ],
    };

    const toSave = orm.em.create(Grandparent, input);

    await orm.em.persistAndFlush(toSave);

    const inputParent2Updated = {
      id: 'parent2',
      name: 'parent2Updated',
      children: [inputChild3],
    };

    const inputUpdated = {
      id: 'grandparent1',
      name: 'grandparent1Updated',
      children: [
        inputParent2Updated,
      ],
    };

    wrap(toSave).assign(inputUpdated, { merge: true });

    await orm.em.persistAndFlush(toSave);

    const grandparent = await orm.em.findOneOrFail(Grandparent, inputUpdated.id, { populate: ['children'] });
    expect(grandparent.name).toBe(inputUpdated.name);

    const parent1 = await orm.em.findOne(Parent, inputParent1.id);
    expect(parent1).toBeNull();

    const parent2 = await orm.em.findOneOrFail(Parent, inputParent2.id, { populate: ['children'] });
    expect(parent2.name).toBe(inputParent2Updated.name);
    expect(parent2.children).toHaveLength(inputParent2.children.length);

    const child1 = await orm.em.findOne(Child, inputChild1.id);
    expect(child1).toBeNull();
    const child2 = await orm.em.findOne(Child, inputChild2.id);
    expect(child2).toBeNull();
    const child3 = await orm.em.findOneOrFail(Child, inputChild3.id);
    expect(child3.name).toBe(inputChild3.name);
  });

  test('assign() attaches to entity currently in map when using em [mysql]', async () => {

    const input = {
      id: 'grandparent1',
      name: 'grandparent1',
    };

    const toSave = orm.em.create(Grandparent, input);

    await orm.em.persistAndFlush(toSave);

    const input2 = {
      id: 'grandparent1',
      name: 'grandparent2',
      children: [],
    };

    const updated = new Grandparent();
    wrap(updated).assign(input2, { em: orm.em, merge: true });

    await orm.em.persistAndFlush(updated);

  });

  test('assign() allows deep merging of object properties [mysql]', async () => {
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    book.meta = { items: 5, category: 'test' };
    wrap(book).assign({ meta: { items: 3, category: 'foo' } });
    expect(book.meta).toEqual({ items: 3, category: 'foo' });
    wrap(book).assign({ meta: { category: 'bar' } }, { mergeObjects: true });
    expect(book.meta).toEqual({ items: 3, category: 'bar' });
    wrap(book).assign({ meta: { category: 'bar' } });
    expect(book.meta).toEqual({ category: 'bar' });
    jon.identities = ['1', '2'];
    wrap(jon).assign({ identities: ['3', '4'] }, { mergeObjects: true });
    expect(jon.identities).toEqual(['3', '4']);
  });

  afterAll(async () => orm.close(true));

});
