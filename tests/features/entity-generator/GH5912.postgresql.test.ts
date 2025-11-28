import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schemaName = 'gh5912';
const schema = `
  CREATE TABLE public.user
  (
    user_id serial4 NOT NULL,
    CONSTRAINT user_pkey PRIMARY KEY (user_id)
  );

  CREATE TABLE public.department
  (
    department_id serial4 NOT NULL,
    CONSTRAINT department_pkey PRIMARY KEY (department_id)
  );

  CREATE TABLE public.user_department
  (
    user_department_id serial4 NOT NULL,
    department_id int4 NOT NULL,
    user_id int4 NOT NULL,
    CONSTRAINT user_department_department_id_user_id_unique UNIQUE (department_id, user_id),
    CONSTRAINT user_department_pkey PRIMARY KEY (user_department_id),
    CONSTRAINT user_department_fk0 FOREIGN KEY (department_id) REFERENCES public.department (department_id),
    CONSTRAINT user_department_fk1 FOREIGN KEY (user_id) REFERENCES public.user (user_id)
  );
`;

test('gh5912', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: schemaName,
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: false })) {
    await orm.schema.execute(schema);
  }

  const dump = await orm.entityGenerator.generate({
    schema: 'public',
    bidirectionalRelations: true,
    identifiedReferences: true,
    scalarTypeInDecorator: true,
    scalarPropertiesForRelations: 'always',
    onlyPurePivotTables: false,
    outputPurePivotTables: true,
    useCoreBaseEntity: true,
  });
  expect(dump).toMatchSnapshot();
  await orm.close(true);
});
