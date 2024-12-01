-- Drop existing policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload logos" on storage.objects;
drop policy if exists "Users can update their own logos" on storage.objects;
drop policy if exists "Users can delete their own logos" on storage.objects;

-- Create a storage bucket for logos if it doesn't exist
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Create a policy to allow public access to logos
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'logos' );

-- Create a policy to allow authenticated users to upload logos
create policy "Authenticated users can upload logos"
on storage.objects for insert
with check (
  bucket_id = 'logos'
  and auth.role() = 'authenticated'
);

-- Create a policy to allow users to update their own logos
create policy "Users can update their own logos"
on storage.objects for update
using (
  bucket_id = 'logos'
  and auth.uid() = owner
)
with check (
  bucket_id = 'logos'
  and auth.uid() = owner
);

-- Create a policy to allow users to delete their own logos
create policy "Users can delete their own logos"
on storage.objects for delete
using (
  bucket_id = 'logos'
  and auth.uid() = owner
);
