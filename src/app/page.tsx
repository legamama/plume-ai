import Link from 'next/link'
import { ArrowRight, Camera, Wand2, Image as ImageIcon } from 'lucide-react'

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm text-purple-300 mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Powered by Gemini 2.5
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Professional Product Photos <br />
                        <span className="text-purple-500">Reimagined with AI</span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Transform simple product shots into stunning professional photography using advanced AI analysis and scene generation.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            Start Creating <ArrowRight className="size-4" />
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="px-8 py-4 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/10"
                        >
                            See Examples
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-black/50" id="how-it-works">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group">
                            <div className="size-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Camera className="size-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
                            <p className="text-gray-400">
                                Upload your product and let our AI analyze every detail, texture, and feature to ensure perfect representation.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors group">
                            <div className="size-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Wand2 className="size-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Scene Generation</h3>
                            <p className="text-gray-400">
                                Choose from professional studio presets or describe your dream scene. We'll handle the lighting and composition.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-colors group">
                            <div className="size-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ImageIcon className="size-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">High-Res Output</h3>
                            <p className="text-gray-400">
                                Get sharp, commercial-ready images with perfect text preservation and realistic shadows.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
