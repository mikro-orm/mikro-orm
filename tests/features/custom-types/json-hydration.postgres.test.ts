import { MikroORM } from '@mikro-orm/postgresql';
import {
  Embeddable,
  Embedded,
  Entity,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Embeddable()
export class Page {

  private _attestations!: string[];
  static log: unknown[] = [];

  @Property({ type: 'jsonb' })
  get attestations(): string[] {
    return this._attestations;
  }

  set attestations(value: string[]) {
    Page.log.push(value);
    this._attestations = value;
  }

}

@Embeddable()
export class Page2 {

  @Property({ type: 'jsonb' })
  private _attestations!: string[];

  get attestations() {
    return this._attestations;
  }

  setAttestations(value: string[] = []) {
    this._attestations = value;
  }

}

@Entity()
export class Customization {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Page, { object: true, nullable: true })
  page!: Page;

  @Embedded(() => Page2, { object: true, nullable: true })
  page2!: Page2;

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
    metadataProvider: ReflectMetadataProvider,
    entities: [Course, Customization],
    dbName: `mikro_orm_test_json_prop`,
  });
  await orm.schema.refresh();
});

beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

test('json property hydration 1/2', async () => {
  const p1 = new Page();
  p1.attestations = [
    'attestation1',
    'attestation2',
  ];

  const cr1 = new Course();
  const c1 = new Customization();
  cr1.published = c1;
  c1.page = p1;
  await orm.em.persist(cr1).flush();
  orm.em.clear();

  Page.log = [];
  const results = await orm.em.find(Course, {}, { populate: ['*'] });
  expect(results[0].published?.page.attestations).toEqual(['attestation1', 'attestation2']);
  expect(Page.log).toEqual([
    ['attestation1', 'attestation2'],
    ['attestation1', 'attestation2'],
  ]);

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('json property hydration 2/2', async () => {
  const p1 = new Page2();
  p1.setAttestations([
    'attestation1',
    'attestation2',
  ]);

  const cr1 = new Course();
  const c1 = new Customization();
  cr1.published = c1;
  c1.page2 = p1;
  await orm.em.persist(cr1).flush();
  orm.em.clear();

  const results = await orm.em.find(Course, {}, { populate: ['*'] });
  expect(results[0].published?.page2.attestations).toEqual(['attestation1', 'attestation2']);

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
