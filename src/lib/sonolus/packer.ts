import * as zip from '@zip.js/zip.js'
import { gzip } from 'pako'
import { Blob } from 'buffer'
import type { Beatmap } from '@osbjs/osujs'
import {
    EffectClip,
    EffectData,
    EffectDataClip,
    EffectItem,
    ItemDetails,
    ItemList,
    ResourceType,
} from 'sonolus-core'

/**
 * Packing codes are stolen from Sonolus-Studio
 *
 * Original Author: NonSpicyBurrito
 * License: MIT
 *
 * Repository:
 * https://github.com/Sonolus/studio/blob/master/src/core/project.ts
 * https://github.com/Sonolus/studio/blob/master/src/core/utils.ts
 * https://github.com/Sonolus/studio/blob/master/src/core/effect.ts
 */

export function srl<T extends ResourceType>(type: T) {
    return {
        type,
        hash: '',
        url: '',
    }
}

export async function hash(data: BufferSource) {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', data)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export function newEffectClip(id: EffectClip): EffectDataClip {
    return {
        id,
        clip: srl('EffectClip'),
    }
}

/**
 * Create .scp file with using specified beatmap, thumbnail, and clips.
 * This class only support one effect per file.
 */
export class SfxPacker {
    blobWriter: zip.BlobWriter
    zipWriter: zip.ZipWriter
    paths: Set<string>
    item: EffectItem
    effectData: EffectData

    constructor(beatmap: Beatmap) {
        this.blobWriter = new zip.BlobWriter('application/zip')
        this.zipWriter = new zip.ZipWriter(this.blobWriter)
        this.paths = new Set<string>()
        this.item = {
            name: beatmap.metadata.title,
            version: 2,
            title: beatmap.metadata.title,
            subtitle: 'osu!mania',
            author: beatmap.metadata.creator,
            thumbnail: srl('EffectThumbnail'),
            data: srl('EffectData'),
        }
        this.effectData = {
            clips: [],
        }
    }

    async addFile(
        path: string,
        reader: zip.Reader
    ): Promise<zip.Entry | undefined> {
        if (!path.startsWith('/')) throw `"${path}" not allowed`
        path = path.slice(1)
        if (this.paths.has(path)) return
        this.paths.add(path)
        return this.zipWriter.add(path, reader)
    }

    async packRaw(
        buffer: ArrayBuffer
    ): Promise<{ hash: string; data: Uint8Array }> {
        return {
            hash: await hash(buffer),
            data: new Uint8Array(buffer),
        }
    }

    async addRaw(path: string, data: Uint8Array): Promise<void> {
        await this.addFile(path, new zip.Uint8ArrayReader(data))
    }

    async packJson<T>(json: T): Promise<{ hash: string; data: Uint8Array }> {
        const data = gzip(JSON.stringify(json), { level: 9 })
        return {
            hash: await hash(data),
            data,
        }
    }

    async addJson<T>(path: string, data: T): Promise<void> {
        await this.addFile(path, new zip.TextReader(JSON.stringify(data)))
    }

    async addThumbnail(thumbnail: ArrayBuffer): Promise<void> {
        const { hash, data } = await this.packRaw(thumbnail)
        const path = `/repository/EffectThumbnail/${hash}`
        await this.addRaw(path, data)
        this.item.thumbnail.hash = hash
        this.item.thumbnail.url = path
    }

    async addClip(clip: ArrayBuffer, id: number): Promise<void> {
        const { hash, data } = await this.packRaw(clip)
        const newClip = newEffectClip(id)
        const path = `/repository/EffectClip/${hash}`
        await this.addRaw(path, data)
        newClip.clip.hash = hash
        newClip.clip.url = path
        this.effectData.clips.push(newClip)
    }

    private async _addEffectData(): Promise<void> {
        const { hash, data } = await this.packJson(this.effectData)
        const path = `/repository/EffectData/${hash}`
        this.item.data.hash = hash
        this.item.data.url = path
        await this.addRaw(path, data)
    }

    async exportPack(): Promise<Blob> {
        this._addEffectData()
        await this.addJson<ItemList<EffectItem>>('/effects/list', {
            pageCount: 1,
            items: [this.item],
        })
        await this.addJson<ItemDetails<EffectItem>>(
            `/effects/${this.item.name}`,
            {
                item: this.item,
                description:
                    'Auto generated effect. It is not compatible with any other level.',
                recommended: [],
            }
        )
        await this.zipWriter.close()
        return this.blobWriter.getData()
    }

    exportItem() {
        return this.item
    }

    async exportEffectData() {
        const { data } = await this.packJson(this.effectData)
        return data
    }
}
