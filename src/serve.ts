import { serve } from 'sonolus.js'
import { buildOutput } from '.'

/*
 * [serve.ts]
 * npm run serve した際に実行されるスクリプト
 *  1 実行時に 同一フォルダ内の index.tsをimportする
 *  2 index.ts内で engineとlevelフォルダ内のソースをimportする
 *  3 index.ts内で ビルドが行われる
 *  4 このコード内で ビルド結果をbuildOutputとして受け取る
 *  5 buildOutputをserve(Sonolus-Express)に渡す (サーバーを開始する)
 *  6 sonolus-expressに渡したテストレベルにジャケットや音源を指定する
 *    ※ テスト用のため、直URLを指定している
 *    ※ 譜面はビルド前に渡しておりビルド結果に含まれている
 */

const sonolus = serve(buildOutput)

const level = sonolus.db.levels[0]
level.cover = {
    type: 'LevelCover',
    hash: '',
    url: 'https://sonolus.com/assets/jacket066.png',
}
level.bgm = {
    type: 'LevelBgm',
    hash: '',
    url: 'https://sonolus.com/assets/bgm066.mp3',
}
