'use client'
import type { NextPage, GetServerSideProps } from 'next'
import React, { useEffect, useMemo } from 'react'
import ChatBox from '@/app/modules/Conversation/chatbox'
import ChatList from '@/app/modules/Conversation/chatlist'
import { Provider } from 'react-redux'
import store from '@/app/store'
import { getChatState, initialConversationListInState, initialConversionList } from './slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'

export const Chat: NextPage<{ serverSideData: any }, any> = ({ serverSideData }: { serverSideData: any }) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    // dispatch(initialConversationListInState())
    useEffect(() => {
        dispatch(initialConversationListInState())
    }, [])
    console.log(`Chat`, state)
    return (
        <main className="main ">
            <div className="chat-container m-0 bg-slate-100 shadow-2xl h-[100vh]  rounded-lg flex flex-row">
                <div className="left-side hidden md:block flex-none w-1/5 h-full max-w-[25rem]">
                    <ChatList />
                </div>
                <div className="right-side flex-grow h-full">
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
