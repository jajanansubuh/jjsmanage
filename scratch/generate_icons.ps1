Add-Type -AssemblyName System.Drawing

$sourcePath = "public/jjslogo.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image public/jjslogo.png not found!"
    exit 1
}

$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image {
    param(
        [System.Drawing.Image]$img,
        [int]$width,
        [int]$height,
        [string]$destPath,
        [bool]$maskable = $false
    )
    Write-Host "Generating: $destPath ($width x $height)"
    $dest = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($maskable) {
        # Scale to 80% for PWA maskable safe zone
        $newW = [int]($width * 0.8)
        $newH = [int]($height * 0.8)
        $x = [int](($width - $newW) / 2)
        $y = [int](($height - $newH) / 2)
        $g.DrawImage($img, $x, $y, $newW, $newH)
    } else {
        $g.DrawImage($img, 0, 0, $width, $height)
    }

    $g.Dispose()
    
    # Create directory if it doesn't exist
    $dir = [System.IO.Path]::GetDirectoryName($destPath)
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
}

# 1. Generate PNG sizes
Resize-Image $sourceImage 192 192 "public/icon-192x192.png"
Resize-Image $sourceImage 512 512 "public/icon-512x512.png"
Resize-Image $sourceImage 512 512 "public/maskable-icon.png" -maskable $true
Resize-Image $sourceImage 180 180 "public/apple-touch-icon.png"
Resize-Image $sourceImage 32 32 "public/favicon-32x32.png"
Resize-Image $sourceImage 16 16 "public/favicon-16x16.png"

# Overwrite existing project assets
Resize-Image $sourceImage 192 192 "public/icon-192.png"
Resize-Image $sourceImage 512 512 "public/icon-512.png"
Resize-Image $sourceImage 500 500 "public/logojjsmanage.png"
Resize-Image $sourceImage 512 512 "src/app/icon.png"
Resize-Image $sourceImage 180 180 "src/app/apple-icon.png"

# 2. Generate multi-resolution favicon.ico
Write-Host "Generating: public/favicon.ico (multi-resolution)"
$sizes = @(16, 32, 48)
$pngStreams = @()
$pngBytes = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($sourceImage, 0, 0, $size, $size)
    $g.Dispose()
    
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    $bytes = $ms.ToArray()
    $pngBytes += ,$bytes
    $pngStreams += $ms
}

$fs = New-Object System.IO.FileStream "public/favicon.ico", Create, Write
$bw = New-Object System.IO.BinaryWriter $fs

# ICO Header (6 bytes)
$bw.Write([uint16]0)      # Reserved
$bw.Write([uint16]1)      # Type: Icon
$bw.Write([uint16]$sizes.Count) # Image Count

$currentOffset = 6 + ($sizes.Count * 16)

# Write Directory Entries (16 bytes per image)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $size = $sizes[$i]
    $bytes = $pngBytes[$i]
    
    $bw.Write([byte]$size)      # Width (16, 32, 48)
    $bw.Write([byte]$size)      # Height (16, 32, 48)
    $bw.Write([byte]0)          # Color count (0 for >= 256 colors)
    $bw.Write([byte]0)          # Reserved
    $bw.Write([uint16]1)        # Color planes (1)
    $bw.Write([uint16]32)       # Bits per pixel (32)
    $bw.Write([uint32]$bytes.Length) # Image data size
    $bw.Write([uint32]$currentOffset) # Offset of image data
    
    $currentOffset += $bytes.Length
}

# Write raw PNG bytes
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $bytes = $pngBytes[$i]
    $bw.Write($bytes, 0, $bytes.Length)
    $pngStreams[$i].Close()
}

$bw.Close()
$fs.Close()

$sourceImage.Dispose()
Write-Host "All assets generated successfully!"
