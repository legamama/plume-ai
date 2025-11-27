'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Save, Key, Activity, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [testMessage, setTestMessage] = useState('')
    const [usageCount, setUsageCount] = useState(0)

    useEffect(() => {
        // Load settings from local storage
        const storedKey = localStorage.getItem('plume_gemini_api_key')
        if (storedKey) setApiKey(storedKey)

        const storedUsage = localStorage.getItem('plume_api_usage_count')
        if (storedUsage) setUsageCount(parseInt(storedUsage, 10))
    }, [])

    const handleSave = () => {
        localStorage.setItem('plume_gemini_api_key', apiKey)
        alert('Settings saved!')
    }

    const handleTestConnection = async () => {
        if (!apiKey) {
            setTestStatus('error')
            setTestMessage('Please enter an API Key first')
            return
        }

        setIsTesting(true)
        setTestStatus('idle')
        setTestMessage('')

        try {
            const response = await fetch('/api/settings/gemini/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
            })

            const data = await response.json()

            if (response.ok) {
                setTestStatus('success')
                setTestMessage('Connection successful! Your API key is working.')
            } else {
                setTestStatus('error')
                setTestMessage(data.error || 'Failed to connect')
            }
        } catch (error) {
            setTestStatus('error')
            setTestMessage('Network error occurred')
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black text-white">
                <div className="container mx-auto px-4 lg:px-6 py-8 max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Settings</h1>
                        <p className="text-gray-400">Manage your AI configuration and preferences</p>
                    </div>

                    <div className="space-y-6">
                        {/* API Configuration Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                                    <Key className="size-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">Gemini API Configuration</h2>
                                    <p className="text-sm text-gray-400">
                                        Provide your own Google Gemini API key to bypass system limits and track your own usage.
                                        Your key is stored locally in your browser.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 max-w-2xl">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="AIzaSy..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all pr-12"
                                        />
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Get one from Google AI Studio</a>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <Save className="size-4" />
                                        Save Settings
                                    </button>
                                    <button
                                        onClick={handleTestConnection}
                                        disabled={isTesting || !apiKey}
                                        className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isTesting ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
                                        Test Connection
                                    </button>
                                </div>

                                {/* Test Result Message */}
                                {testStatus !== 'idle' && (
                                    <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${testStatus === 'success'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        {testStatus === 'success' ? (
                                            <CheckCircle2 className="size-5 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
                                        )}
                                        <span className="text-sm">{testMessage}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Usage Monitoring Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                                    <Activity className="size-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">Usage Monitoring</h2>
                                    <p className="text-sm text-gray-400">
                                        Track your local API usage statistics.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                                    <div className="text-sm text-gray-500 mb-1">Total Requests</div>
                                    <div className="text-2xl font-bold text-white">{usageCount}</div>
                                </div>
                                {/* Add more stats here if we track them later */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
