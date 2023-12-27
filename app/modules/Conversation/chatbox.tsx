'use client'
import React, { useState, ChangeEvent, KeyboardEvent, useRef } from 'react'
import { Roles } from '@/app/shared/interfaces'
import _ from 'lodash'
import { getChatState } from '../../(pages)/chat/slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'

const __test_content_list__ = [
    {
        role: Roles.Human,
        contentText: `你好`,
        timestamp: Date.now() - 1000 * 20,
    },
    {
        role: Roles.AI,
        contentText: `你好`,
        timestamp: Date.now() - 1000 * 20,
    },
    {
        role: Roles.Human,
        contentText: `你好`,
        timestamp: Date.now() - 1000 * 20,
    },
]

const Chatbox = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)

    return (
        <div className="chatbox flex h-full flex-col overflow-hidden">
            <div className="title h-20 flex border-l border-slate-300 border-solid"></div>
            <div className="flex relative chatinfo h-full rounded-br-lg bg-slate-500">
                <ChatContent contentList={__test_content_list__} />
                <ChatInput />
            </div>
        </div>
    )
}

interface IChatContentProps {
    contentList?: { role: Roles; contentText: string; timestamp: number }[]
}
const ChatContent = ({ contentList }: IChatContentProps) => {
    if (_.isEmpty(contentList)) {
        return <div className="__chat_content__ flex "></div>
    }

    const roleAiClass = ` justify-start `
    const roleHumanClass = ` justify-end text-white `
    return (
        <div className="__chat_content__ relative mt-10 mb-36 mx-20 overflow-scroll w-full">
            <div className="flex flex-col gap-2 w-full">
                {_.map(contentList, (contentItem, index) => {
                    const { role, contentText } = contentItem || {}
                    return (
                        <div
                            className={`flex items-center w-full  ${role == Roles.AI ? roleAiClass : roleHumanClass}`}
                            key={`__chat_content_item_${index}__`}
                        >
                            <div className="rounded-xl w-fit bg-lightGeen px-3 py-2">
                                <span>{contentText}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const ChatInput = () => {
    const [inputValue, setInputValue] = useState<string>('')
    const [inputRows, setInputRows] = useState<number>(1)
    const inputRef = useRef<HTMLTextAreaElement>(null)

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
            event.preventDefault()
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
                className="block flex-grow p-4 bg-white outline-none "
            ></textarea>
            <div className="bg-lightGeen text-white w-20 flex items-center justify-center cursor-pointer">Send</div>
        </div>
    )
}
export default Chatbox
