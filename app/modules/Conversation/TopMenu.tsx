'use client'
import 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { getChatState, createNewConversationInState, updateState } from '../../(pages)/chat/slice'
import _ from 'lodash'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import GlobalOptions from './GlobalOptions'
import { GeminiModel } from '@/app/shared/interfaces'

const TopMenu = ({ clickCallback }: { clickCallback?: () => void }) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const handleAddProConsation = () => {
        dispatch(createNewConversationInState({ modelType: GeminiModel.geminiPro }))
        clickCallback && clickCallback()
    }
    const handleAddProVisionContext = () => {
        dispatch(createNewConversationInState({ modelType: GeminiModel.geminiProVision }))
        clickCallback && clickCallback()
    }

    return (
        <div className="flex justify-between w-full items-center">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div className="font-bold px-2 py-2 border rounded-xl bg-gray-50 hover:bg-gray-100 focus:bg-gray-100">
                        Create
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="ml-4">
                    <DropdownMenuItem onClick={handleAddProConsation}>
                        <div className="flex flex-row justify-between gap-2 w-full">
                            <div>Pro Conversation</div>
                            <div className="svg-image flex h-6 w-6 overflow-hidden items-center justify-end cursor-pointer bg-transparent">
                                <img src={`/images/chat-black.svg`} className="h-[1.1rem] w-[1.1rem] mr-[0.12rem]" />
                            </div>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddProVisionContext}>
                        <div className="flex flex-row justify-between gap-2 w-full">
                            <div>Vision Content</div>
                            <div className="svg-image flex h-6 w-6 overflow-hidden items-center justify-end cursor-pointer bg-transparent">
                                <img src={`/images/image-black.svg`} className="h-5 w-5" />
                            </div>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex ml-auto items-center">
                <GlobalOptions />
            </div>
        </div>
    )
}

export default TopMenu
