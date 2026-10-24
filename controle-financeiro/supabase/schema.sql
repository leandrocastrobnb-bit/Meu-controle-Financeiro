-- Execute no Supabase: SQL Editor > New query > Run.
-- Pode ser rodado várias vezes: não apaga dados.

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data_vencimento date not null,
  descricao text,
  categoria text not null,
  tipo text check (tipo in ('Fixa','Variável')),
  forma_pagamento text,
  valor numeric(12,2) not null check (valor > 0),
  valor_pago numeric(12,2) not null default 0 check (valor_pago >= 0 and valor_pago <= valor),
  status text not null default 'Pendente' check (status in ('Pago','Pendente')),
  data_pagamento date,
  criado_em timestamptz default now()
);
alter table public.lancamentos add column if not exists valor_pago numeric(12,2) not null default 0 check (valor_pago >= 0 and valor_pago <= valor);
update public.lancamentos set valor_pago = valor where status = 'Pago' and valor_pago = 0;

create table if not exists public.rendas (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mes text not null,
  valor numeric(12,2) not null default 0,
  primary key (user_id, mes)
);
alter table public.rendas add column if not exists valor_extra numeric(12,2) not null default 0;

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  unique (user_id, nome)
);

create table if not exists public.perfis (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  foto text
);

alter table public.lancamentos enable row level security;
alter table public.rendas enable row level security;
alter table public.categorias enable row level security;
alter table public.perfis enable row level security;

drop policy if exists "dono" on public.lancamentos;
drop policy if exists "dono" on public.rendas;
drop policy if exists "dono" on public.categorias;
drop policy if exists "dono" on public.perfis;

create policy "dono" on public.lancamentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "dono" on public.rendas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "dono" on public.categorias for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "dono" on public.perfis for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
