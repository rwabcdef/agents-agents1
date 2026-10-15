const test = require('node:test');
const assert = require('node:assert');
const { toSearchTerm } = require('../src/parser');

const cases = [
  ['5K0 0805 1%', '5 kohm 0805 1%'],
  ['4K99 0603 0.1%', '4.99 kohm 0603 0.1%'],
  ['4R7 1206', '4.7 ohm 1206'],
  ['100R', '100 ohm'],
  ['10k', '10 kohm'],
  ['1M', '1 Mohm'],
  ['10kohm', '10 kohm'],
  ['4.7kΩ', '4.7 kohm'],
  ['100n 50V 0402', '100nF 50V 0402'],
  ['100nF', '100nF'],
  ['4u7', '4.7uF'],
  ['4µ7 X7R', '4.7uF X7R'],
  ['10p', '10pF'],
  ['0.1uF', '0.1uF'],
  ['10uH SOT-23', '10uH SOT-23'],
  ['  BC547   TO-92 ', 'BC547 TO-92'],
  ['0.125W', '0.125W'],
];

for (const [input, expected] of cases) {
  test(`${JSON.stringify(input)} -> ${JSON.stringify(expected)}`, () => {
    assert.strictEqual(toSearchTerm(input), expected);
  });
}
