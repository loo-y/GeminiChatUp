import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

type Roles = 'user' | 'model'

export interface ISafetySetting {
    category: HarmCategory
    threshold: HarmBlockThreshold
}

export interface IGenerationConfig {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
}

export interface IChatItem {
    role: Roles
    parts: Record<'text', string>[]
}
