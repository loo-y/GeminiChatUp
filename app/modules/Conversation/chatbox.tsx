'use client';
import React, { useState, ChangeEvent, KeyboardEvent, useRef } from 'react';

const Chatbox = ()=>{
    return (
        <div className='chatbox flex h-full flex-col overflow-hidden'>
            <div className='title h-20 flex border-l border-slate-300 border-solid'>

            </div>
            <div className='flex relative chatinfo h-full rounded-br-lg bg-slate-500'>
                <div className='chatcontent'></div>
                <ChatInput />
                </div>
        </div>
    )
}

const ChatInput = ()=>{
    const [inputValue, setInputValue] = useState<string>('');
    const [inputRows, setInputRows] = useState<number>(1);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(event.target.value);
        setInputRows(event.target.value.split('\n').length);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.shiftKey && event.key === 'Enter') {
            event.preventDefault();
            // setInputRows((prevRows) => prevRows + 1);
            // setInputValue((prevValue) => prevValue + '\n');
            const { selectionStart, selectionEnd } = event.currentTarget;
            const newInputValue =
            inputValue.substring(0, selectionStart) + '\n' + inputValue.substring(selectionEnd);
            setInputValue(newInputValue);
            // 移动光标位置到插入换行符后
            const newSelectionStart = selectionStart + 1;
            event.currentTarget.setSelectionRange(newSelectionStart, newSelectionStart);
        }else if(event.key === 'Enter'){
            event.preventDefault();
        }

      };

    return (
        <div className="absolute bottom-10 left-20 right-20 max-h-[7.5rem] overflow-scroll rounded-lg flex flex-row bg-white">
        <textarea
            value={inputValue}
            ref={inputRef}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={inputRows}
            style={{resize: "none"}}
            className="block flex-grow p-4 bg-white outline-none "
        ></textarea>
        <div className="bg-[rgb(95,206,114)] text-white w-20 flex items-center justify-center cursor-pointer">Send</div>
        </div>
    )
}
export default Chatbox