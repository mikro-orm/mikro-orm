import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Workflow {
  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: () => Phase, mappedBy: phase => phase.workflow })
  phases = new Collection<Phase>(this);
}

@Entity()
class Phase {
  @PrimaryKey()
  id!: number;

  @Property()
  position!: number;

  @ManyToOne(() => Workflow)
  workflow!: Workflow;

  @OneToMany({ entity: () => Element, mappedBy: element => element.phase })
  elements = new Collection<Element>(this);
}

@Entity()
class Element {
  @PrimaryKey()
  id!: number;

  @Property()
  position!: number;

  @ManyToOne(() => Phase)
  phase!: Phase;

  @ManyToOne({ entity: () => Element, nullable: true })
  parent?: Element | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Workflow, Phase, Element],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const workflow = orm.em.create(Workflow, { id: 1 });
  const phase = orm.em.create(Phase, { id: 1, position: 1, workflow });
  orm.em.create(Element, { id: 2, position: 1, phase, parent: null });
  orm.em.create(Element, { id: 1, position: 1, phase, parent: 2 });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

// ordering a populated collection by a to-one relation's FK was silently dropped under the `joined` strategy
test('joined strategy keeps nested collection orderBy by a to-one relation field', async () => {
  const mock = mockLogger(orm);
  const workflow = await orm.em.findOneOrFail(
    Workflow,
    { id: 1 },
    {
      populate: ['phases.elements'],
      strategy: 'joined',
      populateOrderBy: {
        phases: { position: 'asc', elements: { parent: { id: 'asc nulls first' }, position: 'asc' } },
      },
    },
  );

  expect(mock.mock.calls[0][0]).toMatch(
    'order by `p1`.`position` asc, `e2`.`parent_id` asc nulls first, `e2`.`position` asc',
  );
  expect(workflow.phases[0].elements.getItems().map(e => e.id)).toEqual([2, 1]);
});
