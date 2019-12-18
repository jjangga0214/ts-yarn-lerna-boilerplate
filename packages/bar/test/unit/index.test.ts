import { run } from '@jjangga0214/bar';

describe('index', () => {
  it('run', () => {
    expect.hasAssertions();
    expect(run()).toEqual([2, 4, 6]);
  });
});
