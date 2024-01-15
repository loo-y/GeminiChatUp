import { createAsyncThunk, createSlice, original, PayloadAction } from '@reduxjs/toolkit'
import type { AppState, AppThunk } from '@/app/store'
import * as API from '@/app/shared/API'
import { fetchGeminiChat, fetchTokenCount, fetchGeminiContent } from '@/app/shared/API'
import { ChatState, IConversation } from './interface'
// import _ from 'lodash' // use specific function from lodash
import { map as _map } from 'lodash'
import type { AsyncThunk } from '@reduxjs/toolkit'
import _ from 'lodash'
import { IChatItem, Roles, GeminiModel, IImageItem } from '@/app/shared/interfaces'
import { geminiChatDb, DBConversation } from '@/app/shared/db'
import { HarmBlockThreshold, HarmCategory, Part } from '@google/generative-ai'
import { generateReversibleToken, getPureDataFromImageBase64 } from '@/app/shared/utils'
import { defaultConversaionName, inputTokenLimit } from '@/app/shared/constants'

// define a queue to store api request
type APIFunc = (typeof API)[keyof typeof API]
type APIFuncName = keyof typeof API
export const getChatState = (state: AppState): ChatState => state.chatStore

const initialState: ChatState & Record<string, any> = {
    requestInQueueFetching: false,
    conversationList: [],
    imageResourceList: [],
    inputImageList: [],
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

export const getGeminiContentAnswer = createAsyncThunk(
    'chatSlice/getGeminiContentAnswer',
    async (
        {
            inputImageList,
            history,
            inputText,
            conversationId,
            conversation,
        }: {
            history?: IChatItem[]
            inputText?: string
            conversationId: string
            conversation: IConversation
        } & Partial<Pick<ChatState, 'inputImageList'>>,
        { dispatch, getState }: any
    ) => {
        const chatState: ChatState = getChatState(getState())
        const { imageResourceList } = chatState || {}
        let historyLimitTS = conversation.historyLimitTS || -1
        const suffix = ` \n `
        const prefix = `question: `
        const systemText = `now we are in a conversation. and please answer in the language that i asked in question.`
        let parts: Part[] = [
            {
                text: systemText,
            },
        ]
        if (history?.length) {
            // 移除重复的
            history = _.reduce(
                history,
                (result: IChatItem[], item: IChatItem) => {
                    if (result.length === 0 || item.role !== _.last(result)?.role) {
                        result.push(item)
                    }
                    return result
                },
                []
            )
            _.map(history, chatItem => {
                const { parts: chatItemParts, imageList, role } = chatItem || {}
                const _prefix_ = role == Roles.model ? `answer: ` : prefix
                if (imageList?.length) {
                    _.map(imageList, imageId => {
                        const theImage = _.find(imageResourceList, imageResource => {
                            return imageId == imageResource?.imageId
                        })
                        if (theImage?.base64Data && theImage.mimeType) {
                            const pureBase64Data = getPureDataFromImageBase64(theImage.base64Data)
                            parts.push({
                                inlineData: {
                                    data: pureBase64Data,
                                    mimeType: theImage.mimeType,
                                },
                            })
                        }
                    })
                }
                if (chatItemParts?.[0]?.text) {
                    parts.push({
                        text: _prefix_ + chatItemParts?.[0]?.text + suffix,
                    })
                }
            })
        }

        if (inputText) {
            let newChatItem: IChatItem = {
                conversationId,
                role: Roles.user,
                parts: [{ text: inputText }],
                timestamp: Date.now(),
            }

            if (!_.isEmpty(inputImageList)) {
                // for ts check
                inputImageList = inputImageList as IImageItem[]
                newChatItem.imageList = _.map(inputImageList, i => {
                    parts.push({
                        inlineData: {
                            data: getPureDataFromImageBase64(i.base64Data),
                            mimeType: i.mimeType,
                        },
                    })
                    return i.imageId
                })
                dispatch(updateImageToStateAndDB({ inputImageList }))
            }

            parts.push({
                text: prefix + inputText + suffix + `answer: `,
            })

            dispatch(
                updateChatToConversation({
                    conversationId,
                    chatItem: newChatItem,
                    isFetching: true,
                })
            )
        } else {
            parts.push({
                text: suffix + `answer: `,
            })
            dispatch(
                updateChatToConversation({
                    conversationId,
                    isFetching: true,
                })
            )
        }

        // ========== TODO history Limit ==========
        // ========== TODO history Limit ==========

        const { safetySettings, generationConfig } = getFetchSettingsFromConverstaion(conversation)

        dispatch(
            makeApiRequestInQueue({
                apiRequest: fetchGeminiContent.bind(null, {
                    parts,
                    conversationId,
                    generationConfig,
                    safetySettings,
                }),
                asyncThunk: getGeminiContentAnswer,
            })
        )
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
        }: { history?: IChatItem[]; inputText?: string; conversationId: string; conversation: IConversation },
        { dispatch, getState }: any
    ) => {
        const chatState: ChatState = getChatState(getState())
        let historyLimitTS = conversation.historyLimitTS || -1

        let newChatItem: IChatItem | undefined = undefined

        if (inputText) {
            newChatItem = {
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
        } else {
            // 将原本history中的最后一条赋值给 inputText
            const lastItem = history && history.splice(-1)
            history = _.reduce(
                history,
                (result: IChatItem[], item: IChatItem) => {
                    if (result.length === 0 || item.role !== _.last(result)?.role) {
                        result.push(item)
                    }
                    return result
                },
                []
            )
            inputText = lastItem?.[0]?.parts?.[0]?.text || ''
            dispatch(
                updateChatToConversation({
                    conversationId,
                    isFetching: true,
                })
            )
        }

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
                }).concat(
                    newChatItem
                        ? [
                              {
                                  role: newChatItem.role,
                                  parts: newChatItem.parts,
                              },
                          ]
                        : []
                ),
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
                        historyLimitTS = newChatItem?.timestamp || -1
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

        const { safetySettings, generationConfig } = getFetchSettingsFromConverstaion(conversation)
        dispatch(
            makeApiRequestInQueue({
                apiRequest: fetchGeminiChat.bind(null, {
                    history: historyToFetch,
                    inputText,
                    conversationId,
                    generationConfig,
                    safetySettings,
                }),
                asyncThunk: getGeminiChatAnswer,
            })
        )
    }
)

export const initiaStateFromDB = createAsyncThunk(
    'chatSlice/initiaStateFromDB',
    async (params, { dispatch, getState }: any) => {
        const chatState: ChatState = getChatState(getState())
        const conversationList = await initialConversionList()
        const imageResourceList = await initialImageResoureFromDB()
        dispatch(
            updateState({
                conversationList,
                imageResourceList,
            })
        )
    }
)

export const createNewConversationInState = createAsyncThunk(
    'chatSlice/createNewConversationInState',
    async (params: { modelType?: GeminiModel }, { dispatch, getState }: any) => {
        const { modelType } = params || {}
        const chatState: ChatState = getChatState(getState())
        const conversationList = await createNewConversation({
            conversationList: chatState.conversationList,
            modelType,
        })
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
        const { archived, history, isFetching, ...others } = conversation || {}
        await updateConversationInfoToDB({
            conversation: { ...others },
        })

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
        const { conversationList } = chatState
        const { conversationId } = conversation || {}
        let newConversationList = _.clone(conversationList || [])
        const index = _.findIndex(newConversationList, { conversationId })
        if (index > -1) {
            if (index > 0) {
                newConversationList[index - 1] = {
                    ...newConversationList[index - 1],
                    isSelected: true,
                }
            } else if (index == 0 && newConversationList.length > 1) {
                newConversationList[1] = {
                    ...newConversationList[1],
                    isSelected: true,
                }
            }

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
        updateSelectConversation: (state, action: PayloadAction<IConversation>) => {
            const conversation = action.payload
            let { conversationId } = conversation || {}
            let newConversationList = _.clone(state.conversationList || [])
            let conversationListToDB: Partial<DBConversation>[] = []
            newConversationList = _.map(newConversationList, c => {
                const { history, archived, isFetching, ...rest } = c || {}
                const isSelected = c.conversationId == conversationId
                conversationListToDB.push({
                    ...rest,
                    isSelected,
                })
                return {
                    ...c,
                    isSelected,
                }
            })
            updateConversationListToDB({
                conversationList: conversationListToDB,
            })
            state.conversationList = newConversationList
        },
        archiveConversationHistory: (state, action: PayloadAction<IConversation>) => {
            const conversation = action.payload
            let { conversationId, history, archived, isFetching, ...others } = conversation || {}
            const historyLength = history && history.length
            if (conversationId && historyLength) {
                // for ts
                history = history as IChatItem[]
                const lastHistory = history[historyLength - 1]
                let newConversationList = _.clone(state.conversationList || [])
                const index = _.findIndex(newConversationList, { conversationId })
                if (index !== -1) {
                    newConversationList[index] = _.assign({}, newConversationList[index], {
                        ...conversation,
                        archived: (archived || []).concat([...history]),
                        history: [],
                    })
                }
                updateConversationInfoToDB({
                    conversation: {
                        conversationId,
                        ...others,
                        archivedTS: lastHistory?.timestamp || -1,
                    },
                })
                state.conversationList = newConversationList
            }
        },
        setRequestInQueueFetching: (state, action: PayloadAction<boolean>) => {
            state.requestInQueueFetching = action.payload
        },
        updateState: (state, action: PayloadAction<Partial<ChatState>>) => {
            return { ...state, ...action.payload }
        },
        updateImageToStateAndDB: (state, action: PayloadAction<Pick<ChatState, 'inputImageList'>>) => {
            const { inputImageList } = action.payload || {}
            // update Image to DB
            updateImagesToDB({ imageList: inputImageList })
            // update Image to state imageResourceList
            state.imageResourceList = state.imageResourceList.concat(inputImageList)
            state.inputImageList = []
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
        addImageToInput: (state, action: PayloadAction<{ base64Content: string; mimeType: string }>) => {
            const { base64Content, mimeType } = action.payload || {}
            let currentInputImageList = _.clone(state.inputImageList) || []
            currentInputImageList.push({
                imageId: generateReversibleToken(),
                base64Data: base64Content,
                timestamp: Date.now(),
                mimeType,
            })
            state.inputImageList = currentInputImageList
        },
        deleteImageFromInput: (state, action: PayloadAction<{ imageId: string }>) => {
            const { imageId } = action.payload || {}
            let currentInputImageList = _.clone(state.inputImageList) || []
            currentInputImageList = _.filter(currentInputImageList, imageItem => {
                return imageItem?.imageId != imageId
            })
            state.inputImageList = currentInputImageList
        },
        clearInputImageList: state => {
            state.inputImageList = []
        },
    },
    extraReducers: builder => {
        builder.addCase(getGeminiChatAnswer.fulfilled, (state, action) => {
            const { status, text, conversationId, error } = (action.payload as any) || {}
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
                    fetchFailed: true,
                    failedInfo: error,
                    isFetching: false,
                })
            }
            state.conversationList = conversationList
        }),
            builder.addCase(getGeminiChatAnswer.rejected, (state, action) => {
                const { status, text, conversationId, error } = (action.payload as any) || {}
                console.log(`getGeminiContentAnswer.rejected`)
                let conversationList = updateChatToConversationToDB({
                    conversationId,
                    conversationList: state.conversationList,
                    fetchFailed: true,
                    failedInfo: error,
                    isFetching: false,
                })
                state.conversationList = conversationList
            }),
            builder.addCase(getGeminiContentAnswer.fulfilled, (state, action) => {
                const { status, text, conversationId, error } = (action.payload as any) || {}
                console.log(`error`, error)
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
                        fetchFailed: true,
                        failedInfo: error,
                        isFetching: false,
                    })
                }
                state.conversationList = conversationList
            }),
            builder.addCase(getGeminiContentAnswer.rejected, (state, action) => {
                const { status, text, conversationId, error } = (action.payload as any) || {}
                console.log(`error`, error)
                console.log(`getGeminiContentAnswer.rejected`)
                let conversationList = updateChatToConversationToDB({
                    conversationId,
                    conversationList: state.conversationList,
                    fetchFailed: true,
                    failedInfo: error,
                    isFetching: false,
                })
                state.conversationList = conversationList
            })
    },
})

// export actions
export const {
    updateState,
    updateChatToConversation,
    addImageToInput,
    deleteImageFromInput,
    clearInputImageList,
    updateImageToStateAndDB,
    archiveConversationHistory,
    updateSelectConversation,
} = chatSlice.actions
export default chatSlice.reducer

// ********** helper **********
const updateChatToConversationToDB = ({
    conversationId,
    chatItem,
    isFetching,
    fetchFailed,
    failedInfo,
    conversationList,
}: {
    conversationId: string
    chatItem?: IChatItem
    isFetching: boolean
    fetchFailed?: boolean
    failedInfo?: string
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
            imageList: chatItem.imageList || [],
        })
    } else {
        _.each(newConversationList, conversation => {
            if (conversation.conversationId == conversationId) {
                const historyLength = conversation?.history?.length
                const lastItem = historyLength && conversation?.history && conversation.history[historyLength - 1]
                if (conversation.history && historyLength && lastItem) {
                    conversation.history[historyLength - 1] = {
                        ...lastItem,
                        isFailed: fetchFailed ? true : false,
                        failedInfo: fetchFailed ? failedInfo || '' : ``,
                    }
                }
                conversation.isFetching = isFetching
                return false
            }
        })
    }
    return newConversationList
}

const updateImagesToDB = async ({ imageList }: { imageList?: IImageItem[] }) => {
    if (!imageList?.length) return
    _.each(imageList, async imageItem => {
        await geminiChatDb.images.add(imageItem)
    })
}

const updateConversationInfoToDB = async ({ conversation }: { conversation: Partial<DBConversation> }) => {
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
            // @ts-ignore
            delete conversation.history
            // @ts-ignore
            delete conversation.isFetching
            await geminiChatDb.conversations.update(theConversationInDB.id, { ...conversation })
        }
    }
}

const updateConversationListToDB = async ({ conversationList }: { conversationList: Partial<DBConversation>[] }) => {
    const length = conversationList.length
    for (let i = 0; i < length; i++) {
        let theConversation = conversationList[i]
        let conversationId = theConversation.conversationId
        const theConversationInDB = await geminiChatDb.conversations.get({ conversationId })
        if (theConversationInDB?.id) {
            await geminiChatDb.conversations.update(theConversationInDB.id, { ...theConversation })
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
            modelType: GeminiModel.geminiPro,
            isSelected: true,
        }

        await geminiChatDb.conversations.add(newConversationItem)
        conversationList = [newConversationItem]
    }

    let chats = await geminiChatDb.chats.toArray()

    let xhistory: IChatItem[] = [],
        xarchived: IChatItem[] = []

    let conversationListForState: IConversation[] = []
    let hasSelected = false
    conversationListForState = _.map(conversationList, c => {
        ;(xhistory = []), (xarchived = [])
        const { archivedTS, conversationId, isSelected } = c
        _.map(chats, chatItem => {
            if (chatItem?.conversationId == conversationId) {
                console.log(`conversationId-->`, conversationId)
                const ts = chatItem.timestamp
                const item = {
                    conversationId: chatItem.conversationId,
                    role: chatItem.role,
                    timestamp: chatItem.timestamp,
                    parts: [{ text: chatItem.text }],
                    imageList: chatItem?.imageList || [],
                }
                if (archivedTS >= ts) {
                    xarchived.push(item)
                } else {
                    xhistory.push(item)
                }
            }
        })

        if (isSelected) hasSelected = true
        return {
            ...c,
            isFetching: false,
            history: xhistory,
            archived: xarchived,
        }
    })

    if (!hasSelected) conversationListForState[0].isSelected = true
    return conversationListForState
}

const initialImageResoureFromDB = async () => {
    let imageResourceList = (await geminiChatDb.images.toArray()) || []
    return imageResourceList
}

const createNewConversation = async ({
    modelType,
    conversationList,
}: {
    conversationList?: IConversation[]
    modelType?: GeminiModel
}) => {
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
        modelType: modelType == GeminiModel.geminiProVision ? GeminiModel.geminiProVision : GeminiModel.geminiPro,
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
    const { conversationId, history } = conversation || {}
    let imageIDList: string[] = []
    if (!history?.length) {
        _.map(history, (chatItem: IChatItem) => {
            if (chatItem.imageList?.length) {
                imageIDList = imageIDList.concat(chatItem.imageList)
            }
        })
    }

    await geminiChatDb.conversations.where('conversationId').equals(conversationId).delete()
    await geminiChatDb.chats.where('conversationId').equals(conversationId).delete()

    if (!imageIDList?.length) {
        await geminiChatDb.images.where('imageId').equals(imageIDList).delete()
    }
}

const getFetchSettingsFromConverstaion = (conversation: IConversation) => {
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
    return {
        safetySettings,
        generationConfig: {
            topK,
            topP,
            temperature,
            maxOutputTokens,
        },
    }
}
