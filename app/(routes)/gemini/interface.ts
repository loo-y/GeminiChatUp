export * from '../../shared/interfaces'
import { IChatItem } from '../../shared/interfaces'

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
}
