'use client'
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { imageSizeLimition } from '@/app/shared/constants'
import { useAppDispatch } from '@/app/hooks'
import { addImageToInput } from '@/app/(pages)/chat/slice'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'

const UploadImageButton: React.FC = () => {
    const dispatch = useAppDispatch()
    const [alertText, setAlertText] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const fileInput = inputRef.current as HTMLInputElement
            // 检查文件类型
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                setAlertText(`只能上传PNG或JPEG类型的图片`)
                fileInput.value = ''
                return
            }

            // 检查文件大小
            if (file.size > imageSizeLimition) {
                setAlertText(`图片大小不能超过${imageSizeLimition}KB`)
                fileInput.value = ''
                return
            }

            const reader = new FileReader()
            reader.onload = () => {
                const base64Data = reader.result as string
                console.log('Base64 data:', base64Data)
                dispatch(
                    addImageToInput({
                        base64Content: base64Data,
                        mimeType: file.type,
                    })
                )
                fileInput.value = ''
            }
            reader.readAsDataURL(file)
        }
    }

    const handleClick = () => {
        inputRef.current?.click()
    }

    return (
        <>
            <div
                className="svg-image flex h-10 w-10 overflow-hidden items-center justify-center cursor-pointer bg-lightGreen rounded-full"
                onClick={handleClick}
            >
                <img src={'/images/image.svg'} className="h-6 w-6 " />
                <input
                    type="file"
                    accept=".png, .jpg, .jpeg"
                    onChange={handleFileUpload}
                    ref={inputRef}
                    style={{ display: 'none' }}
                />
            </div>
            <AlertOverSize
                content={alertText}
                callback={() => {
                    setAlertText('')
                }}
            />
        </>
    )
}

export default UploadImageButton

const AlertOverSize = ({ title, content, callback }: { title?: string; content?: string; callback: () => void }) => {
    const [open, setOpen] = useState(false)
    useEffect(() => {
        if (content) {
            setOpen(true)
        } else {
            setOpen(false)
        }
    }, [content])

    const handleClose = () => {
        // setOpen(false)
        callback()
    }
    return (
        <AlertDialog open={open}>
            <AlertDialogContent onEscapeKeyDown={handleClose}>
                <AlertDialogHeader>
                    {title ? <AlertDialogTitle>{title}</AlertDialogTitle> : null}

                    <AlertDialogDescription className="text-lg font-bold">{content}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleClose}>OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
