import { readFileSync } from 'fs'
import { fromOsu } from '../../lib/osu/sfx'

export async function getEffectData() {
    return await fromOsu(readFileSync('./src/effect/data/chart.osu', 'utf8'))
}
