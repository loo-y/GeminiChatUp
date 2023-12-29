'use client'
import React, { useState, ChangeEvent, KeyboardEvent, useRef, useMemo, useEffect } from 'react'
import { Roles } from '@/app/shared/interfaces'
import _ from 'lodash'
import { getChatState, getGeminiChatAnswer, updateConversation } from '../../(pages)/chat/slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { IConversation } from '../../(pages)/chat/interface'
import { IChatItem } from '@/app/shared/interfaces'
import ReactMarkdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'

const ChatBox = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const conversation = useMemo((): IConversation => {
        return (
            _.find(state.conversationList, conversation => {
                return conversation.isSelected == true
            }) || state.conversationList[0]
        )
    }, [state.conversationList])

    console.log(`the conversation`, conversation)
    const { history, conversationId } = conversation || {}

    return (
        <div className="__chatbox__ flex h-full flex-col ">
            <div className="title h-20 flex border-l border-slate-300 border-solid rounded-tr-lg"></div>
            <div className="flex relative chatinfo h-full rounded-br-lg bg-slate-500 overflow-hidden">
                <ChatContent contentList={history} />
                <ChatInput conversation={conversation} />
            </div>
        </div>
    )
}

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

    const roleAiClass = ` justify-start`,
        roleHumanClass = ` justify-end `
    const roleAiInnerClass = ` bg-white `,
        roleHumanInnerClass = ` bg-lightGreen `

    if (_.isEmpty(contentList)) {
        return <div className="__chat_content__ flex "></div>
    }

    return (
        <div className="__chat_content__ relative mt-10 mb-36 ml-20 mr-16 pr-4 overflow-scroll w-full" ref={contentRef}>
            <div className="flex flex-col gap-6  w-full">
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
                                className={`rounded-xl w-fit px-3 py-2 max-w-[80%] ${
                                    role == Roles.model ? roleAiInnerClass : roleHumanInnerClass
                                }`}
                            >
                                <ReactMarkdown
                                    components={{
                                        code(props) {
                                            const { children, className, node, ...rest } = props
                                            const match = /language-(\w+)/.exec(className || '')
                                            return match ? (
                                                <div className="text-sm mb-2">
                                                    {/* @ts-ignore */}
                                                    <SyntaxHighlighter
                                                        {...rest}
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
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const ChatInput = ({ conversation }: { conversation: IConversation }) => {
    const dispatch = useAppDispatch()
    const [isComposing, setIsComposing] = useState(false)
    const [inputValue, setInputValue] = useState<string>('')
    const [inputRows, setInputRows] = useState<number>(1)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const handleCompositionStart = () => {
        setIsComposing(true)
    }

    const handleCompositionEnd = () => {
        setIsComposing(false)
    }

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(event.target.value)
        setInputRows(event.target.value.split('\n').length)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            // setInputRows((prevRows) => prevRows + 1);
            // setInputValue((prevValue) => prevValue + '\n');
            const { selectionStart, selectionEnd } = event.currentTarget
            const newInputValue = inputValue.substring(0, selectionStart) + '\n' + inputValue.substring(selectionEnd)
            setInputValue(newInputValue)
            // 移动光标位置到插入换行符后
            const newSelectionStart = selectionStart + 1
            event.currentTarget.setSelectionRange(newSelectionStart, newSelectionStart)
        } else if (event.key === 'Enter') {
            if (!isComposing) {
                event.preventDefault()
                handleSendQuestion()
            }
        }
    }

    const handleSendQuestion = () => {
        const { conversationId, isFetching, history } = conversation || {}
        console.log(`conversation`, conversation)
        if (!isFetching) {
            let _history = _.reduce(
                history,
                (result: IChatItem[], item: IChatItem) => {
                    if (result.length === 0 || item.role !== _.last(result)?.role) {
                        result.push(item)
                    }
                    return result
                },
                []
            )
            if (_.last(_history)?.role === 'user') {
                _history.pop() // 移除最后一条记录
            }
            dispatch(
                getGeminiChatAnswer({
                    conversationId,
                    history: _history,
                    inputText: inputValue,
                })
            )
            setInputValue('')
        }
    }

    return (
        <div className="__chat_input__ absolute bottom-10 left-20 right-20 max-h-[7.5rem] overflow-scroll rounded-lg flex flex-row bg-white">
            <textarea
                value={inputValue}
                ref={inputRef}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={inputRows}
                style={{ resize: 'none' }}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className="block flex-grow p-4 bg-white outline-none "
            ></textarea>
            <div
                className="bg-lightGreen text-white w-20 flex items-center justify-center cursor-pointer"
                onClick={handleSendQuestion}
            >
                Send
            </div>
        </div>
    )
}
export default ChatBox
