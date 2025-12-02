'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { GenerationSettings } from '@/components/SceneBuilder'

interface DashboardContextType {
    // State
    uploadedImage: string | null
    analysis: string | null
    originalAnalysis: string | null
    results: any[]
    currentProductId: string | null
    sceneSettings: GenerationSettings

    // Setters
    setUploadedImage: (image: string | null) => void
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
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [originalAnalysis, setOriginalAnalysis] = useState<string | null>(null)
    const [results, setResults] = useState<any[]>([])
    const [currentProductId, setCurrentProductId] = useState<string | null>(null)
    const [sceneSettings, setSceneSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS)

    const resetWorkspace = () => {
        setUploadedImage(null)
        setAnalysis(null)
        setOriginalAnalysis(null)
        setResults([])
        setCurrentProductId(null)
        setSceneSettings(DEFAULT_SETTINGS)
    }

    return (
        <DashboardContext.Provider value={{
            uploadedImage,
            analysis,
            originalAnalysis,
            results,
            currentProductId,
            sceneSettings,
            setUploadedImage,
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
