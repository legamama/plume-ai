const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupStorage() {
    console.log('Setting up storage buckets...');

    const buckets = ['products', 'generations'];

    for (const bucket of buckets) {
        const { data, error } = await supabase.storage.getBucket(bucket);

        if (error && error.message.includes('not found')) {
            console.log(`Creating bucket: ${bucket}`);
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (createError) {
                console.error(`Error creating bucket ${bucket}:`, createError);
            } else {
                console.log(`Bucket ${bucket} created successfully.`);
            }
        } else if (data) {
            console.log(`Bucket ${bucket} already exists.`);
        } else {
            console.error(`Error checking bucket ${bucket}:`, error);
        }
    }
}

setupStorage();
