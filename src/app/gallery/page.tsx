'use client'

import { useEffect, useState } from 'react'
import { getGenerations, deleteGeneration } from '@/lib/supabase-utils'
import Image from 'next/image'
import { Download, Trash2, Clock, Package, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Generation {
    id: string
    image_url: string
    prompt: string
    settings: any
    created_at: string
    expires_at: string
    products: {
        name: string
        image_url: string
    }
}

function GalleryContent() {
    const [generations, setGenerations] = useState<Generation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<Generation | null>(null)
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
    const [fullscreenDetailsExpanded, setFullscreenDetailsExpanded] = useState(false)

    useEffect(() => {
        loadGenerations()
    }, [])

    const loadGenerations = async () => {
        setLoading(true)
        const data = await getGenerations()
        setGenerations(data as Generation[])
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this generated image?')) return

        const success = await deleteGeneration(id)
        if (success) {
            setGenerations(prev => prev.filter(g => g.id !== id))
            if (selectedImage?.id === id) {
                setSelectedImage(null)
            }
        }
    }

    const handleDownload = async (imageUrl: string, filename: string) => {
        try {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download failed:', error)
            alert('Failed to download image')
        }
    }

    const getDaysRemaining = (expiresAt: string) => {
        const now = new Date()
        const expiry = new Date(expiresAt)
        const diff = expiry.getTime() - now.getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days
    }

    const toggleExpanded = (id: string) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 lg:px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">Gallery</h1>
                    <p className="text-gray-400 text-sm lg:text-base">
                        All your generated images (auto-delete after 30 days)
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="size-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                ) : generations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl">
                        <Package className="size-16 text-gray-600 mb-4" />
                        <p className="text-gray-500 text-lg">No generated images yet</p>
                        <p className="text-gray-600 text-sm mt-2">Create some in the dashboard!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                        {generations.map((gen) => {
                            const daysRemaining = getDaysRemaining(gen.expires_at)
                            const isExpanded = expandedCards.has(gen.id)

                            return (
                                <div
                                    key={gen.id}
                                    className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-purple-500/50 transition-all"
                                >
                                    <div
                                        className="aspect-square relative cursor-pointer"
                                        onClick={() => setSelectedImage(gen)}
                                    >
                                        <Image
                                            src={gen.image_url}
                                            alt="Generated image"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <div className="p-3 lg:p-4 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Clock className="size-3" />
                                                <span>{daysRemaining} days left</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDownload(gen.image_url, `plume-${gen.id}.png`)}
                                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(gen.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className={`text-xs lg:text-sm text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                            {gen.prompt}
                                        </p>

                                        {/* Expandable Details */}
                                        {isExpanded && (
                                            <div className="space-y-2 pt-2 border-t border-white/10 animate-in slide-in-from-top-2 fade-in duration-200">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Sparkles className="size-3 text-purple-400" />
                                                    <span className="text-gray-500">Generation Details</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                    <div className="bg-white/5 px-2 py-1.5 rounded-md border border-white/5">
                                                        <div className="text-gray-500 mb-0.5">Preset</div>
                                                        <div className="text-white font-medium">{gen.settings?.preset || 'N/A'}</div>
                                                    </div>
                                                    <div className="bg-white/5 px-2 py-1.5 rounded-md border border-white/5">
                                                        <div className="text-gray-500 mb-0.5">Ratio</div>
                                                        <div className="text-white font-medium">{gen.settings?.aspectRatio || 'N/A'}</div>
                                                    </div>
                                                    <div className="bg-white/5 px-2 py-1.5 rounded-md border border-white/5 col-span-2">
                                                        <div className="text-gray-500 mb-0.5">Model</div>
                                                        <div className="text-white font-medium truncate">{gen.settings?.model || 'N/A'}</div>
                                                    </div>
                                                    {gen.settings?.textOverlay?.enabled && (
                                                        <div className="bg-purple-500/10 px-2 py-1.5 rounded-md border border-purple-500/20 col-span-2">
                                                            <div className="text-purple-400 mb-0.5">Text Overlay</div>
                                                            <div className="text-white font-medium">{gen.settings.textOverlay.text}</div>
                                                            <div className="text-gray-400 text-[9px] mt-1">
                                                                {gen.settings.textOverlay.style} • {gen.settings.textOverlay.position}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    Created: {new Date(gen.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Expand/Collapse Button */}
                                        <button
                                            onClick={() => toggleExpanded(gen.id)}
                                            className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white"
                                        >
                                            {isExpanded ? (
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

                                        {gen.products && (
                                            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                                <div className="size-8 rounded overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={gen.products.image_url}
                                                        alt={gen.products.name}
                                                        width={32}
                                                        height={32}
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 truncate">
                                                    {gen.products.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white/10 transition-all z-50 group"
                    >
                        <svg className="size-6 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Navigation Buttons */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            const currentIndex = generations.findIndex(g => g.id === selectedImage.id)
                            if (currentIndex > 0) setSelectedImage(generations[currentIndex - 1])
                        }}
                        disabled={generations.findIndex(g => g.id === selectedImage.id) === 0}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-0 disabled:pointer-events-none z-50 group"
                    >
                        <svg className="size-8 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            const currentIndex = generations.findIndex(g => g.id === selectedImage.id)
                            if (currentIndex < generations.length - 1) setSelectedImage(generations[currentIndex + 1])
                        }}
                        disabled={generations.findIndex(g => g.id === selectedImage.id) === generations.length - 1}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-0 disabled:pointer-events-none z-50 group"
                    >
                        <svg className="size-8 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Main Image */}
                    <div className="relative w-full h-full p-8 md:p-20 flex items-center justify-center">
                        <div className="relative w-full h-full max-w-7xl">
                            <Image
                                src={selectedImage.image_url}
                                alt="Generated image"
                                fill
                                className="object-contain drop-shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-6 px-4 md:px-8 z-40"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-w-5xl mx-auto">
                            <div className="flex flex-col gap-4">
                                {/* Main Info Row */}
                                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-base md:text-lg font-medium text-white line-clamp-1">
                                            {selectedImage.products?.name || 'Generated Image'}
                                        </h3>
                                        <p className={`text-xs md:text-sm text-gray-300 max-w-2xl ${fullscreenDetailsExpanded ? '' : 'line-clamp-2'}`}>
                                            {selectedImage.prompt}
                                        </p>
                                    </div>

                                    <div className="flex gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => handleDownload(selectedImage.image_url, `plume-${selectedImage.id}.png`)}
                                            className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10 text-sm"
                                        >
                                            <Download className="size-4" />
                                            <span className="hidden sm:inline">Download</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this image?')) {
                                                    handleDelete(selectedImage.id)
                                                    setSelectedImage(null)
                                                }
                                            }}
                                            className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Trash2 className="size-4" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {fullscreenDetailsExpanded && (
                                    <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                        <div className="flex items-center gap-2 text-xs">
                                            <Sparkles className="size-3 text-purple-400" />
                                            <span className="text-gray-400">Generation Details</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-gray-500 mb-1">Preset</div>
                                                <div className="text-sm text-white font-medium">{selectedImage.settings?.preset || 'N/A'}</div>
                                            </div>
                                            <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-gray-500 mb-1">Aspect Ratio</div>
                                                <div className="text-sm text-white font-medium">{selectedImage.settings?.aspectRatio || 'N/A'}</div>
                                            </div>
                                            <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5 col-span-2">
                                                <div className="text-[10px] text-gray-500 mb-1">Model</div>
                                                <div className="text-sm text-white font-medium truncate">{selectedImage.settings?.model || 'N/A'}</div>
                                            </div>
                                            {selectedImage.settings?.textOverlay?.enabled && (
                                                <div className="bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20 col-span-2 md:col-span-4">
                                                    <div className="text-[10px] text-purple-400 mb-1">Text Overlay</div>
                                                    <div className="text-sm text-white font-medium mb-1">{selectedImage.settings.textOverlay.text}</div>
                                                    <div className="text-[10px] text-gray-400">
                                                        {selectedImage.settings.textOverlay.style} • {selectedImage.settings.textOverlay.position}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <Clock className="size-3" />
                                            Created: {new Date(selectedImage.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                {/* Expand/Collapse Button */}
                                <button
                                    onClick={() => setFullscreenDetailsExpanded(!fullscreenDetailsExpanded)}
                                    className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white"
                                >
                                    {fullscreenDetailsExpanded ? (
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
            )}
        </div>
    )
}

export default function Gallery() {
    return (
        <ProtectedRoute>
            <GalleryContent />
        </ProtectedRoute>
    )
}
