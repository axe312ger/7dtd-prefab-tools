import {expect, test} from '@oclif/test'

describe('align-to-heightmap', () => {
  test
  .stdout()
  .command(['align-to-heightmap'])
  .it('executes', ctx => {
    console.log(ctx.stdout)
    expect(ctx.stdout).to.contain('prefabs-heightmap-aligned.xml')
  })
})

