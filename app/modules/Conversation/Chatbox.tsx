'use client'
import React, { useState, ChangeEvent, KeyboardEvent, useRef, useMemo, useEffect } from 'react'
import { Roles } from '@/app/shared/interfaces'
import _ from 'lodash'
import {
    getChatState,
    getGeminiChatAnswer,
    getGeminiContentAnswer,
    updateConversationInfo,
    removeConversationAndChats,
} from '../../(pages)/chat/slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { useSearchParams } from 'next/navigation'
import { IConversation } from '../../(pages)/chat/interface'
import { IChatItem, IImageItem } from '@/app/shared/interfaces'
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
import { Dialog, DialogContent } from '@/app/components/ui/dialog'
import { GeminiModel } from '@/app/shared/interfaces'
import { Drawer, DrawerContent, DrawerTrigger } from '@/app/components/ui/drawer'
import ChatList from './Chatlist'
import ChatImagePreview from './ChatImagePreview'

const ChatBox = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const searchParams = useSearchParams()
    const queryInputValue = searchParams.get('input') || ``
    const conversation = useMemo((): IConversation | undefined => {
        return _.find(state.conversationList, conversation => {
            return conversation.isSelected == true
        })
    }, [state.conversationList])
    const { history, archived, conversationId, modelAvatar, conversationName, isFetching, modelType } =
        conversation || {}

    if (!conversation) {
        return (
            <div className="__chatbox__ flex flex-col text-stone-900 bg-[#fafafa]">
                <div className="flex-none title h-16 flex border-b border-[#eee] border-solid rounded-tr-lg bg-white">
                    <div className=" flex flex-row items-center ml-4 w-full">
                        <div className="block md:hidden mr-4">
                            <DrawerChatList />
                        </div>
                    </div>
                </div>
                <CreatedBy />
            </div>
        )
    }
    return (
        <div className="__chatbox__ flex flex-col text-stone-900 bg-[#fafafa]">
            <div className="flex-none title h-16 flex border-b border-[#eee] border-solid rounded-tr-lg bg-white">
                <div className=" flex flex-row items-center ml-4 w-full">
                    <div className="block md:hidden mr-4">
                        <DrawerChatList />
                    </div>

                    <div className="flex-none flex-row flex w-1/2 items-center gap-4 ">
                        <div className="__conversation_avatar__ flex h-[3.25rem] w-[3.25rem] items-center justify-center bg-stone-300 rounded-full">
                            <img src={modelAvatar} className="h-12 w-12" />
                        </div>
                        <div className="flex flex-col line-clamp-1">
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
                <ChatContent conversation={conversation} />
                {modelType == GeminiModel.geminiProVision ? (
                    <ChatInputWithAttachment conversation={conversation} attachable={true} />
                ) : (
                    <ChatInputWithAttachment conversation={conversation} attachable={false} />
                )}
                {/* <ChatInput conversation={conversation} /> */}
                {/* <ChatInputWithAttachment conversation={conversation} /> */}
            </div>
            <CreatedBy />
        </div>
    )
}

export default ChatBox

const CreatedBy = () => {
    return (
        <div className="absolute bottom-2 right-2 text-xs text-slate-400 italic">
            Created by{' '}
            <a className={`text-slate-500`} target="_blank" href="https://github.com/loo-y/GeminiChatUp">
                Erik
            </a>
        </div>
    )
}

interface IChatContentProps {
    conversation: IConversation
}
const ChatContent = ({ conversation }: IChatContentProps) => {
    const dispatch = useAppDispatch()
    const { history, archived, modelType, conversationId, isFetching } = conversation
    const state = useAppSelector(getChatState)
    const { imageResourceList } = state || {}

    const contentRef = useRef(null)
    const [openPreview, setOpenPreview] = useState(false)
    const [previewImage, setPreviewImage] = useState('')
    const imagePreviewRef = useRef(null)
    useEffect(() => {
        if (contentRef.current) {
            const theElement = contentRef.current as HTMLElement
            theElement.scrollTo(0, theElement.scrollHeight)
        }
    }, [archived, history])

    const handleClickThumbnail = (imageBase64: string) => {
        setOpenPreview(true)
        setPreviewImage(imageBase64)
    }
    const handleClosePreview = () => {
        setOpenPreview(false)
        setPreviewImage('')
    }
    const handleUnactiveClose = () => {
        if (imagePreviewRef?.current) {
            console.log(`handleUnactiveClose`)
            const imagePreviewElement = imagePreviewRef.current as HTMLDivElement
            setTimeout(() => {
                imagePreviewElement.click()
                imagePreviewElement.focus()
                console.log(`imagePreviewElement`, imagePreviewElement)
            }, 100)
        }
    }

    const handleRetry = () => {
        if (modelType == GeminiModel.geminiPro) {
            dispatch(
                getGeminiChatAnswer({
                    conversationId,
                    conversation,
                    history,
                })
            )
        } else {
            dispatch(
                getGeminiContentAnswer({
                    history,
                    conversationId,
                    conversation,
                })
            )
        }
    }

    if (_.isEmpty(history) && _.isEmpty(archived)) {
        return <div className="__chat_content__ flex"></div>
    }

    return (
        <>
            <div
                className="__chat_content__ relative mt-4 mb-44 pr-4 overflow-scroll w-full text-textBlackColor leading-relaxed"
                ref={contentRef}
            >
                <div className="flex flex-col gap-6 w-full max-w-[73rem] mx-auto ">
                    {_.map(archived, (contentItem, index) => {
                        return (
                            <React.Fragment key={`__chat_content_archived_item_${index}__`}>
                                <ChatContentItem
                                    contentItem={contentItem}
                                    imageResourceList={imageResourceList}
                                    handleClickThumbnail={handleClickThumbnail}
                                />
                            </React.Fragment>
                        )
                    })}
                    {archived?.length ? (
                        <div className="flex mx-auto flex-row items-center my-1 px-6 w-full  ">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-gray-500">Context cleared</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>
                    ) : null}
                    {_.map(history, (contentItem, index) => {
                        return (
                            <React.Fragment key={`__chat_content_history_item_${index}__`}>
                                <ChatContentItem
                                    contentItem={contentItem}
                                    imageResourceList={imageResourceList}
                                    handleClickThumbnail={handleClickThumbnail}
                                    handleRetry={handleRetry}
                                />
                            </React.Fragment>
                        )
                    })}
                    {isFetching ? (
                        <div className="flex flex-row items-center flex-grow justify-start gap-1">
                            <div className=" svg-image flex min-w-12 h-12 w-12 overflow-hidden items-center justify-center ">
                                <img src={'/images/three-dots-loading.svg'} className="h-10 w-10 " />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="">
                <ChatImagePreview imageUrl={previewImage} isOpen={openPreview} closeCallback={handleClosePreview} />
                {/* <Dialog open={openPreview}>
                    <DialogContent
                        className="min-w-[80vw] min-h-[80vh] max-h-[90vh] w-full bg-gray-200 border-gray-200 active:outline-none focus:outline-none"
                        onInteractOutside={handleClosePreview}
                        autoFocus={false}
                        onEscapeKeyDown={handleClosePreview}
                    >
                        <div
                            className="grid gap-4 py-4 bg-contain bg-no-repeat bg-center w-full h-full"
                            style={{ backgroundImage: `url(${previewImage})` }}
                        ></div>
                    </DialogContent>
                </Dialog> */}
            </div>
        </>
    )
}

const ChatContentItem = ({
    contentItem,
    imageResourceList,
    handleClickThumbnail,
    handleRetry,
}: {
    contentItem: IChatItem
    imageResourceList: IImageItem[]
    handleClickThumbnail: (imageBase64: string) => void
    handleRetry?: () => void
}) => {
    const { role, parts, timestamp, imageList, isFailed, failedInfo } = contentItem || {}
    const isUser = role == Roles.user
    const contentText = parts[0].text

    const roleAiClass = ` justify-start italic`,
        roleHumanClass = ` justify-end text-white italic`
    const roleAiInnerClass = ` bg-lightWhite not-italic`,
        roleHumanInnerClass = ` bg-lightGreen text-teal-50 not-italic `
    const filedClass = `bg-red-400 `

    const handleClickRetry = () => {
        if (role == Roles.user && handleRetry) {
            handleRetry()
        }
    }

    return (
        <>
            <div
                className={`flex flex-row items-center flex-grow ${role == Roles.model ? roleAiClass : roleHumanClass}`}
            >
                {role == Roles.user && isFailed ? (
                    <div className="flex-1 flex items-center justify-end mr-4">
                        <div
                            onClick={handleClickRetry}
                            className="svg-image flex h-[3rem] w-[3rem] overflow-hidden items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full"
                        >
                            <img src={'/images/retry.svg'} className="h-7 w-7 " />
                        </div>
                    </div>
                ) : null}
                <div
                    className={`rounded-xl flex flex-col px-3 py-2 w-fit  max-w-[80%] gap-1 break-words ${
                        isUser ? roleHumanInnerClass : roleAiInnerClass
                    } ${isFailed ? filedClass : ''}`}
                >
                    {isUser && imageList?.length ? (
                        <div className="flex flex-col">
                            {_.map(imageList, imageID => {
                                const theImage = _.find(imageResourceList, resource => {
                                    return imageID == resource.imageId
                                })?.base64Data
                                if (!theImage) return null
                                return (
                                    <div
                                        className="flex items-center"
                                        onClick={() => {
                                            handleClickThumbnail(theImage)
                                        }}
                                        key={`content_image_${imageID}`}
                                    >
                                        <img className=" max-w-[15rem]" src={theImage} />
                                    </div>
                                )
                            })}
                        </div>
                    ) : null}
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
            {role == Roles.user && isFailed && failedInfo ? (
                <div className={`flex flex-row items-center justify-center flex-grow my-2`}>
                    <div className="flex flex-row gap-2 items-center border border-solid border-yellow-600 rounded-xl py-2 pl-5 pr-8 text-gray-500 italic font-bold">
                        <div className=" svg-image flex min-w-8 h-8 w-8 overflow-hidden items-center justify-center ">
                            <img src={'/images/warning.svg'} className="h-6 w-6 " />
                        </div>
                        <div className="line-clamp-2 ">{failedInfo}</div>
                    </div>
                </div>
            ) : null}
        </>
    )
}

const DrawerChatList = () => {
    const [openDrawer, setOpenDrawer] = useState<boolean>(false)
    const optionsRef = useRef<HTMLDivElement>(null)
    const handleClickOptions = () => {
        const optionsDiv = optionsRef.current as HTMLDivElement
        setTimeout(() => {
            optionsDiv && optionsDiv.blur()
        }, 0)
    }
    const handleCloseDrawer = () => {
        setOpenDrawer(false)
    }
    return (
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
            <DrawerTrigger>
                <div
                    className="__conversation_avatar__ flex h-9 w-9 items-center justify-center cursor-pointer hover:bg-gray-200 hover:rounded-full"
                    onClick={handleClickOptions}
                    ref={optionsRef}
                >
                    <img src="/images/options.svg" className="h-6 w-6" />
                </div>
            </DrawerTrigger>
            <DrawerContent>
                <ChatList className="h-[70vh]" clickCallback={handleCloseDrawer} />
            </DrawerContent>
        </Drawer>
    )
}
