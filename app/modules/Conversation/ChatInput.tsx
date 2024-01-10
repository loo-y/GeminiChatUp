'use client'
import React, { useState, ChangeEvent, KeyboardEvent, useRef } from 'react'
import _ from 'lodash'
import { getGeminiChatAnswer } from '../../(pages)/chat/slice'
import { useAppDispatch } from '@/app/hooks'
import { IConversation } from '../../(pages)/chat/interface'
import { IChatItem } from '@/app/shared/interfaces'

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
            const currentInputRef = inputRef.current as HTMLTextAreaElement
            // setInputRows((prevRows) => prevRows + 1);
            // setInputValue((prevValue) => prevValue + '\n');
            const { selectionStart, selectionEnd } = currentInputRef
            const newInputValue = inputValue.substring(0, selectionStart) + '\n' + inputValue.substring(selectionEnd)
            setInputValue(newInputValue)
            setInputRows(value => value + 1)
            // 移动光标位置到插入换行符后
            const newSelectionStart = selectionStart + 1
            // 需要延时执行，否则无法定位，会被 setInputValue 后执行修改定位
            setTimeout(() => {
                currentInputRef.setSelectionRange(newSelectionStart, newSelectionStart)
                // currentInputRef.selectionStart = 3
                // currentInputRef.selectionEnd = 3;
            }, 0)
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
        if (!isFetching && inputValue?.length) {
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
                    conversation,
                    history: _history,
                    inputText: inputValue,
                })
            )
            setInputValue('')
            setInputRows(1)
        }
    }

    const handleTouchMove = (event: TouchEvent) => {
        event.preventDefault()
    }

    const handleFocus = () => {
        // document.body.addEventListener('touchmove', ()=>{inputRef.current?.blur()}, { passive: false });
    }
    const handleBlur = () => {
        setTimeout(() => {
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
            window.innerHeight = window.outerHeight
            window.scrollTo(0, 0)
        }, 50)
    }

    return (
        <div className="__chat_input__ absolute bottom-10 left-0 right-4 max-h-[7.5rem] flex">
            <div className="flex flex-row overflow-scroll rounded-xl bg-white border-[#eee] border border-r-0 border-solid flex-grow max-w-[73rem] mx-auto">
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
                    placeholder="Type your messeage here..."
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                ></textarea>
                <div
                    className="bg-lightGreen text-white w-20 flex items-center justify-center cursor-pointer"
                    onClick={handleSendQuestion}
                >
                    Send
                </div>
            </div>
        </div>
    )
}

export default ChatInput
