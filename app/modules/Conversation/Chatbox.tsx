'use client'
import React, { useState, ChangeEvent, KeyboardEvent, useRef, useMemo, useEffect } from 'react'
import { Roles } from '@/app/shared/interfaces'
import _ from 'lodash'
import {
    getChatState,
    getGeminiChatAnswer,
    updateConversationInfo,
    removeConversationAndChats,
} from '../../(pages)/chat/slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { useSearchParams } from 'next/navigation'
import { IConversation } from '../../(pages)/chat/interface'
import { IChatItem } from '@/app/shared/interfaces'
import ReactMarkdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { formatDate } from '@/app/shared/utils'
import Popup from '@/app/components/Popup'
import RangeInput from '@/app/components/RangeInput'
import SeparateLineWithText from '@/app/components/SeparateLineWithText'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import DisableSafariBounce from '@/app/components/DisableSafariBounce'
import ChatInput from './ChatInput'
import ChatInputWithAttachment from './ChatInputWithAttachment'
import ConversationSetting from './ConversationSetting'
import ConversationDelete from './ConversationDelete'

const ChatBox = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const searchParams = useSearchParams()
    const queryInputValue = searchParams.get('input') || ``
    const conversation = useMemo((): IConversation => {
        return (
            _.find(state.conversationList, conversation => {
                return conversation.isSelected == true
            }) || state.conversationList[0]
        )
    }, [state.conversationList])
    const { history, conversationId, modelAvatar, conversationName, isFetching } = conversation || {}

    return (
        <div className="__chatbox__ flex flex-col text-stone-900 bg-[#fafafa]">
            <div className="flex-none title h-16 flex border-b border-[#eee] border-solid rounded-tr-lg bg-white">
                <div className=" flex flex-row items-center ml-4 w-full">
                    <div className="flex-none flex-row flex w-1/2 items-center gap-4">
                        <div className="__conversation_avatar__ flex h-[3.25rem] w-[3.25rem] items-center justify-center bg-stone-300 rounded-full">
                            <img src={modelAvatar} className="h-12 w-12" />
                        </div>
                        <div className="flex flex-col">
                            <div className="__conversation_name__ flex font-bold">
                                <span>{conversationName}</span>
                            </div>
                            {isFetching ? (
                                <div className="__conversation_status__ flex text-sm text-lightGreen">
                                    <span>{`is typing...`}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <div className=" flex flex-grow items-center justify-end mr-4 flex-row gap-4">
                        <ConversationDelete conversation={conversation} />
                        <ConversationSetting conversation={conversation} />
                    </div>
                </div>
            </div>
            <div className="flex flex-grow overflow-auto relative chatinfo rounded-br-lg md:ml-12 md:mr-8 ml-4 mr-0">
                <ChatContent contentList={history} />
                {queryInputValue == `attachment` ? (
                    <ChatInputWithAttachment conversation={conversation} attachable={true} />
                ) : (
                    <ChatInput conversation={conversation} />
                )}
                {/* <ChatInput conversation={conversation} /> */}
                {/* <ChatInputWithAttachment conversation={conversation} /> */}
            </div>
        </div>
    )
}

export default ChatBox

interface IChatContentProps {
    contentList?: IChatItem[]
}
const ChatContent = ({ contentList }: IChatContentProps) => {
    const contentRef = useRef(null)
    useEffect(() => {
        if (contentRef.current) {
            const theElement = contentRef.current as HTMLElement
            theElement.scrollTo(0, theElement.scrollHeight)
        }
    }, [contentList])

    const roleAiClass = ` justify-start italic`,
        roleHumanClass = ` justify-end text-white italic`
    const roleAiInnerClass = ` bg-lightWhite not-italic`,
        roleHumanInnerClass = ` bg-lightGreen text-teal-50 not-italic `

    if (_.isEmpty(contentList)) {
        return <div className="__chat_content__ flex"></div>
    }

    return (
        <div
            className="__chat_content__ relative mt-4 mb-44 pr-4 overflow-scroll w-full text-textBlackColor leading-relaxed"
            ref={contentRef}
        >
            <div className="flex flex-col gap-6 w-full max-w-[73rem] mx-auto ">
                {_.map(contentList, (contentItem, index) => {
                    const { role, parts, timestamp } = contentItem || {}
                    const contentText = parts[0].text
                    return (
                        <div
                            className={`flex items-center flex-grow  ${
                                role == Roles.model ? roleAiClass : roleHumanClass
                            }`}
                            key={`__chat_content_item_${index}__`}
                        >
                            <div
                                className={`rounded-xl flex flex-col px-3 py-2 w-fit  max-w-[80%] gap-1 ${
                                    role == Roles.model ? roleAiInnerClass : roleHumanInnerClass
                                }`}
                            >
                                <ReactMarkdown
                                    components={{
                                        code(props) {
                                            const { children, className, node, ...rest } = props
                                            const match = /language-(\w+)/.exec(className || '')
                                            return match ? (
                                                <div className="text-sm mb-2 ">
                                                    {/* @ts-ignore */}
                                                    <SyntaxHighlighter
                                                        {...rest}
                                                        wrapLines={true}
                                                        wrapLongLines={true}
                                                        PreTag="div"
                                                        language={match[1]}
                                                        style={docco}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                </div>
                                            ) : (
                                                <code {...rest} className={className}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                    }}
                                >
                                    {contentText}
                                </ReactMarkdown>
                                <div
                                    className={`flex __timestamp__ text-stone-400 text-xs ${
                                        role == Roles.model ? roleAiClass : roleHumanClass
                                    }`}
                                >
                                    {formatDate(timestamp)}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
