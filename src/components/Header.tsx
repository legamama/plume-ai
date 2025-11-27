'use client'

import Link from 'next/link'
import { Sparkles, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function Header() {
    const { user, signOut } = useAuth()

    return (
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="size-5 text-white" />
                    </div>
                    Plume Ai
                </Link>

                {user && (
                    <nav className="flex items-center gap-6">
                        <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/gallery" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Gallery
                        </Link>
                        <Link href="/settings" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Settings
                        </Link>
                    </nav>
                )}

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">{user.email}</span>
                            <button
                                onClick={() => signOut()}
                                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <LogOut className="size-4" />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}
