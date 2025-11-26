-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (optional, for additional user data)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profile policies
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Products table (references auth.users directly, not profiles)
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  image_url text not null,
  analysis_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on products
alter table public.products enable row level security;

create policy "Users can view their own products."
  on products for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own products."
  on products for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own products."
  on products for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own products."
  on products for delete
  using ( auth.uid() = user_id );

create table public.generations (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  prompt text not null,
  image_url text not null,
  settings jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on generations
alter table public.generations enable row level security;

create policy "Users can view their own generations."
  on generations for select
  using ( auth.uid() = (select user_id from public.products where id = product_id) );

create policy "Users can insert their own generations."
  on generations for insert
  with check ( auth.uid() = (select user_id from public.products where id = product_id) );

-- Storage buckets
insert into storage.buckets (id, name)
values ('products', 'products')
on conflict (id) do nothing;

create policy "Authenticated users can upload product images"
  on storage.objects for insert
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

create policy "Authenticated users can view product images"
  on storage.objects for select
  using ( bucket_id = 'products' and auth.role() = 'authenticated' );

insert into storage.buckets (id, name)
values ('generations', 'generations')
on conflict (id) do nothing;

create policy "Authenticated users can upload generation images"
  on storage.objects for insert
  with check ( bucket_id = 'generations' and auth.role() = 'authenticated' );

create policy "Authenticated users can view generation images"
  on storage.objects for select
  using ( bucket_id = 'generations' and auth.role() = 'authenticated' );
