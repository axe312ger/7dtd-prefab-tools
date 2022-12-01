import {readFile, writeFile, access} from 'node:fs/promises'
import fs from 'node:fs'
import os from 'node:os'
import {resolve} from 'node:path'
import * as inquirer from 'inquirer'
import {PrefabToolsConfig} from '../types'

export async function initConfig(): Promise<PrefabToolsConfig> {
  const currentDir = process.cwd()
  const configPath = resolve(currentDir, 'prefab-tools.json')
  // check if prefab-tools.json exists
  try {
    await access(configPath, fs.constants.R_OK)
    // load and return existing config file
    const configContent = await readFile(configPath)
    console.log(`Loading existing config file from ${configPath}`)
    return JSON.parse(configContent.toString()) as PrefabToolsConfig
  } catch {
    // otherwise ask user for paths and create a config file:
    const responses: any = await inquirer.prompt([
      {
        name: 'prefabsPath',
        message: 'Path to prefabs.xml:',
        type: 'input',
        default: resolve(currentDir, 'prefabs.xml'),
      },
      {
        name: 'biomesPath',
        message: 'Path to biomes.png:',
        type: 'input',
        default: resolve(currentDir, 'workspace', 'biomes.png'),
      },
      {
        name: 'heightMapPath',
        message: 'Path to dtm.png (heightmap):',
        type: 'input',
        default: resolve(currentDir, 'workspace', 'dtm.png'),
      },
      {
        name: 'mapSize',
        message: 'The maximum dimension of the map:',
        type: 'list',
        choices: [
          6144,
          8192,
          10_240,
          5120,
          7168,
          9216,
          11_264,
          12_288,
          13_312,
          14_366,
          15_360,
        ],
      },
      {
        name: 'vanillaPrefabsPath',
        message:
          'Path to your 7 Days To Die game directory (to locate vanilla prefabs):',
        type: 'input',
        default: resolve(
          os.homedir(),
          'Library/Application Support/Steam/steamapps/common/7 Days To Die/7DaysToDie.app/Data/Prefabs',
        ),
      },
    ])

    const additionalPrefabsPaths = []
    let hasPath = true

    while (hasPath) {
      // eslint-disable-next-line no-await-in-loop
      const additionalResponses = await inquirer.prompt([
        {
          name: 'additionalPrefabsPath',
          message:
            'Additional prefabs directory. For example LocalPrefabs or some mods: (Press enter twice to continue)',
          type: 'input',
        },
      ])

      const res = additionalResponses.additionalPrefabsPath.trim()
      hasPath = res.length > 0
      if (hasPath) {
        additionalPrefabsPaths.push(res)
      }
    }

    const config = {
      ...responses,
      additionalPrefabsPaths,
      ...defaultConfig,
    } as PrefabToolsConfig
    await writeFile(configPath, JSON.stringify(config, null, 2))
    console.log(`Created new config file at ${configPath}`)
    return config
  }
}

export const defaultConfig: Partial<PrefabToolsConfig> = {
  biomeMap: {
    '0_64_0': 'pine_forest',
    '255_255_255': 'snow',
    '255_228_119': 'desert',
    '186_0_255': 'burnt_forest',
    '255_168_0': 'wasteland',
  },
  biomeTierMap: {
    // eslint-disable-next-line camelcase
    pine_forest: [1, 2, 3, 4, 5],
    snow: [1, 2, 3, 4, 5],
    desert: [1, 2, 3, 4, 5],
    // eslint-disable-next-line camelcase
    burnt_forest: [1, 2, 3, 4, 5],
    wasteland: [1, 2, 3, 4, 5],
  },
  markerSizeDifferenceMax: 0.02,
  distances: {
    default: 400,
    wilderness: 3000,
    trader: 2000,
  },
  vanillaWhitelists: {
    wasteland: [
      'abandoned_house',
      'bombshelter',
      'cave',
      'countrytown_business_06',
      'downtown_building',
      'downtown_filler_12',
      'downtown_filler_13',
      'downtown_filler_14',
      'downtown_filler_15',
      'downtown_filler_31',
      'downtown_filler_park',
      'football_stadium',
      'funeral_home',
      'house_burnt',
      'junkyard',
      'lot_downtown',
      'lot_industrial',
      'park',
      'parking_lot',
      'remnant',
      'rubble',
      'trader',
      'waste',
      'warehouse_05',
      'warehouse_06',
    ],
  },
  vanillaBlacklists: {
    // eslint-disable-next-line camelcase
    pine_forest: [
      'abandoned_house',
      'downtown_building',
      'downtown_filler_12',
      'downtown_filler_13',
      'downtown_filler_14',
      'downtown_filler_15',
      'countrytown_business_06',
      'downtown_filler_31',
      'house_burnt',
      'rubble',
      'waste',
      'warehouse_05',
      'warehouse_06',
      'oldwest',
    ],
    desert: [
      'downtown_building',
      'downtown_filler_12',
      'downtown_filler_13',
      'downtown_filler_14',
      'downtown_filler_15',
      'downtown_filler_31',
      'countrytown_business_06',
      'house_burnt',
      'rubble',
      'waste',
      'warehouse_05',
      'warehouse_06',
    ],
    snow: [
      'rubble',
      'house_burnt',
      'remnant',
      'rubble',
      'waste',
      'oldwest',
      'countrytown_business_06',
    ],
    wasteland: ['rwg_tile_oldwest'],
  },
  socketBlacklist: [
    'bridge_',
    'canyon_',
    'deco_',
    'spawn_',
    'rwg_tile_oldwest_',
  ],
}
