import { build } from 'sonolus.js'
import { engine } from './engine'
import { levelData } from './level/data'
import { effectData } from './effect/data'

/*
 * [index.ts]
 * build/serve時に読み込まれるスクリプト
 *  1 engineとlevelフォルダ内のソースをimportする
 *  2 ビルドを行う
 *  3 buildOutputとしてexportする
 */

export const buildOutput = build({
    engine,
    level: {
        data: levelData,
    },
})

export const effectOutput = effectData
