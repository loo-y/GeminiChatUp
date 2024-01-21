'use client'
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

interface IPopupProps {
    children: JSX.Element
    trigger: JSX.Element
    title?: string

    showConfirm?: boolean

    confirmCallBack?: () => void
}
export default function Popup({ children, trigger, title, showConfirm, confirmCallBack }: IPopupProps) {
    let [isOpen, setIsOpen] = useState(false)

    function closePopup() {
        setIsOpen(false)
    }

    function openPopup() {
        setIsOpen(true)
    }

    function keepOpen(status: boolean) {
        console.log(`keepOpen`, status)
    }

    return (
        <>
            <div onClick={openPopup}>{trigger}</div>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closePopup}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25 -z-10" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    {title ? (
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                    ) : null}

                                    <div className="mt-2">{children}</div>

                                    {showConfirm && confirmCallBack ? (
                                        <div className="mt-12 w-full flex items-center justify-end flex-row gap-10">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none  focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                onClick={() => {
                                                    closePopup()
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3"
                                                onClick={() => {
                                                    confirmCallBack()
                                                    closePopup()
                                                }}
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-12 w-full flex items-center justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3"
                                                onClick={closePopup}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
