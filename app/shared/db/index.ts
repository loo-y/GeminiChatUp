import Dexie, { Table } from 'dexie'
import { Roles } from '../interfaces'
import { HarmBlockThreshold } from '@google/generative-ai'
export interface Conversation {
    id?: number
    conversationId: string
    conversationName: string
    topK: number
    temperature: number
    topP: number
    maxOutputTokens: number
    harassment: HarmBlockThreshold // HARM_CATEGORY_HARASSMENT
    hateSpeech: HarmBlockThreshold
    sexuallyExplicit: HarmBlockThreshold
    dangerousContent: HarmBlockThreshold
}

interface ChatItem {
    id?: number
    conversationId: string
    role: Roles
    text: string
    timestamp: number
}

export class IndexedDexie extends Dexie {
    // 'friends' is added by dexie when declaring the stores()
    // We just tell the typing system this is the case
    conversations!: Table<Conversation>

    chats!: Table<ChatItem>

    constructor(dbname: string) {
        super(dbname)
        this.version(1).stores({
            conversations:
                '++id, conversationId, conversationName, topK, topP, maxOutputTokens, temperature, harassment, hateSpeech, sexuallyExplicit, dangerousContent', // Primary key and indexed props
            chats: '++id, conversationId, role, text, timestamp',
        })
    }
}

export const geminiChatDb = new IndexedDexie('geminiChatDb')
