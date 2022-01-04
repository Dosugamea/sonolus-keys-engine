import { readFileSync } from 'fs'
import { archetypes } from '../../engine/data/archetypes'
import { fromOsu } from '../../lib/osu/convert'

export async function getLevelData() {
    return await fromOsu(
        readFileSync('./src/level/data/chart.osu', 'utf8'),
        0,
        archetypes
    )
}
