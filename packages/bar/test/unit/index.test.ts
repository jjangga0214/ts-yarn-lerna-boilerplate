import { run } from '~bar';

describe('index', () => {
  it('run', () => {
    expect.hasAssertions();
    expect(run()).toEqual([2, 4, 6]);
  });
});
