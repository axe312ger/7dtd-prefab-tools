import {expect, test} from '@oclif/test'

describe('trim', () => {
  test
  .stdout()
  .command(['trim'])
  .it('executes', ctx => {
    expect(ctx.stdout).to.contain('prefabs-trimmed.xml')
  })
})

