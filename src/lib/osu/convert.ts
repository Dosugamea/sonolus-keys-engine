import { LevelData } from 'sonolus-core'
import { Beatmap, Circle } from '@osbjs/osujs'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

const withTempFile = (fn: (file: string) => Promise<Beatmap>) =>
    withTempDir((dir) => fn(path.join(dir, 'file')))

const withTempDir = async (
    fn: (dir: string) => Promise<Beatmap>
): Promise<Beatmap> => {
    const dir = await fs.mkdtemp((await fs.realpath(os.tmpdir())) + path.sep)
    try {
        return await fn(dir)
    } finally {
        fs.rmdir(dir, { recursive: true })
    }
}

export async function fromOsu(
    osu: string,
    offset: number,
    archetypes: {
        initializationIndex: number
        stageIndex: number
        noteIndex: number
    }
): Promise<LevelData> {
    if (!osu.includes('osu file format v14')) {
        throw new Error('Specified file is not osu v14 chart.')
    }
    if (!osu.includes('Mode: 3')) {
        throw new Error('Specified file is not osu keys chart.')
    }
    const beatmap = await withTempFile(async (file) => {
        await fs.writeFile(file, osu)
        return new Beatmap(file)
    })
    const keys = beatmap.difficulty.circleSize
    const title = beatmap.metadata.title
    console.log('title:', title)
    console.log('keys:', keys)
    console.log(beatmap.timingPoints)

    return {
        entities: [
            {
                archetype: archetypes.initializationIndex,
            },
            {
                archetype: archetypes.stageIndex,
            },
            ...beatmap.hitObjects.circles.map((circle: Circle) => {
                return {
                    archetype: archetypes.noteIndex,
                    data: {
                        index: 0,
                        values: [
                            +circle.startTime + offset,
                            Math.floor((circle.x * keys) / 512),
                        ],
                    },
                }
            }),
        ],
    }
}
