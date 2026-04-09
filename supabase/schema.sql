-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_paid boolean default false not null,
  trial_started_at timestamp with time zone,
  stripe_customer_id text
);

-- Restaurant profiles table
create table if not exists restaurant_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  restaurant_name text not null,
  cuisine_type text not null,
  vibe text not null,
  voice_style text not null,
  description text not null,
  owner_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Replies table
create table if not exists replies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  review_text text not null,
  platform text not null,
  star_rating integer not null check (star_rating >= 1 and star_rating <= 5),
  generated_reply text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table restaurant_profiles enable row level security;
alter table replies enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Restaurant profiles policies
create policy "Users can view their own restaurant profile"
  on restaurant_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own restaurant profile"
  on restaurant_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own restaurant profile"
  on restaurant_profiles for update
  using (auth.uid() = user_id);

-- Replies policies
create policy "Users can view their own replies"
  on replies for select
  using (auth.uid() = user_id);

create policy "Users can insert their own replies"
  on replies for insert
  with check (auth.uid() = user_id);

-- Google waitlist table
create table if not exists google_waitlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

alter table google_waitlist enable row level security;

create policy "Users can view their own waitlist entry"
  on google_waitlist for select
  using (auth.uid() = user_id);

create policy "Users can insert their own waitlist entry"
  on google_waitlist for insert
  with check (auth.uid() = user_id);

-- Add Google Maps scraping columns to restaurant_profiles
alter table restaurant_profiles add column if not exists google_maps_url text;
alter table restaurant_profiles add column if not exists last_scraped_at timestamp with time zone;

-- Scraped reviews table (populated by Outscraper cron)
create table if not exists scraped_reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  restaurant_profile_id uuid references restaurant_profiles(id) on delete cascade not null,
  review_id text not null,
  reviewer_name text not null default 'Anonymous',
  star_rating integer not null default 0,
  review_text text not null default '',
  review_datetime_utc text not null default '',
  generated_reply text,
  reply_status text not null default 'pending' check (reply_status in ('pending', 'approved', 'dismissed', 'skipped')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(review_id, user_id)
);

alter table scraped_reviews enable row level security;

create policy "Users can view their own scraped reviews"
  on scraped_reviews for select
  using (auth.uid() = user_id);

create policy "Users can update their own scraped reviews"
  on scraped_reviews for update
  using (auth.uid() = user_id);

-- Restaurant analytics cache table
create table if not exists restaurant_analytics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  themes jsonb,
  rating_trend jsonb,
  sentiment_summary jsonb,
  last_analyzed_at timestamp with time zone default now(),
  reviews_count_at_analysis integer
);

alter table restaurant_analytics enable row level security;

create policy "Users can manage their own analytics"
  on restaurant_analytics for all
  using (auth.uid() = user_id);

-- Trigger: auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
