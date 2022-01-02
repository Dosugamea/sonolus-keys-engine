import { EffectClip } from 'sonolus-core'
import {
    Add,
    And,
    Draw,
    EntityInfo,
    EntityMemory,
    Equal,
    If,
    Multiply,
    Not,
    Or,
    Play,
    ScreenAspectRatio,
    Script,
    SkinSprite,
    State,
    Subtract,
    TemporaryMemory,
    TouchEnded,
    TouchStarted,
} from 'sonolus.js'

/**
 * エンジンのステージ(判定線等)のスクリプト
 */
export function stage(): Script {
    // 汎用読み書きメモリ (このスクリプト内のコールバックで共有)
    const anyTouch = EntityMemory.to<boolean>(0)
    const leftLineXStart = EntityMemory.to<number>(1)
    const leftLineXEnd = EntityMemory.to<number>(2)
    const rightLineXStart = EntityMemory.to<number>(3)
    const rightLineXEnd = EntityMemory.to<number>(4)

    const isTouchOccupied = TemporaryMemory.to<boolean>(0)

    /**
     * スポーン順序 (初期化スクリプトの次)
     */
    const spawnOrder = 1

    /**
     * スポーン条件 (初期化スクリプトがデスポーンした後)
     */
    const shouldSpawn = Equal(EntityInfo.of(0).state, State.Despawned)

    /**
     * タッチコールバック
     */
    const touch = [
        // タッチ開始 + 別のタッチコールバックが発火中でないなら 効果音再生
        And(TouchStarted, Not(isTouchOccupied), Play(EffectClip.Stage, 0.02)),
        // タッチが終了していなければタッチ中にする
        Or(TouchEnded, [anyTouch.set(true), isTouchOccupied.set(true)]),
    ]

    // 定数
    const yCenter = -0.6
    const thickness = 0.1

    // 実際の値は実行時に決定されます
    const left = Multiply(ScreenAspectRatio, -1)
    const right = ScreenAspectRatio

    const top = yCenter + thickness / 2
    const bottom = yCenter - thickness / 2

    /**
     * ノーツの大きさ
     */
    const radius = 0.2

    /**
     * 事前処理
     */
    const preprocess = [
        leftLineXStart.set(Subtract(Multiply(-radius, 4), thickness)),
        leftLineXEnd.set(Multiply(-radius, 4)),
        rightLineXStart.set(Multiply(radius, 4)),
        rightLineXEnd.set(Add(Multiply(radius, 4), thickness)),
    ]

    /**
     * 並列描画処理
     */
    const updateParallel = [
        // 枠左 を描画
        Draw(
            SkinSprite.StageLeftBorder,
            leftLineXStart,
            1,
            leftLineXStart,
            -1,
            leftLineXEnd,
            -1,
            leftLineXEnd,
            1,
            0,
            // 不透明度
            1
        ),
        // 枠右 を描画
        Draw(
            SkinSprite.StageRightBorder,
            rightLineXStart,
            1,
            rightLineXStart,
            -1,
            rightLineXEnd,
            -1,
            rightLineXEnd,
            1,
            0,
            1
        ),
        // 判定線を描画
        Draw(
            SkinSprite.JudgmentLine,
            left,
            bottom,
            left,
            top,
            right,
            top,
            right,
            bottom,
            0,
            If(anyTouch, 1, 0.5)
        ),
        // 何もタッチされていない状態に戻す
        anyTouch.set(false),
        isTouchOccupied.set(false),
    ]

    return {
        preprocess: {
            code: preprocess,
        },
        spawnOrder: {
            code: spawnOrder,
        },
        shouldSpawn: {
            code: shouldSpawn,
        },
        touch: {
            code: touch,
            order: 1,
        },
        updateParallel: {
            code: updateParallel,
        },
    }
}
