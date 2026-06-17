# Fresh Valley — asset pipeline
# Resizes/compresses the 30 product PNGs (1080x1080) to web JPEGs and copies the logo.
Add-Type -AssemblyName System.Drawing

$srcProducts = "C:\Users\tarek\OneDrive\Desktop\New folder (5)\المنتجات"
$srcLogo     = "C:\Users\tarek\OneDrive\Desktop\New folder (5)\logo\0.png"
$outRoot     = "C:\Users\tarek\OneDrive\Desktop\New folder (7)\fresh-valley\assets\img"
$outProducts = Join-Path $outRoot "products"
$null = New-Item -ItemType Directory -Force -Path $outProducts

# Arabic filename (BaseName) -> english slug
$map = @{
  "انانس"            = "pineapple"
  "باذنجان ابيض"     = "white-eggplant"
  "باذنجان اسود"     = "eggplant"
  "برتقال"           = "orange"
  "بصل"              = "onion"
  "بطاطس_"           = "potato"
  "بطيخة"            = "watermelon"
  "تفاح احمر"        = "red-apple"
  "تفاح اخضر"        = "green-apple"
  "تفاح اصفر"        = "golden-apple"
  "تمر"              = "medjool-dates"
  "ثوم"              = "garlic"
  "جزر"              = "carrot"
  "خوخ"              = "peach"
  "خيار"             = "cucumber"
  "طماطم"            = "tomato"
  "عنب احمر"         = "red-grapes"
  "عنب اخضر"         = "green-grapes"
  "فراولة"           = "strawberry"
  "فلفل احمر"        = "red-pepper"
  "فلفل اخضر"        = "green-pepper"
  "فلفل اصفر"        = "yellow-pepper"
  "قرنابيط"          = "cauliflower"
  "كانتالوب"         = "cantaloupe"
  "كريز"             = "cherry"
  "ليمون"            = "lemon"
  "مانجا"            = "mango"
  "مكس تفاح"         = "apple-medley"
  "مكس فلفل الوان"   = "pepper-medley"
  "موز"              = "banana"
}

# JPEG encoder @ quality 86
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]86)

$target = 1000
$matched = 0
$unmatched = @()

Get-ChildItem $srcProducts -Filter *.png | ForEach-Object {
  $slug = $map[$_.BaseName]
  if (-not $slug) { $unmatched += $_.BaseName; return }
  $matched++

  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $bmp = New-Object System.Drawing.Bitmap($target, $target)
  $bmp.SetResolution(72,72)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $target, $target)
  $outPath = Join-Path $outProducts ("{0}.jpg" -f $slug)
  $bmp.Save($outPath, $jpegCodec, $ep)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

# Copy logo as-is (transparent PNG wordmark)
Copy-Item $srcLogo (Join-Path $outRoot "logo.png") -Force

Write-Output "Matched: $matched / 30"
if ($unmatched.Count -gt 0) { Write-Output ("UNMATCHED: " + ($unmatched -join ", ")) }
Write-Output "--- Output sizes (KB) ---"
Get-ChildItem $outProducts -Filter *.jpg | Sort-Object Name | ForEach-Object {
  "{0,-18} {1} KB" -f $_.Name, [int]($_.Length/1KB)
}
$total = (Get-ChildItem $outProducts -Filter *.jpg | Measure-Object Length -Sum).Sum
Write-Output ("TOTAL products: {0} MB" -f [math]::Round($total/1MB,2))
