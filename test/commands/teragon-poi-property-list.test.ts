import {expect, test} from '@oclif/test'

describe('teragon-poi-property-list', () => {
  test
  .stdout()
  .command(['teragon-poi-property-list'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain(
      'Your Teragon prefab list has been written to',
    )
  })
})
