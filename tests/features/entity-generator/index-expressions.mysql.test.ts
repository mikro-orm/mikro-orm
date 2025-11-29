import { MikroORM } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

test('4911', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '4911',
    port: 3308,
    discovery: {
      warnWhenNoEntities: false,
    },
    multipleStatements: true,
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(`
CREATE TABLE \`dcim_device\` (
    \`created\` timestamp,
    \`id\` int8 NOT NULL,
    \`name\` varchar(255),
    \`_name\` varchar(255),
    \`asset_tag\` varchar(255),
    \`position\` numeric,
    \`face\` varchar(255) NOT NULL,
    \`vc_position\` int2 CHECK (vc_position >= 0),
    \`vc_priority\` int2 CHECK (vc_priority >= 0),
    \`cluster_id\` int8,
    \`role_id\` int8 NOT NULL,
    \`device_type_id\` int8 NOT NULL,
    \`location_id\` int8,
    \`platform_id\` int8,
    \`primary_ip4_id\` int8,
    \`primary_ip6_id\` int8,
    \`rack_id\` int8,
    \`site_id\` int8 NOT NULL,
    \`tenant_id\` int8,
    \`virtual_chassis_id\` int8,
    \`airflow\` varchar(255) NOT NULL,
    \`config_template_id\` int8,
    \`oob_ip_id\` int8,
    PRIMARY KEY (\`id\`)
);
CREATE INDEX dcim_device_virtual_chassis_id_aed51693 ON \`dcim_device\` (virtual_chassis_id);
CREATE UNIQUE INDEX dcim_device_unique_virtual_chassis_vc_position ON \`dcim_device\` (virtual_chassis_id, vc_position);
CREATE UNIQUE INDEX dcim_device_unique_rack_position_face ON \`dcim_device\` (rack_id, position, face);
CREATE UNIQUE INDEX dcim_device_unique_name_site_tenant ON \`dcim_device\` ((lower(name)), site_id, tenant_id);
CREATE UNIQUE INDEX dcim_device_unique_name_site ON \`dcim_device\` ((case when (tenant_id is null) then lower(name) end));
CREATE INDEX dcim_device_tenant_id_dcea7969 ON \`dcim_device\` (tenant_id);
CREATE INDEX dcim_device_site_id_ff897cf6 ON \`dcim_device\` (site_id);
CREATE INDEX dcim_device_rack_id_23bde71f ON \`dcim_device\` (rack_id);
CREATE UNIQUE INDEX dcim_device_primary_ip6_id_key ON \`dcim_device\` (primary_ip6_id);
CREATE UNIQUE INDEX dcim_device_primary_ip4_id_key ON \`dcim_device\` (primary_ip4_id);
CREATE INDEX dcim_device_platform_id_468138f1 ON \`dcim_device\` (platform_id);
CREATE INDEX dcim_device_oob_ip_id_key ON \`dcim_device\` (oob_ip_id);
CREATE INDEX dcim_device_location_id_11a7bedb ON \`dcim_device\` (location_id);
CREATE INDEX dcim_device_device_type_id_d61b4086 ON \`dcim_device\` (device_type_id);
CREATE INDEX dcim_device_device_role_id_682e8188 ON \`dcim_device\` (role_id);
CREATE INDEX dcim_device_config_template_id_316328c4 ON \`dcim_device\` (config_template_id);
CREATE INDEX dcim_device_cluster_id_cf852f78 ON \`dcim_device\` (cluster_id);
CREATE UNIQUE INDEX dcim_device_asset_tag_key ON \`dcim_device\` (asset_tag);
CREATE INDEX dcim_device_asset_tag_8dac1079_like ON \`dcim_device\` (asset_tag);
  `);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();
  await orm.close(true);
});
