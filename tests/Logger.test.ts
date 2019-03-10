import { Logger } from '../lib/utils';

/**
 * @class LoggerTest
 */
describe('Logger', () => {

  test('should have debug mode disabled by default', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock);
    expect(logger['debugMode']).toBe(false);
    logger.debug('test debug msg');
    expect(mock.mock.calls.length).toBe(0);
    logger.info('test info msg');
    expect(mock.mock.calls.length).toBe(1);
  });

  test('should print debug messages when debug mode enabled', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    expect(logger['debugMode']).toBe(true);
    logger.debug('test debug msg');
    expect(mock.mock.calls.length).toBe(1);
    logger.info('test info msg');
    expect(mock.mock.calls.length).toBe(2);
  });

});
