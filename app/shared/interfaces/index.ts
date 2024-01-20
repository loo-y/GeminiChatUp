import { HarmCategory, HarmBlockThreshold, Part } from '@google/generative-ai'

export enum Roles {
    user = `user`,
    model = `model`,
}

export enum APICredentials {
    customAPI = `customAPI`,
    userToken = `userToken`,
}

export enum GeminiModel {
    geminiPro = `gemini-pro`,
    geminiProVision = `gemini-pro-vision`,
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
    conversationId?: string
    role: Roles
    parts: Record<'text', string>[]
    timestamp?: number
    isFailed?: boolean
    failedInfo?: string
    imageList?: string[]
}

export interface IImageItem {
    imageId: string
    base64Data: string
    mimeType: string
    timestamp: number
}

export interface IGeminiTokenCountProps {
    prompt?: string
    parts?: Part[]
    history?: Pick<IChatItem, 'role' | 'parts'>[]
    limit?: number
    customGeminiAPIKey?: string
}
