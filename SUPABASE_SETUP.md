# Supabase Integration Guide

## Overview
Plume AI now fully integrates with Supabase for storing all data in the cloud.

## Database Setup

### 1. Apply the Schema
The schema in `supabase/schema.sql` includes:
- `expires_at` field for 30-day auto-deletion
- `delete_expired_generations()` function
- RLS policies

### 2. Storage Buckets
Create two public buckets:
- `products` - Product images
- `generations` - Generated images

### 3. Cron Job
Set up daily cron in Supabase Dashboard:
```sql
select cron.schedule('delete-expired-generations', '0 0 * * *', $$ select delete_expired_generations(); $$);
```

## Features

- Product profiles saved to cloud
- Generated images saved with 30-day expiry
- Gallery page at `/gallery`
- Auto-delete expired images
- Download and manual delete options

## Environment
Make sure `.env.local` has Supabase credentials.
