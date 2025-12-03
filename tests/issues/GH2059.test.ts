import { Collection, MikroORM, wrap } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Category {

  @PrimaryKey()
  id!: bigint;

  @Property()
  name: string;

  @ManyToOne({ entity: () => Category, nullable: true })
  parent?: Category;

  @OneToMany({ entity: () => Category, mappedBy: c => c.parent })
  children = new Collection<Category>(this);

  constructor(name: string, parent?: Category) {
    this.name = name;
    this.parent = parent;
  }

}

describe('GH issue 2059', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Category],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2059`, async () => {
    const a = new Category('A');
    const a1 = new Category('A1', a);
    const a11 = new Category('A11', a1);
    const a111 = new Category('A111', a11);
    const a2 = new Category('A2', a);
    const b = new Category('B');
    const b1 = new Category('B1', b);
    const b2 = new Category('B2', b);
    await orm.em.fork().persist([a, a1, a11, a111, a2, b, b1, b2]).flush();

    /* Current tree structure is:
        - CAT A
          | - CAT A1
          |   | - CAT A11
          |   |   |  - CAT A111
          | - CAT A2
        - CAT B
          | - CAT B1
          | - CAT B2
     */

    // Load root categories and populate children and children of children
    const categories = await orm.em.find(
      Category,
      { parent: null },
      { populate: ['children.children'] },
    );

    expect(categories[0].children[0].children[0].name).toBe('A11');
    await categories[0].children[0].children[0].children.init();
    expect(categories[0].children[0].children[0].children[0].name).toBe('A111');
    expect(wrap(categories[0]).toObject().children[0].children[0].children).toEqual(['4']);
    expect(wrap(categories[0]).toObject()).toMatchObject({
      name: 'A',
      children: [
        { name: 'A1', children: [{ name: 'A11' }] },
        { name: 'A2' },
      ],
    });
  });

});
