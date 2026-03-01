export interface UpdateLog {
    version: string;
    date: string;
    time: string;
    changes: string[];
}

export const UPDATE_LOGS: UpdateLog[] = [
    {
        version: '0.1.2',
        date: '2026-03-01',
        time: '08:09 PM',
        changes: [
            'Automated app version and update logs on GitHub push workflow'
        ]
    },
    {
        version: '0.1.1',
        date: '2026-03-01',
        time: '03:11 AM',
        changes: [
            'Added Update Logs tab to Settings',
            'Added app version and update date to the footer',
            'Improved smart scene cleaning integration',
            'Fixed Vercel deployment issues'
        ]
    },
    {
        version: '0.1.0',
        date: '2026-02-28',
        time: '12:00 PM',
        changes: [
            'Initial beta release',
            'Model placement and scene generation features added',
            'Supabase integration for user profiles'
        ]
    }
];

export const LATEST_UPDATE = UPDATE_LOGS[0];
