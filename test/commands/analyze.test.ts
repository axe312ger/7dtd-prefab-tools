import {expect, test} from '@oclif/test'

describe('analyze', () => {
  test
  .stdout()
  .command(['analyze'])
  .it('executes', ctx => {
    expect(ctx.stdout).to.contain('There are 1597 unique POIs currently spawned on the map.')
    expect(ctx.stdout).to.contain('prefab-spawn-stats.csv')
  })
})

