$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "assets\logo1.png"
$outDir = Join-Path $root "app\icons"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

Add-Type -AssemblyName System.Drawing

function Save-Icon($size, $fileName) {
    $srcImg = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(255, 5, 5, 5))
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $ratio = [Math]::Min($size / $srcImg.Width, $size / $srcImg.Height)
    $w = [int]($srcImg.Width * $ratio)
    $h = [int]($srcImg.Height * $ratio)
    $x = [int](($size - $w) / 2)
    $y = [int](($size - $h) / 2)
    $g.DrawImage($srcImg, $x, $y, $w, $h)
    $g.Dispose()
    $srcImg.Dispose()
    $path = Join-Path $outDir $fileName
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "OK $fileName"
}

Save-Icon 192 "icon-192.png"
Save-Icon 512 "icon-512.png"
Save-Icon 180 "apple-touch-icon.png"
