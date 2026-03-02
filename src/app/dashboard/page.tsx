'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import ProductUploader from '@/components/ProductUploader'
import SceneBuilder, { GenerationSettings } from '@/components/SceneBuilder'
import ResultCarousel from '@/components/ResultCarousel'
import { Bookmark, Sparkles, Settings2, X, Image as ImageIcon, ArrowLeft, ArrowRight, Check, GripHorizontal, LayoutGrid, List } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import ScrollableContainer from '@/components/ui/ScrollableContainer'

import { useDashboard } from '@/lib/dashboard-context'
import { useDialog } from '@/lib/dialog-context'
import { analyzeProductImage, generateProductScene } from '@/lib/gemini'

// Preset scene descriptions
const PRESET_SCENES = {
    minimalist: "Clean white studio background with professional high-key lighting, soft shadows, minimal props",
    luxury: "Elegant marble surface with dramatic lighting, premium textures like marble or velvet, elegant composition",
    nature: "Natural stone podium surrounded by greenery, organic elements like leaves, soft sunlight filtering through trees",
    neon: "Futuristic cyberpunk vibe with neon blue and pink lights, dark background, vibrant glow effects",
    cozy: "Warm, inviting wooden table setting with natural window light, cozy home interior atmosphere",
    floating: "Surreal floating composition with pastel colors (pink, lavender, mint), dreamy ethereal background",
    industrial: "Raw industrial aesthetic with concrete textures, metallic accents, dramatic shadows, and cool toned lighting",
    summer: "Bright and sunny beach scene with golden sand, clear blue sky, tropical vibes, and warm natural sunlight",
    winter: "Crisp winter scene with fresh white snow, frost details, cool blue tones, and soft diffused lighting",
    lunar: "Festive Lunar New Year theme with red and gold elements, lanterns, traditional patterns, and warm celebratory lighting",
    sale: "Commercial sale banner style with bold solid background, confetti or geometric shapes, high contrast, and space for text",
    urban: "Modern urban street scene with city architecture, asphalt textures, blurred city lights in background, and street style vibe",
    moody: "Dark and moody atmosphere with deep shadows, rich textures, spotlighting on the product, and cinematic look",
    spa: "Elegant bathroom spa setting with white marble, soft towels, water droplets, bamboo accents, and warm relaxing lighting"
};

export default function Dashboard() {
    const {
        uploadedImage, setUploadedImage,
        analysis, setAnalysis,
        originalAnalysis, setOriginalAnalysis,
        results, setResults,
        currentProductId, setCurrentProductId,
        sceneSettings, setSceneSettings,
        resetWorkspace
    } = useDashboard()
    const { alert, confirm, prompt } = useDialog()

    const [isUploading, setIsUploading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)
    const [profiles, setProfiles] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [folders, setFolders] = useState<any[]>([])
    const [isReorderingProfiles, setIsReorderingProfiles] = useState(false)
    const [mobileTab, setMobileTab] = useState<'config' | 'results'>('config')
    const [profilesViewMode, setProfilesViewMode] = useState<'scroll' | 'grid'>('scroll')
    const abortControllerRef = useRef<AbortController | null>(null)

    // Load templates and folders on mount
    useEffect(() => {
        loadTemplates()
        loadFolders()
    }, [])

    const loadFolders = async () => {
        try {
            const { getTemplateFolders } = await import('@/lib/supabase-utils')
            const data = await getTemplateFolders()
            setFolders(data)
        } catch (error) {
            console.error('Error loading folders:', error)
        }
    }

    const loadTemplates = async () => {
        try {
            const { getTemplates } = await import('@/lib/supabase-utils')
            const data = await getTemplates()
            setTemplates(data)
        } catch (error) {
            console.error('Error loading templates:', error)
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        try {
            const { deleteTemplate } = await import('@/lib/supabase-utils')
            const success = await deleteTemplate(id)
            if (success) {
                setTemplates(prev => prev.filter(t => t.id !== id))
            } else {
                await alert('Failed to delete template')
            }
        } catch (error) {
            console.error('Error deleting template:', error)
            await alert('Failed to delete template')
        }
    }

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

                    const apiKey = localStorage.getItem('plume_gemini_api_key') || undefined

                    // Reconstruct the base64 data URL
                    const imageDataUrl = `data:${mimeType};base64,${base64Data}`

                    const analysisText = await analyzeProductImage(imageDataUrl, apiKey)
                    setAnalysis(analysisText)
                    setOriginalAnalysis(analysisText) // Store original for reset
                    setIsEditingAnalysis(false)

                    // Increment usage count
                    const currentUsage = parseInt(localStorage.getItem('plume_api_usage_count') || '0', 10)
                    localStorage.setItem('plume_api_usage_count', (currentUsage + 1).toString())
                } catch (error: any) {
                    console.error('Error analyzing image:', error)
                    await alert(`Failed to analyze image: ${error.message || 'Unknown error'}. Please check console for details.`)
                } finally {
                    setIsUploading(false)
                }
            }
        } catch (error: any) {
            console.error('Error reading file:', error)
            await alert('Failed to read file')
            setIsUploading(false)
        }
    }

    const handleGenerate = async (settings: GenerationSettings) => {
        if (!uploadedImage || !analysis) return

        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new controller
        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsGenerating(true)
        setMobileTab('results') // Switch to results tab automatically on mobile
        try {
            const apiKey = localStorage.getItem('plume_gemini_api_key') || undefined
            const qualitySetting = localStorage.getItem('plume_image_quality') as 'pro' | 'flash' | null || 'flash'

            // Construct the scene prompt
            let scenePrompt = '';
            let referenceImageBase64 = null;

            if (settings.modelPlacement?.enabled && settings.modelPlacement.referenceImage) {
                // Model Placement Mode
                const presetScene = PRESET_SCENES[settings.preset as keyof typeof PRESET_SCENES] || PRESET_SCENES.minimalist;
                const styleContext = `
                Desired Style/Atmosphere: ${presetScene}
                ${settings.customPrompt ? `Additional Context: ${settings.customPrompt}` : ''}`;

                if (settings.modelPlacement.generateNewModel) {
                    scenePrompt = `MODEL PLACEMENT & REGENERATION TASK:
                    Reference Scene: Use the provided reference model image as a POSE and LIGHTING reference only.
                    Task 1 (Model): Generate a NEW model (new face, new hairstyle) but STRICTLY PRESERVE the exact pose, hand gestures, and body language of the reference image. The new model should look distinct from the original to avoid copyright issues.
                    Task 2 (Product): Place the analyzed product into this new model's hands/scene exactly where the original object was.
                    Placement Instructions: ${settings.modelPlacement.prompt || "Replace the object naturally with the analyzed product."}
                    
                    Style & Atmosphere:
                    - Maintain the professional lighting and composition of the reference.
                    - Ensure the product casts realistic shadows on the model's hand/clothing.
                    - Apply the following style influence: ${styleContext}`;
                } else {
                    scenePrompt = `MODEL PLACEMENT TASK:
                    Reference Scene: Use the provided reference model image as the base scene.
                    Task: Replace the product/object in the reference image (e.g. in the model's hand or on the table) with the analyzed product.
                    Placement Instructions: ${settings.modelPlacement.prompt || "Replace the object naturally with the analyzed product."}
                    
                    Integration & Lighting:
                    - Match the lighting, shadows, and color grading of the reference model image perfectly.
                    - The product must reflect its surrounding skin tones and environment.
                    - Use the following style influence (subtly): ${styleContext}`;
                }

                referenceImageBase64 = settings.modelPlacement.referenceImage;
            } else if (settings.sceneReference?.enabled && settings.sceneReference.image) {
                // Scene Reference Mode
                const presetScene = PRESET_SCENES[settings.preset as keyof typeof PRESET_SCENES] || PRESET_SCENES.minimalist;

                scenePrompt = `SCENE REFERENCE EXTRAPOLATION TASK:
                    Reference Scene (Second Image): Use the provided reference scene image to understand the scene setup, product placement, camera angles, lighting, and composition.
                    Task: Generate a new image that places the EXACT product from the FIRST image into this environment. Match the camera angle, perspective, and lighting of the reference scene perfectly.
                    
                    IMPORTANT TEXT REMOVAL RULE:
                    - Do NOT include any promotional text, labels, or watermarks that might be present in the SECOND image (the scene reference).
                    - The generated image must be clean of any additional text natively unless specifically requested in the additional context prompt.
                    
                    Product Integration & Materials:
                    - The product must reflect the environment (colors, highlights) from the reference scene.
                    - It must cast realistic contact shadows and catch the same light sources as the original objects in the scene.
                    - Keep the product material, details, and labels precisely as analyzed.
                    
                    Style & Context:
                    - Style: ${presetScene}
                    ${settings.customPrompt ? `- Additional Context: ${settings.customPrompt}` : ''}`;

                referenceImageBase64 = settings.sceneReference.image;
            } else {
                // Standard Scene Mode
                const presetScene = PRESET_SCENES[settings.preset as keyof typeof PRESET_SCENES] || PRESET_SCENES.minimalist;
                scenePrompt = settings.customPrompt
                    ? `${presetScene}. ${settings.customPrompt}`
                    : presetScene;

                // Add text overlay instruction if enabled
                if (settings.textOverlay?.enabled && settings.textOverlay.text) {
                    scenePrompt += `\n\nIMPORTANT: Add the text "${settings.textOverlay.text}" to the image. 
                    Style: ${settings.textOverlay.style}. 
                    Position: ${settings.textOverlay.position}. 
                    The text must be sharp, clear, and perfectly readable. It should look like a professional commercial banner or overlay.
                    CRITICAL: Ensure all characters are rendered correctly, supporting multi-language text including Vietnamese diacritics (e.g., ư, ơ, ê, ô, á, à, ả, ã, ạ). The text should be integrated naturally into the scene but remain legible.`;
                }
            }

            const imageDataUrl = `data:image/jpeg;base64,${uploadedImage}`;

            const { imageUrl, fullPrompt } = await generateProductScene(
                imageDataUrl,
                analysis,
                scenePrompt,
                settings.model,
                settings.aspectRatio,
                settings.creativeMode || false,
                apiKey,
                referenceImageBase64,
                settings.imageSize,
                qualitySetting
            );

            const data = {
                id: crypto.randomUUID(),
                url: imageUrl,
                prompt: fullPrompt,
            }

            // Include settings in the result for display
            const resultWithSettings = { ...data, settings }
            setResults(prev => [resultWithSettings, ...prev])

            // Increment usage count
            const currentUsage = parseInt(localStorage.getItem('plume_api_usage_count') || '0', 10)
            localStorage.setItem('plume_api_usage_count', (currentUsage + 1).toString())

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
            if (error.name === 'AbortError') {
                console.log('Generation cancelled')
                return
            }
            console.error('Error generating image:', error)
            await alert(`Failed to generate image: ${error.message || 'Unknown error'}. Please check console for details.`)
        } finally {
            if (abortControllerRef.current === controller) {
                setIsGenerating(false)
                abortControllerRef.current = null
            }
        }
    }

    const handleCancelGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsGenerating(false)
            abortControllerRef.current = null
        }
    }

    const handleSaveProfile = async () => {
        if (!uploadedImage || !analysis) {
            await alert('Please upload and analyze a product first')
            return
        }

        // Prompt user for profile name FIRST (before setting any state)
        const profileName = await prompt('Enter a name for this product profile:')
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

            await alert(`Profile "${profileName}" saved successfully!`)
        } catch (error: any) {
            console.error('Error saving profile:', error)
            await alert(`Failed to save profile: ${error.message || 'Unknown error'}`)
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
                    // Update scene settings if profile has them (optional, but good for consistency)
                    // For now, we keep current settings or reset? User didn't specify.
                    // Let's keep current settings to allow applying profile to current scene.
                }
            })
            .catch(async error => {
                console.error('Error loading profile:', error)
                await alert('Failed to load profile')
            })
    }

    const handleDeleteProfile = async (profileId: string, profileName: string) => {
        if (!(await confirm(`Delete profile "${profileName}"?`))) return

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
            await alert('Failed to delete profile. Please try again.')
        }
    }

    // Load profiles from Supabase
    const loadProfiles = async () => {
        try {
            const { getProducts } = await import('@/lib/supabase-utils')
            const products = await getProducts()
            // Sort by order_index if available, otherwise by created_at (handled by DB mostly, but let's ensure)
            // Assuming DB returns sorted or we sort here. 
            // Let's sort locally to be safe if DB sort changes
            const sorted = [...products].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            setProfiles(sorted)
        } catch (error) {
            console.error('Error loading profiles:', error)
        }
    }

    const handleReorderProfile = async (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return
        if (direction === 'right' && index === profiles.length - 1) return

        const newProfiles = [...profiles]
        const swapIndex = direction === 'left' ? index - 1 : index + 1

        // Swap
        const temp = newProfiles[index]
        newProfiles[index] = newProfiles[swapIndex]
        newProfiles[swapIndex] = temp

        // Update order indices
        newProfiles.forEach((p, i) => p.order_index = i)

        setProfiles(newProfiles)
    }

    const saveProfileOrder = async () => {
        try {
            const { updateItemOrder } = await import('@/lib/supabase-utils')
            const items = profiles.map((p, i) => ({ id: p.id, order_index: i }))
            await updateItemOrder('products', items)
            setIsReorderingProfiles(false)
        } catch (error) {
            console.error('Error saving order:', error)
            await alert('Failed to save order')
        }
    }

    // Load profiles on mount
    useEffect(() => {
        loadProfiles()
    }, [])

    return (
        <ProtectedRoute>
            <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] lg:overflow-hidden bg-black min-h-[calc(100vh-4rem)]">

                {/* Mobile Tabs */}
                <div className="lg:hidden flex border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
                    <button
                        onClick={() => setMobileTab('config')}
                        className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2 ${mobileTab === 'config'
                            ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <Settings2 className="size-4" />
                        Setup
                    </button>
                    <button
                        onClick={() => setMobileTab('results')}
                        className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2 ${mobileTab === 'results'
                            ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <Sparkles className="size-4" />
                        Results
                        {results.length > 0 && (
                            <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center inline-flex items-center justify-center">
                                {results.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Left Sidebar - Configuration */}
                <div className={`w-full lg:w-[450px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/50 backdrop-blur-xl flex-col h-auto lg:h-full z-10 ${mobileTab === 'config' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="flex-1 overflow-x-hidden lg:overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-8 no-scrollbar">

                        {/* Saved Profiles */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm lg:text-lg font-semibold flex items-center gap-2 text-white">
                                    <Bookmark className="size-4 lg:size-5 text-green-400" />
                                    Saved Profiles
                                </h2>
                                <button
                                    onClick={async () => {
                                        if (await confirm('Are you sure you want to clear the current workspace?')) {
                                            resetWorkspace()
                                        }
                                    }}
                                    className="text-[10px] lg:text-xs text-gray-500 hover:text-white flex items-center gap-1"
                                    title="Reset Workspace"
                                >
                                    <Sparkles className="size-3" /> Refresh Workspace
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {profiles.length > 0 && (
                                        <>
                                            {isReorderingProfiles ? (
                                                <button
                                                    onClick={saveProfileOrder}
                                                    className="text-[10px] lg:text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-2 py-1 rounded flex items-center gap-1"
                                                >
                                                    <Check className="size-3" /> Done
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setIsReorderingProfiles(true)}
                                                    className="text-[10px] lg:text-xs text-gray-500 hover:text-white flex items-center gap-1"
                                                >
                                                    <GripHorizontal className="size-3" /> Reorder
                                                </button>
                                            )}
                                            <div className="flex border border-white/10 rounded-lg overflow-hidden ml-2 bg-white/5">
                                                <button
                                                    onClick={() => setProfilesViewMode('scroll')}
                                                    className={`p-1 transition-colors ${profilesViewMode === 'scroll' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                                                    title="Scroll View"
                                                    aria-label="Toggle scroll view for profiles"
                                                >
                                                    <List className="size-3 lg:size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setProfilesViewMode('grid')}
                                                    className={`p-1 transition-colors ${profilesViewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                                                    title="Grid View"
                                                    aria-label="Toggle grid view for profiles"
                                                >
                                                    <LayoutGrid className="size-3 lg:size-3.5" />
                                                </button>
                                            </div>
                                            <span className="text-[10px] lg:text-xs text-gray-500 border-l border-white/10 pl-2">{profiles.length} saved</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {profiles.length > 0 ? (
                                profilesViewMode === 'scroll' ? (
                                    <ScrollableContainer className="mask-fade-right">
                                        {profiles.map((profile: any, index: number) => (
                                            <div
                                                key={profile.id}
                                                className="group relative flex-shrink-0 w-20 lg:w-24"
                                            >
                                                <button
                                                    onClick={() => !isReorderingProfiles && handleLoadProfile(profile)}
                                                    className={`w-full aspect-square rounded-lg border overflow-hidden transition-all relative ${isReorderingProfiles ? 'cursor-grab active:cursor-grabbing border-white/20' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50'
                                                        }`}
                                                >
                                                    <img
                                                        src={profile.image_url}
                                                        alt={profile.name}
                                                        className={`w-full h-full object-cover ${isReorderingProfiles ? 'opacity-70' : ''}`}
                                                    />
                                                    {isReorderingProfiles && (
                                                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40">
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); handleReorderProfile(index, 'left') }}
                                                                className={`p-1 rounded bg-black/50 hover:bg-white/20 text-white ${index === 0 ? 'opacity-20 pointer-events-none' : ''}`}
                                                            >
                                                                <ArrowLeft className="size-3" />
                                                            </div>
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); handleReorderProfile(index, 'right') }}
                                                                className={`p-1 rounded bg-black/50 hover:bg-white/20 text-white ${index === profiles.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}
                                                            >
                                                                <ArrowRight className="size-3" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                                {!isReorderingProfiles && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteProfile(profile.id, profile.name)
                                                        }}
                                                        className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10"
                                                        title="Delete profile"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                )}
                                                <p className="mt-1.5 text-[10px] lg:text-xs text-gray-400 text-center truncate">{profile.name}</p>
                                            </div>
                                        ))}
                                    </ScrollableContainer>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3">
                                        {profiles.map((profile: any, index: number) => (
                                            <div
                                                key={profile.id}
                                                className="group relative w-full"
                                            >
                                                <button
                                                    onClick={() => !isReorderingProfiles && handleLoadProfile(profile)}
                                                    className={`w-full aspect-square rounded-lg border overflow-hidden transition-all relative ${isReorderingProfiles ? 'cursor-grab active:cursor-grabbing border-white/20' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50'
                                                        }`}
                                                >
                                                    <img
                                                        src={profile.image_url}
                                                        alt={profile.name}
                                                        className={`w-full h-full object-cover ${isReorderingProfiles ? 'opacity-70' : ''}`}
                                                    />
                                                    {isReorderingProfiles && (
                                                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40">
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); handleReorderProfile(index, 'left') }}
                                                                className={`p-1 rounded bg-black/50 hover:bg-white/20 text-white ${index === 0 ? 'opacity-20 pointer-events-none' : ''}`}
                                                            >
                                                                <ArrowLeft className="size-3" />
                                                            </div>
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); handleReorderProfile(index, 'right') }}
                                                                className={`p-1 rounded bg-black/50 hover:bg-white/20 text-white ${index === profiles.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}
                                                            >
                                                                <ArrowRight className="size-3" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                                {!isReorderingProfiles && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteProfile(profile.id, profile.name)
                                                        }}
                                                        className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10"
                                                        title="Delete profile"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                )}
                                                <p className="mt-1.5 text-[10px] lg:text-xs text-gray-400 text-center truncate">{profile.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                                    <div className="text-gray-500 text-xs lg:text-sm">No saved profiles yet</div>
                                </div>
                            )}
                        </section>

                        {/* Product Upload */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm lg:text-lg font-semibold flex items-center gap-2 text-white">
                                    <ImageIcon className="size-4 lg:size-5 text-purple-400" />
                                    Product
                                </h2>
                                {analysis && (
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="text-[10px] lg:text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1 rounded-full transition-colors"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Profile'}
                                    </button>
                                )}
                            </div>
                            <ProductUploader
                                onUpload={handleUpload}
                                isUploading={isUploading}
                                previewUrl={uploadedImage ? `data:image/jpeg;base64,${uploadedImage}` : null}
                                onClear={() => {
                                    setUploadedImage(null)
                                    setAnalysis(null)
                                    setResults([])
                                    setCurrentProductId(null)
                                }}
                            />
                        </section>

                        {/* Analysis Result */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm lg:text-lg font-semibold flex items-center gap-2 text-white">
                                    <Sparkles className="size-4 lg:size-5 text-blue-400" />
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
                                                    className="text-[10px] lg:text-xs text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingAnalysis(false)}
                                                    className="text-[10px] lg:text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 px-3 py-1 rounded-full transition-colors"
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
                                                    className="text-[10px] lg:text-xs text-gray-400 hover:text-white transition-colors"
                                                    title="Reset to original"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingAnalysis(true)}
                                                    className="text-[10px] lg:text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 px-3 py-1 rounded-full transition-colors"
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
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 text-xs lg:text-sm text-gray-300 leading-relaxed max-h-40 overflow-y-auto shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {analysis}
                                    </div>
                                )
                            ) : (
                                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                                    <div className="text-gray-500 text-xs lg:text-sm">Analysis will appear here after upload</div>
                                </div>
                            )}
                        </section>

                        {/* Scene Settings */}
                        <section className="space-y-3 pb-8">
                            <h2 className="text-sm lg:text-lg font-semibold flex items-center gap-2 text-white">
                                <Settings2 className="size-4 lg:size-5 text-pink-400" />
                                Scene
                            </h2>
                            <SceneBuilder
                                onGenerate={handleGenerate}
                                isGenerating={isGenerating}
                                disabled={!analysis}
                                templates={templates}
                                folders={folders}
                                onRefreshTemplates={() => { loadTemplates(); loadFolders(); }}
                                onDeleteTemplate={handleDeleteTemplate}
                                settings={sceneSettings}
                                onSettingsChange={setSceneSettings}
                            />
                        </section>
                    </div>
                </div>

                {/* Right Area - Canvas/Results */}
                <div className={`flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black relative overflow-hidden flex-col md:min-h-[500px] lg:min-h-0 lg:h-full border-t lg:border-t-0 lg:border-l border-white/10 ${mobileTab === 'results' ? 'flex min-h-[calc(100vh-8rem)]' : 'hidden lg:flex'}`}>
                    {isGenerating ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="relative size-32 mb-6">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
                                <div className="relative size-32 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                                    <div className="size-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-xl lg:text-2xl font-semibold text-white mb-3 tracking-tight">Generating Your Image</h3>
                            <p className="text-gray-400 max-w-md mx-auto text-sm lg:text-lg leading-relaxed mb-6">
                                AI is creating your professional product photo...
                            </p>
                            <button
                                onClick={handleCancelGeneration}
                                className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all"
                            >
                                Cancel Generation
                            </button>
                        </div>
                    ) : results.length > 0 ? (
                        <ResultCarousel
                            images={results}
                            onTemplateSaved={loadTemplates}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative">
                            {/* Ambient magical background for empty state */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                                <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }}></div>
                                <div className="absolute top-[40%] right-[30%] w-[30%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
                            </div>

                            <div className="relative size-32 lg:size-40 mb-8 group z-10">
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all duration-700 opacity-50 group-hover:opacity-100" />
                                <div className="relative w-full h-full rounded-[2.5rem] bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl group-hover:-translate-y-2 transition-transform duration-500 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <Sparkles className="size-12 lg:size-16 text-gray-400 group-hover:text-purple-400 transition-colors duration-500 relative z-10" />
                                </div>
                            </div>
                            <h3 className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 mb-4 tracking-tight z-10">
                                Ready to Create Magic
                            </h3>
                            <p className="text-gray-400 max-w-md mx-auto text-base lg:text-lg leading-relaxed z-10 font-medium">
                                Upload a product on the left to start generating infinite variations of professional photography.
                            </p>

                            {/* Decorative line */}
                            <div className="mt-12 w-24 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full z-10"></div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}
