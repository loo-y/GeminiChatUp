import { IChatItem } from '@/app/shared/interfaces'
import type { Conversation } from '@/app/shared/db'
export interface IConversation
    extends Partial<
        Pick<
            Conversation,
            | 'conversationName'
            | 'historyLimitTS'
            | 'temperature'
            | 'topK'
            | 'topP'
            | 'maxOutputTokens'
            | 'harassment'
            | 'hateSpeech'
            | 'sexuallyExplicit'
            | 'dangerousContent'
        >
    > {
    conversationId: string
    history?: IChatItem[]
    archived?: IChatItem[]
    isSelected?: boolean
    isFetching?: boolean
    modelAvatar?: string
}

export interface ChatState {
    requestInQueueFetching: boolean

    conversationList: IConversation[]
}
