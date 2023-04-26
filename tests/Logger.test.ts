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

    test('should have debug mode disabled by default', async () => {
      const logger = new DefaultLogger({ writer: mockWriter });
      expect(logger.debugMode).toBe(false);
      logger.log('discovery', 'test debug msg');
      logger.log('info', 'test info msg');
      expect(mockWriter).toBeCalledTimes(0);
    });

    test('should print debug messages when debug mode enabled', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: true });
      expect(logger.debugMode).toBe(true);
      logger.log('discovery', 'test debug msg');
      expect(mockWriter).toBeCalledTimes(1);
      logger.log('info', 'test info msg');
      expect(mockWriter).toBeCalledTimes(2);
      logger.log('query', 'test query msg');
      expect(mockWriter).toBeCalledTimes(3);
    });

    test('should not print debug messages when given namespace not enabled', async () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: ['query'] });
      expect(logger.debugMode).toEqual(['query']);
      logger.log('discovery', 'test debug msg');
      expect(mockWriter).toBeCalledTimes(0);
      logger.log('info', 'test info msg');
      expect(mockWriter).toBeCalledTimes(0);
      logger.log('query', 'test query msg');
      expect(mockWriter).toBeCalledTimes(1);
      logger.error('query', 'test error msg');
      expect(mockWriter).toBeCalledTimes(2);
      logger.warn('query', 'test warning msg');
      expect(mockWriter).toBeCalledTimes(3);
    });

    test('should print labels correctly', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const message = 'test label msg';
      const label = 'hello world handler';
      logger.log(namespace, message, { label });
      expect(mockWriter).toBeCalledWith(`[${namespace}] (${label}) ${message}`);
    });

    test('should print values with the appropriate colors', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const label = 'handler';
      const message = 'test label msg';

      logger.log(namespace, message, { level: 'error', label });
      expect(greyColorFormatterSpy).toBeCalledWith(`[${namespace}] `);
      expect(redColorFormatterSpy).toBeCalledWith(message);
      expect(cyanColorFormatterSpy).toBeCalledWith(`(${label}) `);
      expect(yellowColorFormatterSpy).not.toBeCalled();

      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'warning', label });
      expect(greyColorFormatterSpy).toBeCalledWith(`[${namespace}] `);
      expect(yellowColorFormatterSpy).toBeCalledWith(message);
      expect(cyanColorFormatterSpy).toBeCalledWith(`(${label}) `);
      expect(redColorFormatterSpy).not.toBeCalled();

      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'info', label });
      expect(greyColorFormatterSpy).toBeCalledWith(`[${namespace}] `);
      expect(cyanColorFormatterSpy).toBeCalledWith(`(${label}) `);
      expect(yellowColorFormatterSpy).not.toBeCalled();
      expect(redColorFormatterSpy).not.toBeCalled();
    });

    test('should respect the enabled context property', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: true });
      const namespace = 'query';
      const message = '';

      logger.log(namespace, message, { level: 'error', enabled: true });
      expect(mockWriter).toBeCalledTimes(1);
      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'error', enabled: undefined });
      expect(mockWriter).toBeCalledTimes(1);
      jest.clearAllMocks();

      logger.log(namespace, message, { level: 'error', enabled: false });
      expect(mockWriter).not.toBeCalled();
    });

    test('should respect the debugMode context property', () => {
      const logger = new DefaultLogger({ writer: mockWriter, debugMode: true });
      const message = '';

      let options: LogContext = { debugMode: ['query'] };
      logger.log('query', message, options);
      logger.log('discovery', message, options);
      expect(mockWriter).toBeCalledTimes(1);
      jest.clearAllMocks();

      options = { debugMode: ['query', 'info'] };
      logger.log('query', message, options);
      logger.log('info', message, options);
      expect(mockWriter).toBeCalledTimes(2);
      jest.clearAllMocks();

      options = { debugMode: ['discovery', 'info'] };
      logger.log('query', message, options);
      logger.log('info', message, options);
      expect(mockWriter).not.toBeCalled();
      jest.clearAllMocks();
    });
  });

  describe('SimpleLogger', () => {

    test('should print correctly without a label', () => {
      const logger = new SimpleLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const message = 'test label msg';
      logger.log(namespace, message);
      expect(mockWriter).toBeCalledWith(`[${namespace}] ${message}`);
    });

    test('should print labels correctly', () => {
      const logger = new SimpleLogger({ writer: mockWriter, debugMode: ['query'] });
      const namespace = 'query';
      const message = 'test label msg';
      const label = 'hello world handler';
      logger.log(namespace, message, { label });
      expect(mockWriter).toBeCalledWith(`[${namespace}] (${label}) ${message}`);
    });
  });
});


