import { UnderscoreNamingStrategy } from '@mikro-orm/core';

describe('Naming Strategy Issues', () => {
  const ns = new UnderscoreNamingStrategy();

  describe('Multiple underscores in table names (Issue #1)', () => {
    test('should properly convert table names with multiple consecutive underscores to Pascal case', () => {
      // Test cases from the reported issue
      expect(ns.getClassName('wac_tela_principal_wac___ident', '_')).toBe('WacTelaPrincipalWacIdent');
      expect(ns.getClassName('sft_tqm___ocorrencia_envolvido', '_')).toBe('SftTqmOcorrenciaEnvolvido');
      expect(ns.getClassName('sft_tela_principal_sft___ident', '_')).toBe('SftTelaPrincipalSftIdent');
    });

    test('should handle various patterns of multiple underscores', () => {
      expect(ns.getClassName('table__name', '_')).toBe('TableName');
      expect(ns.getClassName('table___name', '_')).toBe('TableName');
      expect(ns.getClassName('table____name', '_')).toBe('TableName');
      expect(ns.getClassName('prefix__middle___suffix', '_')).toBe('PrefixMiddleSuffix');
    });

    test('should still work correctly with single underscores', () => {
      expect(ns.getClassName('simple_table', '_')).toBe('SimpleTable');
      expect(ns.getClassName('another_simple_table_name', '_')).toBe('AnotherSimpleTableName');
    });
  });

  describe('Entity name generation using getEntityName', () => {
    test('should properly convert table names to entity names', () => {
      // Test the full flow through getEntityName
      expect(ns.getEntityName('wac_tela_principal_wac___ident')).toBe('WacTelaPrincipalWacIdent');
      expect(ns.getEntityName('sft_tqm___ocorrencia_envolvido')).toBe('SftTqmOcorrenciaEnvolvido');
      expect(ns.getEntityName('sft_tela_principal_sft___ident')).toBe('SftTelaPrincipalSftIdent');
    });
  });

  describe('Column name to property conversion (Issue #2)', () => {
    test('should handle schema-prefixed column names correctly', () => {
      // Test basic property conversion
      expect(ns.columnNameToProperty('usr_codigo_app')).toBe('usrCodigoApp');
      expect(ns.columnNameToProperty('public.fr_usuario')).toBe('public.frUsuario');

      // The issue is that when schema is included, it should be cleaned
      // but this is more of an Entity Generator issue than naming strategy
    });
  });
});
