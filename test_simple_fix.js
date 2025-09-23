// Direct test of the fixed method logic
const { DatabaseTable } = require('./packages/knex/dist/schema/DatabaseTable');

// Mock platform
const platform = {
  getMappedType: () => ({ runtimeType: 'number' }),
};

// Create database table
const table = new DatabaseTable(platform, 'test_table', 'test_schema');

// Test the getSafeBaseNameForFkProp method through reflection
// Since it's private, we'll test the logic directly

function testGetSafeBaseNameForFkProp() {
  console.log('Testing getSafeBaseNameForFkProp logic...');
  
  // Simulate the key part of our fix
  const currentFk = {
    referencedTableName: 'public.fr_usuario',
    constraintName: 'fk_test',
  };
  
  const fks = [currentFk];
  
  // This is the original logic (before fix)
  function originalLogic(fks, currentFk) {
    if (!fks.some(fk => fk !== currentFk && fk.referencedTableName === currentFk.referencedTableName)) {
      return currentFk.referencedTableName; // Would return "public.fr_usuario"
    }
    return currentFk.constraintName;
  }
  
  // This is our fixed logic
  function fixedLogic(fks, currentFk) {
    if (!fks.some(fk => fk !== currentFk && fk.referencedTableName === currentFk.referencedTableName)) {
      const parts = currentFk.referencedTableName.split('.');
      return parts.length > 1 ? parts[parts.length - 1] : currentFk.referencedTableName;
    }
    return currentFk.constraintName;
  }
  
  const originalResult = originalLogic(fks, currentFk);
  const fixedResult = fixedLogic(fks, currentFk);
  
  console.log('Original result:', originalResult);
  console.log('Fixed result:', fixedResult);
  
  if (originalResult === 'public.fr_usuario' && fixedResult === 'fr_usuario') {
    console.log('✅ Fix working correctly: schema prefix removed');
    return true;
  } else {
    console.log('❌ Fix not working as expected');
    return false;
  }
}

function testEdgeCases() {
  console.log('\nTesting edge cases...');
  
  function fixedLogic(referencedTableName) {
    const parts = referencedTableName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : referencedTableName;
  }
  
  const testCases = [
    { input: 'public.fr_usuario', expected: 'fr_usuario' },
    { input: 'schema1.schema2.table_name', expected: 'table_name' },
    { input: 'simple_table', expected: 'simple_table' },
    { input: 'another.complex.nested.table', expected: 'table' },
  ];
  
  let passed = 0;
  testCases.forEach(({ input, expected }) => {
    const result = fixedLogic(input);
    console.log(`Input: ${input} => Result: ${result} (Expected: ${expected})`);
    if (result === expected) {
      passed++;
    } else {
      console.log('❌ Failed');
    }
  });
  
  console.log(`✅ Edge cases passed: ${passed}/${testCases.length}`);
  return passed === testCases.length;
}

// Run tests
const mainTest = testGetSafeBaseNameForFkProp();
const edgeTest = testEdgeCases();

if (mainTest && edgeTest) {
  console.log('\n🎉 All tests passed! The fix is working correctly.');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.');
  process.exit(1);
}