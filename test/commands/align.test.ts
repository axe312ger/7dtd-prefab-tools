import {expect, test} from '@oclif/test'

describe('align', () => {
  test
  .stdout()
  .command(['align'])
  .it('executes', ctx => {
    expect(ctx.stdout).to.contain('prefabs-heightmap-aligned.xml')
  })
})

