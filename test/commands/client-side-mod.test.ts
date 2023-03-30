import {expect, test} from '@oclif/test'

describe('client-side-mod', () => {
  test
  .stdout()
  .command(['client-side-mod'])
  .it('executes', ctx => {
    expect(ctx.stdout).to.contain(
      'Done. A folder with all our maps prefabs, optimized for size, can be found here',
    )
  })
})
