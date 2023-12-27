'use client'
import type { NextPage, GetServerSideProps } from 'next'
import React from 'react'
import ChatBox from '@/app/modules/Conversation/chatbox'
import ChatList from '@/app/modules/Conversation/chatlist'
import { Provider } from 'react-redux'
import store from '@/app/store'
import { getChatState } from './slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'

export const Chat: NextPage<{ serverSideData: any }, any> = ({ serverSideData }: { serverSideData: any }) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    return (
        <main className="main bg-slate-500">
            <div className="chat-container min-w-[66vw] max-w-[80vw] h-[80vh] bg-slate-100 shadow-2xl mx-auto my-[10vh] rounded-lg flex flex-row border border-slate-50 border-solid">
                <div className="left-side w-1/5 h-full ">
                    <ChatList />
                </div>
                <div className="right-side w-4/5 h-full">
                    <ChatBox />
                </div>
            </div>
        </main>
    )
}

export default function ChatPage() {
    return (
        <Provider store={store}>
            <Chat serverSideData={null} />
        </Provider>
    )
}
