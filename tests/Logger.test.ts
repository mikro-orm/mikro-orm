import { Configuration, DefaultLogger } from '@mikro-orm/core';

describe('Logger', () => {

  test('should have debug mode disabled by default', async () => {
    const mock = jest.fn();
    const config = new Configuration({ type: 'sqlite', logger: mock }, false);
    const logger = new DefaultLogger(config);
    expect(logger.debugMode).toBe(false);
    logger.log('discovery', 'test debug msg');
    expect(mock.mock.calls.length).toBe(0);
    logger.log('info', 'test info msg');
    expect(mock.mock.calls.length).toBe(0);
  });

  test('should print debug messages when debug mode enabled', async () => {
    const mock = jest.fn();
    const config = new Configuration({ type: 'sqlite', logger: mock, debug: true }, false);
    const logger = new DefaultLogger(config);
    expect(logger.debugMode).toBe(true);
    logger.log('discovery', 'test debug msg');
    expect(mock.mock.calls.length).toBe(1);
    logger.log('info', 'test info msg');
    expect(mock.mock.calls.length).toBe(2);
    logger.log('query', 'test query msg');
    expect(mock.mock.calls.length).toBe(3);
  });

  test('should not print debug messages when given namespace not enabled', async () => {
    const mock = jest.fn();
    const config = new Configuration({ type: 'sqlite', logger: mock, debug: ['query'] }, false);
    const logger = new DefaultLogger(config);
    expect(logger.debugMode).toEqual(['query']);
    logger.log('discovery', 'test debug msg');
    expect(mock.mock.calls.length).toBe(0);
    logger.log('info', 'test info msg');
    expect(mock.mock.calls.length).toBe(0);
    logger.log('query', 'test query msg');
    expect(mock.mock.calls.length).toBe(1);
    logger.error('query', 'test error msg');
    expect(mock.mock.calls.length).toBe(2);
    logger.warn('query', 'test warning msg');
    expect(mock.mock.calls.length).toBe(3);
  });

});
