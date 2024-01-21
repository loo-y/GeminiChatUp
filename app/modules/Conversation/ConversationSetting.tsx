'use client'
import React, { ChangeEvent } from 'react'
import _ from 'lodash'
import { updateConversationInfo } from '../../(pages)/chat/slice'
import { useAppDispatch } from '@/app/hooks'
import { IConversation } from '../../(pages)/chat/interface'
import Popup from '@/app/components/Popup'
import RangeInput from '@/app/components/RangeInput'
import SeparateLineWithText from '@/app/components/SeparateLineWithText'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { Drawer, DrawerContent, DrawerTrigger } from '@/app/components/ui/drawer'

const HarmBlockThresholdLabelMap = [
    {
        label: `Block None`,
        value: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        label: `Block Few`,
        value: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        label: `Block Some`,
        value: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        label: `Block Most`,
        value: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
]

const HarmBlockThresholdLabel = _.map(HarmBlockThresholdLabelMap, 'label')

interface IConversationSettingProps {
    conversation: IConversation
}
const ConversationSetting = ({ conversation }: IConversationSettingProps) => {
    const isMobileScreen = window.innerWidth <= 768

    if (isMobileScreen) {
        return (
            <Drawer onOpenChange={() => {}}>
                <DrawerTrigger>
                    <div className="svg-image flex h-7 w-7 overflow-hidden items-center justify-center cursor-pointer">
                        <img src={'/images/settings.svg'} className="h-6 w-6 active:mt-[0.5px] active:ml-[0.5px]" />
                    </div>
                </DrawerTrigger>
                <DrawerContent>
                    <div className="py-4 pb-12 px-6 max-h-[70vh] overflow-y-scroll">
                        <ConversationSettingMain conversation={conversation} />
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Popup
            trigger={
                <div className="svg-image flex h-7 w-7 overflow-hidden items-center justify-center cursor-pointer">
                    <img src={'/images/settings.svg'} className="h-6 w-6 active:mt-[0.5px] active:ml-[0.5px]" />
                </div>
            }
            title={`Conversation Setting`}
        >
            <ConversationSettingMain conversation={conversation} />
        </Popup>
    )
}

export default ConversationSetting

const ConversationSettingMain = ({ conversation }: IConversationSettingProps) => {
    const dispatch = useAppDispatch()
    const {
        conversationName,
        conversationId,
        temperature,
        topK,
        topP,
        maxOutputTokens,
        harassment,
        hateSpeech,
        sexuallyExplicit,
        dangerousContent,
    } = conversation || {}

    const handleChangeConversationName = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event?.currentTarget?.value
        if (newValue) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    conversationName: _.trim(newValue),
                })
            )
        }
    }

    const handleChangeTemperature = (newTemperature: number) => {
        if (newTemperature >= 0 && newTemperature <= 1) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    temperature: newTemperature,
                })
            )
        }
    }

    const handleChangeTopK = (event: ChangeEvent<HTMLInputElement>) => {
        const newTopK = Number(event?.currentTarget?.value) || 0
        if (newTopK >= 1) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    topK: newTopK,
                })
            )
        }
    }

    const handleChangeTopP = (newTopP: number) => {
        if (newTopP >= 0 && newTopP <= 1) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    topP: newTopP,
                })
            )
        }
    }

    const handleChangeMaxOutputTokens = (event: ChangeEvent<HTMLInputElement>) => {
        const newMaxOutputTokens = Number(event?.currentTarget?.value) || 0
        // https://ai.google.dev/models/gemini Pro: 2048, Pro Vision: 4096
        if (newMaxOutputTokens >= 1 && newMaxOutputTokens <= 2048) {
            dispatch(
                updateConversationInfo({
                    conversationId,
                    maxOutputTokens: newMaxOutputTokens,
                })
            )
        }
    }

    const handleChangeSafety = (
        num: number,
        safetyType: 'harassment' | 'hateSpeech' | 'sexuallyExplicit' | 'dangerousContent'
    ) => {
        if (HarmBlockThresholdLabelMap[num]) {
            let safetyInfo: Pick<IConversation, 'harassment' | 'hateSpeech' | 'sexuallyExplicit' | 'dangerousContent'> =
                {}
            safetyInfo[safetyType] = HarmBlockThresholdLabelMap[num].value
            dispatch(
                updateConversationInfo({
                    conversationId,
                    ...safetyInfo,
                })
            )
        }
    }
    return (
        <div className="flex flex-col w-full gap-10" tabIndex={0}>
            <div className=" flex flex-col w-full text-textBlackColor gap-6">
                <SeparateLineWithText text={`Basic Settings`} />
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Conversation Name`}</span>
                    </div>
                    <div className="flex flex-grow border border-solid border-stone-400 rounded-xl py-2 px-3">
                        <input
                            className="w-full text-left text-sm focus:outline-none active:outline-none text-textBlackColor"
                            type="text"
                            defaultValue={conversationName || ''}
                            onChange={handleChangeConversationName}
                        />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Temperature`}</span>
                    </div>
                    <div className="flex flex-grow">
                        <RangeInput
                            id={`temperature`}
                            min={0}
                            max={1}
                            step={0.01}
                            defaultValue={temperature == undefined ? 1 : temperature}
                            valueShowRight={true}
                            changeCallback={value => {
                                handleChangeTemperature(value)
                            }}
                        />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Top K`}</span>
                    </div>
                    <div className="flex flex-grow border border-solid border-stone-400 rounded-xl py-2 px-3">
                        <input
                            className="w-full text-left text-sm focus:outline-none active:outline-none text-textBlackColor"
                            type="number"
                            defaultValue={topK}
                            step={1}
                            min={1}
                            onChange={handleChangeTopK}
                        />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Top P`}</span>
                    </div>
                    <div className="flex flex-grow">
                        <RangeInput
                            id={`topp`}
                            min={0}
                            max={1}
                            step={0.01}
                            defaultValue={topP || 1}
                            valueShowRight={true}
                            changeCallback={value => {
                                handleChangeTopP(value)
                            }}
                        />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Max Output`}</span>
                    </div>
                    <div className="flex flex-grow border border-solid border-stone-400 rounded-xl py-2 px-3">
                        <input
                            className="w-full text-left text-sm focus:outline-none active:outline-none text-textBlackColor"
                            type="number"
                            defaultValue={maxOutputTokens || 2048}
                            step={1}
                            min={1}
                            max={2048}
                            onChange={handleChangeMaxOutputTokens}
                        />
                    </div>
                </div>
            </div>
            <div className=" flex flex-col w-full text-textBlackColor gap-6">
                <SeparateLineWithText text={`Safety settings`} />
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Harassment`}</span>
                    </div>
                    <div className="flex flex-grow -mb-8">
                        <RangeInput
                            id={`harassment`}
                            min={0}
                            max={3}
                            step={1}
                            defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: harassment }) || 0}
                            changeCallback={value => {
                                handleChangeSafety(value, 'harassment')
                            }}
                            labelList={HarmBlockThresholdLabel}
                        />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Hate Speech`}</span>
                    </div>
                    <div className="flex flex-grow -mb-8">
                        <RangeInput
                            id={`hatespeech`}
                            min={0}
                            max={3}
                            step={1}
                            defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: hateSpeech }) || 0}
                            changeCallback={value => {
                                handleChangeSafety(value, 'hateSpeech')
                            }}
                            labelList={HarmBlockThresholdLabel}
                        />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Sexually Explicit`}</span>
                    </div>
                    <div className="flex flex-grow -mb-8">
                        <RangeInput
                            id={`sexuallyexplicit`}
                            min={0}
                            max={3}
                            step={1}
                            defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: sexuallyExplicit }) || 0}
                            changeCallback={value => {
                                handleChangeSafety(value, 'sexuallyExplicit')
                            }}
                            labelList={HarmBlockThresholdLabel}
                        />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="flex w-2/5">
                        <span>{`Dangerous Content`}</span>
                    </div>
                    <div className="flex flex-grow -mb-8">
                        <RangeInput
                            id={`dangerouscontent`}
                            min={0}
                            max={3}
                            step={1}
                            defaultValue={_.findIndex(HarmBlockThresholdLabelMap, { value: dangerousContent }) || 0}
                            changeCallback={value => {
                                handleChangeSafety(value, 'dangerousContent')
                            }}
                            labelList={HarmBlockThresholdLabel}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
