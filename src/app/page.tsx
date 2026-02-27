import Link from 'next/link'
import { ArrowRight, Camera, Wand2, Image as ImageIcon, Sparkles, Zap, Layers, Upload, Download, SlidersHorizontal, Github, Twitter, Linkedin } from 'lucide-react'

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white selection:bg-purple-500/30 selection:text-purple-200">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] mix-blend-screen opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-900/20 blur-[100px] mix-blend-screen opacity-50 animate-pulse" style={{ animationDuration: '7s' }} />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen opacity-40 animate-pulse" style={{ animationDuration: '5s' }} />

                {/* Subtle Grid overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0wIDEwaDQwTTEwIDB2NDBMNDAgNDB2LTQwIiBzdHJva2U9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMikiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)] opacity-30"></div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 overflow-hidden z-10 flex flex-col items-center justify-center min-h-[90vh]">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-300 mb-8 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20">
                        <Sparkles className="size-4 animate-pulse text-purple-400" />
                        Powered by Gemini 2.5 Pro
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 drop-shadow-sm">Professional Product</span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-500 animate-gradient-x drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            Photos AI
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
                        Transform raw smartphone snaps into stunning, high-converting commercial photography in seconds.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <Link
                            href="/dashboard"
                            className="group relative px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-gray-100 transition-all flex items-center gap-3 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0"
                            aria-label="Start creating product photos now"
                        >
                            <span className="relative z-10">Start Creating for Free</span>
                            <ArrowRight className="size-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </Link>
                        <Link
                            href="#examples"
                            className="px-8 py-4 rounded-full bg-black/40 backdrop-blur-md text-white font-semibold hover:bg-white/10 transition-all border border-white/10 hover:border-white/30 flex items-center gap-2"
                            aria-label="View examples of AI generated photos"
                        >
                            <ImageIcon className="size-5 text-gray-400" />
                            View Examples
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 relative z-10 bg-gradient-to-b from-black/0 via-black/80 to-black border-t border-white/5" id="features">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Enterprise-Grade Generation</h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Every tool you need to produce pixel-perfect catalog imagery.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                        <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all">
                                <Camera className="size-7 text-purple-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 tracking-tight text-white group-hover:text-purple-300 transition-colors">Smart Analysis</h3>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                Upload your product and let our AI analyze every detail, texture, and feature to ensure perfect structural integrity and scale.
                            </p>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all">
                                <Wand2 className="size-7 text-blue-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 tracking-tight text-white group-hover:text-blue-300 transition-colors">Infinite Scenes</h3>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                Choose from professional studio presets or describe your dream scene context. We'll handle realistic lighting, reflections, and composition.
                            </p>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-pink-500/30 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(236,72,153,0.15)] group-hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all">
                                <Zap className="size-7 text-pink-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 tracking-tight text-white group-hover:text-pink-300 transition-colors">4K Resolution</h3>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                Get sharp, commercial-ready high-resolution images with impeccable prompt adherence, perfect text preservation, and flawless detail.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 relative z-10 bg-black" id="how-it-works">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">How it Works</h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">From raw photo to ad-ready asset in three simple steps.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto items-center md:items-start relative">
                        {/* Connecting line for desktop */}
                        <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-blue-500/0 z-0"></div>

                        {[
                            { step: "01", icon: <Upload className="size-8" />, title: "Upload Product", desc: "Upload a clean photo of your product. Transparent backgrounds work best." },
                            { step: "02", icon: <Layers className="size-8" />, title: "Describe Scene", desc: "Write a prompt for the background or choose a curated template." },
                            { step: "03", icon: <Download className="size-8" />, title: "Download Assets", desc: "Review options, pick your favorite, and download commercially ready files." }
                        ].map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center text-center relative z-10 group">
                                <div className="size-12 rounded-full bg-black border-2 border-white/20 flex items-center justify-center font-bold text-lg mb-6 text-gray-400 group-hover:text-white group-hover:border-purple-500 transition-colors shadow-lg shadow-black">
                                    {item.step}
                                </div>
                                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 w-full hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="text-gray-400 mb-4 flex justify-center group-hover:text-purple-400 transition-colors group-hover:scale-110 duration-300">
                                        {item.icon}
                                    </div>
                                    <h4 className="text-xl font-bold mb-2 text-white">{item.title}</h4>
                                    <p className="text-gray-500 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Examples Gallery Showcase (Placeholder style) */}
            <section className="py-24 relative z-10 bg-black/50 overflow-hidden" id="examples">
                <div className="container mx-auto px-4 mb-16">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Studio Quality Output</h2>
                            <p className="text-gray-400 text-lg">Achieve results that rival professional photography studios at a fraction of the cost.</p>
                        </div>
                        <Link href="/gallery" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold group whitespace-nowrap">
                            Browse full community gallery <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Simulated Image Grid */}
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden group relative flex items-center justify-center shadow-lg">
                                {/* Simulated Before/After or Product */}
                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black opacity-50 z-0"></div>
                                <div className="relative z-10 flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity text-gray-500 group-hover:text-white">
                                    <ImageIcon className="size-16 mb-4" />
                                    <p className="font-semibold tracking-wider uppercase text-sm">Example Scene {i}</p>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-purple-500/30 text-purple-200 backdrop-blur-md">Cosmetics</span>
                                        <div className="flex gap-2">
                                            <span className="p-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors cursor-pointer"><SlidersHorizontal className="size-3" /></span>
                                            <span className="p-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors cursor-pointer"><Download className="size-3" /></span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-300 truncate">"Luxurious perfume bottle on a marble pedestal, golden hour lighting..."</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-purple-900/40 via-black to-blue-900/40 border border-white/10 text-center relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-purple-500/20 blur-[100px] rounded-full -z-10"></div>

                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white drop-shadow-md">Ready to Elevate Your Brand?</h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium">Join thousands of creators saving time and money on product photography.</p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        >
                            Get Started Free <ArrowRight className="size-5" />
                        </Link>
                        <p className="mt-6 text-sm text-gray-500 font-medium">No credit card required. Includes 10 free generations.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black py-12 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                        <div className="flex items-center gap-3 text-2xl font-bold">
                            <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <Sparkles className="size-5 text-white" />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                Plume Ai
                            </span>
                        </div>
                        <div className="flex gap-6 text-gray-400">
                            <Link href="#" className="hover:text-white transition-colors"><Twitter className="size-5" aria-label="Twitter" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Github className="size-5" aria-label="GitHub" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Linkedin className="size-5" aria-label="LinkedIn" /></Link>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium border-t border-white/5 pt-8">
                        <p>&copy; {new Date().getFullYear()} Plume AI Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
