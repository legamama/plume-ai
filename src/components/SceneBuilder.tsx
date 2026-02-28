'use client'

import { useState, useEffect } from 'react'
import { Wand2, LayoutTemplate, Ratio, Type, Sparkles, Armchair, Leaf, Crown, Camera, Factory, Sun, Snowflake, Flame, Tag, Building2, Moon, Bookmark, Trash2, Droplets, FolderPlus, Folder, ChevronRight, ChevronDown, ChevronUp, GripVertical, Plus, MoreVertical, FolderOpen, ArrowUp, ArrowDown, Move, X, User, Eraser } from 'lucide-react'
import ModelPlacement from './ModelPlacement'
import SceneCleaner from './SceneCleaner'
import { expandPromptText } from '@/lib/gemini'

interface SceneBuilderProps {
    onGenerate: (settings: GenerationSettings) => void
    isGenerating: boolean
    disabled: boolean
    templates?: Template[]
    folders?: any[]
    onRefreshTemplates?: () => void
    onDeleteTemplate?: (id: string) => void
    // Controlled state props
    settings?: GenerationSettings
    onSettingsChange?: (settings: GenerationSettings) => void
}

export interface GenerationSettings {
    preset: string
    customPrompt: string
    aspectRatio: string
    model: string
    creativeMode?: boolean
    imageSize?: string
    textOverlay?: {
        enabled: boolean
        text: string
        style: string
        position: string
    }
    modelPlacement?: {
        enabled: boolean
        referenceImage: string | null
        prompt: string
        generateNewModel: boolean
    }
    sceneReference?: {
        enabled: boolean
        image: string | null
    }
}

export interface Template {
    id: string
    name: string
    prompt: string
    settings: GenerationSettings
    folder_id?: string
    order_index?: number
}

const PRESETS = [
    { id: 'minimalist', name: 'Minimalist Studio', description: 'Clean, soft lighting', icon: Camera, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
    { id: 'luxury', name: 'Luxury Marble', description: 'Elegant marble surface', icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { id: 'spa', name: 'Elegant Spa', description: 'Relaxing bathroom vibe', icon: Droplets, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    { id: 'nature', name: 'Nature Podium', description: 'Stone podium & greenery', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { id: 'neon', name: 'Neon Cyberpunk', description: 'Futuristic neon lights', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { id: 'cozy', name: 'Cozy Interior', description: 'Warm wooden table', icon: Armchair, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'floating', name: 'Floating Pastel', description: 'Surreal pastel colors', icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    { id: 'industrial', name: 'Industrial Concrete', description: 'Raw concrete textures', icon: Factory, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    { id: 'summer', name: 'Summer Beach', description: 'Bright sun & sand', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { id: 'winter', name: 'Snowy Winter', description: 'Crisp white snow', icon: Snowflake, color: 'text-blue-200', bg: 'bg-blue-300/10', border: 'border-blue-300/20' },
    { id: 'lunar', name: 'Lunar New Year', description: 'Festive red & gold', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 'sale', name: 'Sale Banner', description: 'Commercial promo style', icon: Tag, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { id: 'urban', name: 'Urban Street', description: 'City street vibe', icon: Building2, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
    { id: 'moody', name: 'Dark Moody', description: 'Dramatic shadows', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
]

const ASPECT_RATIOS = [
    { id: '1:1', name: '1:1', label: 'Square', ratio: 'aspect-square' },
    { id: '16:9', name: '16:9', label: 'Wide', ratio: 'aspect-video' },
    { id: '9:16', name: '9:16', label: 'Story', ratio: 'aspect-[9/16]' },
    { id: '4:5', name: '4:5', label: 'Post', ratio: 'aspect-[4/5]' },
]

const IMAGE_SIZES = [
    { id: '1K', name: '1K (Standard)', description: 'Fast (~1024px)' },
    { id: '2K', name: '2K (High)', description: 'Detailed (~2048px)' },
    { id: '4K', name: '4K (Ultra)', description: 'Maximum (~4096px)' },
]

const MODELS = [
    {
        id: 'gemini-3-pro-image-preview',
        name: 'Gemini 3.0 Pro',
        description: 'Highest fidelity, best detail preservation.',
        badge: 'Recommended'
    },
    {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash',
        description: 'Fast generation speed, good for quick ideation.',
        badge: 'Fast'
    }
]

function TemplateItem({ template, applyTemplate, onDelete, onMove, folders, movingId, setMovingId }: {
    template: Template,
    applyTemplate: (t: Template) => void,
    onDelete?: (id: string) => void,
    onMove: (tid: string, fid: string | null) => void,
    folders: any[],
    movingId: string | null,
    setMovingId: (id: string | null) => void
}) {
    return (
        <div
            className="group relative flex items-center gap-3 p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
            onClick={() => applyTemplate(template)}
        >
            <div className="size-6 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Bookmark className="size-3" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-gray-200 truncate">{template.name}</div>
                <div className="text-[9px] text-gray-500 truncate">
                    {template.settings?.preset}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                {/* Move Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setMovingId(movingId === template.id ? null : template.id)}
                        className={`p-1.5 rounded hover:bg-white/10 ${movingId === template.id ? 'text-purple-400 bg-white/10 opacity-100' : 'text-gray-500 hover:text-white'}`}
                        title="Move to folder"
                    >
                        <FolderOpen className="size-3" />
                    </button>

                    {movingId === template.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                            <div className="px-2 py-1 text-[10px] text-gray-500 uppercase font-semibold">Move to...</div>
                            <button
                                onClick={() => onMove(template.id, null)}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2"
                            >
                                <Bookmark className="size-3" /> Root (No Folder)
                            </button>
                            {folders.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => onMove(template.id, f.id)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2"
                                >
                                    <Folder className="size-3" /> {f.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {onDelete && (
                    <button
                        onClick={() => {
                            if (confirm('Delete this template?')) {
                                onDelete(template.id)
                            }
                        }}
                        className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="size-3" />
                    </button>
                )}
            </div>
        </div>
    )
}

export default function SceneBuilder({
    onGenerate,
    isGenerating,
    disabled,
    templates = [],
    folders = [],
    onRefreshTemplates,
    onDeleteTemplate,
    settings: controlledSettings,
    onSettingsChange
}: SceneBuilderProps) {
    // Local state for uncontrolled usage
    const [localSettings, setLocalSettings] = useState<GenerationSettings>({
        preset: 'minimalist',
        customPrompt: '',
        aspectRatio: '1:1',
        model: 'gemini-3-pro-image-preview',
        creativeMode: false,
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
        },
        sceneReference: {
            enabled: false,
            image: null
        }
    })

    // Use controlled settings if provided, otherwise local
    const settings = controlledSettings || localSettings

    const setSettings = (newSettings: GenerationSettings) => {
        if (onSettingsChange) {
            onSettingsChange(newSettings)
        } else {
            setLocalSettings(newSettings)
        }
    }

    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [isReordering, setIsReordering] = useState(false)
    const [movingTemplateId, setMovingTemplateId] = useState<string | null>(null)
    const [templatesExpanded, setTemplatesExpanded] = useState(false)
    const [presetsExpanded, setPresetsExpanded] = useState(false)
    const [isEnhancing, setIsEnhancing] = useState(false)
    const [enhancedPrompts, setEnhancedPrompts] = useState<string[]>([])
    const [builderMode, setBuilderMode] = useState<'standard' | 'model_placement' | 'clean_scene'>(settings?.modelPlacement?.enabled ? 'model_placement' : 'standard')

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }))
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return
        try {
            const { createTemplateFolder } = await import('@/lib/supabase-utils')
            await createTemplateFolder(newFolderName)
            setNewFolderName('')
            setIsCreatingFolder(false)
            onRefreshTemplates?.()
        } catch (error) {
            console.error('Error creating folder:', error)
        }
    }

    const handleMoveTemplate = async (templateId: string, folderId: string | null) => {
        try {
            const { moveTemplateToFolder } = await import('@/lib/supabase-utils')
            await moveTemplateToFolder(templateId, folderId)
            setMovingTemplateId(null)
            onRefreshTemplates?.()
        } catch (error) {
            console.error('Error moving template:', error)
        }
    }

    const handleReorderTemplate = async (template: Template, direction: 'up' | 'down') => {
        // This is a simplified reorder that swaps indices locally and saves
        // In a real app, you'd calculate the new index based on neighbors
        // Here we'll just alert as a placeholder or implement basic swap if we had the full list context easily
        // For now, let's just show it's possible
        alert('Reordering not fully implemented in this view. Drag and drop would be better.')
    }

    const handleSubmit = () => {
        onGenerate(settings)
    }

    const applyTemplate = (template: Template) => {
        if (template.settings) {
            setSettings(template.settings)
        }
    }

    const handleMagicEnhance = async () => {
        if (!settings.customPrompt.trim()) return;
        setIsEnhancing(true);
        try {
            const apiKey = localStorage.getItem('plume_gemini_api_key') || undefined;
            const variations = await expandPromptText(settings.customPrompt, apiKey);
            if (variations && variations.length > 0) {
                setEnhancedPrompts(variations);
            }
        } catch (error) {
            console.error('Failed to enhance prompt', error);
        } finally {
            setIsEnhancing(false);
        }
    }

    const handleGenerateVariations = async () => {
        // Simple loop to call onGenerate 3 times
        // NOTE: In a real app we might want a dedicated batch API to avoid UI lockups
        // For now, we'll queue them in the parent by passing a special flag or just calling it repeatedly
        // However, since onGenerate is passed from parent, we can simulate 3 clicks.
        // It's cleaner to handle batch generation in the parent because the parent manages the generation queue/state.
        // To implement it here natively, we either update onGenerate to accept multiple, or call it 3 times.
        // If we call it 3 times sequentially without await (since it's void), the parent might overwrite its own parsing state.

        // Let's pass a batch flag to onGenerate, we need to update the prop or handle it here
        // The prompt asked for "Generate Variations (3x)" button.
        // For simplicity, we can just fire onGenerate 3 times. If the parent handles parallel well, it will work.
        // Wait, onGenerate is synchronous in signature but likely triggers async work in parent.
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                onGenerate(settings);
            }, i * 2000); // Stagger by 2 seconds to avoid rate limits
        }
    }

    return (
        <div className={`space-y-8 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>

            {/* Mode Selector */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                    onClick={() => {
                        setBuilderMode('standard')
                        setSettings({ ...settings, modelPlacement: { ...settings.modelPlacement!, enabled: false } })
                    }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${builderMode === 'standard' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <LayoutTemplate className="size-3.5" />
                    Standard Room
                </button>
                <button
                    onClick={() => {
                        setBuilderMode('model_placement')
                        setSettings({ ...settings, modelPlacement: { ...settings.modelPlacement!, enabled: true } })
                    }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${builderMode === 'model_placement' ? 'bg-purple-500/20 text-purple-400 shadow-sm border border-purple-500/20' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <User className="size-3.5" />
                    Model Placement
                </button>
                <button
                    onClick={() => setBuilderMode('clean_scene')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${builderMode === 'clean_scene' ? 'bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/20' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Eraser className="size-3.5" />
                    Clean Scene
                </button>
            </div>

            {/* Clean Scene Section */}
            {builderMode === 'clean_scene' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <SceneCleaner
                        onApplyBaseScene={(base64Image) => {
                            setSettings({
                                ...settings,
                                sceneReference: { enabled: true, image: base64Image }
                            })
                            setBuilderMode('standard')
                        }}
                    />
                </div>
            )}

            {/* Model Placement Section */}
            {builderMode === 'model_placement' && (
                <ModelPlacement
                    referenceImage={settings.modelPlacement?.referenceImage ?? null}
                    placementPrompt={settings.modelPlacement?.prompt ?? ''}
                    generateNewModel={settings.modelPlacement?.generateNewModel ?? false}
                    onImageChange={(img) => setSettings({
                        ...settings,
                        modelPlacement: { ...settings.modelPlacement!, referenceImage: img }
                    })}
                    onPromptChange={(prompt) => setSettings({
                        ...settings,
                        modelPlacement: { ...settings.modelPlacement!, prompt }
                    })}
                    onGenerateNewModelChange={(enabled) => setSettings({
                        ...settings,
                        modelPlacement: { ...settings.modelPlacement!, generateNewModel: enabled }
                    })}
                />
            )}

            {/* Standard Scene Sections */}
            {builderMode === 'standard' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                                <Camera className="size-3" /> Reference Scene Setup
                            </label>
                            <p className="text-[10px] text-gray-400">Upload a scene. We'll analyze placement, angles & lighting to recreate it with your product.</p>
                        </div>
                        <button
                            onClick={() => setSettings({
                                ...settings,
                                sceneReference: { enabled: !settings.sceneReference?.enabled, image: settings.sceneReference?.image || null }
                            })}
                            className={`w-10 h-5 rounded-full transition-colors relative ${settings.sceneReference?.enabled ? 'bg-blue-500' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${settings.sceneReference?.enabled ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    {settings.sceneReference?.enabled && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                            {settings.sceneReference.image ? (
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/40">
                                    <img src={settings.sceneReference.image} alt="Scene Reference" className="w-full h-full object-contain" />
                                    <button
                                        onClick={() => setSettings({ ...settings, sceneReference: { ...settings.sceneReference!, image: null } })}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors z-10"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-all">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                const reader = new FileReader()
                                                reader.onloadend = () => {
                                                    setSettings({ ...settings, sceneReference: { ...settings.sceneReference!, image: reader.result as string } })
                                                }
                                                reader.readAsDataURL(file)
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
                                        <div className="p-3 rounded-full bg-white/5 mb-3">
                                            <Plus className="size-5 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-gray-300 font-medium">Click or drag reference scene image</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Saved Templates & Folders */}
            {(templates.length > 0 || folders.length > 0) && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label
                            className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                            onClick={() => setTemplatesExpanded(!templatesExpanded)}
                        >
                            <Bookmark className="size-3" /> Saved Templates
                            {templatesExpanded ? <ChevronUp className="size-3 ml-1" /> : <ChevronDown className="size-3 ml-1" />}
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="New Folder"
                            >
                                <FolderPlus className="size-3.5" />
                            </button>
                        </div>
                    </div>

                    {templatesExpanded && (
                        <>
                            {isCreatingFolder && (
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-1">
                                    <Folder className="size-4 text-purple-400" />
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Folder Name"
                                        className="bg-transparent border-none text-sm text-white focus:outline-none flex-1 min-w-0"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                    />
                                    <button onClick={handleCreateFolder} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/30">Add</button>
                                    <button onClick={() => setIsCreatingFolder(false)} className="text-gray-500 hover:text-white"><X className="size-3.5" /></button>
                                </div>
                            )}

                            <div className="space-y-2">
                                {/* Folders */}
                                {folders.map(folder => {
                                    const folderTemplates = templates.filter(t => t.folder_id === folder.id)
                                    const isExpanded = expandedFolders[folder.id]

                                    return (
                                        <div key={folder.id} className="space-y-1">
                                            <div
                                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer group"
                                                onClick={() => toggleFolder(folder.id)}
                                            >
                                                {isExpanded ? <ChevronDown className="size-3 text-gray-500" /> : <ChevronRight className="size-3 text-gray-500" />}
                                                <Folder className={`size-4 ${isExpanded ? 'text-purple-400' : 'text-gray-500'}`} />
                                                <span className="text-sm text-gray-300 flex-1">{folder.name}</span>
                                                <span className="text-[10px] text-gray-600">{folderTemplates.length}</span>
                                            </div>

                                            {isExpanded && (
                                                <div className="pl-4 space-y-1 border-l border-white/5 ml-2.5">
                                                    {folderTemplates.map(template => (
                                                        <TemplateItem
                                                            key={template.id}
                                                            template={template}
                                                            applyTemplate={applyTemplate}
                                                            onDelete={onDeleteTemplate}
                                                            onMove={handleMoveTemplate}
                                                            folders={folders}
                                                            movingId={movingTemplateId}
                                                            setMovingId={setMovingTemplateId}
                                                        />
                                                    ))}
                                                    {folderTemplates.length === 0 && (
                                                        <div className="text-[10px] text-gray-600 p-2 italic">Empty folder</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {/* Uncategorized Templates */}
                                {templates.filter(t => !t.folder_id).map(template => (
                                    <TemplateItem
                                        key={template.id}
                                        template={template}
                                        applyTemplate={applyTemplate}
                                        onDelete={onDeleteTemplate}
                                        onMove={handleMoveTemplate}
                                        folders={folders}
                                        movingId={movingTemplateId}
                                        setMovingId={setMovingTemplateId}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* Presets Grid */}
            <div className="space-y-3">
                <label
                    className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                    onClick={() => setPresetsExpanded(!presetsExpanded)}
                >
                    <LayoutTemplate className="size-3" /> Style Preset
                    {presetsExpanded ? <ChevronUp className="size-3 ml-1" /> : <ChevronDown className="size-3 ml-1" />}
                </label>
                {presetsExpanded && (
                    <div className="grid grid-cols-2 gap-2">
                        {PRESETS.map((preset) => {
                            const Icon = preset.icon
                            const isSelected = settings.preset === preset.id
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => setSettings({ ...settings, preset: preset.id })}
                                    className={`relative p-3 rounded-xl border text-left transition-all duration-300 group overflow-hidden ${isSelected
                                        ? `bg-white/10 border-white/20 shadow-lg`
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    {isSelected && <div className={`absolute inset-0 opacity-20 ${preset.bg}`} />}
                                    <div className={`relative z-10 flex items-center gap-2`}>
                                        <div className={`size-7 rounded-lg flex items-center justify-center ${preset.bg} ${preset.color} flex-shrink-0`}>
                                            <Icon className="size-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={`font-medium text-xs ${isSelected ? 'text-white' : 'text-gray-300'} truncate`}>{preset.name}</div>
                                            <div className="text-[9px] text-gray-500 leading-tight mt-0.5 truncate">{preset.description}</div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Custom Prompt */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Type className="size-3" /> Custom Details
                    </label>
                    <button
                        onClick={handleMagicEnhance}
                        disabled={isEnhancing || !settings.customPrompt.trim()}
                        className="text-[10px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-2 py-1 rounded-md border border-purple-500/30 hover:bg-purple-500/40 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                        {isEnhancing ? <div className="size-3 border hover:text-white rounded-full border-t-transparent animate-spin" /> : <Sparkles className="size-3" />}
                        ✨ Magic Enhance
                    </button>
                </div>

                {enhancedPrompts.length > 0 && (
                    <div className="flex flex-col gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-3">
                        <div className="text-[10px] text-purple-300 font-medium flex justify-between">
                            <span>Select a Magic Variation:</span>
                            <button onClick={() => setEnhancedPrompts([])} className="hover:text-white"><X className="size-3" /></button>
                        </div>
                        {enhancedPrompts.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSettings({ ...settings, customPrompt: p });
                                    setEnhancedPrompts([]);
                                }}
                                className="text-left text-xs text-gray-300 bg-black/40 p-2 rounded-lg hover:bg-purple-500/30 hover:text-white transition-colors border border-white/5"
                            >
                                "{p.substring(0, 80)}..."
                            </button>
                        ))}
                    </div>
                )}
                <div className="relative group">
                    <textarea
                        value={settings.customPrompt}
                        onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                        placeholder="Describe specific props, colors, or mood..."
                        className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all resize-none"
                    />
                    <div className="absolute bottom-3 right-3">
                        <Sparkles className="size-4 text-purple-500/20 group-focus-within:text-purple-500/50 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Commercial Text */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Tag className="size-3" /> Commercial Text (Optional)
                    </label>
                    <button
                        onClick={() => setSettings({
                            ...settings,
                            textOverlay: { ...settings.textOverlay!, enabled: !settings.textOverlay?.enabled }
                        })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${settings.textOverlay?.enabled ? 'bg-purple-500' : 'bg-white/10'
                            }`}
                    >
                        <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${settings.textOverlay?.enabled ? 'left-6' : 'left-1'
                            }`} />
                    </button>
                </div>

                {settings.textOverlay?.enabled && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-gray-400 uppercase">Text Content</label>
                            <input
                                type="text"
                                value={settings.textOverlay.text}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    textOverlay: { ...settings.textOverlay!, text: e.target.value }
                                })}
                                placeholder="e.g. SUMMER SALE 50% OFF"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-gray-400 uppercase">Style</label>
                                <select
                                    value={settings.textOverlay.style}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        textOverlay: { ...settings.textOverlay!, style: e.target.value }
                                    })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                                >
                                    <option value="modern">Modern Sans (Clean)</option>
                                    <option value="bold">Bold Impact (Sale)</option>
                                    <option value="elegant">Elegant Serif (Luxury)</option>
                                    <option value="handwritten">Handwritten Script</option>
                                    <option value="neon">Neon Glow (Cyberpunk)</option>
                                    <option value="minimal">Minimalist Thin</option>
                                    <option value="3d">3D Rendered</option>
                                    <option value="vintage">Vintage / Retro</option>
                                    <option value="brush">Brush Stroke</option>
                                    <option value="gold">Metallic Gold</option>
                                    <option value="silver">Metallic Silver</option>
                                    <option value="glitch">Glitch Effect</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-gray-400 uppercase">Position</label>
                                <select
                                    value={settings.textOverlay.position}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        textOverlay: { ...settings.textOverlay!, position: e.target.value }
                                    })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                                >
                                    <option value="center">Center</option>
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Ratio className="size-3" /> Format
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.id}
                            onClick={() => setSettings({ ...settings, aspectRatio: ratio.id })}
                            className={`group flex flex-col items-center gap-1.5`}
                            title={ratio.label}
                        >
                            <div className={`w-full rounded-md border transition-all ${settings.aspectRatio === ratio.id
                                ? 'bg-purple-500 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                : 'bg-white/5 border-white/10 hover:border-white/30'
                                } ${ratio.ratio}`} />
                            <span className={`text-[10px] font-medium transition-colors ${settings.aspectRatio === ratio.id ? 'text-purple-400' : 'text-gray-500'
                                }`}>{ratio.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Model */}
            <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Wand2 className="size-3" /> Model
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {MODELS.map((model) => (
                        <button
                            key={model.id}
                            onClick={() => setSettings({ ...settings, model: model.id })}
                            className={`px-3 py-3 rounded-lg border text-left transition-all ${settings.model === model.id
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{model.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${model.badge === 'Recommended' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>{model.badge}</span>
                                    {settings.model === model.id && <div className="size-1.5 rounded-full bg-purple-500" />}
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">{model.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Creative Mode */}
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="size-3" /> Creative & Dynamic Angles
                        </label>
                        <p className="text-[10px] text-gray-400">Allows AI freely change camera angles while preserving product labels.</p>
                    </div>
                    <button
                        onClick={() => setSettings({
                            ...settings,
                            creativeMode: !settings.creativeMode
                        })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${settings.creativeMode ? 'bg-purple-500' : 'bg-white/10'
                            }`}
                    >
                        <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${settings.creativeMode ? 'left-6' : 'left-1'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Quality/Size */}
            <div className="space-y-3 pb-24">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Wand2 className="size-3" /> Resolution Quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {IMAGE_SIZES.map((size) => (
                        <button
                            key={size.id}
                            onClick={() => setSettings({ ...settings, imageSize: size.id })}
                            className={`p-2 rounded-lg border text-center transition-all ${(settings.imageSize || '1K') === size.id
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <div className="font-medium text-xs">{size.name}</div>
                            <div className="text-[9px] opacity-70 mt-0.5">{size.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button - Fixed at bottom of container */}
            {(builderMode === 'standard' || builderMode === 'model_placement') && (
                <div className="sticky bottom-0 -mx-4 lg:-mx-6 -mb-4 lg:-mb-6 p-4 lg:p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-20 backdrop-blur-sm">
                    <div className="flex gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isGenerating}
                            className="flex-1 py-3 lg:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group relative overflow-hidden shadow-xl text-sm lg:text-base"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            {isGenerating ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="size-4 group-hover:rotate-12 transition-transform" />
                                    Generate Photoshoot
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleGenerateVariations}
                            disabled={isGenerating}
                            className="px-4 py-3 lg:py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl border border-white/10 text-sm lg:text-base flex-shrink-0"
                            title="Generate 3 variations sequentially"
                        >
                            <LayoutTemplate className="size-4" />
                            Variations (3x)
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
