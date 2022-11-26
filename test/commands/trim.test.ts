import {expect, test} from '@oclif/test'

describe('trim', () => {
  test
  .stdout()
  .command(['trim'])
  .it('executes', ctx => {
    console.log(ctx.stdout)
    expect(ctx.stdout).to.contain('prefabs-trimmed.xml')
  })
})

