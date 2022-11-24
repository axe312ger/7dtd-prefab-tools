import {expect, test} from '@oclif/test'

describe('align-to-heightmap', () => {
  test
  .stdout()
  .command(['align-to-heightmap'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['align-to-heightmap', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
