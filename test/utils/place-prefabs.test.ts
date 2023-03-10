import {expect} from '@oclif/test'
import chai from 'chai'
import {jestSnapshotPlugin} from 'mocha-chai-jest-snapshot'

import {readPrefabsFromXMLs} from '../../src/utils/read-prefabs'
import {spawnPOI} from '../../src/utils/place-prefabs'
import {Prefab, PrefabToolsConfig} from '../../src/types'

chai.use(jestSnapshotPlugin())

import {Vector3} from 'three'
import {initConfig} from '../../src/utils/config'
import {MapHelper} from '../../src/utils/map-helper'
import {createDecorationBox} from '../../src/utils/utils'

describe('spawn POI markers', () => {
  let prefabs: {
    prefabsByName: Map<string, Prefab>;
    validPrefabsByName: Map<string, Prefab>;
  }
  let prefabCounter: Map<string, number>
  let config: PrefabToolsConfig
  let mapHelper: MapHelper

  before(async () => {
    config = await initConfig()
    prefabs = await readPrefabsFromXMLs(config)
    prefabCounter = new Map()
    mapHelper = new MapHelper(config)
  })

  beforeEach(() => {
    mapHelper.getBiomeForPosition = () => 'pine_forest'
    mapHelper.getHeightForPosition = () => 37
  })

  it('vanilla pregenerated - rwg_tile_rural_t rotation 1', async () => {
    mapHelper.getHeightForPosition = () => 45
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('rwg_tile_rural_t')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(1769, 40, 1313)
    const rotation = 1

    const prefabFixtures: Map<string, Prefab> = new Map()
    const prefabFixtureList = ['rwg_tile_rural_t',
      'lot_rural_filler_04',
      'lot_rural_filler_05',
      'rural_church_01',
      'part_driveway_rural_04',
      'house_old_ranch_01',
      'part_driveway_rural_02']

    for (const prefabName of prefabFixtureList) {
      const prefabFixture = prefabs.validPrefabsByName.get(prefabName)
      if (!prefabFixture) {
        throw new Error('Unable to find POI')
      }

      prefabFixtures.set(prefabName, prefabFixture)
    }

    const res = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabFixtures,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    const socketDeco = res[0]
    const socketPrefab = prefabs.validPrefabsByName.get(socketDeco.name.toLocaleLowerCase())
    if (!socketPrefab) {
      throw new Error('Unable to find POI')
    }

    expect(socketDeco).to.deep.equal({
      name: 'rwg_tile_rural_t',
      position,
      rotation,
    })

    const socketBox = createDecorationBox(socketDeco, socketPrefab)
    const resNoParts = res.filter(res => res.name.indexOf('part_') !== 0)

    const expectedPrefabRotations =
    [1, 0, 0, 2, 2]

    for (const [i, rotation] of expectedPrefabRotations.entries()) {
      expect(resNoParts[i].rotation, `${resNoParts[i].name} rotation`).to.equal(rotation)
    }

    // These should pass as soon rotation is fine!
    for (const [i, resDeco] of res.entries()) {
      const resDecoPrefab = prefabs.validPrefabsByName.get(resDeco.name.toLocaleLowerCase())
      if (!resDecoPrefab) {
        throw new Error('Unable to find POI')
      }

      const decoBox = createDecorationBox(resDeco, resDecoPrefab)
      expect(
        socketBox.intersectsBox(decoBox),
        `${
          resDecoPrefab.name
        }@${i} does not overlap with socket:\n${JSON.stringify({
          socketBox,
          decoBox,
        })}`,
      ).to.be.true
    }
  })

  it('vanilla pregenerated - farm_05 rotation 1', async () => {
    mapHelper.getHeightForPosition = () => 45
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_05')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(1627, 41, 1314)
    const rotation = 1
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_05', position, rotation},
      {
        name: 'part_driveway_rural_03',
        position: new Vector3(1687, 44, 1352),
        rotation: 1,
      },
    ])
  })

  it('vanilla pregenerated - farm_08 rotation 2', async () => {
    mapHelper.getHeightForPosition = () => 44
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_08')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-689, 38, 417)
    const rotation = 2
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_08', position, rotation},
      {
        name: 'part_farm60_field_01',
        position: new Vector3(-688, 43, 444),
        rotation: 1,
      },
      {
        name: 'part_driveway_rural_02',
        position: new Vector3(-654, 43, 477),
        rotation: 2,
      },
    ])
  })

  it('vanilla pregenerated - farm_12 rotation 3', async () => {
    mapHelper.getHeightForPosition = () => 44
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_12')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-689, 42, 498)
    const rotation = 3
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_12', position, rotation},
      {
        name: 'part_farm60_field_04',
        position: new Vector3(-688, 43, 499),
        rotation: 2,
      },
      {
        name: 'part_dumpster',
        position: new Vector3(-653, 44, 524),
        rotation: 0,
      },
      {
        name: 'part_driveway_rural_12',
        position: new Vector3(-692, 43, 532),
        rotation: 3,
      },
    ])
  })

  //   <decoration type="model" name="farm_02" position="2070,39,1695" rotation="0"/>
  // <decoration type="model" name="part_chicken_coup_01" position="2095,44,1747" rotation="0"/>
  // <decoration type="model" name="part_driveway_rural_01" position="2120,44,1692" rotation="0"/>
  // <decoration type="model" name="part_driveway_rural_03" position="2073,44,1692" rotation="0"/>

  it('vanilla pregenerated - farm_02 rotation 0', async () => {
    mapHelper.getHeightForPosition = () => 45
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_02')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(2070, 39, 1695)
    const rotation = 0
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_02', position, rotation},
      {
        name: 'part_chicken_coup_01',
        position: new Vector3(2095, 44, 1747),
        rotation: 0,
      },
      {
        name: 'part_driveway_rural_01',
        position: new Vector3(2120, 44, 1692),
        rotation: 0,
      },
      {
        name: 'part_driveway_rural_03',
        position: new Vector3(2073, 44, 1692),
        rotation: 0,
      },
    ])
  })

  it('farm_12 rotation 0', async () => {
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_12')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-732, 35, -405)
    const rotation = 0
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_12', position: new Vector3(-732, 35, -405), rotation: 0},
      {
        name: 'part_farm60_field_04',
        position: new Vector3(-706, 36, -404),
        rotation: 3,
      },
      {
        name: 'part_dumpster',
        position: new Vector3(-704, 37, -369),
        rotation: 1,
      },
      {
        name: 'part_driveway_rural_12',
        position: new Vector3(-713, 36, -408),
        rotation: 0,
      },
    ])
  })

  it('farm_12 rotation 2', async () => {
    mapHelper.getHeightForPosition = () => 41
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_12')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(2305, 39, 1236)
    const rotation = 2
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_12', position: new Vector3(2305, 39, 1236), rotation: 2},
      {
        name: 'part_farm60_field_04',
        position: new Vector3(2306, 40, 1262),
        rotation: 1,
      },
      {
        name: 'part_dumpster',
        position: new Vector3(2331, 41, 1256),
        rotation: 3,
      },
      {
        name: 'part_driveway_rural_12',
        position: new Vector3(2339, 40, 1296),
        rotation: 2,
      },
    ])
  })

  it('farm_12 rotation 3', async () => {
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_12')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-944, 35, -1820)
    const rotation = 3
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_12', position: new Vector3(-944, 35, -1820), rotation: 3},
      {
        name: 'part_farm60_field_04',
        position: new Vector3(-943, 36, -1819),
        rotation: 2,
      },
      {
        name: 'part_dumpster',
        position: new Vector3(-908, 37, -1794),
        rotation: 0,
      },
      {
        name: 'part_driveway_rural_12',
        position: new Vector3(-947, 36, -1786),
        rotation: 3,
      },
    ])
  })

  it('farm_12 rotation 1', async () => {
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('farm_12')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(2857, 35, -2457)
    const rotation = 1
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {name: 'farm_12', position: new Vector3(2857, 35, -2457), rotation: 1},
      {
        // 2857 + start.z
        name: 'part_farm60_field_04',
        position: new Vector3(2883, 36, -2431),
        rotation: 0,
      },
      {
        name: 'part_dumpster',
        position: new Vector3(2877, 37, -2429),
        rotation: 2,
      },
      {
        name: 'part_driveway_rural_12',
        position: new Vector3(2917, 36, -2438),
        rotation: 1,
      },
    ])
  })

  it('house_old_ranch_01 rotation 3', async () => {
    mapHelper.getHeightForPosition = () => 36
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('house_old_ranch_01')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-2950, 35, 2021)
    const rotation = 3
    expect(
      spawnPOI(
        mapHelper,
        position,
        rotation,
        prefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        prefab,
        prefabCounter,
        config,
      ),
    ).to.deep.equal([
      {
        name: 'house_old_ranch_01',
        position: new Vector3(-2950, 35, 2021),
        rotation: 3,
      },
      {
        name: 'part_driveway_rural_02',
        position: new Vector3(-2953, 35, 2037),
        rotation: 3,
      },
      {
        name: 'part_driveway_rural_02',
        position: new Vector3(-2953, 35, 2056),
        rotation: 3,
      },
    ])
  })

  it('zztong_Farm_04 rotation 3', async () => {
    mapHelper.getHeightForPosition = () => 36
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('zztong_farm_04')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-2022, 31, 2890)
    const rotation = 3
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )
    expect(decorations[0]).to.deep.equal({
      name: 'zztong_Farm_04',
      position: new Vector3(-2022, 31, 2890),
      rotation: 3,
    })
    expect(decorations[1]).to.deep.equal({
      name: 'part_driveway_rural_09',
      position: new Vector3(-2024, 35, 2925),
      rotation: 3,
    })
  })

  it('rwg_tile_commercial_intersection rotation 0', async () => {
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get(
      'rwg_tile_commercial_intersection',
    )
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-1476, 35, -1752)
    const rotation = 0
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_commercial_intersection',
      position: new Vector3(-1476, 35, -1752),
      rotation: 0,
    })

    // Random POIs
    const randomPOI1 = prefabs.validPrefabsByName.get(
      decorations[1].name.toLocaleLowerCase(),
    )
    if (!randomPOI1) {
      throw new Error('Unable to find random POI from decoration')
    }

    expect(
      decorations[1].position.y + prefab.meta.YOffset - randomPOI1.meta.YOffset,
    ).to.equal(35)
  })

  it('rwg_tile_commercial_intersection rotation 2', async () => {
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get(
      'rwg_tile_commercial_intersection',
    )
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(416, 35, 2374)
    const rotation = 2
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_commercial_intersection',
      position: new Vector3(416, 35, 2374),
      rotation: 2,
    })
  })

  it('rwg_tile_commercial_intersection rotation 1', async () => {
    mapHelper.getHeightForPosition = () => 36
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get(
      'rwg_tile_commercial_intersection',
    )
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-2732, 34, 1570)
    const rotation = 1
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_commercial_intersection',
      position: new Vector3(-2732, 34, 1570),
      rotation: 1,
    })

    // Random POIs
    // const {pois, parts} = decorations.reduce<{
    //   pois: Decoration[];
    //   parts: Decoration[];
    // }>(
    //   (acc, decoration) => {
    //     if (decoration.name.startsWith('part_')) {
    //       acc.parts.push(decoration)
    //     } else {
    //       acc.pois.push(decoration)
    //     }

    //     return acc
    //   },
    //   {pois: [], parts: []},
    // )
    // @todo more tests here?
  })

  it('rwg_tile_commercial_intersection_ghost rotation 3 test tag filtering', async () => {
    mapHelper.getBiomeForPosition = () => 'desert'
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get(
      'rwg_tile_commercial_intersection_ghost',
    )
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(1476, 25, -1602)
    const rotation = 3
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_commercial_intersection_ghost',
      position: new Vector3(1476, 25, -1602),
      rotation: 3,
    })

    // Check if it spawns the ghost busters building in slot 1
    if (!prefab.meta.markers) {
      throw new Error('this should have markers')
    }

    expect(prefab.meta.markers[0].Tags).includes('ghostbusters')
    const ghostPrefab = prefabs.validPrefabsByName.get(
      decorations[1].name.toLocaleLowerCase(),
    )
    if (!ghostPrefab) {
      throw new Error('This tile should have spawned a POI at marker #1')
    }

    expect(ghostPrefab.meta.tags).includes('ghostbusters')
  })

  it('rwg_tile_oldwest_corner to test old west city', async () => {
    mapHelper.getBiomeForPosition = () => 'desert'
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('rwg_tile_oldwest_corner')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(1476, 25, -1602)
    const rotation = 3
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_oldwest_corner',
      position: new Vector3(1476, 35, -1602),
      rotation: 3,
    })

    for (const decoration of decorations.slice(1, -1)) {
      const decorationPrefab = prefabs.prefabsByName.get(
        decoration.name.toLocaleLowerCase(),
      )
      if (!decorationPrefab) {
        throw new Error('Where is the prefab?')
      }

      if (
        !(
          decorationPrefab.meta.tags.includes('part') ||
          decorationPrefab.name.indexOf('part_') === 0
        )
      ) {
        expect(decorationPrefab.meta.allowedTownships).to.include('oldwest')
      }
    }
  })

  it('rwg_tile_oldwest_corner with rotation test for 25x50 marker', async () => {
    mapHelper.getBiomeForPosition = () => 'desert'
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('rwg_tile_oldwest_corner')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-638, 35, 211)
    const rotation = 0
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_oldwest_corner',
      position: new Vector3(-638, 35, 211),
      rotation: 0,
    })

    const decoration = decorations[1]

    //   {
    //   Start: Vector3 { x: 46, y: 2, z: 25 },
    //   Size: Vector3 { x: 25, y: 0, z: 50 },
    //   Type: 'POISpawn',
    //   Group: '1',
    //   Tags: [],
    //   PartToSpawn: '',
    //   PartRotation: 3,
    //   PartSpawnChance: 1
    // },

    // console.log({markers: prefab.meta.markers && prefab.meta.markers[0], decoration})

    const decorationPrefab = prefabs.prefabsByName.get(
      decoration.name.toLocaleLowerCase(),
    )
    if (!decorationPrefab) {
      throw new Error('Where is the prefab?')
    }

    expect(decoration.rotation).to.equal(1)
  })

  it('rwg_tile_oldwest_t with rotation test for 25x50 marker', async () => {
    mapHelper.getBiomeForPosition = () => 'desert'
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('rwg_tile_oldwest_t')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-423, 36, 80)
    const rotation = 2
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_oldwest_t',
      position: new Vector3(-423, 36, 80),
      rotation: 2,
    })

    const decoration = decorations[1]

    // console.log({markers: prefab.meta.markers && prefab.meta.markers[0], decoration})

    // {
    //   Start: Vector3 { x: 79, y: 1, z: 79 },
    //   Size: Vector3 { x: 25, y: 0, z: 50 },
    //   Type: 'POISpawn',
    //   Group: '1',
    //   Tags: [],
    //   PartToSpawn: '',
    //   PartRotation: 1,
    //   PartSpawnChance: 1
    // },

    const decorationPrefab = prefabs.prefabsByName.get(
      decoration.name.toLocaleLowerCase(),
    )
    if (!decorationPrefab) {
      throw new Error('Where is the prefab?')
    }

    expect(decoration.rotation).to.equal(1)
  })

  it('rwg_tile_gateway_cap that had issues', async () => {
    mapHelper.getBiomeForPosition = () => 'snow'
    const distanceMap: Map<string, Vector3[]> = new Map()
    const prefab = prefabs.validPrefabsByName.get('rwg_tile_gateway_cap')
    if (!prefab) {
      throw new Error('Unable to find POI')
    }

    const position = new Vector3(-1176, 92, -1452)
    const rotation = 3
    const decorations = spawnPOI(
      mapHelper,
      position,
      rotation,
      prefab,
      prefabs.prefabsByName,
      prefabs.validPrefabsByName,
      distanceMap,
      prefab,
      prefabCounter,
      config,
    )

    expect(decorations[0]).to.deep.equal({
      name: 'rwg_tile_gateway_cap',
      position: new Vector3(-1176, 34, -1452),
      rotation: 3,
    })

    // @todo expect hat one trader spawned
    expect(
      decorations.slice(1, -1).some(decoration => {
        const decorationPrefab = prefabs.prefabsByName.get(
          decoration.name.toLocaleLowerCase(),
        )
        if (!decorationPrefab) {
          throw new Error('Where is the prefab?')
        }

        return decorationPrefab.meta.isTrader
      }),
    )
  })
})
