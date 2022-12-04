import {expect, test} from '@oclif/test'

describe('analyze', () => {
  test
  .stdout()
  .command(['analyze'])
  .it('executes', ctx => {
    expect(ctx.stdout).to.contain(
      'There are 728 unique POIs spawned in your prefabs.xml',
    )
    expect(ctx.stdout).to.contain('prefab-spawn-stats.csv')
  })
})

