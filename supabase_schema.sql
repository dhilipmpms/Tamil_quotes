-- Tamil Literature & Philosophy Community Platform Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    email text,
    profile_image text,
    bio text,
    role text check (role in ('admin', 'user')) default 'user',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles
    for select using (true);

create policy "Users can update their own profile" on public.profiles
    for update using (auth.uid() = id);

-- Trigger: Automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, profile_image, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'profile_image',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Categories Table
create table public.categories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text unique not null,
    description text,
    type text check (type in ('quotes', 'kavithai', 'philosophy', 'stories', 'all')) default 'all',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone" on public.categories
    for select using (true);

create policy "Only admin can modify categories" on public.categories
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- 3. Tags Table
create table public.tags (
    id uuid default gen_random_uuid() primary key,
    name text unique not null,
    slug text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tags enable row level security;

create policy "Tags are viewable by everyone" on public.tags
    for select using (true);

create policy "Only admin can modify tags" on public.tags
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- Helper check constraint for languages
-- 'ta' = Tamil, 'en' = English
-- 4. Quotes Table
create table public.quotes (
    id uuid default gen_random_uuid() primary key,
    title text,
    content text not null,
    author text not null,
    category text references public.categories(slug),
    tags text[] default '{}',
    status text check (status in ('pending', 'approved', 'rejected')) default 'approved',
    featured boolean default false,
    language text check (language in ('ta', 'en')) default 'ta',
    views integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quotes enable row level security;

create policy "Approved quotes are viewable by everyone" on public.quotes
    for select using (status = 'approved');

create policy "Admin has full access to quotes" on public.quotes
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- 5. Kavithai (Poetry) Table
create table public.kavithai (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    content text not null, -- formatted verse, lines separated by newlines
    author text not null,
    category text references public.categories(slug),
    tags text[] default '{}',
    status text check (status in ('pending', 'approved', 'rejected')) default 'approved',
    featured boolean default false,
    language text check (language in ('ta', 'en')) default 'ta',
    views integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.kavithai enable row level security;

create policy "Approved poems are viewable by everyone" on public.kavithai
    for select using (status = 'approved');

create policy "Admin has full access to poems" on public.kavithai
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- 6. Philosophy Articles Table
create table public.philosophy_articles (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    content text not null, -- rich markdown text
    author text not null,
    category text references public.categories(slug),
    tags text[] default '{}',
    status text check (status in ('pending', 'approved', 'rejected')) default 'approved',
    featured boolean default false,
    language text check (language in ('ta', 'en')) default 'ta',
    views integer default 0,
    reading_time integer default 5, -- in minutes
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.philosophy_articles enable row level security;

create policy "Approved articles are viewable by everyone" on public.philosophy_articles
    for select using (status = 'approved');

create policy "Admin has full access to articles" on public.philosophy_articles
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- 7. Stories Table
create table public.stories (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    content text not null, -- rich story text
    author text not null,
    category text references public.categories(slug),
    tags text[] default '{}',
    status text check (status in ('pending', 'approved', 'rejected')) default 'approved',
    featured boolean default false,
    language text check (language in ('ta', 'en')) default 'ta',
    views integer default 0,
    reading_time integer default 8,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stories enable row level security;

create policy "Approved stories are viewable by everyone" on public.stories
    for select using (status = 'approved');

create policy "Admin has full access to stories" on public.stories
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- 8. Submissions Table (User contributions moderation queue)
create table public.submissions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content_type text check (content_type in ('quotes', 'kavithai', 'philosophy', 'stories')) not null,
    title text,
    content text not null,
    author text not null,
    category text references public.categories(slug),
    tags text[] default '{}',
    status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
    moderator_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.submissions enable row level security;

create policy "Users can view and create their own submissions" on public.submissions
    for all using (auth.uid() = user_id);

create policy "Admin can moderate all submissions" on public.submissions
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- 9. Comments Table (Supports nested replies via parent_id)
create table public.comments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content_type text check (content_type in ('quotes', 'kavithai', 'philosophy', 'stories')) not null,
    content_id uuid not null,
    message text not null,
    parent_id uuid references public.comments(id) on delete cascade,
    reported boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" on public.comments
    for select using (true);

create policy "Registered users can post comments" on public.comments
    for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments" on public.comments
    for delete using (auth.uid() = user_id);

create policy "Admin can moderate all comments" on public.comments
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );


-- 10. Bookmarks Table
create table public.bookmarks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content_type text check (content_type in ('quotes', 'kavithai', 'philosophy', 'stories')) not null,
    content_id uuid not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, content_type, content_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can manage their own bookmarks" on public.bookmarks
    for all using (auth.uid() = user_id);


-- 11. Likes Table
create table public.likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content_type text check (content_type in ('quotes', 'kavithai', 'philosophy', 'stories')) not null,
    content_id uuid not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, content_type, content_id)
);

alter table public.likes enable row level security;

create policy "Users can manage their own likes" on public.likes
    for all using (auth.uid() = user_id);


-- =========================================================================
-- SEED DATA
-- =========================================================================

-- Insert Categories
insert into public.categories (name, slug, description, type) values
('Motivation', 'motivation', 'Inspirational thoughts to fuel your daily drive.', 'quotes'),
('Life', 'life', 'Wisdom and reflections on the journey of life.', 'quotes'),
('Love', 'love', 'Romance, affection, and emotional bonding.', 'quotes'),
('Friendship', 'friendship', 'Honoring companions and loyal friendships.', 'quotes'),
('Success', 'success', 'Principles for achieving goals and excellence.', 'quotes'),
('Wisdom', 'wisdom', 'Deep insights from ancient and modern thinkers.', 'quotes'),
('Spirituality', 'spirituality', 'Exploring inner peace and spiritual consciousness.', 'quotes'),
('Classical Tamil Poetry', 'classical-poetry', 'Poetry in traditional forms (Sangam literature style).', 'kavithai'),
('Modern Kavithai', 'modern-poetry', 'Contemporary free-verse (Puthukkavithai) expressing modern emotions.', 'kavithai'),
('Stoicism', 'stoicism', 'Practical philosophy focusing on resilience and virtue.', 'philosophy'),
('Tamil Wisdom & Thirukkural', 'tamil-wisdom', 'Exploring teachings of Thiruvalluvar, Avvaiyar, and others.', 'philosophy'),
('Ethics & Personal Growth', 'ethics', 'Moral guidance and self-improvement frameworks.', 'philosophy'),
('Inspirational Stories', 'inspirational-stories', 'Tales of resilience, kindness, and personal triumphs.', 'stories'),
('Life Experiences', 'life-experiences', 'Reflective short stories about everyday epiphanies.', 'stories');

-- Insert Tags
insert into public.tags (name, slug) values
('Thiruvalluvar', 'thiruvalluvar'),
('Bharathiyar', 'bharathiyar'),
('Avvaiyar', 'avvaiyar'),
('Marcus Aurelius', 'marcus-aurelius'),
('Self-Discipline', 'self-discipline'),
('Hope', 'hope'),
('Silence', 'silence'),
('Peace', 'peace'),
('Nature', 'nature');

-- Insert Initial Approved Quotes
insert into public.quotes (title, content, author, category, tags, language, featured) values
('Purpose of Life', 'துப்பார்க்குத் துப்பாய துப்பாக்கித் துப்பார்க்குத் துப்பாய தூஉம் மழை.', 'Thiruvalluvar', 'life', '{"thiruvalluvar"}', 'ta', true),
('Fearlessness', 'அச்சமில்லை அச்சமில்லை அச்சமென்ப தில்லையே...', 'Mahakavi Bharathiyar', 'motivation', '{"bharathiyar", "hope"}', 'ta', false),
('Wisdom of Age', 'அறம் செய விரும்பு. ஆறுவது சினம். இயல்வது கரவேல்.', 'Avvaiyar', 'wisdom', '{"avvaiyar"}', 'ta', false),
('Control Your Mind', 'You have power over your mind - not outside events. Realize this, and you will find strength.', 'Marcus Aurelius', 'wisdom', '{"marcus-aurelius", "self-discipline"}', 'en', true),
('True Friendship', 'நவில்தொறும் நூல்நயம் போலும் பயில்தொறும் பண்புடை யாளர் தொடர்பு.', 'Thiruvalluvar', 'friendship', '{"thiruvalluvar"}', 'ta', false);

-- Insert Initial Approved Kavithai (Tamil Poetry)
insert into public.kavithai (title, content, author, category, tags, language, featured) values
('காற்று', 'விசையுறு பந்தினைப்போல் - உள்ளம்
வேண்டியவாறு செல்லுமடா!
விண்ணையும் மண்ணையும் கைகளில் ஏந்தி
விளையாட நினைக்குமடா!
காற்றே, என் ஜீவனின் கீதமே,
நின் வேகம் தடையறியாதது!', 'பாரதியார்', 'modern-poetry', '{"bharathiyar", "nature"}', 'ta', true),
('மௌனத்தின் மொழி', 'சொற்கள் களைந்து போன மாலையில்
உன் மௌனம் மட்டும்
என் அறையெங்கும் நிரம்பி வழிகிறது...
பேசப்படாத வார்த்தைகளே
கவிதையாகிப் போகின்றன.', 'கவி நிலவன்', 'modern-poetry', '{"silence", "peace"}', 'ta', false);

-- Insert Initial Approved Philosophy Articles
insert into public.philosophy_articles (title, content, author, category, tags, language, reading_time, featured) values
('Thirukkural: The Global Code of Ethics', '# Thirukkural: The Global Code of Ethics

Thirukkural, written by the sage Thiruvalluvar over 2,000 years ago, remains one of the most comprehensive secular ethical guides in human history. 

Unlike many contemporary texts, Thirukkural does not advocate for any specific religion, sect, or community. It focuses purely on **Aram (Virtue)**, **Porul (Wealth/Statecraft)**, and **Inbam (Love/Family Life)**.

## The Core Concept of Aram (Virtue)
Aram is defined as acting with a pure mind. Valluvar states:
> "மனத்துக்கண் மாசிலன் ஆதல் அனைத்துஅறன்; ஆகுல நீர பிற."
*(To be pure in mind is all virtue; all else is mere empty sound.)*

This standard forms the bedrock of personal growth and ethical living. It encourages:
1. **Gratitude (செய்ந்நன்றி அறிதல்)**: Recognizing kindness and never forgetting a good deed.
2. **Speech (இனியவை கூறல்)**: Speaking pleasant, gentle words instead of harsh, destructive ones.
3. **Equanimity (நடுவுநிலைமை)**: Being fair and impartial to friends, strangers, and enemies alike.

In a globalized world filled with conflicts, Valluvar''s timeless insights offer a blueprint for harmony and personal peace.', 'Dr. S. Raman', 'tamil-wisdom', '{"thiruvalluvar"}', 'en', 6, true),

('Stoicism and Tamil Sangam Wisdom: An Unexpected Parallel', '# Stoicism and Tamil Sangam Wisdom: An Unexpected Parallel

Is there a connection between the philosophy of Ancient Rome/Greece and the Classical Tamil Sangam era? While separated by thousands of miles, Stoics and Tamil poets shared striking philosophical foundations.

## Universal Citizenship (Cosmopolitanism)
Seneca and Marcus Aurelius famously spoke of being citizens of the world. In the Tamil tradition, this was beautifully summarized by the poet **Kaniyan Pungundranar** in Purananuru:
> "யாதும் ஊரே யாவரும் கேளிர்"
*(Every town is my hometown, and everyone is my kinsman.)*

This verse represents a peak of humanistic thought, mirroring the Stoic concept of *Oikeiosis* - the widening circle of ethical concern.

## Accepting the Flow of Nature (Amor Fati)
Stoicism teaches us to accept external events beyond our control. Similarly, Pungundranar wrote:
> "தீதும் நன்றும் பிறர்தர வாரா... 
பெரியோரை வியத்தலும் இலமே, சிறியோரை இகழ்தல் அதனினும் இலமே."
*(Good and evil do not come from others... We do not marvel at the great, and much less do we despise the small.)*

This displays a calm acceptance of life''s vicissitudes, demonstrating that deep, resilient wisdom is universal to human consciousness.', 'Aravind K.', 'stoicism', '{"marcus-aurelius", "peace"}', 'en', 7, false);

-- Insert Initial Approved Stories
insert into public.stories (title, content, author, category, tags, language, reading_time, featured) values
('The Merchant''s Ledger of Good Deeds', '# The Merchant''s Ledger of Good Deeds

Deep in the historical city of Madurai, during the Pandyan rule, lived a merchant named Meiyappan. Unlike other traders who counted gold coins, Meiyappan kept a separate, secret ledger bound in red silk. 

One day, his young apprentice, Somu, asked: "Master, what accounts do you write in that red book? Is it our hidden profits?"

Meiyappan smiled, his eyes reflecting the evening lamps. "No, Somu. This is my ledger of debts that can never be paid in coin. It is the kindness ledger."

He opened the book and showed a page. 
- *Item 1:* A farmer who shared his gruel when my cart broke down in the rain (Value: Lifesaving).
- *Item 2:* A stranger who warned me of thieves in the pass (Value: Beyond price).

"But master, why write these down?" Somu asked.

"Because," Meiyappan replied, "in business, we count what people owe us. In life, we must count what we owe to the goodness of others. Every time I look at this ledger, I am reminded that my success is built on the silent kindness of a thousand strangers. It keeps my heart soft and my hands open."

Somu looked at his master with newfound respect. From that day, he too began writing his own red ledger, realizing that true wealth is not stored in chests of gold, but in a grateful mind.', 'K. Sundaram', 'inspirational-stories', '{"hope", "peace"}', 'ta', 5, true);
