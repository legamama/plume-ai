'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProductUploader from '@/components/ProductUploader'
import SceneBuilder, { GenerationSettings } from '@/components/SceneBuilder'
import ResultCarousel from '@/components/ResultCarousel'
import { Bookmark, Sparkles, Settings2, X, Image as ImageIcon } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Dashboard() {
    const [isUploading, setIsUploading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [originalAnalysis, setOriginalAnalysis] = useState<string | null>(null)
    const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [results, setResults] = useState<any[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [currentProductId, setCurrentProductId] = useState<string | null>(null)

    const handleUpload = async (file: File) => {
        setIsUploading(true)
        setAnalysis(null)
        setUploadedImage(null)

        try {
            // Convert file to base64 for the API
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onloadend = async () => {
                try {
                    const base64String = reader.result as string
                    const base64Data = base64String.split(',')[1]
                    const mimeType = file.type

                    setUploadedImage(base64Data)

                    const response = await fetch('/api/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            image: base64Data,
                            mimeType: mimeType,
                        }),
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.error || 'Analysis failed')
                    }

                    const data = await response.json()
                    const analysisText = data.analysis
                    setAnalysis(analysisText)
                    setOriginalAnalysis(analysisText) // Store original for reset
                    setIsEditingAnalysis(false)
                } catch (error: any) {
                    console.error('Error analyzing image:', error)
                    alert(`Failed to analyze image: ${error.message || 'Unknown error'}. Please check console for details.`)
                } finally {
                    setIsUploading(false)
                }
            }
        } catch (error: any) {
            console.error('Error reading file:', error)
            alert('Failed to read file')
            setIsUploading(false)
        }
    }

    const handleGenerate = async (settings: GenerationSettings) => {
        if (!uploadedImage || !analysis) return

        setIsGenerating(true)
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: uploadedImage,
                    analysis,
                    settings,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Generation failed')
            }

            const data = await response.json()

            // Include settings in the result for display
            const resultWithSettings = { ...data, settings }
            setResults(prev => [resultWithSettings, ...prev])

            // Save to Supabase if we have a product ID
            if (currentProductId) {
                try {
                    const { saveGeneration } = await import('@/lib/supabase-utils')
                    await saveGeneration(
                        currentProductId,
                        data.url,
                        data.prompt,
                        settings
                    )
                } catch (saveError) {
                    console.error('Error saving generation to Supabase:', saveError)
                    // Don't fail the whole operation if save fails
                }
            }
        } catch (error: any) {
            console.error('Error generating image:', error)
            alert(`Failed to generate image: ${error.message || 'Unknown error'}. Please check console for details.`)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSaveProfile = async () => {
        if (!uploadedImage || !analysis) {
            alert('Please upload and analyze a product first')
            return
        }

        // Prompt user for profile name FIRST (before setting any state)
        const profileName = prompt('Enter a name for this product profile:')
        if (!profileName || profileName.trim() === '') {
            return // User cancelled or entered empty name
        }

        // Now set loading state
        setIsSaving(true)

        try {
            // Save to Supabase
            const { saveProduct } = await import('@/lib/supabase-utils')
            const savedProduct = await saveProduct(uploadedImage, analysis, profileName.trim())

            console.log('Product saved successfully:', savedProduct)

            // Set the current product ID for future generations
            if (savedProduct && savedProduct.id) {
                setCurrentProductId(savedProduct.id)
            }

            // Reload profiles
            await loadProfiles()

            alert(`Profile "${profileName}" saved successfully!`)
        } catch (error: any) {
            console.error('Error saving profile:', error)
            alert(`Failed to save profile: ${error.message || 'Unknown error'}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleLoadProfile = (profile: any) => {
        // Set the current product ID for saving generations
        setCurrentProductId(profile.id)

        // Convert image URL to base64 for compatibility
        // In production, you might want to keep it as URL
        fetch(profile.image_url)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                    const base64 = reader.result as string
                    const base64Data = base64.split(',')[1]
                    setUploadedImage(base64Data)
                    setAnalysis(profile.analysis_data.description)
                    setResults([]) // Clear previous results
                }
            })
            .catch(error => {
                console.error('Error loading profile:', error)
                alert('Failed to load profile')
            })
    }

    const handleDeleteProfile = async (profileId: string, profileName: string) => {
        if (!confirm(`Delete profile "${profileName}"?`)) return

        try {
            const { deleteProduct } = await import('@/lib/supabase-utils')
            const success = await deleteProduct(profileId)

            if (success) {
                // Reload profiles
                await loadProfiles()

                // If the deleted profile was currently loaded, clear it
                setUploadedImage(null)
                setAnalysis(null)
                setResults([])
            }
        } catch (error) {
            console.error('Error deleting profile:', error)
            alert('Failed to delete profile. Please try again.')
        }
    }

    // Load profiles from Supabase
    const loadProfiles = async () => {
        try {
            const { getProducts } = await import('@/lib/supabase-utils')
            const products = await getProducts()
            setProfiles(products)
        } catch (error) {
            console.error('Error loading profiles:', error)
        }
    }

    // Load profiles on mount
    useEffect(() => {
        loadProfiles()
    }, [])

    return (
        <ProtectedRoute>
            <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-black">
                {/* Left Sidebar - Configuration */}
                <div className="w-[400px] flex-shrink-0 border-r border-white/10 bg-black/50 backdrop-blur-xl flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">

                        {/* Saved Profiles */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                                    <Bookmark className="size-5 text-green-400" />
                                    Saved Profiles
                                </h2>
                                {profiles.length > 0 && (
                                    <span className="text-xs text-gray-500">{profiles.length} saved</span>
                                )}
                            </div>
                            {profiles.length > 0 ? (
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar mask-fade-right">
                                    {profiles.map((profile: any) => (
                                        <div
                                            key={profile.id}
                                            className="group relative flex-shrink-0 w-24"
                                        >
                                            <button
                                                onClick={() => handleLoadProfile(profile)}
                                                className="w-full aspect-square rounded-lg border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all relative"
                                            >
                                                <img
                                                    src={profile.image_url}
                                                    alt={profile.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteProfile(profile.id, profile.name)
                                                }}
                                                className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                title="Delete profile"
                                            >
                                                <X className="size-3" />
                                            </button>
                                            <p className="mt-1.5 text-xs text-gray-400 text-center truncate">{profile.name}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                                    <div className="text-gray-500 text-sm">No saved profiles yet</div>
                                </div>
                            )}
                        </section>

                        {/* Product Upload */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                                    <ImageIcon className="size-5 text-purple-400" />
                                    Product
                                </h2>
                                {analysis && (
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1 rounded-full transition-colors"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Profile'}
                                    </button>
                                )}
                            </div>
                            <ProductUploader onUpload={handleUpload} isUploading={isUploading} />
                        </section>

                        {/* Analysis Result */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                                    <Sparkles className="size-5 text-blue-400" />
                                    Analysis
                                </h2>
                                {analysis && (
                                    <div className="flex gap-2">
                                        {isEditingAnalysis ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setAnalysis(originalAnalysis)
                                                        setIsEditingAnalysis(false)
                                                    }}
                                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingAnalysis(false)}
                                                    className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 px-3 py-1 rounded-full transition-colors"
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setAnalysis(originalAnalysis)
                                                    }}
                                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                                    title="Reset to original"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingAnalysis(true)}
                                                    className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 px-3 py-1 rounded-full transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {analysis ? (
                                isEditingAnalysis ? (
                                    <textarea
                                        value={analysis}
                                        onChange={(e) => setAnalysis(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 text-sm text-gray-300 leading-relaxed min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        placeholder="Edit the AI analysis..."
                                    />
                                ) : (
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 text-sm text-gray-300 leading-relaxed max-h-40 overflow-y-auto shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {analysis}
                                    </div>
                                )
                            ) : (
                                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                                    <div className="text-gray-500 text-sm">Analysis will appear here after upload</div>
                                </div>
                            )}
                        </section>

                        {/* Scene Settings */}
                        <section className="space-y-3 pb-8">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                                <Settings2 className="size-5 text-pink-400" />
                                Scene
                            </h2>
                            <SceneBuilder
                                onGenerate={handleGenerate}
                                isGenerating={isGenerating}
                                disabled={!analysis}
                            />
                        </section>
                    </div>
                </div>

                {/* Right Area - Canvas/Results */}
                <div className="flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black relative overflow-hidden flex flex-col">
                    {isGenerating ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="relative size-32 mb-6">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
                                <div className="relative size-32 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                                    <div className="size-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Generating Your Image</h3>
                            <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">
                                AI is creating your professional product photo...
                            </p>
                        </div>
                    ) : results.length > 0 ? (
                        <ResultCarousel images={results} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="relative size-32 mb-6 group">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500" />
                                <div className="relative size-32 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                    <Sparkles className="size-12 text-gray-500 group-hover:text-purple-400 transition-colors duration-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Ready to Create Magic</h3>
                            <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
                                Upload your product image to start generating professional photography with AI.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}
