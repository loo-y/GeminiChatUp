import Dexie, { Table } from 'dexie'
import { Roles, GeminiModel } from '../interfaces'
import { HarmBlockThreshold } from '@google/generative-ai'
export interface DBConversation {
    id?: number
    conversationId: string
    conversationName: string
    topK: number
    temperature: number
    modelType: GeminiModel
    topP: number
    maxOutputTokens: number
    harassment: HarmBlockThreshold // HARM_CATEGORY_HARASSMENT
    hateSpeech: HarmBlockThreshold
    sexuallyExplicit: HarmBlockThreshold
    dangerousContent: HarmBlockThreshold
    modelAvatar?: string
    isSelected?: boolean
    archivedTS: number
    historyLimitTS: number
}

interface DBChatItem {
    id?: number
    conversationId: string
    role: Roles
    text: string
    timestamp: number
    imageList?: string[]
}

interface DBImageItem {
    id?: number
    imageId: string
    base64Data: string
    mimeType: string
    timestamp: number
}

export class IndexedDexie extends Dexie {
    // 'friends' is added by dexie when declaring the stores()
    // We just tell the typing system this is the case
    conversations!: Table<DBConversation>

    chats!: Table<DBChatItem>

    images!: Table<DBImageItem>

    constructor(dbname: string) {
        super(dbname)
        this.version(5.3).stores({
            conversations:
                '++id, conversationId, conversationName, topK, topP, maxOutputTokens, temperature, harassment, hateSpeech, sexuallyExplicit, archivedTS, historyLimitTS, dangerousContent, modelAvatar, isSelected', // Primary key and indexed props
            chats: '++id, conversationId, role, text, timestamp, imageList',
            images: '++id, imageId, base64Data, mimeType, timestamp',
        })
    }
}

export const geminiChatDb = new IndexedDexie('geminiChatDb')
