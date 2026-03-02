'use client'

import { useState } from 'react'
import { Upload, X, Wand2, Sparkles, Image as ImageIcon, Loader2, ArrowRight, Layers, Check, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { cleanSceneImage, generateSceneVariations } from '@/lib/gemini'
import { useDialog } from '@/lib/dialog-context'

interface SceneCleanerProps {
    onApplyBaseScene: (base64Image: string) => void
}

export default function SceneCleaner({ onApplyBaseScene }: SceneCleanerProps) {
    const { alert } = useDialog()
    const [sourceImage, setSourceImage] = useState<string | null>(null)
    const [cleanedImage, setCleanedImage] = useState<string | null>(null)
    const [isCleaning, setIsCleaning] = useState(false)

    const [variations, setVariations] = useState<string[]>([])
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false)

    const [dragActive, setDragActive] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        let file: File | null = null
        if ('dataTransfer' in e) {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                file = e.dataTransfer.files[0]
            }
        } else if (e.target && e.target.files && e.target.files[0]) {
            file = e.target.files[0]
        }

        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    setSourceImage(event.target.result as string)
                    setCleanedImage(null)
                    setVariations([])
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCleanScene = async () => {
        if (!sourceImage) return

        setIsCleaning(true)
        try {
            const apiKey = localStorage.getItem('plume_gemini_api_key') || undefined
            const { imageUrl } = await cleanSceneImage(sourceImage, apiKey)

            setCleanedImage(imageUrl)
            // Success
        } catch (error: any) {
            console.error("Clean Scene Error:", error)
            await alert(error.message || "Failed to clean scene. Please try again.")
        } finally {
            setIsCleaning(false)
        }
    }

    const handleGenerateVariations = async () => {
        if (!cleanedImage) return

        setIsGeneratingVariations(true)
        try {
            const apiKey = localStorage.getItem('plume_gemini_api_key') || undefined
            const { imageUrls } = await generateSceneVariations(cleanedImage, 2, apiKey)

            setVariations(imageUrls)
        } catch (error: any) {
            console.error("Variations Error:", error)
            await alert(error.message || "Failed to generate variations.")
        } finally {
            setIsGeneratingVariations(false)
        }
    }

    const resetState = () => {
        setSourceImage(null)
        setCleanedImage(null)
        setVariations([])
    }

    return (
        <div className="space-y-6">
            {!sourceImage ? (
                <div
                    className={`relative group overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 aspect-video flex flex-col items-center justify-center
                        ${dragActive ? 'border-purple-500 bg-purple-500/10 scale-[0.99]' : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'}`}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                    onDrop={handleFileUpload}
                >
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} accept="image/*" />
                    <div className="flex flex-col items-center gap-4 pointer-events-none relative z-0 transform group-hover:-translate-y-1 transition-transform duration-300">
                        <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all">
                            <ImageIcon className="size-8 text-purple-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-center font-medium">
                            <p className="text-white">Upload Reference Scene Image</p>
                            <p className="text-sm text-gray-500 mt-1">We'll automatically extract products & text</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                        <span className="text-sm font-medium text-gray-300">Source Scene Selected</span>
                        <button onClick={resetState} className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title="Change Image">
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Original Image */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest pl-1">Original</h3>
                            <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                <Image src={sourceImage} alt="Original Scene" fill className="object-contain" />
                            </div>
                        </div>

                        {/* Cleaned Image */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-purple-400 uppercase tracking-widest pl-1">
                                <Sparkles className="size-4" /> Cleaned Scene
                            </h3>
                            <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                                {isCleaning ? (
                                    <div className="flex flex-col items-center gap-3 text-purple-400">
                                        <Wand2 className="size-8 animate-pulse text-purple-500" />
                                        <p className="text-sm animate-pulse font-medium">Extracting Subjects...</p>
                                    </div>
                                ) : cleanedImage ? (
                                    <Image src={cleanedImage} alt="Cleaned Scene" fill className="object-contain" />
                                ) : (
                                    <div className="text-center p-6 text-gray-500 flex flex-col items-center gap-2">
                                        <Layers className="size-8 opacity-50" />
                                        <p className="text-sm font-medium">Ready to clean scene</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {!cleanedImage && !isCleaning && (
                        <button onClick={handleCleanScene} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-base transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2">
                            <Wand2 className="size-5" /> Smart Remove Subjects & Logos
                        </button>
                    )}

                    {cleanedImage && (
                        <div className="space-y-6 pt-4 border-t border-white/10">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => onApplyBaseScene(cleanedImage)} className="flex-1 py-4 rounded-xl bg-white text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                    <Check className="size-5" /> Use Clean Scene as Base
                                </button>
                                <button onClick={handleGenerateVariations} disabled={isGeneratingVariations} className="flex-1 py-4 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-bold text-sm transition-all border border-purple-500/30 hover:border-purple-500/50 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isGeneratingVariations ? <Loader2 className="size-5 animate-spin" /> : <RefreshCw className="size-5" />}
                                    Generate Variations
                                </button>
                            </div>

                            {variations.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-400 uppercase tracking-widest pl-1">
                                        <RefreshCw className="size-4" /> Available Variations
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {variations.map((v, i) => (
                                            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:border-purple-500/50 transition-colors" onClick={() => onApplyBaseScene(v)}>
                                                <Image src={v} alt={`Variation ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
                                                        <Check className="size-4" /> Use Variation
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
