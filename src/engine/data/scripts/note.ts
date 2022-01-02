import { EffectClip } from 'sonolus-core'
import {
    Add,
    And,
    createEntityData,
    Divide,
    Draw,
    EntityMemory,
    Greater,
    GreaterOr,
    If,
    InputAccuracy,
    InputBucket,
    InputBucketValue,
    InputJudgment,
    InputOffset,
    Judge,
    Multiply,
    Not,
    Or,
    ParticleEffect,
    Play,
    Pointer,
    Random,
    Remap,
    Script,
    SkinSprite,
    SpawnParticleEffect,
    Subtract,
    TemporaryMemory,
    Time,
    TouchST,
    TouchStarted,
} from 'sonolus.js'
import { options } from '../../configuration/options'
import { buckets } from '../buckets'

// ノーツの構造体(LevelDataから代入されるデータに名前を付けている)
class EntityDataPointer extends Pointer {
    public get time() {
        return this.to<number>(0)
    }

    public get column() {
        return this.to<number>(1)
    }
}

// EntityData: Levelからパラメータを受け取れる唯一のメモリ
//  独自で構造を定義できるポインタ
//  主に 描画ループなどで使うことが多い
//  preprocessとspawnOrder以外では読み取り専用
const EntityData = createEntityData(EntityDataPointer)

/**
 * ノーツエンティティのスクリプト
 */
export function note(): Script {
    // EntityMemory: 汎用読み書きメモリ
    //  単一のノーツエンティティ内で扱う事が多い
    //  各コールバック間でデータを受け渡すためのポインタ定義
    //  基本的にどこでも読み書きできる
    const spawnTime = EntityMemory.to<number>(0)
    const z = EntityMemory.to<number>(1)
    const minInputTime = EntityMemory.to<number>(2)
    const maxInputTime = EntityMemory.to<number>(3)

    const yCurrent = EntityMemory.to<number>(32)
    const inputState = EntityMemory.to<boolean>(33)
    const xStart = EntityMemory.to<number>(34)
    const xEnd = EntityMemory.to<number>(35)

    /**
     * ノーツの大きさ
     */
    const radius = 0.2

    /**
     * 事前処理
     */
    const preprocess = [
        // 画面への出現タイミングを計算し代入
        EntityData.time.set(Divide(EntityData.time, options.speed)),

        // エンティティのスポーンタイミングを計算し代入
        spawnTime.set(
            Subtract(EntityData.time, If(options.random, Random(0.5, 1.5), 1))
        ),
        // X開始地点
        //  ノーツ横幅(左)
        xStart.set(Multiply(Multiply(-radius, 2), EntityData.column)),
        // X終了地点
        //  ノーツ横幅(右)
        xEnd.set(Add(Multiply(radius, 2), xStart)),
        // Zファイティング対策
        z.set(Subtract(1000, EntityData.time)),
        // 最早入力受付時刻
        minInputTime.set(Add(EntityData.time, -0.2, InputOffset)),
        // 最遅入力受付時刻
        maxInputTime.set(Add(EntityData.time, 0.2, InputOffset)),
    ]

    // スポーン順序 (スポーン時刻 + 1000)
    const spawnOrder = Add(spawnTime, 1000)

    // スポーン条件 (時間が来たらスポーン)
    const shouldSpawn = GreaterOr(Time, spawnTime)

    // TemporaryMemory: タッチコールバック内でのみ使用可能なメモリ
    //  タッチコールバック内以外では読み書きできない
    const isTouchOccupied = TemporaryMemory.to<boolean>(0)

    /**
     * タッチコールバック処理
     */
    const touch = And(
        // タッチが開始した直後
        TouchStarted,
        // タッチを開始した時間が 最早入力受付時刻以上か
        GreaterOr(TouchST, minInputTime),
        // タッチ中でない
        Not(isTouchOccupied),
        [
            // タッチ中に変更
            inputState.set(true),
            isTouchOccupied.set(true),

            // 自動判定
            InputJudgment.set(
                Judge(
                    Subtract(TouchST, InputOffset),
                    EntityData.time,
                    0.05,
                    0.1,
                    0.2
                )
            ),
            // 精度データ入力
            InputAccuracy.set(Subtract(TouchST, InputOffset, EntityData.time)),

            // バケットデータ入力
            InputBucket.set(buckets.noteIndex),
            InputBucketValue.set(Multiply(1000, InputAccuracy)),

            // 効果音再生
            Play(Add(EffectClip.Miss, InputJudgment), 0.02),

            // パーティクル表示
            SpawnParticleEffect(
                // ID
                ParticleEffect.NoteCircularTapCyan,
                // 座標...?
                -0.4,
                -1,
                -0.4,
                -0.2,
                0.4,
                -0.2,
                0.4,
                -1,
                // 表示秒数
                0.3,
                // ループするかどうか
                false
            ),
        ]
    )

    // 定数
    // この値は 描画中に更新される

    /**
     * 鍵盤の数
     */
    const columnCount = 4

    /**
     * 落下開始地点
     */
    const yFrom = 1 + radius

    /**
     * 落下終了地点
     */
    const yTo = -0.6

    /**
     * ノーツ縦幅(上座標)
     */
    const top = Add(yCurrent, radius / 2)

    /**
     * ノーツ縦幅(下座標)
     */
    const bottom = Subtract(yCurrent, radius / 2)

    /**
     * 並列描画処理
     */
    const updateParallel = Or(
        // 入力中
        inputState,
        // 最遅入力受付時間を超えた
        Greater(Time, maxInputTime),
        // 条件が満たされてる場合実行
        [
            // Y座標に新しい地点を代入
            yCurrent.set(Remap(spawnTime, EntityData.time, yFrom, yTo, Time)),
            // スプライトを描画
            Draw(
                SkinSprite.NoteHeadCyan,
                xStart,
                bottom,
                xStart,
                top,
                xEnd,
                top,
                xEnd,
                bottom,
                z,
                1
            ),
        ]
    )

    return {
        // 事前処理
        preprocess: {
            code: preprocess,
        },
        // スポーン順序
        spawnOrder: {
            code: spawnOrder,
        },
        // スポーン条件
        shouldSpawn: {
            code: shouldSpawn,
        },
        // タッチコールバック
        touch: {
            code: touch,
        },
        // 並列描画コールバック
        updateParallel: {
            code: updateParallel,
        },
    }
}
