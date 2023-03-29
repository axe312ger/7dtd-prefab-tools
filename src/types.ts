import {Vector3} from 'three'

export interface PrefabXMLData {
  [key: string]: string
}

export interface Prefab {
  name: string
  filePath: string
  prefabData: PrefabXMLData
  meta: POIMeta
}

export interface POIMarker {
  Size: Vector3
  Start: Vector3
  Group: string
  Tags: string[]
  Type: string
  PartToSpawn: string
  PartRotation: number
  PartSpawnChance: number
}

export interface POIMeta {
  zoning: string[];
  allowedBiomes: string[];
  allowedTownships: string[];
  difficultyTier: number;
  markers?: POIMarker[];
  markerGroups?: Map<string, Set<POIMarker>>;
  markerGroupsOrder?: string[];
  PrefabSize: Vector3;
  RotationToFaceNorth: number;
  YOffset: number;
  isTrader: boolean;
  isTile: boolean;
  isWilderness: boolean;
  tags: string[];
  tileType?: string
  tilePattern?: string;
}

export interface Decoration {
  name: string
  position: Vector3
  rotation: number
  guessedZone?: string
  guessedTownship?: string
  zoning?: string
  allowedTownships?: string
  isWilderness?: boolean
  spawnedDecorations?: Decoration[]
}

export type Prefabs = Map<string, Prefab>

export interface PrefabToolsConfig {
  vanillaPrefabsPath: string;
  additionalPrefabsPaths: string[];
  biomesPath: string;
  heightMapPath: string;
  prefabsPath: string;
  mapSize: number;
  biomeMap: { [key: string]: string };
  prefabWhitelists: { [key: string]: string[] };
  prefabBlacklists: { [key: string]: string[] };
  socketBlacklist: string[];
  biomeTierMap: { [key: string]: number[] };
  markerSizeDifferenceMax: number;
  distances: { [key: string]: number };
  additionalTileTypes: string[];
}
