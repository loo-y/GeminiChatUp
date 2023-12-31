'use client'
import { useEffect, useState, ChangeEvent } from 'react'
import _ from 'lodash'

interface IRangeInputProps {
    id: string
    defaultValue: number
    step: number
    min: number
    max: number
    labelList?: string[]
    changeCallback: (value: number) => void
}
export default function RangeInput({ id, defaultValue, step, min, max, labelList }: IRangeInputProps) {
    const [value, setValue] = useState(defaultValue)

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(event.target.value)
        setValue(newValue)
    }

    return (
        <div className="w-full flex flex-col ">
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={handleChange}
                step={step}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700  focus:outline-none "
            />
            {labelList?.length && labelList.length - 1 == (max - min) / step ? (
                <div className="flex justify-center items-center mt-2 text-sm font-medium text-textGrayColor">
                    <span>{labelList[value / step]}</span>
                </div>
            ) : (
                <div className="flex justify-center items-center mt-2 text-sm font-medium text-textGrayColor">
                    <span>{value}</span>
                </div>
            )}
        </div>
    )
}
