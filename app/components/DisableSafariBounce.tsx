import React, { useEffect } from 'react'

const DisableSafariBounce = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        const handleTouchMove = (event: TouchEvent) => {
            event.preventDefault()
        }

        // Disable bounce effect on touchmove
        document.body.addEventListener('touchmove', handleTouchMove, { passive: false })

        return () => {
            document.body.removeEventListener('touchmove', handleTouchMove)
        }
    }, [])

    return <div className="">{children}</div>
}

export default DisableSafariBounce
