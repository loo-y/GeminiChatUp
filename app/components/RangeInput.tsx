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
    valueShowRight?: boolean
    changeCallback: (value: number) => void
}
export default function RangeInput({
    id,
    defaultValue,
    step,
    min,
    max,
    labelList,
    valueShowRight,
    changeCallback,
}: IRangeInputProps) {
    const [value, setValue] = useState(defaultValue)

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(event.target.value)
        setValue(newValue)
        changeCallback(newValue)
    }

    const fiexdValue = step > 0 && String(step).includes('.') ? String(step).split('.')[1].length : 0

    if (valueShowRight) {
        return (
            <div className="w-[240px] flex flex-row">
                <div className="flex-grow  items-center justify-center pr-3">
                    <input
                        id={id}
                        type="range"
                        min={min}
                        max={max}
                        value={value}
                        onChange={handleChange}
                        step={step}
                        className="h-2 w-full bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700  focus:outline-none "
                    />
                </div>
                {labelList?.length && labelList.length - 1 == (max - min) / step ? (
                    <div className="flex ml-auto w-28 justify-center items-center text-sm font-medium text-textGrayColor">
                        <span className="line-clamp-1">{labelList[value / step]}</span>
                    </div>
                ) : (
                    <div className="flex ml-auto w-10 justify-center items-center text-sm font-medium text-textGrayColor">
                        <span>{fiexdValue > 0 ? value.toFixed(fiexdValue) : value}</span>
                    </div>
                )}
            </div>
        )
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
                    <span>{fiexdValue > 0 ? value.toFixed(fiexdValue) : value}</span>
                </div>
            )}
        </div>
    )
}
