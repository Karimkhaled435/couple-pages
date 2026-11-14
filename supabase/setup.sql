-- شغّل هذا الملف مرة واحدة من Supabase > SQL Editor
-- (آمن للتشغيل أكثر من مرة)

create table if not exists public.pages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  slug text not null unique,
  lover_name text not null,
  password text not null,
  message text not null,
  song_url text,
  images text[] default '{}',
  secret_message text,
  cards text,
  timeline text,
  reasons text,
  relation_date date,
  song_title text,
  closing_line text
);

-- الموقع بيتعامل مع الداتابيز من السيرفر فقط (service_role بيتخطى RLS)،
-- فنقفل الجدول تماماً على أي وصول مباشر من المتصفح:
alter table public.pages enable row level security;
drop policy if exists "public read pages" on public.pages;
drop policy if exists "Enable read access for all users" on public.pages;

-- جدول الدفع القديم لم يعد مستخدماً. لو عايز تمسحه شيل التعليق:
-- drop table if exists public.pending_pages;
