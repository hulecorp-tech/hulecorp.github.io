-- ============================================================================
-- Design Orders — schema + RLS for the /studio tool (Xưởng Thiết Kế)
-- Run this ONCE in the Supabase SQL editor of project dmvomgmhsivifionnkiu.
-- Safe to re-run (idempotent).
-- ============================================================================

create table if not exists public.design_orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  requester_id  uuid not null references auth.users(id) on delete cascade,
  requester_name text,
  title         text not null,
  category      text,
  brief         text,
  size          text,
  deadline      date,
  priority      text not null default 'normal',   -- normal | high | urgent
  ref_image     text,                             -- optional reference image (data URL)
  status        text not null default 'new',      -- new | in_progress | done
  design_prompt text,                             -- AI prompt used by the designer
  result_image  text,                             -- delivered design (data URL / URL)
  designer_id   uuid references auth.users(id) on delete set null,
  designer_name text
);

create index if not exists design_orders_status_idx on public.design_orders(status);
create index if not exists design_orders_requester_idx on public.design_orders(requester_id);

alter table public.design_orders enable row level security;

-- keep updated_at fresh
create or replace function public.touch_design_orders() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists design_orders_touch on public.design_orders;
create trigger design_orders_touch before update on public.design_orders
  for each row execute function public.touch_design_orders();

-- is the current user a designer (admin/moderator)?
create or replace function public.is_designer() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  );
$$;

-- anyone signed in may create their own order
drop policy if exists "design_orders insert own" on public.design_orders;
create policy "design_orders insert own" on public.design_orders
  for insert to authenticated
  with check (requester_id = auth.uid());

-- owner sees their own orders; designers see all
drop policy if exists "design_orders read" on public.design_orders;
create policy "design_orders read" on public.design_orders
  for select to authenticated
  using (requester_id = auth.uid() or public.is_designer());

-- designers can update any order (status, result, prompt, …)
drop policy if exists "design_orders update" on public.design_orders;
create policy "design_orders update" on public.design_orders
  for update to authenticated
  using (public.is_designer())
  with check (public.is_designer());

-- designers can delete orders
drop policy if exists "design_orders delete" on public.design_orders;
create policy "design_orders delete" on public.design_orders
  for delete to authenticated
  using (public.is_designer());
