import {expect, test} from '@oclif/test'

describe('populate', () => {
  test
  .stdout()
  .command(['populate'])
  .it('executes', ctx => {
    expect(ctx.stdout).to.contain('prefabs-populated.xml')
  })
})

