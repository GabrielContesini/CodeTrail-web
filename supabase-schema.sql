// Run these commands in the Supabase SQL Editor

-- Create the plan_intents table
create table if not exists public.plan_intents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  selected_plan text not null check (selected_plan in ('free', 'pro', 'founding')),
  source text not null default 'landing_page',
  platform_interest text not null default 'windows',
  status text not null default 'interested',
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.plan_intents enable row level security;

-- Create policies
create policy "Users can view their own intent"
  on public.plan_intents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own intent"
  on public.plan_intents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own intent"
  on public.plan_intents for update
  using (auth.uid() = user_id);
