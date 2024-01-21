'use client'
import React, { useState, ChangeEvent, KeyboardEvent, MouseEvent, useRef } from 'react'
import _ from 'lodash'
import {
    getChatState,
    getGeminiChatAnswer,
    getGeminiContentAnswer,
    deleteImageFromInput,
    archiveConversationHistory,
    updateGlobalOptionsInfo,
} from '../../(pages)/chat/slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { IConversation, IGlobalOptionsInfo } from '../../(pages)/chat/interface'
import { APICredentials, IChatItem, IImageItem } from '@/app/shared/interfaces'
import UploadImageButton from './UploadImageButton'
import { Dialog, DialogContent } from '@/app/components/ui/dialog'
import ChatImagePreview from './ChatImagePreview'
import { useSearchParams } from 'next/navigation'
import { GlobalOptionsMain, IGlobalOptionsMain } from './GlobalOptions'
import { Drawer, DrawerContent } from '@/app/components/ui/drawer'

const ChatInputWithAttachment = ({
    conversation,
    attachable,
}: {
    conversation: IConversation
    attachable?: boolean
}) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const {
        inputImageList,
        geminiUserName,
        geminiUserToken,
        customGeminiAPI,
        useAPICredentials,
        needAPICredentials,
        useStream,
    } = state || {}
    const [isComposing, setIsComposing] = useState(false)
    const [showGlobalOptions, setShowGlobalOptions] = useState<boolean | 'mobileScreen' | 'desktopScreen'>(false)
    const [inputValue, setInputValue] = useState<string>('')
    const [inputRows, setInputRows] = useState<number>(1)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const searchParams = useSearchParams()
    const queryIsStream = searchParams.get('stream') || ``

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
        setInputRows(Math.min(rows, 4))
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
            // setInputRows(value => value + 1)
            setInputRows(value => {
                return Math.min(value + 1, 4)
            })
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
            if (
                needAPICredentials &&
                ((useAPICredentials == APICredentials.customAPI && !customGeminiAPI) ||
                    (useAPICredentials == APICredentials.userToken && (!geminiUserName || !geminiUserToken)) ||
                    !((geminiUserName && geminiUserToken) || customGeminiAPI))
            ) {
                const isMobileScreen = window.innerWidth <= 768
                setShowGlobalOptions(isMobileScreen ? 'mobileScreen' : 'desktopScreen')
                return
            }

            if (attachable) {
                dispatch(
                    getGeminiContentAnswer({
                        inputImageList,
                        conversationId,
                        conversation,
                        history: _history,
                        inputText: inputValue.replace(/\n/g, '\n\n'),
                    })
                )
            } else {
                dispatch(
                    getGeminiChatAnswer({
                        conversationId,
                        conversation,
                        history: _history,
                        inputText: inputValue.replace(/\n/g, '\n\n'),
                    })
                )
            }

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

    const handleDeleteImage = (imageItem: IImageItem) => {
        dispatch(
            deleteImageFromInput({
                imageId: imageItem.imageId,
            })
        )
    }

    const handleArchived = () => {
        dispatch(archiveConversationHistory(conversation))
    }

    const handleConfirmDialog = (valueObj: Partial<IGlobalOptionsInfo>) => {
        setShowGlobalOptions(false)
        dispatch(updateGlobalOptionsInfo(valueObj))
    }
    const handleConfirmDrawer = (valueObj: Partial<IGlobalOptionsInfo>) => {
        setShowGlobalOptions(false)
        dispatch(updateGlobalOptionsInfo(valueObj))
    }

    const showImages = attachable && !_.isEmpty(inputImageList)

    return (
        <>
            {/* <div className='__chatinput_with_attachment__ absolute bottom-10 left-0 right-4 max-h-[7.5rem] overflow-scroll bg-transparent flex flex-row gap-2'> */}

            <div className="__chatinput_with_attachment__ absolute flex flex-col bottom-10 left-0 right-4 max-h-[7.5rem] ">
                {showImages ? (
                    <div className="flex flex-row gap-2 w-full h-20 clear-both mx-auto pl-11 mb-2 items-center max-w-[73rem] ">
                        {_.map(inputImageList, (imageItem, imageIndex) => {
                            const { base64Data } = imageItem || {}
                            return (
                                <ThumbnailDisplay
                                    key={`inputImageList_${imageIndex}`}
                                    imageUrl={base64Data}
                                    onDelete={() => {
                                        handleDeleteImage(imageItem)
                                    }}
                                />
                            )
                        })}
                    </div>
                ) : null}
                <div className="__chatinput_with_attachment__ relative flex">
                    <div className="overflow-y-scroll overflow-x-hidden bg-transparent flex flex-row gap-1 flex-grow max-w-[73rem] mx-auto">
                        <div className="flex w-12 items-center ">
                            <div className=" flex items-center justify-center h-[3.75rem] w-[3.75rem]">
                                <div
                                    onClick={handleArchived}
                                    className="svg-image flex h-[3rem] w-[3rem] overflow-hidden items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full"
                                >
                                    <img src={'/images/clear.svg'} className="h-7 w-7 " />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-grow flex-row rounded-[2rem] border-2 border-green-600 bg-white pl-5 gap-1">
                            <div className="flex my-1 flex-row flex-grow ml-2 bg-transparent items-center">
                                <textarea
                                    value={inputValue}
                                    ref={inputRef}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    rows={inputRows}
                                    style={{ resize: 'none' }}
                                    onCompositionStart={handleCompositionStart}
                                    onCompositionEnd={handleCompositionEnd}
                                    className="block flex-grow bg-white outline-none py-2 w-full text-sm md:text-lg"
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
                                        className="svg-image flex h-10 w-10 pl-1 overflow-hidden items-center justify-center cursor-pointer bg-lightGreen rounded-full"
                                        onClick={handleSendQuestion}
                                    >
                                        <img src={'/images/send.svg'} className="h-6 w-6 " />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showGlobalOptions == 'mobileScreen' ? (
                <Drawer
                    open={showGlobalOptions == 'mobileScreen'}
                    onOpenChange={status => {
                        setShowGlobalOptions(!status ? false : 'mobileScreen')
                    }}
                >
                    <DrawerContent>
                        <GlobalOptionsMain
                            confirmCallback={handleConfirmDrawer}
                            geminiUserName={geminiUserName}
                            geminiUserToken={geminiUserToken}
                            customGeminiAPI={customGeminiAPI}
                            useAPICredentials={useAPICredentials}
                            useStream={useStream}
                        />
                    </DrawerContent>
                </Drawer>
            ) : null}
            {showGlobalOptions == 'desktopScreen' ? (
                <Dialog
                    open={showGlobalOptions == 'desktopScreen'}
                    onOpenChange={status => {
                        setShowGlobalOptions(!status ? false : 'desktopScreen')
                    }}
                >
                    <DialogContent>
                        <GlobalOptionsMain
                            confirmCallback={handleConfirmDialog}
                            geminiUserName={geminiUserName}
                            geminiUserToken={geminiUserToken}
                            customGeminiAPI={customGeminiAPI}
                            useAPICredentials={useAPICredentials}
                            useStream={useStream}
                        />
                    </DialogContent>
                </Dialog>
            ) : null}
        </>
    )
}

export default ChatInputWithAttachment

const ThumbnailDisplay: React.FC<{ imageUrl: string; onDelete: () => void }> = ({ imageUrl, onDelete }) => {
    const [hovered, setHovered] = useState(true)
    const [openPreview, setOpenPreview] = useState(false)
    const thumbnailRef = useRef(null)
    const imagePreviewRef = useRef(null)

    const handleMouseEnter = () => {
        // setHovered(true)
    }

    const handleMouseLeave = () => {
        // setHovered(false)
    }

    const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()
        onDelete()
    }

    const handleClickThumbnail = () => {
        setOpenPreview(true)
    }
    const handleClosePreview = () => {
        setOpenPreview(false)
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

    const handleImageClick = (event: MouseEvent<HTMLImageElement>) => {
        event.preventDefault()
        event.stopPropagation()
    }

    return (
        <>
            <div
                className="w-12 h-full relative  rounded-lg bg-contain bg-no-repeat bg-center border border-gray-200 bg-gray-200 cursor-zoom-in"
                style={{ backgroundImage: `url(${imageUrl})` }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClickThumbnail}
                ref={thumbnailRef}
            >
                {hovered && (
                    <button
                        className="absolute -top-2 -right-2 p-1 bg-gray-600 text-white rounded-full"
                        onClick={handleDelete}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-2 h-2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>
            <div className="">
                <ChatImagePreview imageUrl={imageUrl} isOpen={openPreview} closeCallback={handleClosePreview} />
                {/* <Dialog open={openPreview}>
                    <DialogContent
                        className="py-0 px-0 border-none bg-transparent active:outline-none focus:outline-none text-center justify-center flex items-center"
                        // onOpenAutoFocus={handleUnactiveClose}
                        onInteractOutside={handleClosePreview}
                        autoFocus={false}
                        onEscapeKeyDown={handleClosePreview}
                        onClick={handleClosePreview}
                    >
                        <div className=' max-h-[90vh] max-w-[90vw] min-w-[80vw] min-h-[80vh] object-contain justify-center items-center flex'>
                        <img src={imageUrl} className='' onClick={handleImageClick} />
                        </div>
                    </DialogContent>
                </Dialog> */}
            </div>
        </>
    )
}
