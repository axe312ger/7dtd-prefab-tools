import {Vector3} from 'three'
import {parseStringPromise} from 'xml2js'

import {Decoration} from '../types'
import {parseArrayValue} from '../utils/utils'

export const loadDecorations = async (xml: string): Promise<Decoration[]> => {
  const $prefabs = await parseStringPromise(xml, {trim: true})
  const decorations: Decoration[] = $prefabs.prefabs.decoration.map(
    (xmlDecoration: any) => ({
      name: xmlDecoration.$.name,
      rotation: Number.parseInt(xmlDecoration.$.rotation, 10),
      position: new Vector3(
        ...parseArrayValue(xmlDecoration.$.position).map(v =>
          Number.parseInt(v, 10),
        ),
      ),
    }),
  )
  return decorations
}
