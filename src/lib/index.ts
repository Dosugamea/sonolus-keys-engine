import { LevelData } from 'sonolus-core'
import { fromOsu as _fromOsu } from './osu/convert'
import { archetypes } from '../engine/data/archetypes'

export async function fromOsu(osu: string, offset = 0): Promise<LevelData> {
    return await _fromOsu(osu, offset, archetypes)
}
