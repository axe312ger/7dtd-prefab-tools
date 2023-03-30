/* eslint-disable unicorn/prefer-module */
/* eslint-disable no-await-in-loop */
import {Command} from '@oclif/core'
import {readFile} from 'node:fs/promises'
import {
  readFileSync,
  createReadStream,
  existsSync,
  accessSync,
  constants,
} from 'node:fs'
import * as FsPromises from 'node:fs/promises'
import {join, resolve, dirname, parse} from 'node:path'

import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {loadDecorations} from '../utils/load-decorations'
import {initConfig} from '../utils/config'
import {Prefab} from '../types'

const BASE_DIR_NAME = 'Client Side Mod'

const DUMMIES = new Set([
  '60x60',
  '49x63',
  '42x42',
  '35x37',
  '33x98',
  '25x25',
  '150x150',
  '141x145',
  '100x100',
])

export default class ClientSideMod extends Command {
  static description = 'Creates an folder with all prefabs that are spawned on your map. For prefabs with common sizes the block info will be replaced by dummy data. That way you provide a distant terrain client side mod to your players with minimal file size.';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath, vanillaPrefabsPath} = config

    const prefabs = await readPrefabsFromXMLs(config)
    const xml = await readFile(resolve(prefabsPath), 'utf8')
    const decorations = await loadDecorations(xml)

    const prefabsToInclude: Set<Prefab> = new Set()
    for (const decoration of decorations) {
      const prefab = prefabs.prefabsByName.get(
        decoration.name.toLocaleLowerCase(),
      )
      if (!prefab) {
        throw new Error('prefab not found' + decoration.name)
      }

      if (
        !prefab.filePath.includes(vanillaPrefabsPath) &&
        existsSync(resolve(dirname(prefab.filePath), `${prefab.name}.mesh`))
      ) {
        prefabsToInclude.add(prefab)
      }
    }

    let cnt = 0
    for (const prefab of prefabsToInclude.values()) {
      cnt++
      const {name, dir} = parse(prefab.filePath)
      console.log(`${cnt}/${prefabsToInclude.size}: ${prefab.name}`)

      const id = `${prefab.meta.PrefabSize.x}x${prefab.meta.PrefabSize.z}`
      const dummyExists = DUMMIES.has(id)

      const nim = dummyExists ?
        readFileSync(
          resolve(__dirname, '..', 'prefab-dummies', `dummy_${id}.blocks.nim`),
        ) :
        createReadStream(resolve(dir, `${name}.blocks.nim`))

      let ins = null
      try {
        const insPath = dummyExists ?
          resolve(__dirname, '..', 'prefab-dummies', `dummy_${id}.ins`) :
          resolve(dir, `${name}.ins`)

        accessSync(insPath, constants.F_OK)

        ins = createReadStream(insPath)
      } catch {
        ins = null
      }

      const tts = dummyExists ?
        readFileSync(
          resolve(__dirname, '..', 'prefab-dummies', `dummy_${id}.tts`),
        ) :
        createReadStream(resolve(dir, `${name}.tts`))

      const targetDir = join(process.cwd(), BASE_DIR_NAME, name)
      await FsPromises.mkdir(targetDir, {recursive: true})

      await FsPromises.writeFile(join(targetDir, `${name}.blocks.nim`), nim)

      if (ins) {
        await FsPromises.writeFile(join(targetDir, `${name}.ins`), ins)
      }

      await FsPromises.writeFile(join(targetDir, `${name}.tts`), tts)

      await FsPromises.writeFile(join(targetDir, `${name}.xml`), createReadStream(resolve(dir, `${name}.xml`)))
      await FsPromises.writeFile(join(targetDir, `${name}.mesh`), createReadStream(resolve(dir, `${name}.mesh`)))

      try {
        const previewImagePath = resolve(dir, `${name}.jpg`)
        accessSync(previewImagePath, constants.F_OK)

        const previewImage = createReadStream(previewImagePath)

        await FsPromises.writeFile(join(targetDir, `${name}.jpg`), previewImage)
      } catch {}
    }

    console.log(
      `Done. A folder with all our maps prefabs, optimized for size, can be found here: ${join(
        process.cwd(),
        BASE_DIR_NAME,
      )}`,
    )
  }
}
