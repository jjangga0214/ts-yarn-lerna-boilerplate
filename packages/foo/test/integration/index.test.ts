import { doubleNumbers } from '@jjangga0214/foo';

describe('This is an unit test', () => {
  it('doubleNumbers', () => {
    expect.hasAssertions();
    expect(doubleNumbers([1, 2, 3])).toEqual([2, 4, 6]);
    expect(doubleNumbers([6, 2, 13])).toEqual([12, 4, 26]);
  });
});
