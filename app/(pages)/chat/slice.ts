import { createAsyncThunk, createSlice, original, PayloadAction } from '@reduxjs/toolkit'
import type { AppState, AppThunk } from '@/app/store'
import * as API from '@/app/shared/API'
import { fetchGeminiChat } from '@/app/shared/API'
import { ChatState } from './interface'
// import _ from 'lodash' // use specific function from lodash
import { map as _map } from 'lodash'
import type { AsyncThunk } from '@reduxjs/toolkit'
import _ from 'lodash'
import { IChatItem, Roles } from '@/app/shared/interfaces'

// define a queue to store api request
type APIFunc = (typeof API)[keyof typeof API]
type APIFuncName = keyof typeof API
export const getChatState = (state: AppState): ChatState => state.chatStore

const initialState: ChatState & Record<string, any> = {
    requestInQueueFetching: false,
    conversationList: [],
}

type RequestCombo = {
    apiRequest: APIFunc
    asyncThunk?: AsyncThunk<any, any, any>
}
const apiRequestQueue: Array<RequestCombo> = []
// define a thunk action to wrap api request
const makeApiRequestInQueue = createAsyncThunk(
    'chatSlice/makeApiRequestInQueue',
    async (requestCombo: RequestCombo, { dispatch, getState }: any) => {
        const mainState = getChatState(getState())
        const { requestInQueueFetching } = mainState || {}

        // 将接口请求添加到队列中，并设置isFetching为true
        apiRequestQueue.push(requestCombo)

        if (requestInQueueFetching) {
            // if there is a request in progress, return a resolved Promise
            return Promise.resolve()
        }

        const { setRequestInQueueFetching } = chatSlice.actions
        dispatch(setRequestInQueueFetching(true))

        // loop through the queue and process each request
        while (apiRequestQueue.length > 0) {
            const nextRequestCombo = apiRequestQueue.shift()
            if (nextRequestCombo) {
                const { apiRequest, asyncThunk } = nextRequestCombo || {}

                // send api request
                try {
                    // @ts-ignore
                    asyncThunk && dispatch(asyncThunk.pending())
                    // @ts-ignore
                    dispatch(makeApiRequestInQueue.pending())
                    // @ts-ignore
                    const response = await apiRequest()
                    // @ts-ignore
                    asyncThunk && dispatch(asyncThunk.fulfilled(response))
                    // @ts-ignore
                    dispatch(makeApiRequestInQueue.fulfilled(response))
                } catch (error) {
                    // @ts-ignore
                    asyncThunk && dispatch(asyncThunk.rejected(error))
                    // @ts-ignore
                    dispatch(makeApiRequestInQueue.rejected(error))
                }
            }
        }

        // set RequestInQueueFetching to false when all requests are processed
        dispatch(setRequestInQueueFetching(false))
    }
)

export const getGeminiChatAnswer = createAsyncThunk(
    'chatSlice/getGeminiChatAnswer',
    async (
        { history, inputText, conversationId }: { history?: IChatItem[]; inputText: string; conversationId: string },
        { dispatch, getState }: any
    ) => {
        const chatState: ChatState = getChatState(getState())
        dispatch(
            updateConversation({
                conversationId,
                chatItem: {
                    role: Roles.user,
                    parts: [{ text: inputText }],
                    timsStamp: Date.now(),
                },
                isFetching: true,
            })
        )

        dispatch(
            makeApiRequestInQueue({
                apiRequest: fetchGeminiChat.bind(null, {
                    history,
                    inputText,
                    conversationId,
                }),
                asyncThunk: getGeminiChatAnswer,
            })
        )
    }
)

export const chatSlice = createSlice({
    name: 'chatSlice',
    initialState,
    reducers: {
        setRequestInQueueFetching: (state, action: PayloadAction<boolean>) => {
            state.requestInQueueFetching = action.payload
        },
        updateState: (state, action: PayloadAction<Partial<ChatState>>) => {
            return { ...state, ...action.payload }
        },
        updateConversation: (
            state,
            action: PayloadAction<{ conversationId: string; chatItem: IChatItem; isFetching: boolean }>
        ) => {
            const { conversationId, chatItem, isFetching } = action.payload || {}
            let conversationList = _.clone(state.conversationList)
            state.conversationList = updateConversationById({
                conversationId,
                conversationList,
                chatItem,
                isFetching,
            })
        },
    },
    extraReducers: builder => {
        builder.addCase(getGeminiChatAnswer.fulfilled, (state, action) => {
            if (action.payload as any) {
                const { status, text, conversationId } = (action.payload as any) || {}
                if (status && text && conversationId) {
                    const conversationList = updateConversationById({
                        conversationId,
                        conversationList: state.conversationList,
                        chatItem: {
                            role: Roles.model,
                            parts: [{ text }],
                        },
                        isFetching: false,
                    })
                    state.conversationList = conversationList
                }
            } else {
                return { ...state }
            }
        })
    },
})

// export actions
export const { updateState, updateConversation } = chatSlice.actions
export default chatSlice.reducer

// ********** helper **********
const updateConversationById = ({
    conversationId,
    chatItem,
    isFetching,
    conversationList,
}: {
    conversationId: string
    chatItem: IChatItem
    isFetching: boolean
    conversationList: ChatState['conversationList']
}) => {
    const newConversationList = _.clone(conversationList)
    let hasTheConversation = false
    _.each(newConversationList, conversation => {
        if (conversation.conversationId == conversationId) {
            conversation.isFetching = isFetching
            hasTheConversation = true
            conversation.history = _.isEmpty(conversation.history) ? [chatItem] : conversation.history?.concat(chatItem)
            return false
        }
    })
    // TODO save to local
    // save to indexedDb

    if (!hasTheConversation) {
        newConversationList.push({
            conversationId,
            history: [chatItem],
            isFetching,
        })
    }

    return newConversationList
}
