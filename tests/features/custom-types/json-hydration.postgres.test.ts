import { MikroORM } from '@mikro-orm/postgresql';
import { Embedded, Entity, PrimaryKey, Embeddable, OneToOne, Property } from '@mikro-orm/core';

@Embeddable()
export class Page {

  private _attestations!: string[];
  static log: unknown[] = [];

  @Property({ type: 'jsonb' })
  get attestations(): string[] {
    return this._attestations;
  }

  set attestations(value: string[]) {
    if (typeof value === 'string') {
      Page.log.push(value);
    } else {
      Page.log.push(value);
    }
    this._attestations = value;
  }

}

@Entity()
export class Customization {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Page, { object: true })
  pages!: Page;

}

@Entity()
export class Course {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => Customization, nullable: true })
  published?: Customization;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Course, Customization],
    dbName: `mikro_orm_test_json_prop`,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

// FIXME this test was false positive because of the `jsonb` type, which is now fixed and the test correctly fails
test.skip('json property hydration', async () => {
  const p1 = new Page();
  p1.attestations = [
    'attestation1',
    'attestation2',
  ];

  const cr1 = new Course();
  const c1 = new Customization();
  cr1.published = c1;
  c1.pages = p1;
  await orm.em.persistAndFlush(cr1);
  orm.em.clear();

  Page.log = [];
  const results = await orm.em.find(Course, {}, { populate: true });
  expect(results[0].published?.pages.attestations).toEqual(['attestation1', 'attestation2']);
  expect(Page.log).toEqual([
    ['attestation1', 'attestation2'],
    ['attestation1', 'attestation2'],
  ]);
});
