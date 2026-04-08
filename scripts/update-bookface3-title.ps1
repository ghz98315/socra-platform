Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path $PSScriptRoot "..\book\bookface3.png"
$tempPath = Join-Path $PSScriptRoot "..\book\bookface3.tmp.png"

function New-Brush([int]$a, [int]$r, [int]$g, [int]$b) {
  return [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function New-PenColor([int]$a, [int]$r, [int]$g, [int]$b, [float]$width) {
  return [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($a, $r, $g, $b), $width)
}

function From-CodePoints([int[]]$codePoints) {
  return -join ($codePoints | ForEach-Object { [char]$_ })
}

$eyebrowText = From-CodePoints @(30005,23376,20070,39318,21457)
$mainPrefix = From-CodePoints @(20174)
$mainAccent = From-CodePoints @(38169,35823)
$mainSuffix = From-CodePoints @(24320,22987)
$subtitleText = From-CodePoints @(19968,22871,30495,27491,33021,38381,29615,30340)
$subtitleStrongText = From-CodePoints @(23398,20064,31995,32479)
$blurbText = From-CodePoints @(19981,26159,25552,20998,25216,24039,65292,19981,26159,31649,29702,24037,20855,65292,32780,26159,19968,31181,38754,23545,38169,35823,30340,31995,32479,24605,32500,26041,24335,12290)

$source = [System.Drawing.Bitmap]::FromFile($inputPath)
$image = [System.Drawing.Bitmap]::new($source.Width, $source.Height)
$g = [System.Drawing.Graphics]::FromImage($image)
$g.DrawImage($source, 0, 0, $source.Width, $source.Height)
$source.Dispose()

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$format = [System.Drawing.StringFormat]::GenericTypographic
$format.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip

$panelBrush = New-Brush 255 255 255 255
$eyebrowBrush = New-Brush 255 151 113 73
$mainBrush = New-Brush 255 22 26 35
$accentBrush = New-Brush 255 232 96 10
$subtitleBrush = New-Brush 255 66 73 85
$ruleBrush = New-Brush 255 241 224 211
$rulePen = New-PenColor 255 232 96 10 2.0
$blurbBrush = New-Brush 255 116 123 133
$blurbLineBrush = New-Brush 255 244 212 188

$eyebrowFont = [System.Drawing.Font]::new("Microsoft YaHei UI", 14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$mainFont = [System.Drawing.Font]::new("SimSun", 47, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subtitleFont = [System.Drawing.Font]::new("SimSun", 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subtitleStrongFont = [System.Drawing.Font]::new("SimSun", 33, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$blurbFont = [System.Drawing.Font]::new("Microsoft YaHei UI", 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$panelX = 338
$panelY = 0
$panelWidth = 573
$panelHeight = 356
$contentX = 382.0

$g.FillRectangle($panelBrush, $panelX, $panelY, $panelWidth, $panelHeight)

$g.DrawString($eyebrowText, $eyebrowFont, $eyebrowBrush, $contentX, 34.0, $format)

$mainY = 62.0
$prefixWidth = $g.MeasureString($mainPrefix, $mainFont, 1000, $format).Width
$accentWidth = $g.MeasureString($mainAccent, $mainFont, 1000, $format).Width

$g.DrawString($mainPrefix, $mainFont, $mainBrush, $contentX, $mainY, $format)
$g.DrawString($mainAccent, $mainFont, $accentBrush, [float]($contentX + $prefixWidth), $mainY, $format)
$g.DrawString($mainSuffix, $mainFont, $mainBrush, [float]($contentX + $prefixWidth + $accentWidth), $mainY, $format)

$ruleRect = [System.Drawing.RectangleF]::new([float]($contentX + 44.0), 136.0, 58.0, 3.0)
$g.FillRectangle($ruleBrush, $ruleRect)
$g.DrawLine($rulePen, [float]($contentX + 44.0), 137.5, [float]($contentX + 102.0), 137.5)

$g.DrawString($subtitleText, $subtitleFont, $subtitleBrush, [float]($contentX + 4.0), 158.0, $format)
$g.DrawString($subtitleStrongText, $subtitleStrongFont, $subtitleBrush, [float]($contentX + 42.0), 191.0, $format)

$g.FillRectangle($blurbLineBrush, $contentX, 274.0, 2.0, 66.0)
$blurbRect = [System.Drawing.RectangleF]::new([float]($contentX + 16.0), 269.0, 378.0, 92.0)
$g.DrawString($blurbText, $blurbFont, $blurbBrush, $blurbRect)

$image.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)

$blurbFont.Dispose()
$subtitleStrongFont.Dispose()
$subtitleFont.Dispose()
$mainFont.Dispose()
$eyebrowFont.Dispose()
$blurbLineBrush.Dispose()
$blurbBrush.Dispose()
$rulePen.Dispose()
$ruleBrush.Dispose()
$subtitleBrush.Dispose()
$accentBrush.Dispose()
$mainBrush.Dispose()
$eyebrowBrush.Dispose()
$panelBrush.Dispose()
$format.Dispose()
$g.Dispose()
$image.Dispose()

Move-Item -LiteralPath $tempPath -Destination $inputPath -Force

Write-Output "Updated $inputPath"
