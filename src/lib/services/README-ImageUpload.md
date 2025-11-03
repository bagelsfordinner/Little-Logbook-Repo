# 🖼️ Industry-Standard Image Upload Service

A comprehensive, production-ready image upload pipeline following 2025 best practices for Next.js applications with TypeScript and Supabase.

## 🎯 Features

- **Multiple Upload Strategies**: Supabase Storage with RLS + Base64 fallback
- **Security First**: File validation, type checking, size limits, path traversal protection
- **Robust Error Handling**: Detailed logging and graceful fallbacks
- **TypeScript Strict**: Full type safety with comprehensive interfaces
- **Performance Optimized**: Smart compression and strategy selection
- **Reusable**: Abstract service for Hero, Gallery, Profile, and other uploads
- **Future-Proof**: Extensible architecture for CDN integration

## 🚀 Quick Start

### Basic Usage

```typescript
import { uploadImageToLogbook } from '@/app/actions/imageUpload'

// Upload hero image
const result = await uploadImageToLogbook(
  'my-logbook-slug',
  'home',
  'hero.image',
  file,
  'hero'
)

if (result.success) {
  console.log('Image uploaded:', result.url)
} else {
  console.error('Upload failed:', result.error)
}
```

### Advanced Usage

```typescript
import { uploadImage, getUploadOptionsFor } from '@/lib/services/imageUpload'

// Custom upload with specific options
const options = {
  ...getUploadOptionsFor.gallery(),
  maxSizeBytes: 20 * 1024 * 1024, // 20MB
  strategy: 'supabase' as const
}

const result = await uploadImage(file, options)
```

## 📋 Upload Types & Configurations

### Hero Images
- **Max Size**: 2MB
- **Strategy**: Base64 (reliable)
- **Folder**: `hero-images/`
- **Use Case**: Header banners, main visuals

### Gallery Images  
- **Max Size**: 10MB
- **Strategy**: Supabase Storage (scalable)
- **Folder**: `gallery/`
- **Use Case**: Photo galleries, albums

### Profile Images
- **Max Size**: 1MB
- **Strategy**: Base64 (fast)
- **Folder**: `profiles/`
- **Use Case**: User avatars, profile pictures

## 🔧 API Reference

### Core Functions

#### `uploadImage(file: File, options?: ImageUploadOptions)`
Main upload function with smart strategy selection.

#### `uploadImageToLogbook(logbookSlug, pageType, contentPath, file, uploadType)`
Complete workflow: upload + update logbook content.

#### `validateImageFile(file: File, options?: ImageUploadOptions)`
Standalone validation for pre-upload checks.

### Configuration Options

```typescript
interface ImageUploadOptions {
  bucket?: string              // Supabase bucket name
  folder?: string             // Upload folder path
  maxSizeBytes?: number       // File size limit
  allowedTypes?: string[]     // MIME types allowed
  compressionQuality?: number // 0.0 - 1.0
  enableRLS?: boolean         // Enable Row Level Security
  strategy?: 'supabase' | 'base64' | 'external'
}
```

### Upload Strategies

#### 1. Supabase Storage (Recommended for Production)
- ✅ Scalable cloud storage
- ✅ CDN delivery
- ✅ Automatic optimization
- ❌ Requires RLS setup
- ❌ More complex error handling

#### 2. Base64 (Reliable Fallback)
- ✅ No external dependencies
- ✅ Bypasses RLS issues
- ✅ Immediate availability
- ❌ Larger database storage
- ❌ Not suitable for large files

#### 3. External CDN (Future Enhancement)
- 🔄 Available for future implementation
- ✅ Best performance
- ✅ Global distribution
- ❌ Requires additional service

## 🛡️ Security Features

### File Validation
- MIME type checking
- File size limits
- Extension validation
- Path traversal protection

### Access Control
- User authentication required
- Role-based permissions
- Supabase RLS integration
- Secure path generation

### Error Handling
- Graceful degradation
- Detailed error logging
- Strategy fallbacks
- User-friendly messages

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Component  │───▶│  Server Action   │───▶│  Upload Service │
│   (Editable)    │    │ (imageUpload.ts) │    │ (imageUpload.ts)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       ▼                                 ▼                                 ▼
            ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
            │ Supabase Storage│              │ Base64 Strategy │              │ External CDN    │
            │   (Primary)     │              │   (Fallback)    │              │   (Future)      │
            └─────────────────┘              └─────────────────┘              └─────────────────┘
```

## 🔍 Debugging & Logging

The service includes comprehensive logging with emoji indicators:

- 🎯 **Entry Points**: Function calls and parameters
- 🔍 **Validation**: File type, size, security checks  
- 📦 **Processing**: Base64 conversion, compression
- ☁️ **Storage**: Supabase upload attempts
- 🎉 **Success**: Successful operations
- ❌ **Errors**: Failed operations with details
- 💥 **Exceptions**: Unexpected errors

Enable console logging in development to see detailed upload flow.

## 🚀 Production Setup

### 1. Supabase Storage Configuration

Create RLS policies for the `storage.objects` table:

```sql
-- Allow authenticated users to upload to their folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Allow authenticated access"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Next.js Configuration

Increase Server Action body size limit:

```typescript
// next.config.ts
experimental: {
  serverActions: {
    bodySizeLimit: '10mb'
  }
}
```

## 🔄 Migration Guide

### From Old Upload System

1. Replace `uploadAndUpdateContent` calls:
```typescript
// Old
const result = await uploadAndUpdateContent(slug, type, path, file)

// New  
const result = await uploadImageToLogbook(slug, type, path, file, 'hero')
```

2. Update error handling:
```typescript
// Old
if (result.success && result.data?.url) { ... }

// New
if (result.success && result.url) { ... }
```

3. Use type-specific configurations:
```typescript
// Gallery uploads
await uploadImageToLogbook(slug, type, path, file, 'gallery')

// Profile uploads  
await uploadImageToLogbook(slug, type, path, file, 'profile')
```

## 🤝 Contributing

To extend the upload service:

1. Add new upload strategies in `uploadImage.ts`
2. Create strategy-specific functions
3. Update the smart upload fallback chain
4. Add comprehensive logging
5. Update TypeScript types
6. Document the new strategy

## 📈 Performance Monitoring

Monitor these metrics in production:

- Upload success rate by strategy
- Average upload time
- File size distribution  
- Error frequency and types
- Fallback strategy usage

## 🔮 Future Enhancements

- [ ] Client-side image compression
- [ ] Progress bars for large uploads
- [ ] Drag & drop interface
- [ ] Image editing/cropping
- [ ] CDN integration (AWS S3, Cloudinary)
- [ ] Automatic image optimization
- [ ] Background/batch uploads
- [ ] Upload resumption for large files

---

This image upload service provides a production-ready foundation that can scale from small projects to enterprise applications while maintaining security, performance, and developer experience.