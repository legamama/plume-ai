'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function Header() {
    const { user, signOut } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-[100]">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 text-xl font-bold text-white z-50">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        <Sparkles className="size-5 text-white" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Plume Ai
                    </span>
                </Link>

                {/* Desktop Navigation */}
                {user && (
                    <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            Dashboard
                        </Link>
                        <Link href="/gallery" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            Gallery
                        </Link>
                        <Link href="/settings" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            Settings
                        </Link>
                    </nav>
                )}

                {/* Desktop Auth / Profile */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400 font-medium">{user.email}</span>
                            <button
                                onClick={() => signOut()}
                                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition-all flex items-center gap-2 hover:border-white/20"
                            >
                                <LogOut className="size-4 text-gray-400" />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Sign In
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle Button */}
                <button
                    className="md:hidden p-2 text-gray-300 hover:text-white transition-colors z-50 bg-white/5 rounded-full border border-white/10"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-[100%] left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 flex flex-col gap-4">
                        {user ? (
                            <>
                                <nav className="flex flex-col gap-2">
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/gallery"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                    >
                                        Gallery
                                    </Link>
                                    <Link
                                        href="/settings"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                    >
                                        Settings
                                    </Link>
                                </nav>
                                <div className="border-t border-white/10 my-2 pt-4 px-2">
                                    <div className="mb-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Account</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-300 truncate max-w-[200px]">{user.email}</span>
                                        <button
                                            onClick={() => {
                                                signOut()
                                                setIsMobileMenuOpen(false)
                                            }}
                                            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <LogOut className="size-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full px-4 py-3 rounded-xl bg-white text-black text-center font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
