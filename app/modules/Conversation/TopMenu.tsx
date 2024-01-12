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
import { GeminiModel } from '@/app/shared/interfaces'

const TopMenu = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const handleAddProConsation = () => {
        dispatch(createNewConversationInState({ modelType: GeminiModel.geminiPro }))
    }
    const handleAddProVisionContext = () => {
        dispatch(createNewConversationInState({ modelType: GeminiModel.geminiProVision }))
    }

    return (
        <div className="flex">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div className="font-bold">Add New</div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="ml-4">
                    <DropdownMenuItem onClick={handleAddProConsation}>Pro Conversation</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddProVisionContext}>Vision Content</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default TopMenu
