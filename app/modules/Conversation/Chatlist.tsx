'use client'
import 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import {
    getChatState,
    createNewConversationInState,
    updateState,
    updateSelectConversation,
} from '../../(pages)/chat/slice'
import _ from 'lodash'
import { GeminiModel, IChatItem, Roles } from '@/app/shared/interfaces'
import { formatDate } from '@/app/shared/utils'
import { IConversation } from '@/app/(pages)/chat/interface'
import TopMenu from './TopMenu'

const ChatList = ({ className, clickCallback }: { className?: string; clickCallback?: () => void }) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    // createNewConversationInState
    const handleAddNewConsation = () => {
        dispatch(createNewConversationInState({}))
    }
    return (
        <div className="__chatlist__ flex w-full mt-0">
            <div
                className={`__chatlist_topsetting__ w-full flex flex-col text-textBlackColor pb-2 h-[100vh] ${className || ''}`}
            >
                <div className="flex flex-row mx-4 gap-4 h-16 items-center border-b">
                    <TopMenu clickCallback={clickCallback} />
                    {/* <div className="__add_new_chat__ flex items-center mx-[0.5px] active:mr-[-.05px]">
                        <img
                            src={'/images/plus.svg'}
                            className="h-6 w-6 cursor-pointer  shadow-lg shadow-transparent hover:shadow-white-600/50 active:shadow-transparent-400/50 active:mt-[0.5px] active:ml-[0.5px]"
                            onClick={handleAddNewConsation}
                        />
                    </div>
                    <SearchInput /> */}
                </div>

                <ConversationList clickCallback={clickCallback} />
            </div>
        </div>
    )
}

const SearchInput = () => {
    return (
        <div className="__chatlist_searchinput__ flex rounded-2xl h-10 bg-[#eee] px-3 text-stone-600 w-full">
            <input type="search" className="outline-none flex-grow bg-[#eee]  " placeholder="search"></input>
        </div>
    )
}

const ConversationList = ({ clickCallback }: { clickCallback?: () => void }) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const { conversationList } = state || {}
    const isSlectedConversationClass = `bg-gray-500  text-gray-100 `
    const unSlectedConversationClass = `bg-gray-100`
    const isSlectedConversationInnerTextClass = `text-gray-50`
    const unSlectedConversationInnerTextClass = `text-gray-400`
    const handleSelectConversation = (theConversation: IConversation) => {
        dispatch(
            updateSelectConversation({
                ...theConversation,
            })
        )
        clickCallback && clickCallback()
        // dispatch(
        //     updateState({
        //         conversationList: _.map(conversationList, c => {
        //             if (c.conversationId == theConversation.conversationId) {
        //                 return {
        //                     ...c,
        //                     isSelected: true,
        //                 }
        //             }
        //             return {
        //                 ...c,
        //                 isSelected: false,
        //             }
        //         }),
        //     })
        // )
    }
    return (
        <div className="__conversationlist__ flex flex-col mt-3 gap-1 relative flex-1  overflow-scroll bg-white">
            {_.map(conversationList, (theConversation: IConversation, conversationIndex) => {
                const { conversationName, history, isSelected, modelAvatar, isFetching, modelType } =
                    theConversation || {}
                const lastChatItem: IChatItem | undefined = history && history[history.length - 1]
                const lastText = lastChatItem?.parts?.[0]?.text
                const isUser = lastChatItem?.role == Roles.user
                const lastTimestamp = lastChatItem?.timestamp || ``
                return (
                    <div
                        key={`__conversationlist__${conversationIndex}`}
                        className={`flex py-1 px-2 cursor-pointer `}
                        onClick={() => {
                            handleSelectConversation(theConversation)
                        }}
                    >
                        <div
                            className={`flex flex-row gap-3 shadow rounded-3xl mx-1 py-5 pl-2 pr-4 flex-grow justify-between overflow-hidden ${
                                isSelected ? isSlectedConversationClass : unSlectedConversationClass
                            }`}
                        >
                            <div className="flex flex-row gap-3 ">
                                <div className="__conersation_avatar__ flex items-center justify-start">
                                    {modelAvatar ? (
                                        <div className="flex items-center justify-center h-11 w-11 rounded-full bg-gray-300">
                                            <img src={modelAvatar} className="h-10 w-10 overflow-hidden" />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex flex-col gap-1 mr-3 overflow-hidden">
                                    <div className=" line-clamp-1">{conversationName}</div>
                                    {lastText && !isFetching ? (
                                        <div
                                            className={`${isSelected ? isSlectedConversationInnerTextClass : unSlectedConversationInnerTextClass} text-sm line-clamp-1 break-words`}
                                        >
                                            {isUser ? 'You: ' : ''}
                                            {lastText.substring(0, 50)}
                                        </div>
                                    ) : isFetching ? (
                                        <div className="text-lightGreen text-sm line-clamp-1">{`is typing...`}</div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex items-end justify-center flex-col gap-[0.375rem]">
                                {lastTimestamp ? (
                                    <div
                                        className={`__conersation_updatetime__ flex h-5 items-center justify-end flex-grow text-xs ${isSelected ? isSlectedConversationInnerTextClass : unSlectedConversationInnerTextClass}`}
                                    >
                                        <span>{formatDate(lastTimestamp)}</span>
                                    </div>
                                ) : null}
                                <div className="svg-image flex h-6 w-6 overflow-hidden items-center justify-end cursor-pointer bg-transparent">
                                    {modelType == GeminiModel.geminiProVision ? (
                                        <img
                                            src={`/images/image${isSelected ? '' : '-black'}.svg`}
                                            className="h-6 w-6"
                                        />
                                    ) : (
                                        <img
                                            src={`/images/chat${isSelected ? '' : '-black'}.svg`}
                                            className="h-5 w-5 mr-[0.125rem]"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
export default ChatList
