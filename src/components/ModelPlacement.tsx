'use client'

import { useState, useRef } from 'react'
import { Upload, X, User, Image as ImageIcon, Sparkles } from 'lucide-react'

interface ModelPlacementProps {
    onImageChange: (base64: string | null) => void
    onPromptChange: (prompt: string) => void
    onGenerateNewModelChange: (enabled: boolean) => void
    referenceImage: string | null
    placementPrompt: string
    generateNewModel: boolean
}

export default function ModelPlacement({ onImageChange, onPromptChange, onGenerateNewModelChange, referenceImage, placementPrompt, generateNewModel }: ModelPlacementProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    const processFile = (file: File) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            // Remove data URL prefix if present for consistency, or keep it and handle in parent
            // Usually we keep it for display and strip for API
            onImageChange(base64String)
        }
        reader.readAsDataURL(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(file)
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <User className="size-4 text-purple-400" />
                    <h3>Reference Model Scene</h3>
                </div>

                <p className="text-xs text-gray-500">
                    Upload an image of a model holding a product (or a scene) where you want your product to be placed.
                </p>

                {/* Image Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-xl transition-all ${isDragging
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {referenceImage ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/40">
                            <img
                                src={referenceImage}
                                alt="Reference Model"
                                className="w-full h-full object-contain"
                            />
                            <button
                                onClick={() => onImageChange(null)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center py-8 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="p-3 rounded-full bg-white/5 mb-3">
                                <Upload className="size-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-300 font-medium">Click or drag reference image</p>
                            <p className="text-[10px] text-gray-500 mt-1">Supports JPG, PNG</p>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Prompt Input */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                        <Sparkles className="size-3 text-purple-400" />
                        Placement Instructions <span className="text-gray-600">(Optional)</span>
                    </label>
                    <textarea
                        value={placementPrompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder="e.g. Replace the bottle in the model's hand with my product. Keep the lighting and shadows consistent."
                        className="w-full h-20 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                    />
                </div>

                {/* Generate New Model Toggle */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center h-5">
                        <input
                            id="new-model"
                            type="checkbox"
                            checked={generateNewModel}
                            onChange={(e) => onGenerateNewModelChange(e.target.checked)}
                            className="size-4 rounded border-purple-500/50 bg-black/40 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                        />
                    </div>
                    <label htmlFor="new-model" className="text-xs">
                        <span className="block font-medium text-purple-300">Generate New Model Identity</span>
                        <span className="block text-purple-200/60 mt-0.5">
                            Create a new face and hairstyle while keeping the <strong>exact pose and gesture</strong>. Helps avoid copyright issues with the reference image.
                        </span>
                    </label>
                </div>
            </div>
        </div>
    )
}
