import {expect, test} from '@oclif/test'

describe('client-side-mod', () => {
  test
  .stdout()
  .command(['client-side-mod'])
  .it('executes', ctx => {
    expect(ctx.stdout).to.contain('lient side mod with')
  })
})
