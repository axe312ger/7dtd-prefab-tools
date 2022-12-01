import {CliUx, Command} from '@oclif/core'
import {readFile, writeFile, access} from 'node:fs/promises'
import fs from 'node:fs'
import {resolve, parse} from 'node:path'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {loadDecorations} from '../utils/load-decorations'
import {initConfig} from '../utils/config'
import {Prefab} from '../types'
import {getBiomeForPosition, loadImageViaJimp} from '../utils/pixel-data'
import chalk from 'chalk'

async function analyzePrefabs(validPrefabsByName: Map<string, Prefab>) {
  const errorPrefabs: Set<{ prefab: Prefab; errors: string[] }> = new Set()
  const validPrefabsBySize: Map<string, Prefab[]> = new Map()
  const uniqueValues: Map<
    'zones' | 'tags' | 'townships' | 'biomes',
    Set<string>
  > = new Map([
    ['zones', new Set()],
    ['tags', new Set()],
    ['townships', new Set()],
    ['biomes', new Set()],
  ])
  for await (const prefab of validPrefabsByName.values()) {
    const prefabSizeId = `${prefab.meta.PrefabSize.x}x${prefab.meta.PrefabSize.z}`

    // Gather issues/warnings/errors about prefabs

    // 1. output list of prefabs without distant mesh!
    const errors: string[] = []
    try {
      const {dir, base} = parse(prefab.filePath)
      await access(resolve(dir, `${base}.mesh`), fs.constants.R_OK)
    } catch {
      errors.push('Distant mesh file is missing (.mesh)')
    }

    if (prefab.meta.zoning.length === 0) {
      errors.push('Spawns in all zones')
    }

    if (prefab.meta.allowedTownships.length === 0) {
      errors.push('Spawns in all townships')
    }

    if (prefab.meta.allowedBiomes.length === 0) {
      errors.push('Spawns in all biomes')
    }

    // @todo show prefabs without quest
    // @todo can we find prefabs with broken quests?

    if (errors.length > 0) {
      errorPrefabs.add({prefab, errors})
    }

    // Gather unique values for certain prefab attributes
    uniqueValues.set(
      'tags',
      new Set([...(uniqueValues.get('tags') || new Set()), ...prefab.meta.tags]),
    )
    uniqueValues.set(
      'zones',
      new Set([
        ...(uniqueValues.get('zones') || new Set()),
        ...prefab.meta.zoning,
      ]),
    )
    uniqueValues.set(
      'townships',
      new Set([
        ...(uniqueValues.get('townships') || new Set()),
        ...prefab.meta.allowedTownships,
      ]),
    )
    uniqueValues.set(
      'biomes',
      new Set([
        ...(uniqueValues.get('biomes') || new Set()),
        ...prefab.meta.allowedBiomes,
      ]),
    )

    // prefabs by size for POISpawn marker analysis
    const prefabList = validPrefabsBySize.get(prefabSizeId)
    if (prefabList) {
      validPrefabsBySize.set(prefabSizeId, [...prefabList, prefab])
    } else {
      validPrefabsBySize.set(prefabSizeId, [prefab])
    }
  }

  const prefabsErrorTableData = []
  for (const prefabErrorInfo of errorPrefabs.values()) {
    prefabsErrorTableData.push({
      name: prefabErrorInfo.prefab.name,
      errors: prefabErrorInfo.errors.join(',\n'),
    })
  }

  return {prefabsErrorTableData, validPrefabsBySize, uniqueValues}
}

export default class Analyze extends Command {
  static description =
    'Analyze your maps prefabs.xml and get detailed stats about your spawned POIs';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static args = [{name: 'file'}];

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath, vanillaPrefabsPath, biomesPath} = config
    // const name = flags.name ?? 'world'
    // this.log(`hello ${name} from /Users/bene/dev/7d2d/prefab-tools/src/commands/analyze.ts`)
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }

    const prefabs = await readPrefabsFromXMLs(config)
    const xml = await readFile(resolve(prefabsPath), 'utf8')
    const decorations = await loadDecorations(xml)
    const biomesImage = await loadImageViaJimp(biomesPath)

    CliUx.ux.action.start('Analyzing your prefabs and prefabs.xml')

    const {prefabsErrorTableData, validPrefabsBySize, uniqueValues} =
      await analyzePrefabs(prefabs.validPrefabsByName)

    const biomePrefabs: Map<string, Prefab[]> = new Map()
    const poiSpawnMarkerMap: Map<string, Prefab[]> = new Map()
    let tilesCount = 0
    for (const decoration of decorations) {
      const prefabId = decoration.name.toLocaleLowerCase()
      const prefabData = prefabs.validPrefabsByName.get(prefabId)
      if (!prefabData) {
        continue
      }

      // Check by biome
      const biome = getBiomeForPosition(
        decoration.position,
        biomesImage,
        config,
      )
      const biomePrefabList = biomePrefabs.get(biome)
      if (biomePrefabList) {
        biomePrefabs.set(biome, [...biomePrefabList, prefabData])
      } else {
        biomePrefabs.set(biome, [prefabData])
      }

      // Count types
      if (prefabData.meta.isTile) {
        tilesCount += 1
      }

      // Analyze POI spawn markers
      if (prefabData.meta.markers) {
        for (const marker of prefabData.meta.markers) {
          if (marker.Type === 'POISpawn') {
            const markerId = `${marker.Size.x}x${marker.Size.z}`
            const markerStats = poiSpawnMarkerMap.get(markerId)
            if (markerStats) {
              poiSpawnMarkerMap.set(markerId, [...markerStats, prefabData])
            } else {
              poiSpawnMarkerMap.set(markerId, [prefabData])
            }
          }
        }
      }
    }

    const markerTableData = []
    for (const markerInfo of poiSpawnMarkerMap.entries()) {
      markerTableData.push({
        size: markerInfo[0],
        count: markerInfo[1].length,
        prefabs: validPrefabsBySize.get(markerInfo[0])?.length || 0,
        tiles: [...new Set(markerInfo[1].map(prefab => prefab.name))]
        .sort()
        .join(', '),
      })
    }

    const biomesTableData = []
    for (const biomeInfo of biomePrefabs.entries()) {
      biomesTableData.push({
        biome: biomeInfo[0],
        count: biomeInfo[1].length,
      })
    }

    // Output prefab placement stats as CSV
    const prefabStats = [...prefabs.validPrefabsByName.entries()]
    .filter(
      ([k]) =>
        !k.includes('part_') &&
          !k.includes('deco') &&
          !k.toLowerCase().includes('aaa_'),
    )
    // Inject extra information
    .map(([k, v]) => {
      const count = decorations.filter(
        d => d.name.toLocaleLowerCase() === k.toLocaleLowerCase(),
      ).length
      const data = {...v, count}
      return data
    })
    // Sort
    .sort((d, d2) => {
      const count = d2.count - d.count
      if (count !== 0) {
        return count
      }

      return d.name.localeCompare(d2.name)
    })

    // Turn to CSV array
    const csvData = prefabStats
    .map(d =>
      [
        d.name,
        d.count,
        d.meta.difficultyTier,
        [d.meta.PrefabSize.x, d.meta.PrefabSize.z].join('x'),
        d.meta.PrefabSize.x,
        d.meta.PrefabSize.y,
        d.meta.PrefabSize.z,
        d.meta.allowedBiomes.join(', '),
        d.meta.allowedTownships.join(', '),
        d.meta.zoning.join(', '),
        d.meta.isTile,
        d.meta.isTrader,
        d.meta.isWilderness,
        d.filePath.includes(vanillaPrefabsPath),
        d.meta.tags.join(', '),
      ].join(';'),
    )
    .filter(Boolean)

    CliUx.ux.action.stop()

    // Prefabs DATA LOGGING
    console.log(chalk.green('\nAnalysis of your configured prefabs:\n'))

    console.log(`Total Prefabs: ${prefabs.prefabsByName.size}`)
    console.log(`Valid/Spawnable Prefabs: ${prefabs.validPrefabsByName.size}`)

    console.log(chalk.bold('\nUnique values for tags:'))
    console.log([...(uniqueValues.get('tags') || [])].join(', '))
    console.log(chalk.bold('\nUnique values for zones:'))
    console.log([...(uniqueValues.get('zones') || [])].join(', '))
    console.log(chalk.bold('\nUnique values for townships:'))
    console.log([...(uniqueValues.get('townships') || [])].join(', '))
    console.log(chalk.bold('\nUnique values for biomes:'))
    console.log([...(uniqueValues.get('biomes') || [])].join(', '))

    if (prefabsErrorTableData.length > 0) {
      console.log(chalk.bold('\nPrefabs with issues:'))
      CliUx.ux.table(prefabsErrorTableData, {
        name: {
          header: 'Prefab',
        },
        errors: {
          header: 'Issues / Warnings / Errors',
        },
      })
    }

    console.log(chalk.green('\nAnalysis of prefab.xml:\n'))
    console.log(
      `There are ${
        prefabStats.filter(v => v.count > 0).length
      } unique POIs spawned in your prefabs.xml`,
    )
    console.log(`Number of tiles: ${tilesCount}`)
    console.log(chalk.bold('\nList of POI markers:'))
    CliUx.ux.table(
      markerTableData.sort((a, b) => a.size.localeCompare(b.size)),
      {
        size: {
          header: 'Marker Size',
        },
        count: {
          header: 'Total Count', // override column header
          minWidth: 3, // column must display at this width or greater
        },
        prefabs: {
          header: 'Fitting prefabs',
          get: (row: { count: number; prefabs: number }) =>
            row.prefabs > row.count ? chalk.red(row.prefabs) : row.prefabs, // custom getter for data row object
        },
        tiles: {
          header: 'Tiles with marker',
        },
      },
    )

    console.log(chalk.bold('\nPrefabs per biome:'))
    CliUx.ux.table(
      biomesTableData.sort((a, b) => a.biome.localeCompare(b.biome)),
      {
        biome: {
          header: 'Biome',
        },
        count: {
          header: 'Total Count', // override column header
          minWidth: 3, // column must display at this width or greater
        },
      },
    )

    const statsPath = resolve(process.cwd(), 'prefab-spawn-stats.csv')
    await writeFile(
      statsPath,
      [
        'name;count;difficulty;size;size_x;size_y;size_z;biomes;townships;zones;isTile;isTrader;isWilderness;isVanilla;tags',
        ...csvData,
      ].join('\n'),
    )
    console.log(
      chalk.bold(
        '\nDetailed statistics of your spawned prefabs is written to:',
      ),
      statsPath,
    )
  }
}
