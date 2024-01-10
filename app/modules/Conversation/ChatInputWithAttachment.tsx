'use client'
import React, { useState, ChangeEvent, KeyboardEvent, useRef } from 'react'
import _ from 'lodash'
import { getGeminiChatAnswer } from '../../(pages)/chat/slice'
import { useAppDispatch } from '@/app/hooks'
import { IConversation } from '../../(pages)/chat/interface'
import { IChatItem } from '@/app/shared/interfaces'
import UploadImageButton from './UploadImageButton'

const ChatInputWithAttachment = ({
    conversation,
    attachable,
}: {
    conversation: IConversation
    attachable?: boolean
}) => {
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
        const currentValue = event.target.value
        setInputValue(currentValue)
        const rows = currentValue.split('\n').length + (currentValue.match(/\n$/)?.[1] ? 1 : 0)
        setInputRows(rows)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            // setInputRows((prevRows) => prevRows + 1);
            // setInputValue((prevValue) => prevValue + '\n');
            const currentInputRef = inputRef.current as HTMLTextAreaElement
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
        <>
            {/* <div className='__chatinput_with_attachment__ absolute bottom-10 left-0 right-4 max-h-[7.5rem] overflow-scroll bg-transparent flex flex-row gap-2'> */}

            <div className="__chatinput_with_attachment__ absolute bottom-10 left-0 right-4 max-h-[7.5rem] flex">
                <div className="overflow-y-scroll overflow-x-hidden bg-transparent flex flex-row gap-1 flex-grow max-w-[73rem] mx-auto">
                    <div className="flex w-10 items-end ">
                        <div className=" flex ">
                            <div className="svg-image flex h-[3.75rem] w-8 overflow-hidden items-center justify-center cursor-pointer">
                                <img src={'/images/clear.svg'} className="h-7 w-7 " />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-grow flex-row rounded-[2rem] border-2 border-green-600 bg-white pl-5 gap-1">
                        <div className="flex my-1 flex-row flex-grow ml-2 bg-transparent">
                            <textarea
                                value={inputValue}
                                ref={inputRef}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                rows={inputRows}
                                style={{ resize: 'none' }}
                                onCompositionStart={handleCompositionStart}
                                onCompositionEnd={handleCompositionEnd}
                                className="block flex-grow bg-white outline-none py-2 w-full text-lg"
                                placeholder="Type your messeage here..."
                                onBlur={handleBlur}
                                onFocus={handleFocus}
                            ></textarea>
                        </div>
                        <div className="flex flex-row justify-end items-end my-2 mr-[0.4rem] gap-1">
                            {attachable ? (
                                <div className=" items-center flex">
                                    <UploadImageButton />
                                </div>
                            ) : null}
                            <div className=" items-center flex">
                                <div
                                    className="svg-image flex h-10 w-10 overflow-hidden items-center justify-center cursor-pointer bg-lightGreen rounded-full"
                                    onClick={handleSendQuestion}
                                >
                                    <img src={'/images/send.svg'} className="h-6 w-6 " />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ChatInputWithAttachment
