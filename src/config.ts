import {resolve} from 'node:path'

export const biomesPath = resolve(
  '/Users/bene/dev/7d2d/map/workspace/biomes.png',
)
export const heightMapPath = resolve(
  '/Users/bene/dev/7d2d/map/workspace/dtm.png',
)
export const xmlMapPrefabsPath = resolve(
  '/Users/bene/dev/7d2d/map/prefabs-original.xml',
)
export const localPrefabsPath = resolve('/Users/bene/dev/7d2d/prefabs')
export const vanillaPrefabsPath = '/Users/bene/Library/Application Support/Steam/steamapps/common/7 Days To Die/7DaysToDie.app/Data/Prefabs'

export const mapSize = 8192

export const RANDOM_POI_NAME = 'random'
export const SKIPPED_POI_NAME = 'skipped'

export const biomeMap = {
  '90_172_94': 'pine_forest',
  '220_220_220': 'snow',
  '255_235_160': 'desert',
  '186_0_255': 'burnt_forest',
  '255_171_117': 'wasteland',
}

export const vanillaWhitelists = {
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
    'rwg_tile_',
  ],
}

export const vanillaBlacklists = {
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
}

export const socketBlacklist = [
  'property_',
  'naz_super_aircraft_carrier',
  'playpen',
  'tower_20220815_tb_1',
  'mercado',
  'bridge_',
  'canyon_',
  'deco_',
  'spawn_',
]
