import { Logger } from '../lib/utils';

describe('Logger', () => {

  test('should have debug mode disabled by default', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock);
    // @ts-ignore
    expect(logger.debugMode).toBe(false);
    logger.log('discovery', 'test debug msg');
    expect(mock.mock.calls.length).toBe(0);
    logger.log('info', 'test info msg');
    expect(mock.mock.calls.length).toBe(0);
  });

  test('should print debug messages when debug mode enabled', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    // @ts-ignore
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
    const logger = new Logger(mock, ['query']);
    // @ts-ignore
    expect(logger.debugMode).toEqual(['query']);
    logger.log('discovery', 'test debug msg');
    expect(mock.mock.calls.length).toBe(0);
    logger.log('info', 'test info msg');
    expect(mock.mock.calls.length).toBe(0);
    logger.log('query', 'test query msg');
    expect(mock.mock.calls.length).toBe(1);
  });

});
