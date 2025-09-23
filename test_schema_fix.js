// Minimal test to verify the schema prefix fix
const { DatabaseTable } = require('./packages/knex/dist/schema/DatabaseTable');
const { UnderscoreNamingStrategy } = require('./packages/core/dist');

// Mock platform
const platform = {
  getMappedType: () => ({ runtimeType: 'number' }),
};

// Create database table with schema
const table = new DatabaseTable(platform, 'tabela_com_fk', 'test_schema');

// Create a column and foreign key
const column = {
  name: 'usr_codigo_app',
  type: 'int',
  nullable: false,
  primary: false,
  unique: false,
  default: null,
  mappedType: { runtimeType: 'number' },
  enumItems: [],
};

const fk = {
  constraintName: 'fk_tabela_fr_usuario',
  columnNames: ['usr_codigo_app'],
  referencedTableName: 'public.fr_usuario',
  referencedColumnNames: ['id'],
  updateRule: 'CASCADE',
  deleteRule: 'RESTRICT',
};

// Initialize table
table.init([column], [], [], [], { fk_tabela_fr_usuario: fk });

// Create naming strategy
const namingStrategy = new UnderscoreNamingStrategy();

// Test the getSafeBaseNameForFkProp method by calling getEntityDeclaration
try {
  const metadata = table.getEntityDeclaration(namingStrategy, {}, 'always');
  console.log('Success! Entity declaration generated');
  console.log('Class name:', metadata.className);
  
  // Check property names
  const props = Object.keys(metadata.properties);
  console.log('Property names:', props);
  
  // Look for foreign key properties
  const fkProps = props.filter(prop => {
    const propMeta = metadata.properties[prop];
    return propMeta.kind && propMeta.kind !== 'scalar';
  });
  
  console.log('FK properties:', fkProps);
  
  // The fix should ensure that we don't have schema prefixes in property names
  const hasSchemaPrefix = fkProps.some(prop => prop.includes('.'));
  if (hasSchemaPrefix) {
    console.log('❌ FAIL: Schema prefix found in property names');
    process.exit(1);
  } else {
    console.log('✅ PASS: No schema prefixes in property names');
  }
  
} catch (error) {
  console.error('Error generating entity declaration:', error);
  process.exit(1);
}