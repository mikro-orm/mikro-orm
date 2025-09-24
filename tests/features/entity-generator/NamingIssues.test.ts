import { UnderscoreNamingStrategy } from '@mikro-orm/core';

describe('Naming Strategy Issues', () => {
  const ns = new UnderscoreNamingStrategy();

  describe('Column name to property conversion', () => {
    test('should handle clean table names correctly', () => {
      // Test basic property conversion - these are the correct inputs the naming strategy should receive
      expect(ns.columnNameToProperty('usr_codigo_app')).toBe('usrCodigoApp');
      expect(ns.columnNameToProperty('fr_usuario')).toBe('frUsuario');

      // The Entity Generator should strip schema prefixes before calling columnNameToProperty
      // So these clean table names are what the naming strategy should actually receive
    });
  });
});
