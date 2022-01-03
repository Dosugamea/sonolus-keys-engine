import { readFileSync } from 'fs'
import { fromOsu } from '../../lib/osu/sfx'

export const effectData = await fromOsu(
    readFileSync('./src/effect/data/chart.osu', 'utf8')
)
