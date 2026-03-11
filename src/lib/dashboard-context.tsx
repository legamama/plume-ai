'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { GenerationSettings } from '@/components/SceneBuilder'

interface DashboardContextType {
    // State
    uploadedImage: string | null
    uploadedImageMimeType: string
    analysis: string | null
    originalAnalysis: string | null
    results: any[]
    currentProductId: string | null
    sceneSettings: GenerationSettings

    // Setters
    setUploadedImage: (image: string | null) => void
    setUploadedImageMimeType: (mimeType: string) => void
    setAnalysis: (analysis: string | null) => void
    setOriginalAnalysis: (analysis: string | null) => void
    setResults: (results: any[] | ((prev: any[]) => any[])) => void
    setCurrentProductId: (id: string | null) => void
    setSceneSettings: (settings: GenerationSettings) => void

    // Actions
    resetWorkspace: () => void
}

const DEFAULT_SETTINGS: GenerationSettings = {
    preset: 'minimalist',
    customPrompt: '',
    aspectRatio: '1:1',
    model: 'gemini-3-pro-image-preview',
    imageSize: '1K',
    textOverlay: {
        enabled: false,
        text: '',
        style: 'modern',
        position: 'center'
    },
    modelPlacement: {
        enabled: false,
        referenceImage: null,
        prompt: '',
        generateNewModel: false
    }
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string>('image/jpeg')
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [originalAnalysis, setOriginalAnalysis] = useState<string | null>(null)
    const [results, setResults] = useState<any[]>([])
    const [currentProductId, setCurrentProductId] = useState<string | null>(null)
    const [sceneSettings, setSceneSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS)

    const resetWorkspace = () => {
        setUploadedImage(null)
        setUploadedImageMimeType('image/jpeg')
        setAnalysis(null)
        setOriginalAnalysis(null)
        setResults([])
        setCurrentProductId(null)
        setSceneSettings(DEFAULT_SETTINGS)
    }

    return (
        <DashboardContext.Provider value={{
            uploadedImage,
            uploadedImageMimeType,
            analysis,
            originalAnalysis,
            results,
            currentProductId,
            sceneSettings,
            setUploadedImage,
            setUploadedImageMimeType,
            setAnalysis,
            setOriginalAnalysis,
            setResults,
            setCurrentProductId,
            setSceneSettings,
            resetWorkspace
        }}>
            {children}
        </DashboardContext.Provider>
    )
}

export const useDashboard = () => {
    const context = useContext(DashboardContext)
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider')
    }
    return context
}
