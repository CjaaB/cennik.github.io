# Tworzy mniejsze logo do PDF (szybsze commity, mniejsze pliki)
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "logo1.png"
$dst = Join-Path $PSScriptRoot "logo-pdf.png"

if (-not (Test-Path $src)) {
    Write-Error "Brak logo1.png"
    exit 1
}

Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($src)
$maxW = 220
$scale = $maxW / [double]$img.Width
if ($scale -gt 1) { $scale = 1 }
$w = [int][Math]::Round($img.Width * $scale)
$h = [int][Math]::Round($img.Height * $scale)
if ($w -lt 1 -or $h -lt 1) { Write-Error "Nieprawidlowy rozmiar logo"; exit 1 }
$thumb = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($thumb)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $w, $h)
$g.Dispose()
$img.Dispose()
$thumb.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$thumb.Dispose()
Write-Host "Zapisano: $dst ($w x $h)"
