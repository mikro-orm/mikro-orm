import { DefaultLogger, LogContext, SimpleLogger, colors } from '@mikro-orm/core';

// Allow for testing colored output and prevent colors from causing match failures (invis. chars)
const redColorFormatterSpy = jest.spyOn(colors, 'red').mockImplementation(text => text);
const greyColorFormatterSpy = jest.spyOn(colors, 'grey').mockImplementation(text => text);
const cyanColorFormatterSpy = jest.spyOn(colors, 'cyan').mockImplementation(text => text);
const yellowColorFormatterSpy = jest.spyOn(colors, 'yellow').mockImplementation(text => text);

const mockWriter = jest.fn();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DefaultLogger', () => {

    test('should have debug mode disabled by default, but still output deprecated', async () => {
      const logger = new DefaultLogger({ writer: mockWriter });
      expect(logger.debugMode).toBe(false);
      logger.log('discovery', 'test debug msg');
      logger.log('info', 'test info msg');
      expect(mockWriter).toHaveBeenCalledTimes(0);
      logger.log('deprecated', 'test deprecation msg');
      expect(mockWriter).toHaveBeenCalledTimes(1);
    });

    test('should have debug mode not print anything when disabled, except deprecated', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: false });
      expect(logger.debugMode).toBe(false);
      logger.log('discovery', 'test debug msg');
      logger.log('info', 'test info msg');
      expect(mockWriter).toHaveBeenCalledTimes(0);
      logger.log('deprecated', 'test deprecation msg');
      expect(mockWriter).toHaveBeenCalledTimes(1);
    });

    test('should only ignore deprecations with specific labels', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: false, ignoreDeprecations: ['ignoreMe'] });
      expect(logger.debugMode).toBe(false);
      logger.log('discovery', 'test debug msg');
      logger.log('info', 'test info msg');
      logger.log('deprecated', 'test deprecation msg', { label: 'ignoreMe' });
      expect(mockWriter).toHaveBeenCalledTimes(0);
      logger.log('deprecated', 'test deprecation msg', { label: 'DoNotIgnoreMe' });
      expect(mockWriter).toHaveBeenCalledTimes(1);
    });

    test('should have debug mode not print anything when debugMode is false and ignoreDeprecations is true', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: false, ignoreDeprecations: true });
      expect(logger.debugMode).toBe(false);
      logger.log('discovery', 'test debug msg');
      logger.log('info', 'test info msg');
      logger.log('deprecated', 'test deprecation msg');
      expect(mockWriter).toHaveBeenCalledTimes(0);
    });

    test('should have debug mode not print deprecated when ignoreDeprecations is set to true', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: true, ignoreDeprecations: true });
      expect(logger.debugMode).toBe(true);
      logger.log('deprecated', 'test deprecation msg');
      expect(mockWriter).toHaveBeenCalledTimes(0);
      logger.log('discovery', 'test debug msg');
      logger.log('info', 'test info msg');
      expect(mockWriter).toHaveBeenCalledTimes(2);
    });

    test('should print debug messages when debug mode enabled', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: true });
      expect(logger.debugMode).toBe(true);
      logger.log('discovery', 'test debug msg');
      expect(mockWriter).toHaveBeenCalledTimes(1);
      logger.log('info', 'test info msg');
      expect(mockWriter).toHaveBeenCalledTimes(2);
      logger.log('query', 'test query msg');
      expect(mockWriter).toHaveBeenCalledTimes(3);
      logger.log('deprecated', 'test deprecation msg');
      expect(mockWriter).toHaveBeenCalledTimes(4);
    });

    test('should not print debug messages when given namespace not enabled', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: ['query'] });
      expect(logger.debugMode).toEqual(['query']);
      logger.log('discovery', 'test debug msg');
      expect(mockWriter).toHaveBeenCalledTimes(0);
      logger.log('info', 'test info msg');
      expect(mockWriter).toHaveBeenCalledTimes(0);
      logger.log('query', 'test query msg');
      expect(mockWriter).toHaveBeenCalledTimes(1);
      logger.error('query', 'test error msg');
      expect(mockWriter).toHaveBeenCalledTimes(2);
      logger.warn('query', 'test warning msg');
      expect(mockWriter).toHaveBeenCalledTimes(3);
      logger.log('deprecated', 'test deprecation msg');
      expect(mockWriter).toHaveBeenCalledTimes(4);
    });

    test('should print labels correctly', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const message = 'test label msg';
      const label = 'hello world handler';
      logger.log(namespace, message, { label });
      expect(mockWriter).toHaveBeenCalledWith(`[${namespace}] (${label}) ${message}`);
    });

    test('should print values with the appropriate colors', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const label = 'handler';
      const message = 'test label msg';

      logger.log(namespace, message, { level: 'error', label });
      expect(greyColorFormatterSpy).toHaveBeenCalledWith(`[${namespace}] `);
      expect(redColorFormatterSpy).toHaveBeenCalledWith(message);
      expect(cyanColorFormatterSpy).toHaveBeenCalledWith(`(${label}) `);
      expect(yellowColorFormatterSpy).not.toHaveBeenCalled();

      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'warning', label });
      expect(greyColorFormatterSpy).toHaveBeenCalledWith(`[${namespace}] `);
      expect(yellowColorFormatterSpy).toHaveBeenCalledWith(message);
      expect(cyanColorFormatterSpy).toHaveBeenCalledWith(`(${label}) `);
      expect(redColorFormatterSpy).not.toHaveBeenCalled();

      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'info', label });
      expect(greyColorFormatterSpy).toHaveBeenCalledWith(`[${namespace}] `);
      expect(cyanColorFormatterSpy).toHaveBeenCalledWith(`(${label}) `);
      expect(yellowColorFormatterSpy).not.toHaveBeenCalled();
      expect(redColorFormatterSpy).not.toHaveBeenCalled();
    });

    test('should respect the enabled context property', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: true });
      const namespace = 'query';
      const message = '';

      logger.log(namespace, message, { level: 'error', enabled: true });
      expect(mockWriter).toHaveBeenCalledTimes(1);
      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'error', enabled: undefined });
      expect(mockWriter).toHaveBeenCalledTimes(1);
      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'error', enabled: false });
      expect(mockWriter).not.toHaveBeenCalled();
    });

    test('should respect the debugMode context property', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: true });
      const message = '';

      let options: LogContext = { debugMode: ['query'] };
      logger.log('query', message, options);
      logger.log('discovery', message, options);
      expect(mockWriter).toHaveBeenCalledTimes(1);
      jest.clearAllMocks();

      options = { debugMode: ['query', 'info'] };
      logger.log('query', message, options);
      logger.log('info', message, options);
      expect(mockWriter).toHaveBeenCalledTimes(2);
      jest.clearAllMocks();

      options = { debugMode: ['discovery', 'info'] };
      logger.log('query', message, options);
      logger.log('query-params', message, options);
      expect(mockWriter).not.toHaveBeenCalled();
      jest.clearAllMocks();
    });
  });

  describe('SimpleLogger', () => {

    test('should print correctly without a label', () => {
      const logger = new SimpleLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const message = 'test label msg';
      logger.log(namespace, message);
      expect(mockWriter).toHaveBeenCalledWith(`[${namespace}] ${message}`);
    });

    test('should print labels correctly', () => {
      const logger = new SimpleLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const message = 'test label msg';
      const label = 'hello world handler';
      logger.log(namespace, message, { label });
      expect(mockWriter).toHaveBeenCalledWith(`[${namespace}] (${label}) ${message}`);
    });
  });
});


