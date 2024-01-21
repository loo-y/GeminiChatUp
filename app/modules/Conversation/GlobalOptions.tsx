'use client'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { Drawer, DrawerContent, DrawerFooter, DrawerTrigger } from '@/app/components/ui/drawer'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Button } from '@/app/components/ui/button'
import { APICredentials } from '@/app/shared/interfaces'
import { Dialog, DialogContent, DialogTrigger } from '@/app/components/ui/dialog'
import { Switch } from '@/app/components/ui/switch'
import { ChangeEvent, useRef, useState } from 'react'
import _ from 'lodash'
import { updateGlobalOptionsInfo, getChatState } from '@/app/(pages)/chat/slice'
import { IGlobalOptionsInfo } from '@/app/(pages)/chat/interface'

const optionsImgUrl = `/images/options.svg`
const GlobalOptions = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getChatState)
    const { geminiUserName, geminiUserToken, customGeminiAPI, useAPICredentials, useStream } = state || {}
    const [openOptionsDialog, setopenOptionsDialog] = useState<boolean>(false)
    const [openOptionsDrawer, setopenOptionsDrawer] = useState<boolean>(false)

    const handleConfirmDialog = (valueObj: Partial<IGlobalOptionsInfo>) => {
        setopenOptionsDialog(false)
        dispatch(updateGlobalOptionsInfo(valueObj))
    }
    const handleConfirmDrawer = (valueObj: Partial<IGlobalOptionsInfo>) => {
        setopenOptionsDrawer(false)
        dispatch(updateGlobalOptionsInfo(valueObj))
    }

    return (
        <div className="flex">
            <div className="hidden md:flex">
                <Dialog open={openOptionsDialog} onOpenChange={setopenOptionsDialog}>
                    <DialogTrigger asChild>
                        <div className="__conversation_avatar__ flex h-9 w-9 items-center justify-center cursor-pointer hover:bg-gray-200 hover:rounded-full">
                            <img src={optionsImgUrl} className="h-6 w-6" />
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <GlobalOptionsMain
                            confirmCallback={handleConfirmDialog}
                            geminiUserName={geminiUserName}
                            geminiUserToken={geminiUserToken}
                            customGeminiAPI={customGeminiAPI}
                            useAPICredentials={useAPICredentials}
                            useStream={useStream}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex md:hidden">
                <Drawer open={openOptionsDrawer} onOpenChange={setopenOptionsDrawer}>
                    <DrawerTrigger>
                        <div className="__conversation_avatar__ flex h-9 w-9 items-center justify-center cursor-pointer hover:bg-gray-200 hover:rounded-full">
                            <img src={optionsImgUrl} className="h-6 w-6" />
                        </div>
                    </DrawerTrigger>
                    <DrawerContent>
                        <GlobalOptionsMain
                            confirmCallback={handleConfirmDrawer}
                            geminiUserName={geminiUserName}
                            geminiUserToken={geminiUserToken}
                            customGeminiAPI={customGeminiAPI}
                            useAPICredentials={useAPICredentials}
                            useStream={useStream}
                        />
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    )
}

export default GlobalOptions

export interface IGlobalOptionsMain extends IGlobalOptionsInfo {
    className?: string
    confirmCallback: (valueObj: Partial<IGlobalOptionsInfo>) => void
    useStream?: boolean
}

export const GlobalOptionsMain = ({
    className,
    confirmCallback,
    geminiUserName,
    geminiUserToken,
    customGeminiAPI,
    useAPICredentials,
    useStream,
}: IGlobalOptionsMain) => {
    const selectRef = useRef(null)
    const [tempUseAPICredentials, setTempUseAPICredentials] = useState<APICredentials | undefined>(useAPICredentials)
    const [tempGeminiUserName, setTempGeminiUserName] = useState<string>(geminiUserName || '')
    const [tempGeminiUserToken, setTempGeminiUserToken] = useState<string>(geminiUserToken || '')
    const [tempCustomGeminiAPI, setTempCustomGeminiAPI] = useState<string>(customGeminiAPI || '')
    const [tempUseStream, setTempUseStream] = useState<boolean>(useStream || false)

    const handleConfirm = () => {
        confirmCallback &&
            confirmCallback({
                geminiUserName: _.trim(tempGeminiUserName),
                geminiUserToken: _.trim(tempGeminiUserToken),
                customGeminiAPI: _.trim(tempCustomGeminiAPI),
                useAPICredentials: tempUseAPICredentials,
                useStream: tempUseStream,
            })
    }

    const handleChangeSelection = (value: APICredentials) => {
        console.log(`value`, value)
        setTempUseAPICredentials(value)
    }

    const handleChangeCustomAPI = (event: ChangeEvent<HTMLInputElement>) => {
        let value = event?.currentTarget?.value
        setTempCustomGeminiAPI(value)
    }
    const handleChangeGeminiUserName = (event: ChangeEvent<HTMLInputElement>) => {
        let value = event?.currentTarget?.value
        setTempGeminiUserName(value)
    }
    const handleChangeGeminiUserToken = (event: ChangeEvent<HTMLInputElement>) => {
        let value = event?.currentTarget?.value
        setTempGeminiUserToken(value)
    }
    const handleChangeStreamSwitch = (switchValue: boolean) => {
        setTempUseStream(switchValue)
    }
    return (
        <div className={`flex w-full px-4 py-4 ${className || ''}`} tabIndex={0}>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col w-full space-y-1.5 gap-3">
                    <div className="flex flex-row gap-2 items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="use_stream_switch">Use Stream</Label>
                            <div className="text-sm text-gray-500">use streaming API calls for conversations</div>
                        </div>
                        <Switch
                            id={`use_stream_switch`}
                            checked={!!tempUseStream}
                            onCheckedChange={handleChangeStreamSwitch}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="gemini_api_credentials_select">API Credentials</Label>
                        <Select onValueChange={handleChangeSelection} value={tempUseAPICredentials || undefined}>
                            <SelectTrigger id="gemini_api_credentials_select">
                                <SelectValue placeholder="Select API Credentials" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value={APICredentials.customAPI}>Self Gemini Pro API Key</SelectItem>
                                <SelectItem value={APICredentials.userToken}>Username & Password</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {tempUseAPICredentials == APICredentials.userToken ? (
                    <>
                        <hr className="flex-grow border-t border-gray-300 my-2" />
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="gemini_user_name">User Name</Label>
                            <Input
                                id="gemini_user_name"
                                value={tempGeminiUserName}
                                placeholder="user name"
                                onChange={handleChangeGeminiUserName}
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="gemini_user_token">User Token</Label>
                            <Input
                                id="gemini_user_token"
                                value={tempGeminiUserToken}
                                placeholder="user token"
                                onChange={handleChangeGeminiUserToken}
                            />
                        </div>
                    </>
                ) : null}
                {tempUseAPICredentials == APICredentials.customAPI ? (
                    <>
                        <hr className="flex-grow border-t border-gray-300 my-2" />
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="gemini_custom_api">Gemini Pro API Key</Label>
                            <Input
                                id="gemini_custom_api"
                                value={tempCustomGeminiAPI}
                                placeholder="your Gemini Pro API Key"
                                onChange={handleChangeCustomAPI}
                            />
                        </div>
                    </>
                ) : null}

                <div className="flex flex-col space-y-1.5 mt-6">
                    <Button onClick={handleConfirm}>Confirm</Button>
                </div>
            </div>
        </div>
    )
}
