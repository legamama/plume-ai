import React from 'react';
import { LATEST_UPDATE } from '@/lib/updateLogs';

export default function Footer() {
    return (
        <footer className="w-full bg-black border-t border-white/10 py-6 mt-auto">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-gray-400 text-sm">
                    Version {LATEST_UPDATE.version}
                </p>
                <p className="text-gray-500 text-xs">
                    Last Updated: {LATEST_UPDATE.date} at {LATEST_UPDATE.time}
                </p>
            </div>
        </footer>
    );
}
