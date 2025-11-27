'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Download, Maximize2, Share2, X, Save, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface GeneratedImage {
    id: string
    url: string
    prompt: string
    settings?: {
        preset: string
        aspectRatio: string
        model: string
        customPrompt?: string
        textOverlay?: {
            enabled: boolean
            text: string
            style: string
            position: string
        }
    }
}

interface ResultCarouselProps {
    images: GeneratedImage[]
    onTemplateSaved?: () => void
}

export default function ResultCarousel({ images, onTemplateSaved }: ResultCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showPromptDetails, setShowPromptDetails] = useState(false)
    const [detailsExpanded, setDetailsExpanded] = useState(false)

    if (images.length === 0) return null

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    const currentImage = images[currentIndex]

    const handleDownload = async () => {
        try {
            // Create filename with preset prefix
            const preset = currentImage.settings?.preset || 'default'
            const timestamp = new Date().getTime()
            const filename = `plume-studio-${preset}-${timestamp}.png`

            let blob: Blob

            // Get the image as a blob
            if (currentImage.url.startsWith('data:')) {
                // For data URLs, fetch directly
                const response = await fetch(currentImage.url)
                blob = await response.blob()
            } else if (currentImage.url.startsWith('http')) {
                // For external URLs, use our proxy or fetch with cors mode
                try {
                    const response = await fetch(currentImage.url, { mode: 'cors' })
                    blob = await response.blob()
                } catch (corsError) {
                    //  Fallback to proxy if CORS fails
                    const proxyUrl = `/api/download?url=${encodeURIComponent(currentImage.url)}&filename=${encodeURIComponent(filename)}`
                    const response = await fetch(proxyUrl)
                    blob = await response.blob()
                }
            } else {
                throw new Error('Invalid image URL')
            }

            // Create download link
            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()

            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl)
                document.body.removeChild(a)
            }, 100)
        } catch (error) {
            console.error('Download failed:', error)
            alert('Failed to download image. Please try again.')
        }
    }

    const handleSaveTemplate = async () => {
        const templateName = prompt('Enter a name for this template:')
        if (!templateName || templateName.trim() === '') return

        try {
            const { saveTemplate } = await import('@/lib/supabase-utils')
            await saveTemplate(
                templateName.trim(),
                currentImage.prompt,
                currentImage.settings
            )
            alert('Template saved successfully!')
            if (onTemplateSaved) onTemplateSaved()
        } catch (error: any) {
            console.error('Error saving template:', error)
            alert(`Failed to save template: ${error.message || 'Unknown error'}`)
        }
    }

    return (
        <>
            <div className="w-full h-full flex flex-col bg-black/20 backdrop-blur-sm">
                {/* Main Image Area */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden group p-8">
                    <div className="relative w-full h-full max-w-5xl aspect-square shadow-2xl rounded-lg overflow-hidden">
                        <Image
                            src={currentImage.url}
                            alt={`Generated result ${currentIndex + 1}`}
                            fill
                            className="object-contain drop-shadow-2xl"
                        />
                    </div>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 backdrop-blur-md border border-white/10"
                            >
                                <ChevronLeft className="size-6" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 backdrop-blur-md border border-white/10"
                            >
                                <ChevronRight className="size-6" />
                            </button>
                        </>
                    )}

                    {/* Action Bar */}
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        <button
                            onClick={() => setShowPromptDetails(!showPromptDetails)}
                            className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all"
                            title="View Details"
                        >
                            <Share2 className="size-5" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all"
                            title="Download"
                        >
                            <Download className="size-5" />
                        </button>
                        <button
                            onClick={() => setIsFullscreen(true)}
                            className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all"
                            title="Fullscreen"
                        >
                            <Maximize2 className="size-5" />
                        </button>
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-black/50 text-white backdrop-blur-md border border-white/10 text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>

                {/* Filmstrip & Info */}
                <div className="bg-black/40 border-t border-white/10 backdrop-blur-md">
                    <div className="container mx-auto px-4 lg:px-6 py-4">
                        <div className="space-y-4">
                            {/* Main Row */}
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                                {/* Filmstrip */}
                                <div className="flex gap-2 overflow-x-auto pb-2 max-w-full lg:max-w-md no-scrollbar">
                                    {images.map((img, idx) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`relative size-14 lg:size-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-purple-500 opacity-100 scale-110' : 'border-transparent opacity-50 hover:opacity-80'
                                                }`}
                                        >
                                            <Image src={img.url} alt="" fill className="object-cover" />
                                            {idx === currentIndex && (
                                                <div className="absolute inset-0 bg-purple-500/20" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="hidden lg:block h-12 w-px bg-white/10" />

                                {/* Prompt Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                                        Prompt Used
                                    </h3>
                                    <p className={`text-xs lg:text-sm text-gray-300 font-light ${detailsExpanded ? '' : 'line-clamp-2'}`}>
                                        {currentImage.prompt}
                                    </p>
                                </div>

                                {/* Save Template Button */}
                                <button
                                    onClick={handleSaveTemplate}
                                    className="flex-shrink-0 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all flex items-center gap-2 text-sm font-medium"
                                >
                                    <Save className="size-4" />
                                    <span className="hidden sm:inline">Save Template</span>
                                </button>
                            </div>

                            {/* Expandable Details */}
                            {detailsExpanded && (
                                <div className="space-y-3 pt-3 border-t border-white/10 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="flex items-center gap-2 text-xs">
                                        <Sparkles className="size-3 text-purple-400" />
                                        <span className="text-gray-400">Generation Details</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                            <div className="text-[10px] text-gray-500 mb-1">Preset</div>
                                            <div className="text-sm text-white font-medium">{currentImage.settings?.preset || 'N/A'}</div>
                                        </div>
                                        <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                            <div className="text-[10px] text-gray-500 mb-1">Aspect Ratio</div>
                                            <div className="text-sm text-white font-medium">{currentImage.settings?.aspectRatio || 'N/A'}</div>
                                        </div>
                                        <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5 col-span-2">
                                            <div className="text-[10px] text-gray-500 mb-1">Model</div>
                                            <div className="text-sm text-white font-medium truncate">{currentImage.settings?.model || 'N/A'}</div>
                                        </div>
                                        {currentImage.settings?.textOverlay?.enabled && (
                                            <div className="bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20 col-span-2 md:col-span-4">
                                                <div className="text-[10px] text-purple-400 mb-1">Text Overlay</div>
                                                <div className="text-sm text-white font-medium mb-1">{currentImage.settings.textOverlay.text}</div>
                                                <div className="text-[10px] text-gray-400">
                                                    {currentImage.settings.textOverlay.style} • {currentImage.settings.textOverlay.position}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Expand/Collapse Button */}
                            <button
                                onClick={() => setDetailsExpanded(!detailsExpanded)}
                                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white"
                            >
                                {detailsExpanded ? (
                                    <>
                                        <ChevronUp className="size-3.5" />
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="size-3.5" />
                                        Show Details
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsFullscreen(false)
                        }}
                        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
                    >
                        <X className="size-6" />
                    </button>
                    <div className="relative w-full h-full p-8" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={currentImage.url}
                            alt="Fullscreen view"
                            fill
                            className="object-contain"
                        />
                    </div>
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    prevSlide()
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                                <ChevronLeft className="size-8" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    nextSlide()
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                                <ChevronRight className="size-8" />
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Prompt Details Modal */}
            {showPromptDetails && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPromptDetails(false)}>
                    <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">Generation Details</h2>
                            <button onClick={() => setShowPromptDetails(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="size-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Prompt</label>
                                <div className="mt-2 p-4 bg-black/40 rounded-lg border border-white/10 text-sm text-gray-300 whitespace-pre-wrap">
                                    {currentImage.prompt}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aspect Ratio</label>
                                    <div className="mt-2 p-3 bg-black/40 rounded-lg border border-white/10 text-sm text-white">
                                        {currentImage.settings?.aspectRatio || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Model</label>
                                    <div className="mt-2 p-3 bg-black/40 rounded-lg border border-white/10 text-sm text-white">
                                        {currentImage.settings?.model || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Style Preset</label>
                                <div className="mt-2 p-3 bg-black/40 rounded-lg border border-white/10 text-sm text-white capitalize">
                                    {currentImage.settings?.preset || 'N/A'}
                                </div>
                            </div>

                            {currentImage.settings?.customPrompt && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Custom Details</label>
                                    <div className="mt-2 p-3 bg-black/40 rounded-lg border border-white/10 text-sm text-white">
                                        {currentImage.settings.customPrompt}
                                    </div>
                                </div>
                            )}

                            {currentImage.settings?.textOverlay?.enabled && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Text Overlay</label>
                                    <div className="mt-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                        <div className="text-sm text-white font-medium mb-2">{currentImage.settings.textOverlay.text}</div>
                                        <div className="text-xs text-gray-400">
                                            Style: {currentImage.settings.textOverlay.style} • Position: {currentImage.settings.textOverlay.position}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSaveTemplate}
                            className="w-full mt-6 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2"
                        >
                            <Save className="size-5" />
                            Save as Template
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
