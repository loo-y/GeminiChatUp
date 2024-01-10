import React, { ChangeEvent, useRef } from 'react'
import { imageSizeLimition } from '@/app/shared/constants'

const UploadImageButton: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // 检查文件类型
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                console.error('只能上传PNG或JPEG类型的图片')
                return
            }

            // 检查文件大小
            if (file.size > imageSizeLimition) {
                console.error('图片大小不能超过1000KB')
                return
            }

            const reader = new FileReader()
            reader.onload = () => {
                const base64Data = reader.result as string
                console.log('Base64 data:', base64Data)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleClick = () => {
        inputRef.current?.click()
    }

    return (
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
    )
}

export default UploadImageButton
