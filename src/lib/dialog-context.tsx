'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { X } from 'lucide-react'

type DialogType = 'alert' | 'confirm' | 'prompt'

interface DialogState {
    isOpen: boolean
    type: DialogType
    title: string
    message: string
    defaultValue?: string
    onConfirm: (value?: string) => void
    onCancel: () => void
}

interface DialogContextType {
    alert: (message: string, title?: string) => Promise<void>
    confirm: (message: string, title?: string) => Promise<boolean>
    prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { }
    })
    const [inputValue, setInputValue] = useState('')

    const alert = (message: string, title = 'Alert') => {
        return new Promise<void>((resolve) => {
            setDialog({
                isOpen: true,
                type: 'alert',
                title,
                message,
                onConfirm: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }))
                    resolve()
                },
                onCancel: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }))
                    resolve()
                }
            })
        })
    }

    const confirm = (message: string, title = 'Confirm') => {
        return new Promise<boolean>((resolve) => {
            setDialog({
                isOpen: true,
                type: 'confirm',
                title,
                message,
                onConfirm: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }))
                    resolve(true)
                },
                onCancel: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }))
                    resolve(false)
                }
            })
        })
    }

    const prompt = (message: string, defaultValue = '', title = 'Prompt') => {
        return new Promise<string | null>((resolve) => {
            setInputValue(defaultValue)
            setDialog({
                isOpen: true,
                type: 'prompt',
                title,
                message,
                defaultValue,
                onConfirm: (value) => {
                    setDialog(prev => ({ ...prev, isOpen: false }))
                    resolve(value || '')
                },
                onCancel: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }))
                    resolve(null)
                }
            })
        })
    }

    const { isOpen, type, title, message } = dialog

    // Premium UI design for the modal
    return (
        <DialogContext.Provider value={{ alert, confirm, prompt }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={dialog.onCancel}
                    />

                    {/* Modal Content */}
                    <div
                        className="relative bg-black/90 border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/20 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                            <h3 className="text-white font-semibold text-lg">{title}</h3>
                            <button
                                onClick={dialog.onCancel}
                                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <p className="text-gray-300 text-sm mb-6">{message}</p>

                            {type === 'prompt' && (
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all mb-2"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            dialog.onConfirm(inputValue)
                                        } else if (e.key === 'Escape') {
                                            dialog.onCancel()
                                        }
                                    }}
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end gap-3">
                            {type !== 'alert' && (
                                <button
                                    onClick={dialog.onCancel}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => dialog.onConfirm(type === 'prompt' ? inputValue : undefined)}
                                className="px-5 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                            >
                                {type === 'alert' ? 'OK' : type === 'confirm' ? 'Confirm' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    )
}

export function useDialog() {
    const context = useContext(DialogContext)
    if (context === undefined) {
        throw new Error('useDialog must be used within a DialogProvider')
    }
    return context
}
