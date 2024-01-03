'use client'
import type { NextPage, GetServerSideProps } from 'next'
import React, { useEffect, useMemo, useState } from 'react'
import ChatBox from '@/app/modules/Conversation/chatbox'
import ChatList from '@/app/modules/Conversation/chatlist'
import { Provider } from 'react-redux'
import store from '@/app/store'
import { getChatState, initialConversationListInState } from './slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'

export const Chat: NextPage<{ serverSideData: any }, any> = ({ serverSideData }: { serverSideData: any }) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)

    const [virtualHeight, setVirtualHeight] = useState(0)
    useEffect(() => {
        dispatch(initialConversationListInState())

        let vh = window.innerHeight * 0.01
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`)

        // We listen to the resize event
        window.addEventListener('resize', () => {
            // We execute the same script as before
            let vh = window.innerHeight * 0.01
            console.log(vh)
            setVirtualHeight(vh)
            document.documentElement.style.setProperty('--vh', `${vh}px`)
        })
    }, [])
    console.log(`Chat`, state)
    return (
        <main className="main h-full overflow-hidden">
            <div className="chat-container m-0 bg-white shadow-2xl h-[100vh]  flex flex-row">
                <div className="left-side hidden md:block flex-none w-1/5 h-full max-w-[25rem] border-r border-[#eee] border-solid">
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
