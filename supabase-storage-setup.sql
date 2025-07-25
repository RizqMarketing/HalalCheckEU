-- HalalCheck AI - Storage Buckets Configuration
-- Run this in your Supabase SQL editor after creating the project

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('halalcheck-files', 'halalcheck-files', false, 52428800, ARRAY[
        'text/plain',
        'text/csv',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/zip',
        'application/x-rar-compressed'
    ]),
    ('halalcheck-reports', 'halalcheck-reports', false, 10485760, ARRAY[
        'application/pdf'
    ]),
    ('halalcheck-avatars', 'halalcheck-avatars', true, 2097152, ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp'
    ])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for halalcheck-files (private user files)
CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'halalcheck-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'halalcheck-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'halalcheck-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'halalcheck-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for halalcheck-reports (private PDF reports)
CREATE POLICY "Users can upload their own reports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'halalcheck-reports' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own reports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'halalcheck-reports' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own reports" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'halalcheck-reports' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for halalcheck-avatars (public profile images)
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'halalcheck-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'halalcheck-avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'halalcheck-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'halalcheck-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );