'use client'

import { useEffect, useState, useMemo } from 'react'
import { getGenerations, deleteGeneration } from '@/lib/supabase-utils'
import Image from 'next/image'
import { Download, Trash2, Clock, Package, ChevronDown, ChevronUp, Sparkles, X, ChevronLeft, ChevronRight, Share2, Info, CheckSquare, Check } from 'lucide-react'
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
    const [isSelectMode, setIsSelectMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadGenerations()
    }, [])

    const loadGenerations = async () => {
        setLoading(true)
        const data = await getGenerations()
        setGenerations(data as Generation[])
        setLoading(false)
    }

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (!confirm('Are you sure you want to delete this masterpiece?')) return

        const success = await deleteGeneration(id)
        if (success) {
            setGenerations(prev => prev.filter(g => g.id !== id))
            if (selectedImage?.id === id) {
                setSelectedImage(null)
            }
        }
    }

    const handleDownload = async (imageUrl: string, baseFilename: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        try {
            let ext = 'png';
            try {
                const urlObj = new URL(imageUrl);
                const pathExt = urlObj.pathname.split('.').pop()?.toLowerCase();
                if (pathExt && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(pathExt)) {
                    ext = pathExt;
                }
            } catch (err) { }
            if (ext === 'jpeg') ext = 'jpg';
            const filename = `${baseFilename}.${ext}`;

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

    const processedGenerations = useMemo(() => {
        const nowMs = Date.now()
        return generations.map(gen => {
            const diff = new Date(gen.expires_at).getTime() - nowMs
            const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
            return {
                ...gen,
                daysRemaining
            }
        })
    }, [generations])

    const toggleExpanded = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
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

    const navigateImage = (direction: 'next' | 'prev', e: React.MouseEvent) => {
        e.stopPropagation()
        if (!selectedImage) return
        const currentIndex = generations.findIndex(g => g.id === selectedImage.id)
        if (direction === 'prev' && currentIndex > 0) {
            setSelectedImage(generations[currentIndex - 1])
        } else if (direction === 'next' && currentIndex < generations.length - 1) {
            setSelectedImage(generations[currentIndex + 1])
        }
    }

    const toggleSelection = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) newSet.delete(id)
            else newSet.add(id)
            return newSet
        })
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} item(s)?`)) return

        setLoading(true)
        for (const id of Array.from(selectedIds)) {
            await deleteGeneration(id)
        }

        setGenerations(prev => prev.filter(g => !selectedIds.has(g.id)))
        setSelectedIds(new Set())
        setIsSelectMode(false)
        setLoading(false)
    }

    const handleCardClick = (gen: Generation) => {
        if (isSelectMode) {
            toggleSelection(gen.id)
        } else {
            setSelectedImage(gen)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
                {/* Header section */}
                <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-300 to-blue-400">
                                Your Gallery
                            </span>
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">
                            A showcase of your AI generated product photography. Assets automatically expire after 30 days to free up space.
                        </p>
                    </div>
                    {generations.length > 0 && (
                        <div className="flex items-center gap-3">
                            {isSelectMode ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsSelectMode(false);
                                            setSelectedIds(new Set());
                                        }}
                                        className="px-4 py-2 rounded-full border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    {selectedIds.size > 0 && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-4 py-2 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-medium hover:bg-red-500/40 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 className="size-4" />
                                            Delete ({selectedIds.size})
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsSelectMode(true)}
                                    className="px-4 py-2 rounded-full border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <CheckSquare className="size-4" />
                                    Select
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                        <div className="relative size-16">
                            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" />
                            <div className="absolute inset-2 rounded-full border-r-2 border-blue-400 animate-spin border-opacity-60" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                        </div>
                        <p className="text-purple-300/60 text-sm animate-pulse font-medium tracking-wide">Loading masterpiece archive...</p>
                    </div>
                ) : generations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm p-8 text-center ring-1 ring-white/5 shadow-2xl">
                        <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-inner">
                            <Sparkles className="size-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-white">Your Canvas is Empty</h3>
                        <p className="text-gray-400 text-sm sm:text-base max-w-sm mb-6">
                            Head back to the dashboard to generate your first breathtaking product photo using AI.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                        {processedGenerations.map((gen) => {
                            const daysRemaining = gen.daysRemaining
                            const isExpanded = expandedCards.has(gen.id)
                            const isSelected = selectedIds.has(gen.id)

                            return (
                                <div
                                    key={gen.id}
                                    className={`group flex flex-col relative rounded-2xl overflow-hidden bg-white/[0.03] border transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] focus-within:ring-2 focus-within:ring-purple-500/50 ${isSelected ? 'border-purple-500 ring-1 ring-purple-500' : 'border-white/10 hover:bg-white/[0.05] hover:border-purple-500/40'}`}
                                >
                                    {/* Image Container */}
                                    <div
                                        className={`aspect-[4/5] sm:aspect-square relative cursor-pointer overflow-hidden bg-black/40 ${isSelectMode && isSelected ? 'opacity-80' : ''}`}
                                        onClick={() => handleCardClick(gen)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={isSelectMode ? "Select image" : "View fullscreen image"}
                                    >
                                        <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-20 transition-opacity duration-200 ${isSelectMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                            <div className={`size-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'bg-black/50 border-white/50 backdrop-blur-md'}`}>
                                                <Check className={`size-3 lg:size-4 transition-transform duration-200 ${isSelected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                                            </div>
                                        </div>
                                        <Image
                                            src={gen.image_url}
                                            alt={gen.prompt || "Generated image"}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        />

                                        {/* Hover Overlay Desktop */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex flex-col justify-between p-4">
                                            {/* Top row controls */}
                                            <div className="flex justify-between items-start">
                                                <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-[10px] font-medium text-purple-200">
                                                    <Clock className="size-3" />
                                                    {daysRemaining}d
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => handleDownload(gen.image_url, `plume-${gen.id}`, e)}
                                                        className="size-8 rounded-full bg-black/50 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors flex items-center justify-center text-white"
                                                        title="Download"
                                                    >
                                                        <Download className="size-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(gen.id, e)}
                                                        className="size-8 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md border border-red-500/30 transition-colors flex items-center justify-center text-red-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Bottom row view prompt cue */}
                                            <div className="text-center">
                                                <span className="text-xs font-medium text-white/80 bg-black/50 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                                    Click to expand
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobile Always-on badges */}
                                        <div className="absolute top-2 right-2 sm:hidden pointer-events-none">
                                            <div className="bg-black/60 shadow-lg backdrop-blur-md px-2 py-1 rounded-md border border-white/10 flex items-center gap-1 text-[10px] sm:text-xs font-medium text-purple-200">
                                                <Clock className="size-3" />
                                                {daysRemaining}d
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                                        <div className="space-y-3">
                                            {/* Prompt Preview */}
                                            <div className={`${isExpanded ? 'max-h-32 overflow-y-auto pr-2' : ''}`}>
                                                <p className={`text-sm text-gray-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                    {gen.prompt}
                                                </p>
                                            </div>

                                            {/* Expandable Details */}
                                            {isExpanded && (
                                                <div className="space-y-3 pt-3 mt-3 border-t border-white/10 animate-in slide-in-from-top-2 fade-in duration-300">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="bg-white/5 p-2 rounded-lg border border-white/[0.05]">
                                                            <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider font-semibold">Preset</div>
                                                            <div className="text-gray-200 font-medium truncate">{gen.settings?.preset || 'Custom'}</div>
                                                        </div>
                                                        <div className="bg-white/5 p-2 rounded-lg border border-white/[0.05]">
                                                            <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider font-semibold">Aspect</div>
                                                            <div className="text-gray-200 font-medium truncate">{gen.settings?.aspectRatio || '1:1'}</div>
                                                        </div>
                                                        <div className="bg-white/5 p-2 rounded-lg border border-white/[0.05] col-span-2">
                                                            <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider font-semibold">Model</div>
                                                            <div className="text-gray-200 font-medium truncate">{gen.settings?.model || 'Auto'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer area of card */}
                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {gen.products && (
                                                    <>
                                                        <div className="size-6 rounded bg-white/10 overflow-hidden flex-shrink-0 relative ring-1 ring-white/10">
                                                            <Image
                                                                src={gen.products.image_url}
                                                                alt={gen.products.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-400 truncate pr-2">
                                                            {gen.products.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Mobile Actions (Visible mainly on mobile) */}
                                            <div className="flex items-center gap-1 sm:hidden">
                                                <button onClick={(e) => handleDownload(gen.image_url, `plume-${gen.id}`, e)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg active:scale-95 transition-transform">
                                                    <Download className="size-4" />
                                                </button>
                                                <button onClick={(e) => handleDelete(gen.id, e)} className="p-2 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg active:scale-95 transition-transform">
                                                    <Trash2 className="size-4" />
                                                </button>
                                                <button onClick={(e) => toggleExpanded(gen.id, e)} className="p-2 text-purple-400 bg-purple-500/10 rounded-lg active:scale-95 transition-transform">
                                                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                </button>
                                            </div>

                                            {/* Desktop Expand Toggle */}
                                            <button
                                                onClick={(e) => toggleExpanded(gen.id, e)}
                                                className="hidden sm:flex items-center justify-center p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                title={isExpanded ? "Show Less" : "Show Details"}
                                            >
                                                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal Restyled */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[150] bg-black/95 sm:bg-black/90 sm:backdrop-blur-xl flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    {/* Top Bar (Mobile friendly) */}
                    <div className="flex items-center justify-between p-4 sm:p-6 sm:absolute sm:top-0 sm:left-0 sm:right-0 sm:z-50 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex items-center gap-3">
                            {selectedImage.products && (
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                    <div className="size-6 rounded-sm overflow-hidden relative">
                                        <Image src={selectedImage.products.image_url} alt="product" fill className="object-cover" />
                                    </div>
                                    <span className="text-xs font-semibold text-white/90 truncate max-w-[120px] sm:max-w-[200px]">
                                        {selectedImage.products.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => handleDownload(selectedImage.image_url, `plume-${selectedImage.id}`, e)}
                                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10"
                            >
                                <Download className="size-4 sm:size-5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    handleDelete(selectedImage.id, e)
                                }}
                                className="p-2.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors backdrop-blur-md border border-red-500/20"
                            >
                                <Trash2 className="size-4 sm:size-5" />
                            </button>
                            <div className="w-px h-6 bg-white/20 mx-1"></div>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10"
                            >
                                <X className="size-4 sm:size-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Image Area with Navigation overlay */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden w-full px-0 sm:px-16" onClick={(e) => e.stopPropagation()}>
                        {/* Prev Button Desktop */}
                        <button
                            onClick={(e) => navigateImage('prev', e)}
                            disabled={generations.findIndex(g => g.id === selectedImage.id) === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none z-50 group backdrop-blur-md hidden sm:block"
                        >
                            <ChevronLeft className="size-6 sm:size-8 group-hover:-translate-x-1 transition-transform" />
                        </button>

                        {/* Main Image Container */}
                        <div className="relative w-full h-[85vh] sm:h-full max-w-6xl mx-auto flex items-center justify-center selection:bg-transparent touch-pan-y">
                            <Image
                                src={selectedImage.image_url}
                                alt="Generated full image"
                                fill
                                className="object-contain drop-shadow-2xl sm:p-4"
                                priority
                                onClick={(e) => {
                                    // On mobile, tap on image could expand details or close. For now, stopping prop to keep open.
                                    e.stopPropagation()
                                    setFullscreenDetailsExpanded(!fullscreenDetailsExpanded)
                                }}
                            />
                        </div>

                        {/* Next Button Desktop */}
                        <button
                            onClick={(e) => navigateImage('next', e)}
                            disabled={generations.findIndex(g => g.id === selectedImage.id) === generations.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none z-50 group backdrop-blur-md hidden sm:block"
                        >
                            <ChevronRight className="size-6 sm:size-8 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Mobile Swipe / Nav overlay indicators - simplified to bottom sheet style */}
                    <div
                        className={`bg-black/80 backdrop-blur-2xl border-t border-white/10 transition-all duration-300 ease-in-out ${fullscreenDetailsExpanded ? 'max-h-[60vh] overflow-y-auto' : 'max-h-24 sm:max-h-32'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-4">
                            {/* Drag handle for mobile */}
                            <div
                                className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 sm:hidden flex-shrink-0"
                                onClick={() => setFullscreenDetailsExpanded(!fullscreenDetailsExpanded)}
                            />

                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="text-white/90 font-medium text-sm sm:text-lg mb-2 flex items-center gap-2 cursor-pointer w-fit"
                                        onClick={() => setFullscreenDetailsExpanded(!fullscreenDetailsExpanded)}
                                    >
                                        <Info className="size-4 text-purple-400 hidden sm:block" /> Prompt Details
                                    </h3>
                                    <div
                                        className={`${fullscreenDetailsExpanded ? 'max-h-32 overflow-y-auto pr-2' : 'overflow-hidden cursor-pointer'}`}
                                        onClick={!fullscreenDetailsExpanded ? () => setFullscreenDetailsExpanded(true) : undefined}
                                    >
                                        <p className={`text-gray-400 text-xs sm:text-sm leading-relaxed ${fullscreenDetailsExpanded ? '' : 'line-clamp-1 sm:line-clamp-2'}`}>
                                            {selectedImage.prompt}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="sm:hidden p-2 bg-white/5 rounded-full border border-white/10 flex-shrink-0"
                                    onClick={() => setFullscreenDetailsExpanded(!fullscreenDetailsExpanded)}
                                >
                                    {fullscreenDetailsExpanded ? <ChevronDown className="size-5 text-gray-300" /> : <ChevronUp className="size-5 text-gray-300" />}
                                </button>
                            </div>

                            {/* Expanded Details bottom section */}
                            {fullscreenDetailsExpanded && (
                                <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Created</div>
                                            <div className="text-xs sm:text-sm text-gray-200">{new Date(selectedImage.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Aspect Ratio</div>
                                            <div className="text-xs sm:text-sm text-gray-200">{selectedImage.settings?.aspectRatio || '1:1'}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Preset</div>
                                            <div className="text-xs sm:text-sm text-gray-200">{selectedImage.settings?.preset || 'None'}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Model Engine</div>
                                            <div className="text-xs sm:text-sm text-gray-200 truncate">{selectedImage.settings?.model || 'Auto'}</div>
                                        </div>
                                    </div>

                                    {/* Mobile Navigation controls */}
                                    <div className="flex sm:hidden mt-6 gap-4 justify-between pt-4 border-t border-white/5">
                                        <button
                                            onClick={(e) => navigateImage('prev', e)}
                                            disabled={generations.findIndex(g => g.id === selectedImage.id) === 0}
                                            className="px-6 py-3 rounded-xl bg-white/10 text-white disabled:opacity-30 font-medium text-sm flex items-center gap-2"
                                        >
                                            <ChevronLeft className="size-4" /> Prev
                                        </button>
                                        <button
                                            onClick={(e) => navigateImage('next', e)}
                                            disabled={generations.findIndex(g => g.id === selectedImage.id) === generations.length - 1}
                                            className="px-6 py-3 rounded-xl bg-white/10 text-white disabled:opacity-30 font-medium text-sm flex items-center gap-2"
                                        >
                                            Next <ChevronRight className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
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
