'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ScrollableContainerProps {
    children: React.ReactNode
    className?: string
    itemClassName?: string
}

export default function ScrollableContainer({ children, className = '', itemClassName = '' }: ScrollableContainerProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeft, setShowLeft] = useState(false)
    const [showRight, setShowRight] = useState(false)

    const checkScroll = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setShowLeft(scrollLeft > 0)
        setShowRight(scrollLeft < scrollWidth - clientWidth - 5) // 5px buffer
    }

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [])

    // Re-check when children change
    useEffect(() => {
        checkScroll()
    }, [children])

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const scrollAmount = scrollRef.current.clientWidth / 2
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }

    return (
        <div className={`relative group/scroll ${className}`}>
            {/* Left Indicator/Button */}
            <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 flex items-center transition-opacity duration-300 ${showLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={() => scroll('left')}
                    className="ml-1 p-1 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white/20 transition-colors"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="size-4" />
                </button>
            </div>

            {/* Scrollable Area */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className={`overflow-x-auto flex gap-3 pb-2 no-scrollbar ${itemClassName}`}
            >
                {children}
            </div>

            {/* Right Indicator/Button */}
            <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 flex items-center justify-end transition-opacity duration-300 ${showRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={() => scroll('right')}
                    className="mr-1 p-1 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white/20 transition-colors"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>
        </div>
    )
}
