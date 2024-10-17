import { Author4 } from '../../entities-schema';

describe('SchemaValidator', () => {
  test('validate input', () => {
    Author4.init();
    const result = Author4['~validate']({ value: {
        name: 'John',
        email: 'john@example.com',
    } });

    expect(result).toEqual({
      value: {
        name: 'John',
        email: 'john@example.com',
      },
    });
  });

  test('should failed with empty data', () => {
    Author4.init();
    expect(Author4['~validate']({ value: null }).issues?.[0].message).toMatch('input value is empty');
    expect(Author4['~validate']({ value: 1 }).issues?.[0].message).toMatch('input value is not an object');
  });
});
