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
                <ChatInput conversation={conversation} />
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

    const roleAiClass = ` justify-start`,
        roleHumanClass = ` justify-end `
    const roleAiInnerClass = ` bg-lightWhite `,
        roleHumanInnerClass = ` bg-lightWhite `

    if (_.isEmpty(contentList)) {
        return <div className="__chat_content__ flex "></div>
    }

    return (
        <div
            className="__chat_content__ relative mt-4 mb-32 pr-4 overflow-scroll w-full text-textBlackColor leading-relaxed"
            ref={contentRef}
        >
            <div className="flex flex-col gap-6  w-full ">
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
        }
    }

    return (
        <div className="__chat_input__ absolute bottom-10 left-0 right-4 max-h-[7.5rem] overflow-scroll rounded-lg flex flex-row bg-white border-[#eee] border border-r-0 border-solid">
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

const HarmBlockThresholdLabelMap = [
    {
        label: `Block None`,
        value: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        label: `Block Few`,
        value: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        label: `Block Some`,
        value: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        label: `Block Most`,
        value: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
]

const HarmBlockThresholdLabel = _.map(HarmBlockThresholdLabelMap, 'label')

interface IConversationSettingProps {
    conversation: IConversation
}
const ConversationSetting = ({ conversation }: IConversationSettingProps) => {
    const dispatch = useAppDispatch()
    const {
        conversationName,
        conversationId,
        temperature,
        topK,
        topP,
        maxOutputTokens,
        harassment,
        hateSpeech,
        sexuallyExplicit,
        dangerousContent,
    } = conversation || {}

    const handleChangeConversationName = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event?.currentTarget?.value
        if (newValue) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    conversationName: _.trim(newValue),
                })
            )
        }
    }

    const handleChangeTemperature = (newTemperature: number) => {
        if (newTemperature >= 0 && newTemperature <= 1) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    temperature: newTemperature,
                })
            )
        }
    }

    const handleChangeTopK = (event: ChangeEvent<HTMLInputElement>) => {
        const newTopK = Number(event?.currentTarget?.value) || 0
        if (newTopK >= 1) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    topK: newTopK,
                })
            )
        }
    }

    const handleChangeTopP = (newTopP: number) => {
        if (newTopP >= 0 && newTopP <= 1) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    topP: newTopP,
                })
            )
        }
    }

    const handleChangeMaxOutputTokens = (event: ChangeEvent<HTMLInputElement>) => {
        const newMaxOutputTokens = Number(event?.currentTarget?.value) || 0
        // https://ai.google.dev/models/gemini Pro: 2048, Pro Vision: 4096
        if (newMaxOutputTokens >= 1 && newMaxOutputTokens <= 2048) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    maxOutputTokens: newMaxOutputTokens,
                })
            )
        }
    }

    const handleChangeSafety = (
        num: number,
        safetyType: 'harassment' | 'hateSpeech' | 'sexuallyExplicit' | 'dangerousContent'
    ) => {
        if (HarmBlockThresholdLabelMap[num]) {
            let safetyInfo: Pick<IConversation, 'harassment' | 'hateSpeech' | 'sexuallyExplicit' | 'dangerousContent'> =
                {}
            safetyInfo[safetyType] = HarmBlockThresholdLabelMap[num].value
            dispatch(
                updateConversationInfo({
                    conversationId,
                    ...safetyInfo,
                })
            )
        }
    }
    return (
        <Popup
            trigger={
                <div className="svg-image flex h-7 w-7 overflow-hidden items-center justify-center cursor-pointer">
                    <img src={'/images/settings.svg'} className="h-6 w-6 active:mt-[0.5px] active:ml-[0.5px]" />
                </div>
            }
            title={`Conversation Setting`}
        >
            <div className="flex flex-col w-full gap-10">
                <div className=" flex flex-col w-full text-textBlackColor gap-6">
                    <SeparateLineWithText text={`Basic Settings`} />
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Conversation Name`}</span>
                        </div>
                        <div className="flex flex-grow border border-solid border-stone-400 rounded-xl py-2 px-3">
                            <input
                                className="w-full text-left text-sm focus:outline-none active:outline-none text-textBlackColor"
                                type="text"
                                defaultValue={conversationName || ''}
                                onChange={handleChangeConversationName}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Temperature`}</span>
                        </div>
                        <div className="flex flex-grow">
                            <RangeInput
                                id={`temperature`}
                                min={0}
                                max={1}
                                step={0.01}
                                defaultValue={temperature == undefined ? 1 : temperature}
                                valueShowRight={true}
                                changeCallback={value => {
                                    handleChangeTemperature(value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Top K`}</span>
                        </div>
                        <div className="flex flex-grow border border-solid border-stone-400 rounded-xl py-2 px-3">
                            <input
                                className="w-full text-left text-sm focus:outline-none active:outline-none text-textBlackColor"
                                type="number"
                                defaultValue={topK}
                                step={1}
                                min={1}
                                onChange={handleChangeTopK}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Top P`}</span>
                        </div>
                        <div className="flex flex-grow">
                            <RangeInput
                                id={`topp`}
                                min={0}
                                max={1}
                                step={0.01}
                                defaultValue={topP || 1}
                                valueShowRight={true}
                                changeCallback={value => {
                                    handleChangeTopP(value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Max Output`}</span>
                        </div>
                        <div className="flex flex-grow border border-solid border-stone-400 rounded-xl py-2 px-3">
                            <input
                                className="w-full text-left text-sm focus:outline-none active:outline-none text-textBlackColor"
                                type="number"
                                defaultValue={maxOutputTokens || 2048}
                                step={1}
                                min={1}
                                onChange={handleChangeMaxOutputTokens}
                            />
                        </div>
                    </div>
                </div>
                <div className=" flex flex-col w-full text-textBlackColor gap-6">
                    <SeparateLineWithText text={`Safety settings`} />
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Harassment`}</span>
                        </div>
                        <div className="flex flex-grow -mb-8">
                            <RangeInput
                                id={`harassment`}
                                min={0}
                                max={3}
                                step={1}
                                defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: harassment }) || 0}
                                changeCallback={value => {
                                    handleChangeSafety(value, 'harassment')
                                }}
                                labelList={HarmBlockThresholdLabel}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Hate Speech`}</span>
                        </div>
                        <div className="flex flex-grow -mb-8">
                            <RangeInput
                                id={`hatespeech`}
                                min={0}
                                max={3}
                                step={1}
                                defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: hateSpeech }) || 0}
                                changeCallback={value => {
                                    handleChangeSafety(value, 'hateSpeech')
                                }}
                                labelList={HarmBlockThresholdLabel}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Sexually Explicit`}</span>
                        </div>
                        <div className="flex flex-grow -mb-8">
                            <RangeInput
                                id={`sexuallyexplicit`}
                                min={0}
                                max={3}
                                step={1}
                                defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: sexuallyExplicit }) || 0}
                                changeCallback={value => {
                                    handleChangeSafety(value, 'sexuallyExplicit')
                                }}
                                labelList={HarmBlockThresholdLabel}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="flex w-2/5">
                            <span>{`Dangerous Content`}</span>
                        </div>
                        <div className="flex flex-grow -mb-8">
                            <RangeInput
                                id={`dangerouscontent`}
                                min={0}
                                max={3}
                                step={1}
                                defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: dangerousContent }) || 0}
                                changeCallback={value => {
                                    handleChangeSafety(value, 'dangerousContent')
                                }}
                                labelList={HarmBlockThresholdLabel}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Popup>
    )
}

interface IConversationDeleteProps {
    conversation: IConversation
}
const ConversationDelete = ({ conversation }: IConversationDeleteProps) => {
    const dispatch = useAppDispatch()

    const handleConfirmDelete = () => {
        dispatch(removeConversationAndChats(conversation))
    }

    return (
        <Popup
            trigger={
                <div className="svg-image flex h-7 w-7 overflow-hidden items-center justify-center cursor-pointer">
                    <img src={'/images/delete.svg'} className="h-6 w-6 active:mt-[0.5px] active:ml-[0.5px]" />
                </div>
            }
            title={`Delete this conversation?`}
            showConfirm={true}
            confirmCallBack={handleConfirmDelete}
        >
            <div className="flex flex-col w-full gap-10"></div>
        </Popup>
    )
}
