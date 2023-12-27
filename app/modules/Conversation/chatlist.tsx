'use client'
import 'react'

const ChatList = () => {
    return (
        <div className="__chatlist__ flex w-full mt-4">
            <div className="__chatlist_topsetting__ w-full px-4">
                <SearchInput />
            </div>
        </div>
    )
}

const SearchInput = () => {
    return (
        <div className="__chatlist_searchinput__ flex rounded-2xl h-10 bg-white px-3">
            <input type="search" className="outline-none flex-grow " placeholder="search"></input>
        </div>
    )
}

export default ChatList
