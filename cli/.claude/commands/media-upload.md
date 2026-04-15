# /media-upload - Upload Media to Cloudflare R2

Upload media files to Cloudflare R2 storage with automatic public URL generation and fast S3-compatible uploads.

## Usage

```bash
/media-upload <file_path> [options]
```

## Examples

```bash
# Quick upload with auto content-type
/media-upload /path/to/video.mp4

# Upload with custom filename
/media-upload /path/to/video.mp4 -n my-demo.mov

# Explicit content type
/media-upload /path/to/file.bin -c application/octet-stream

# Quiet mode (no output)
/media-upload /path/to/file.pdf -q

# Verbose mode
/media-upload /path/to/file.pdf -v

# Upload to custom bucket
/media-upload /path/to/file.pdf my-bucket
```

## Options

- `-n, --name NAME` - Custom filename for uploaded object
- `-c, --content-type TYPE` - Explicit MIME type (auto-detected if omitted)
- `-q, --quiet` - Suppress progress output (good for scripts)
- `-v, --verbose` - Detailed upload information
- `-h, --help` - Show help message

## Features

✅ **Fast Upload** - 15-43 MiB/s via AWS CLI S3-compatible protocol
✅ **Auto Detection** - Automatically detects content-type from file extension
✅ **Progress Tracking** - Real-time transfer rates and completion percentage
✅ **Public URLs** - Automatic generation of `https://media.one.ie/filename`
✅ **Custom Names** - Upload with different filename than source
✅ **Multiple Buckets** - Support for any R2 bucket (default: one-platform-media)
✅ **Error Handling** - Clear error messages and validation

## Supported File Types

| Type | Extensions |
|------|-----------|
| Video | `.mp4`, `.mov`, `.webm` |
| Image | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` |
| Document | `.pdf`, `.zip`, `.tar.gz` |
| Other | Auto-detect or specify with `-c` |

## Output

Successful upload shows:

```
═══════════════════════════════════════════════════════════
Cloudflare R2 Media Upload
═══════════════════════════════════════════════════════════
Source:        /path/to/file.mp4
Size:          149.60 MiB
Destination:   s3://one-platform-media/ONE-demo.mp4
Content-Type:  video/mp4
Endpoint:      https://627e0c7ccbe735a4a7cabf91e377bbad.r2.cloudflarestorage.com
───────────────────────────────────────────────────────────
Completed 1.0 MiB/149.6 MiB (2.9 MiB/s) with 1 file(s) remaining
...
✓ Upload successful!
───────────────────────────────────────────────────────────
Public URL:    https://media.one.ie/ONE-demo.mp4
Direct URL:    https://627e0c7ccbe735a4a7cabf91e377bbad.r2.cloudflarestorage.com/one-platform-media/ONE-demo.mp4
═══════════════════════════════════════════════════════════
(Public URL copied to clipboard)
```

## Requirements

1. **AWS CLI** - `brew install awscli`
2. **R2 Credentials** in `.env`:
   ```
   CLOUDFLARE_R2_S3_ACCESS_KEY_ID=...
   CLOUDFLARE_R2_S3_SECRET_KEY=...
   CLOUDFLARE_ACCOUNT_ID=...
   CLOUDFLARE_S3_API=...
   ```
3. **bc** - `brew install bc`

## URLs

After upload, access your file:

**Public Domain:**
```
https://media.one.ie/filename
```

**R2 Direct (backup):**
```
https://627e0c7ccbe735a4a7cabf91e377bbad.r2.cloudflarestorage.com/one-platform-media/filename
```

## Script Location

The underlying script is at:
```
/Users/toc/Server/ONE/scripts/media-uploads.sh
```

## Documentation

Full documentation available at:
```
/Users/toc/Server/ONE/media-upload.md
```

## Performance

- **Speed**: 15-43 MiB/s (varies with file size)
- **Max File Size**: 5 TiB
- **Bucket**: Unlimited objects

## Troubleshooting

**"aws: command not found"**
```bash
brew install awscli
```

**"Error: .env file not found"**
Check that `.env` exists in project root with R2 credentials

**Connection issues**
- Verify internet connection
- Check R2 API endpoint in `.env`
- Verify AWS credentials are correct

## Examples

### Upload demo video

```bash
/media-upload demo.mp4
# Returns: https://media.one.ie/demo.mp4
```

### Upload with custom name

```bash
/media-upload video.mp4 -n product-demo.mov
# Returns: https://media.one.ie/product-demo.mov
```

### Batch upload (script)

```bash
for file in /path/to/media/*; do
  /media-upload "$file" -q
done
```

### Upload large file (40+ MiB)

```bash
/media-upload large-file.zip
# Automatically uses multipart upload with retry logic
```

## See Also

- `media-upload.md` - Complete documentation
- `/scripts/media-uploads.sh` - Script source code
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

---

**Command Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Production Ready
