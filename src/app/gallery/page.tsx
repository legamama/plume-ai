'use client'

import { useEffect, useState } from 'react'
import { getGenerations, deleteGeneration } from '@/lib/supabase-utils'
import Image from 'next/image'
import { Download, Trash2, Clock, Package } from 'lucide-react'
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

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Gallery</h1>
                    <p className="text-gray-400">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {generations.map((gen) => {
                            const daysRemaining = getDaysRemaining(gen.expires_at)

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

                                    <div className="p-4 space-y-3">
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

                                        <p className="text-sm text-gray-400 line-clamp-2">
                                            {gen.prompt}
                                        </p>

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
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
                        <Image
                            src={selectedImage.image_url}
                            alt="Generated image"
                            fill
                            className="object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <p className="text-sm text-gray-300 mb-4">{selectedImage.prompt}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Preset: {selectedImage.settings?.preset}</span>
                                <span>Ratio: {selectedImage.settings?.aspectRatio}</span>
                                <span>Model: {selectedImage.settings?.model}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(selectedImage.image_url, `plume-${selectedImage.id}.png`)}
                                    className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                                >
                                    <Download className="size-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedImage.id)}
                                    className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors flex items-center gap-2 text-red-400"
                                >
                                    <Trash2 className="size-4" />
                                    Delete
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
