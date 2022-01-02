import { writeFileSync } from 'fs'
import { buildOutput } from '.'

/*
 * [build.ts]
 * npm run build した際に実行されるスクリプト
 *  1 実行時に 同一フォルダ内の index.tsをimportする
 *  2 index.ts内で engineとlevelフォルダ内のソースをimportする
 *  3 index.ts内で ビルドが行われる
 *  4 このコード内で ビルド結果をbuildOutputとして受け取る
 *  5 buildOutputをファイルに書き出す
 */

writeFileSync('EngineConfiguration', buildOutput.engine.configuration.buffer)
writeFileSync('EngineData', buildOutput.engine.data.buffer)
writeFileSync('LevelData', buildOutput.level.data.buffer)
