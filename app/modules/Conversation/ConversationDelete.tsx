'use client'
import React from 'react'
import { Roles } from '@/app/shared/interfaces'
import _ from 'lodash'
import { removeConversationAndChats } from '../../(pages)/chat/slice'
import { useAppDispatch } from '@/app/hooks'
import { IConversation } from '../../(pages)/chat/interface'
import Popup from '@/app/components/Popup'

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

export default ConversationDelete
