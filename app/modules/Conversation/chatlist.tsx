'use client'
import 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { getChatState, createNewConversationInState, updateState } from '../../(pages)/chat/slice'
import _ from 'lodash'
import { IChatItem, Roles } from '@/app/shared/interfaces'
import { formatDate } from '@/app/shared/utils'
import { IConversation } from '@/app/(pages)/chat/interface'

const ChatList = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    // createNewConversationInState
    const handleAddNewConsation = () => {
        dispatch(createNewConversationInState())
    }
    return (
        <div className="__chatlist__ flex w-full mt-4">
            <div className="__chatlist_topsetting__ w-full flex flex-col text-textBlackColor">
                <div className="flex flex-row mx-4 gap-4">
                    <div className="__add_new_chat__ flex items-center mx-[0.5px] active:mr-[-.05px]">
                        <img
                            src={'/images/plus.svg'}
                            className="h-6 w-6 cursor-pointer  shadow-lg shadow-transparent hover:shadow-white-600/50 active:shadow-transparent-400/50 active:mt-[0.5px] active:ml-[0.5px]"
                            onClick={handleAddNewConsation}
                        />
                    </div>
                    <SearchInput />
                </div>

                <ConversationList />
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

const ConversationList = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const { conversationList } = state || {}
    const isSlectedConversationClass = `bg-stone-100`
    const handleSelectConversation = (theConversation: IConversation) => {
        dispatch(
            updateState({
                conversationList: _.map(conversationList, c => {
                    if (c.conversationId == theConversation.conversationId) {
                        return {
                            ...c,
                            isSelected: true,
                        }
                    }
                    return {
                        ...c,
                        isSelected: false,
                    }
                }),
            })
        )
    }
    return (
        <div className="__conversationlist__ flex flex-col mt-6 gap-3">
            {_.map(conversationList, (theConversation, conversationIndex) => {
                const { conversationName, history, isSelected, modelAvatar } = theConversation || {}
                const lastChatItem: IChatItem | undefined = history && history[history.length - 1]
                const lastText = lastChatItem?.parts?.[0]?.text
                const isUser = lastChatItem?.role == Roles.user
                const lastTimestamp = lastChatItem?.timestamp || ``
                return (
                    <div
                        key={`____conversationlist__${conversationIndex}`}
                        className={`flex flex-row gap-3 py-4 px-4 cursor-pointer ${
                            isSelected ? isSlectedConversationClass : ''
                        }`}
                        onClick={() => {
                            handleSelectConversation(theConversation)
                        }}
                    >
                        <div className="__conersation_avatar__ flex items-center justify-start">
                            {modelAvatar ? (
                                <div className="h-10 w-10 rounded-full">
                                    <img src={modelAvatar} />
                                </div>
                            ) : null}
                        </div>
                        <div className="flex flex-col gap-1 line-clamp-1 mr-3">
                            <div className="">{conversationName}</div>
                            {lastText ? (
                                <div className="text-textGrayColor text-sm line-clamp-1">
                                    {isUser ? 'You: ' : ''}
                                    {lastText}
                                </div>
                            ) : null}
                        </div>
                        <div className="__conersation_updatetime__ flex items-center justify-end flex-grow text-xs text-stone-500">
                            {lastTimestamp ? <span>{formatDate(lastTimestamp)}</span> : null}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
export default ChatList
