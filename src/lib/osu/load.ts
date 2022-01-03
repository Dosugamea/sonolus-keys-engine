import { Beatmap } from '@osbjs/osujs'
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

export async function loadBeatMap(osu: string): Promise<Beatmap> {
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
    if (beatmap.difficulty.circleSize !== 4) {
        throw new Error('Specified file is not 4keys chart.')
    }
    return beatmap
}
