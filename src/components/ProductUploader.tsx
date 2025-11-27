'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2, ScanLine } from 'lucide-react'
import Image from 'next/image'

interface ProductUploaderProps {
    onUpload: (file: File) => void
    isUploading: boolean
}

export default function ProductUploader({ onUpload, isUploading }: ProductUploaderProps) {
    const [dragActive, setDragActive] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            handleFile(file)
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            handleFile(file)
        }
    }

    const handleFile = (file: File) => {
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)
        onUpload(file)
    }

    const clearFile = () => {
        setPreview(null)
    }

    return (
        <div className="w-full">
            {preview ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square group bg-black/40">
                    <Image
                        src={preview}
                        alt="Product preview"
                        fill
                        className={`object-contain p-4 transition-all duration-500 ${isUploading ? 'scale-95 opacity-50' : 'scale-100'}`}
                    />

                    {/* Scanning Animation */}
                    {/* Scanning Animation */}
                    {isUploading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            {/* Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                            {/* Scanning Line */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 via-purple-500/10 to-purple-500/0 animate-scan" />
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-scan-line" />

                            {/* Corner Markers */}
                            <div className="absolute top-4 left-4 size-8 border-t-2 border-l-2 border-purple-500 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 size-8 border-t-2 border-r-2 border-purple-500 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 size-8 border-b-2 border-l-2 border-purple-500 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 size-8 border-b-2 border-r-2 border-purple-500 rounded-br-lg" />

                            <div className="flex flex-col items-center gap-3 z-20">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
                                    <ScanLine className="size-10 text-purple-400 animate-pulse" />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-sm font-bold text-white tracking-widest uppercase">Analyzing</span>
                                    <span className="text-[10px] text-purple-300 tracking-wider animate-pulse">Detecting Features...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={clearFile}
                        disabled={isUploading}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 disabled:opacity-0 backdrop-blur-sm"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <div
                    className={`relative group overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 aspect-video flex flex-col items-center justify-center
            ${dragActive
                            ? 'border-purple-500 bg-purple-500/10 scale-[0.99]'
                            : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleChange}
                        accept="image/*"
                    />

                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col items-center gap-4 pointer-events-none relative z-0 transform group-hover:-translate-y-1 transition-transform duration-300">
                        <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/20 group-hover:border-purple-500/30 transition-all">
                            <Upload className="size-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                Drop your product here
                            </p>
                            <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                or click to browse
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
