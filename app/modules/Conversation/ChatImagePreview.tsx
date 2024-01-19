'use client'
import { useRef, useState, MouseEvent, useEffect } from 'react'
import { Dialog, DialogContent } from '@/app/components/ui/dialog'

const ChatImagePreview = ({
    imageUrl,
    isOpen,
    closeCallback,
}: {
    imageUrl?: string
    isOpen: boolean
    closeCallback?: () => void
}) => {
    const [hovered, setHovered] = useState(false)
    const [openPreview, setOpenPreview] = useState(false)

    useEffect(() => {
        setOpenPreview(isOpen)
    }, [isOpen])

    const handleClosePreview = () => {
        setOpenPreview(false)
        if (closeCallback) {
            closeCallback()
        }
    }

    const handleImageClick = (event: MouseEvent<HTMLImageElement>) => {
        event.preventDefault()
        event.stopPropagation()
        handleClosePreview()
    }

    if (!imageUrl) return null

    return (
        <Dialog open={openPreview}>
            <DialogContent
                className="py-0 px-0 border-none bg-transparent active:outline-none focus:outline-none text-center justify-center flex items-center"
                onInteractOutside={handleClosePreview}
                autoFocus={false}
                onEscapeKeyDown={handleClosePreview}
                onClick={handleClosePreview}
            >
                <div className=" max-h-[90vh] max-w-[90vw] min-w-[80vw] min-h-[80vh] object-contain justify-center items-center flex">
                    <img src={imageUrl} className="" onClick={handleImageClick} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ChatImagePreview
