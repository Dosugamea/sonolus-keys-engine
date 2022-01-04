import { createWriteStream, readFileSync } from 'fs'
import { SfxPacker } from '../sonolus/packer'
import { loadBeatMap } from './load'
import { Lame } from 'node-lame'

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
    let index = 0
    for (const file of files) {
        if (file == undefined) {
            continue
        }
        if (file in ['0', '70', '']) {
            continue
        }
        const src = `./src/effect/data/${file}.wav`
        const out = `./src/effect/data/${file}.mp3`
        try {
            const encoder = new Lame({
                output: out,
                bitrate: 192,
            }).setFile(src)
            await encoder.encode()
            const buffer = readFileSync(out)
            scp.addClip(buffer, index)
            index += 1
        } catch (e) {
            console.log(e)
        }
    }
    const buffer = readFileSync('./src/effect/data/thumbnail.png')
    scp.addThumbnail(buffer)
    const stream = await scp.exportPack()
    stream.pipe(createWriteStream(filename))
    scp.exportEffectData()
}
