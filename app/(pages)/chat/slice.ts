import { createAsyncThunk, createSlice, original, PayloadAction } from '@reduxjs/toolkit'
import type { AppState, AppThunk } from '@/app/store'
import * as API from '@/app/shared/API'
import { fetchGeminiChat, fetchTokenCount } from '@/app/shared/API'
import { ChatState, IConversation } from './interface'
// import _ from 'lodash' // use specific function from lodash
import { map as _map } from 'lodash'
import type { AsyncThunk } from '@reduxjs/toolkit'
import _ from 'lodash'
import { IChatItem, Roles } from '@/app/shared/interfaces'
import { geminiChatDb } from '@/app/shared/db'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { generateReversibleToken } from '@/app/shared/utils'
import { defaultConversaionName, inputTokenLimit } from '@/app/shared/constants'

// define a queue to store api request
type APIFunc = (typeof API)[keyof typeof API]
type APIFuncName = keyof typeof API
export const getChatState = (state: AppState): ChatState => state.chatStore

const initialState: ChatState & Record<string, any> = {
    requestInQueueFetching: false,
    conversationList: [],
}

const __avatar__ = [`animal001`, `animal002`, `animal003`, `animal004`, `animal005`, `animal006`]

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
        {
            history,
            inputText,
            conversationId,
            conversation,
        }: { history?: IChatItem[]; inputText: string; conversationId: string; conversation: IConversation },
        { dispatch, getState }: any
    ) => {
        const chatState: ChatState = getChatState(getState())
        let historyLimitTS = conversation.historyLimitTS || -1
        const newChatItem = {
            conversationId,
            role: Roles.user,
            parts: [{ text: inputText }],
            timestamp: Date.now(),
        }

        dispatch(
            updateChatToConversation({
                conversationId,
                chatItem: newChatItem,
                isFetching: true,
            })
        )

        let historyToFetch: IChatItem[] = []
        if (history && !_.isEmpty(history)) {
            const limit = inputTokenLimit.GeminiPro
            historyToFetch = history
            if (historyLimitTS > -1) {
                const _index_ =
                    _.findIndex(history, h => {
                        return h.timestamp == historyLimitTS
                    }) || 0
                historyToFetch = history.slice(_index_)
            }
            let { totalTokens, validIndex } = await fetchTokenCount({
                history: _.map(historyToFetch, h => {
                    return {
                        role: h.role,
                        parts: h.parts,
                    }
                }).concat({
                    role: newChatItem.role,
                    parts: newChatItem.parts,
                }),
                limit,
            })

            if (totalTokens && validIndex != undefined && totalTokens > limit) {
                let theChatItemLimit = historyToFetch[validIndex]
                if (theChatItemLimit?.timestamp) {
                    if (theChatItemLimit.role == Roles.model) {
                        validIndex = validIndex + 1
                        theChatItemLimit = historyToFetch[validIndex]
                    }
                    if (theChatItemLimit?.timestamp) {
                        historyLimitTS = theChatItemLimit.timestamp
                        historyToFetch = historyToFetch.slice(validIndex)
                    } else {
                        historyLimitTS = newChatItem.timestamp
                        historyToFetch = []
                    }
                    dispatch(updateConversationInfo({ ...conversation, historyLimitTS }))
                } else {
                    // newChatItem
                    console.log(`the input text is too long!`)
                    alert(`the input text is too long!`)

                    dispatch(
                        updateChatToConversation({
                            conversationId,
                            isFetching: false,
                        })
                    )
                    return
                }
            }
        }

        const { topK, topP, temperature, maxOutputTokens, harassment, hateSpeech, dangerousContent, sexuallyExplicit } =
            conversation || {}
        let safetySettings = []
        if (harassment) {
            safetySettings.push({
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: harassment,
            })
        }
        if (hateSpeech) {
            safetySettings.push({
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: hateSpeech,
            })
        }
        if (dangerousContent) {
            safetySettings.push({
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: dangerousContent,
            })
        }
        if (sexuallyExplicit) {
            safetySettings.push({
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: sexuallyExplicit,
            })
        }
        dispatch(
            makeApiRequestInQueue({
                apiRequest: fetchGeminiChat.bind(null, {
                    history: historyToFetch,
                    inputText,
                    conversationId,
                    generationConfig: {
                        topK,
                        topP,
                        temperature,
                        maxOutputTokens,
                    },
                    safetySettings: safetySettings,
                }),
                asyncThunk: getGeminiChatAnswer,
            })
        )
    }
)

export const initialConversationListInState = createAsyncThunk(
    'chatSlice/initialConversationListInState',
    async (params, { dispatch, getState }: any) => {
        const chatState: ChatState = getChatState(getState())
        const conversationList = await initialConversionList()
        dispatch(
            updateState({
                conversationList: conversationList,
            })
        )
    }
)

export const createNewConversationInState = createAsyncThunk(
    'chatSlice/createNewConversationInState',
    async (params, { dispatch, getState }: any) => {
        const chatState: ChatState = getChatState(getState())
        const conversationList = await createNewConversation(chatState.conversationList)
        dispatch(
            updateState({
                conversationList: conversationList,
            })
        )
    }
)

export const updateConversationInfo = createAsyncThunk(
    'chatSlice/updateConversationInfo',
    async (conversation: IConversation, { dispatch, getState }: any) => {
        const chatState: ChatState = getChatState(getState())
        const { conversationId } = conversation || {}
        let newConversationList = _.clone(chatState.conversationList || [])
        await updateConversationInfoToDB({ conversation })

        const index = _.findIndex(newConversationList, { conversationId })
        if (index !== -1) {
            newConversationList[index] = _.assign({}, newConversationList[index], { ...conversation })
        }

        dispatch(
            updateState({
                conversationList: newConversationList,
            })
        )
    }
)

export const removeConversationAndChats = createAsyncThunk(
    'chatSlice/removeConversationAndChats',
    async (conversation: IConversation, { dispatch, getState }: any) => {
        const chatState: ChatState = getChatState(getState())
        const { conversationId } = conversation || {}
        let newConversationList = _.clone(chatState.conversationList || [])
        const index = _.findIndex(newConversationList, { conversationId })
        if (index > -1) {
            newConversationList.splice(index, 1)
        }
        await removeConversationAndChatsInDB(conversation)

        dispatch(
            updateState({
                conversationList: newConversationList,
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
        updateChatToConversation: (
            state,
            action: PayloadAction<{ conversationId: string; chatItem?: IChatItem; isFetching: boolean }>
        ) => {
            const { conversationId, chatItem, isFetching } = action.payload || {}
            let conversationList = _.clone(state.conversationList)
            state.conversationList = updateChatToConversationToDB({
                conversationId,
                conversationList,
                chatItem,
                isFetching,
            })
        },
    },
    extraReducers: builder => {
        builder.addCase(getGeminiChatAnswer.fulfilled, (state, action) => {
            const { status, text, conversationId } = (action.payload as any) || {}
            let conversationList
            if (status && text && conversationId) {
                conversationList = updateChatToConversationToDB({
                    conversationId,
                    conversationList: state.conversationList,
                    chatItem: {
                        conversationId,
                        role: Roles.model,
                        parts: [{ text }],
                        timestamp: Date.now(),
                    },
                    isFetching: false,
                })
            } else {
                conversationList = updateChatToConversationToDB({
                    conversationId,
                    conversationList: state.conversationList,
                    isFetching: false,
                })
            }
            state.conversationList = conversationList
        })
    },
})

// export actions
export const { updateState, updateChatToConversation } = chatSlice.actions
export default chatSlice.reducer

// ********** helper **********
const updateChatToConversationToDB = ({
    conversationId,
    chatItem,
    isFetching,
    conversationList,
}: {
    conversationId: string
    chatItem?: IChatItem
    isFetching: boolean
    conversationList: ChatState['conversationList']
}) => {
    const newConversationList = _.clone(conversationList)
    if (chatItem) {
        let hasTheConversation = false
        _.each(newConversationList, conversation => {
            if (conversation.conversationId == conversationId) {
                conversation.isFetching = isFetching
                hasTheConversation = true
                conversation.history = _.isEmpty(conversation.history)
                    ? [chatItem]
                    : conversation.history?.concat(chatItem)
                return false
            }
        })

        if (!hasTheConversation) {
            newConversationList.push({
                conversationId,
                history: [chatItem],
                isFetching,
            })
        }

        // save to indexedDb
        geminiChatDb.chats.add({
            conversationId,
            role: chatItem.role,
            text: chatItem.parts[0].text,
            timestamp: chatItem.timestamp || Date.now(),
        })
    } else {
        _.each(newConversationList, conversation => {
            if (conversation.conversationId == conversationId) {
                conversation.isFetching = isFetching
                return false
            }
        })
    }
    return newConversationList
}

const updateConversationInfoToDB = async ({ conversation }: { conversation: IConversation }) => {
    const { conversationId } = conversation || {}
    let newConversationList = await geminiChatDb.conversations.toArray()
    const index = _.findIndex(newConversationList, { conversationId })
    let updatedConversation
    if (index !== -1) {
        updatedConversation = newConversationList[index]
        newConversationList[index] = _.assign({}, newConversationList[index], { ...conversation })

        const theConversationInDB = await geminiChatDb.conversations.get({ conversationId })
        if (theConversationInDB?.id) {
            // 不存在于 db 中
            delete conversation.history
            delete conversation.isFetching
            await geminiChatDb.conversations.update(theConversationInDB.id, { ...conversation })
        }
    }
}

// initialConversionList from db
const initialConversionList = async () => {
    let conversationList = await geminiChatDb.conversations.toArray()
    // if it is empty, create one
    if (_.isEmpty(conversationList)) {
        const newConversationItem = {
            conversationId: generateReversibleToken(),
            conversationName: defaultConversaionName,
            topK: 1,
            temperature: 0.9,
            topP: 1,
            maxOutputTokens: 2048,
            harassment: HarmBlockThreshold.BLOCK_NONE,
            hateSpeech: HarmBlockThreshold.BLOCK_NONE,
            sexuallyExplicit: HarmBlockThreshold.BLOCK_NONE,
            dangerousContent: HarmBlockThreshold.BLOCK_NONE,
            modelAvatar: `/avatars/${__avatar__[Math.floor(Math.random() * 6)]}.png`,
            historyLimitTS: -1,
            archivedTS: -1,
        }

        await geminiChatDb.conversations.add(newConversationItem)
        conversationList = [newConversationItem]
    }

    let chats = await geminiChatDb.chats.toArray()

    let xhistory: IChatItem[]
    return _.map(conversationList, c => {
        xhistory = []
        _.map(chats, chatItem => {
            if (chatItem?.conversationId == c?.conversationId) {
                xhistory.push({
                    conversationId: chatItem.conversationId,
                    role: chatItem.role,
                    timestamp: chatItem.timestamp,
                    parts: [{ text: chatItem.text }],
                })
            }
        })

        return {
            ...c,
            isFetching: false,
            history: xhistory,
        }
    })
}

const createNewConversation = async (conversationList?: IConversation[]) => {
    conversationList = conversationList || (await geminiChatDb.conversations.toArray())
    const newConversationItem = {
        conversationId: generateReversibleToken(),
        conversationName: defaultConversaionName,
        topK: 1,
        temperature: 0.9,
        topP: 1,
        maxOutputTokens: 2048,
        harassment: HarmBlockThreshold.BLOCK_NONE,
        hateSpeech: HarmBlockThreshold.BLOCK_NONE,
        sexuallyExplicit: HarmBlockThreshold.BLOCK_NONE,
        dangerousContent: HarmBlockThreshold.BLOCK_NONE,
        modelAvatar: `/avatars/${__avatar__[Math.floor(Math.random() * 6)]}.png`,
        isSelected: true,
        historyLimitTS: -1,
        archivedTS: -1,
    }

    geminiChatDb
        .transaction('rw', geminiChatDb.conversations.name, async () => {
            await geminiChatDb.conversations.toCollection().each(async item => {
                item.isSelected = false
                await geminiChatDb.conversations.put(item)
            })
        })
        .catch(error => {
            console.error('Error updating data:', error)
        })

    await geminiChatDb.conversations.add(newConversationItem)

    return _.map(conversationList, c => {
        return { ...c, isSelected: false }
    }).concat([{ ...newConversationItem }])
}

const removeConversationAndChatsInDB = async (conversation: IConversation) => {
    const { conversationId } = conversation || {}
    await geminiChatDb.conversations.where('conversationId').equals(conversationId).delete()
    await geminiChatDb.chats.where('conversationId').equals(conversationId).delete()
}
