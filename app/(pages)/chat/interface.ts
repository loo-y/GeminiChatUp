import { IChatItem } from '@/app/shared/interfaces'

export interface IConversation {
    conversationId: string
    history?: IChatItem[]
    isSelected?: boolean
    isFetching?: boolean
}

export interface ChatState {
    requestInQueueFetching: boolean

    conversationList: IConversation[]
}
