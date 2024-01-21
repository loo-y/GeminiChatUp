'use client'
import type { NextPage, GetServerSideProps } from 'next'
import React, { useEffect, useMemo, useState } from 'react'
import ChatBox from '@/app/modules/Conversation/Chatbox'
import ChatList from '@/app/modules/Conversation/Chatlist'
import { Provider } from 'react-redux'
import store from '@/app/store'
import { getChatState, initiaStateFromDB } from './slice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/app/components/ui/resizable'

export const Chat: NextPage<{ serverSideData: any }, any> = ({ serverSideData }: { serverSideData: any }) => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const { needAPICredentials } = serverSideData || {}
    const [virtualHeight, setVirtualHeight] = useState(0)
    useEffect(() => {
        dispatch(initiaStateFromDB({ needAPICredentials }))

        let vh = window.innerHeight * 0.01
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`)

        // We listen to the resize event
        window.addEventListener('resize', () => {
            // We execute the same script as before
            let vh = Math.min(document?.documentElement?.clientHeight || window.innerHeight, window.innerHeight) * 0.01
            console.log(`resizing, new view height`, vh)
            setVirtualHeight(vh)
            document.documentElement.style.setProperty('--vh', `${vh}px`)
        })
    }, [])
    return (
        <main className="main h-full overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    maxSize={40}
                    defaultSize={20}
                    minSize={5}
                    className="hidden md:block min-w-[18rem] max-w-[26rem]"
                >
                    <ChatList />
                </ResizablePanel>
                <ResizableHandle withHandle className="hidden md:flex" />
                <ResizablePanel>
                    <ChatBox />
                </ResizablePanel>
            </ResizablePanelGroup>
        </main>
    )

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

export default function ChatPage({ needAPICredentials }: { needAPICredentials?: boolean }) {
    return (
        <Provider store={store}>
            <Chat serverSideData={{ needAPICredentials }} />
        </Provider>
    )
}
