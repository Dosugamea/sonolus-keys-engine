import { LevelData } from 'sonolus-core'
import { Circle } from '@osbjs/osujs'
import { loadBeatMap } from './load'

export async function fromOsu(
    osu: string,
    offset: number,
    archetypes: {
        initializationIndex: number
        stageIndex: number
        noteIndex: number
    }
): Promise<LevelData> {
    const beatmap = await loadBeatMap(osu)
    const keys = beatmap.difficulty.circleSize
    const sfxs = [
        ...new Set(
            beatmap.hitObjects.circles.map(
                (circle) => circle.hitSample.filename
            )
        ),
    ]

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
                            (+circle.startTime + offset) / 1000,
                            Math.floor((circle.x * keys) / 512) - 1,
                            sfxs.indexOf(circle.hitSample.filename),
                        ],
                    },
                }
            }),
        ],
    }
}
