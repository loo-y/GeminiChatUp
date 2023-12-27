import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export enum Roles {
    user = `user`,
    model = `model`,
}

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
    timsStamp?: number
}
