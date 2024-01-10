import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export enum Roles {
    user = `user`,
    model = `model`,
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
    imageList?: string[]
}

export interface IImageItem {
    imageId: string
    base64Data: string
    timestamp: number
}
export interface IImagePart {
    inlineData: {
        data: string
        mimeType: string
    }
}

export interface IGeminiTokenCountProps {
    prompt?: string
    imageParts?: IImagePart[]
    history?: Pick<IChatItem, 'role' | 'parts'>[]
    limit?: number
}
