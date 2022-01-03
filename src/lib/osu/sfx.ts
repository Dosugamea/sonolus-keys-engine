import { readFileSync, appendFileSync } from 'fs'
import { SfxPacker } from '../sonolus/packer'
import { loadBeatMap } from './load'
import { Lame } from 'node-lame'
import { Blob } from 'buffer'

export async function fromOsu(osu: string, filename = 'custom-effect.scp') {
    const beatmap = await loadBeatMap(osu)
    const scp = new SfxPacker(beatmap)
    const files = [
        ...new Set(
            beatmap.hitObjects.circles.map(
                (circle) => circle.hitSample.filename
            )
        ),
    ]
    files.forEach(async (file, index) => {
        const src = `./src/effect/data/${file}`
        const out = `./src/effect/data/${file?.replace('.wav', '.mp3')}`
        const encoder = new Lame({
            output: out,
            bitrate: 192,
        }).setFile(src)
        await encoder.encode()
        const buffer = readFileSync(out)
        scp.addClip(buffer, index)
    })
    const pack = await scp.exportPack()
    const packBuffer = await pack.arrayBuffer()
    appendFileSync(filename, new Uint8Array(packBuffer))
    const effectData = scp.exportEffectData()
    return effectData
}
