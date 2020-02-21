import { CommitOrderCalculator } from '../lib/unit-of-work';

describe('CommitOrderCalculator', () => {

  const calc = new CommitOrderCalculator();

  test('Commit ordering 1', async () => {
    calc.addNode('1');
    calc.addNode('2');
    calc.addNode('3');
    calc.addNode('4');
    calc.addNode('5');

    calc.addDependency('1', '2', 1);
    calc.addDependency('2', '3', 1);
    calc.addDependency('3', '4', 1);
    calc.addDependency('5', '1', 1);

    const sorted = calc.sort();
    const correctOrder = ['5', '1', '2', '3', '4'];
    expect(sorted).toEqual(correctOrder);
  });

  test('Commit ordering 2', async () => {
    calc.addNode('1');
    calc.addNode('2');

    calc.addDependency('1', '2', 0);
    calc.addDependency('2', '1', 1);

    const sorted = calc.sort();
    const correctOrder = ['2', '1'];
    expect(sorted).toEqual(correctOrder);
  });

  test('Commit ordering 3', async () => {
    calc.addNode('1');
    calc.addNode('2');
    calc.addNode('3');
    calc.addNode('4');

    calc.addDependency('4', '1', 1);
    calc.addDependency('1', '2', 1);
    calc.addDependency('4', '3', 1);
    calc.addDependency('1', '4', 0);

    // There are multiple valid ordering for this constellation, but
    // the class4, class1, class2 ordering is important to break the cycle
    // on the nullable link.
    const correctOrders = [
      ['4', '1', '2', '3'],
      ['4', '1', '3', '2'],
      ['4', '3', '1', '2'],
    ];
    const sorted = calc.sort();
    expect(correctOrders).toContainEqual(sorted);
  });

  test('Commit ordering 4', async () => {
    calc.addNode('1');
    calc.addNode('2');
    calc.addNode('3');
    calc.addNode('4');
    calc.addNode('5');

    calc.addDependency('1', '2', 0.5);
    calc.addDependency('1', '3', 0.5);
    calc.addDependency('1', '4', 0);
    calc.addDependency('2', '3', 0.5);
    calc.addDependency('3', '1', 1);
    calc.addDependency('4', '5', 1);
    calc.addDependency('5', '3', 1);

    const sorted = calc.sort();
    const correctOrder = ['2', '3', '1', '4', '5'];
    expect(sorted).toEqual(correctOrder);
  });

});
