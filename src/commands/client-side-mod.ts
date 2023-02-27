import {Command, Flags} from '@oclif/core'
import {readFile} from 'node:fs/promises'
import {
  readFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  accessSync,
  constants,
} from 'node:fs'
import * as StreamPromises from 'node:stream/promises'
import {join, resolve, dirname, parse} from 'node:path'

import archiver from 'archiver'
import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'

import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {loadDecorations} from '../utils/load-decorations'
import {initConfig} from '../utils/config'
import {Prefab} from '../types'

const BASE_DIR_NAME = 'SuperSmackCity - Prefabs'

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
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

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

    // Loop through
    const clientSideModPath = resolve(process.cwd(), 'client-side-mod.zip')
    const output = createWriteStream(clientSideModPath)
    const archive = archiver('zip', {
      zlib: {level: 9},
    })

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
      console.log(
        chalk.bold(
          `\nClient side mod with ${prettyBytes(
            archive.pointer(),
          )} has been created:`,
        ),
        clientSideModPath,
      )
    })

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
      console.log('Data has been drained')
    })

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err
      }
    })

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      throw err
    })

    // Progress
    archive.on('progress', function ({entries, fs}) {
      console.log(
        `${entries.processed}/${entries.total} @ ${prettyBytes(
          fs.processedBytes,
        )}/${prettyBytes(fs.totalBytes)}`,
      )
    })

    for (const prefab of prefabsToInclude.values()) {
      const {name, dir} = parse(prefab.filePath)

      const id = `${prefab.meta.PrefabSize.x}x${prefab.meta.PrefabSize.z}`
      const dummyExists = DUMMIES.has(id)

      const nim = dummyExists ?
        readFileSync(
          resolve(__dirname, '..', 'prefab-dummies', `dummy_${id}.blocks.nim`),
        ) :
        createReadStream(resolve(dir, `${name}.blocks.nim`))

      let ins = null
      try {
        const insPath = dummyExists ? resolve(__dirname, '..', 'prefab-dummies', `dummy_${id}.ins`) : resolve(dir, `${name}.ins`)

        accessSync(insPath, constants.F_OK)

        ins = createReadStream(insPath)
      } catch {
        ins = null
      }

      const tts = dummyExists ?
        readFileSync(resolve(__dirname, '..', 'prefab-dummies', `dummy_${id}.tts`)) :
        createReadStream(resolve(dir, `${name}.tts`))

      archive.append(nim, {
        name: join(BASE_DIR_NAME, name, `${name}.blocks.nim`),
      })

      if (ins) {
        archive.append(ins, {
          name: join(BASE_DIR_NAME, name, `${name}.ins`),
        })
      }

      archive.append(tts, {
        name: join(BASE_DIR_NAME, name, `${name}.tts`),
      })

      archive.append(createReadStream(resolve(dir, `${name}.xml`)), {
        name: join(BASE_DIR_NAME, name, `${name}.xml`),
      })
      archive.append(createReadStream(resolve(dir, `${name}.mesh`)), {
        name: join(BASE_DIR_NAME, name, `${name}.mesh`),
      })

      try {
        const previewImagePath = resolve(dir, `${name}.jpg`)
        accessSync(previewImagePath, constants.F_OK)

        const previewImage = createReadStream(previewImagePath)

        archive.append(previewImage, {
          name: join(BASE_DIR_NAME, name, `${name}.jpg`),
        })
      } catch {}
    }

    // Finish archive
    await archive.finalize()

    // Write to disk
    await StreamPromises.pipeline(archive, output)
  }
}
