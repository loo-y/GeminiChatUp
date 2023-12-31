'use client'
import { useEffect, useState, ChangeEvent } from 'react'

interface ISeparateLineWithTextProps {
    text: string
}

export default function SeparateLineWithText({ text }: ISeparateLineWithTextProps) {
    return (
        <div className="flex items-center">
            <hr className="flex-grow border-t-2 border-gray-300" />
            <span className="px-4 text-gray-500">{text}</span>
            <hr className="flex-grow border-t-2 border-gray-300" />
        </div>
    )
}
