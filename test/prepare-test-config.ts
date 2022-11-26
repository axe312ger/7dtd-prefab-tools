import {rename, writeFile, access} from 'node:fs/promises'
import fs from 'node:fs'
import {resolve} from 'node:path'

import {defaultConfig} from '../src/utils/config'
import {PrefabToolsConfig} from '../src/types'

async function initTestConfig(): Promise<void> {
  const currentDir = process.cwd()
  const configPath = resolve(currentDir, 'prefab-tools.json')

  try {
    await access(configPath, fs.constants.R_OK)
    await rename(configPath, resolve(currentDir, `prefab-tools-backup-${Date.now()}.json`))
  } catch {
    const config = {
      vanillaPrefabsPath: resolve(currentDir, 'test', 'fixtures', 'prefabs', 'vanilla'),
      additionalPrefabsPaths: [resolve(currentDir, 'test', 'fixtures', 'prefabs', 'ul'), resolve(currentDir, 'test', 'fixtures', 'prefabs', 'custom')],
      biomesPath: resolve(currentDir, 'test', 'fixtures', 'biomes.png'),
      heightMapPath: resolve(currentDir, 'test', 'fixtures', 'dtm.png'),
      prefabsPath: resolve(currentDir, 'test', 'fixtures', 'prefabs.xml'),
      mapSize: 6144,
      ...defaultConfig,
    } as PrefabToolsConfig

    await writeFile(configPath, JSON.stringify(config, null, 2))
  }
}

initTestConfig()
