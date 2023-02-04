import {expect, test} from '@oclif/test'

describe('teragon-poi-property-list', () => {
  test
  .stdout()
  .command(['teragon-poi-property-list'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['teragon-poi-property-list', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
