Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

$width = 1200
$height = 1500
$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new(0, 0)),
  ([System.Drawing.Point]::new(0, $height)),
  ([System.Drawing.Color]::FromArgb(245, 243, 239)),
  ([System.Drawing.Color]::FromArgb(236, 233, 228))
)
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

$shadowBaseX = 188
$shadowBaseY = 96
$shadowW = 706
$shadowH = 1138
for ($i = 24; $i -ge 1; $i--) {
  $alpha = [Math]::Max(4, [int](24 - $i * 0.68))
  $path = New-RoundedRectPath ($shadowBaseX - $i) ($shadowBaseY + 38 - $i * 0.25) ($shadowW + $i * 2) ($shadowH + $i * 2) (34 + $i * 0.25)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alpha, 13, 20, 38))
  $g.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

$spineX = 194
$spineY = 88
$spineW = 46
$spineH = 1138
$spinePath = New-RoundedRectPath $spineX $spineY $spineW $spineH 18
$spineBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new($spineX, $spineY)),
  ([System.Drawing.Point]::new($spineX + $spineW, $spineY)),
  ([System.Drawing.Color]::FromArgb(116, 126, 147)),
  ([System.Drawing.Color]::FromArgb(50, 59, 82))
)
$g.FillPath($spineBrush, $spinePath)
$spinePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(52, 255, 255, 255), 2)
$g.DrawLine($spinePen, $spineX + $spineW - 2, $spineY + 18, $spineX + $spineW - 2, $spineY + $spineH - 18)

$spineFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$spineBrushText = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(68, 255, 255, 255))
$spineFormat = New-Object System.Drawing.StringFormat
$spineFormat.FormatFlags = [System.Drawing.StringFormatFlags]::DirectionVertical
$g.DrawString('SOCRATES PRESS', $spineFont, $spineBrushText, [float]($spineX + 13), [float]($spineY + 54), $spineFormat)

$coverX = 238
$coverY = 74
$coverW = 706
$coverH = 1146
$coverPath = New-RoundedRectPath $coverX $coverY $coverW $coverH 34
$coverBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new($coverX, $coverY)),
  ([System.Drawing.Point]::new($coverX, $coverY + $coverH)),
  ([System.Drawing.Color]::FromArgb(31, 46, 79)),
  ([System.Drawing.Color]::FromArgb(24, 37, 63))
)
$g.FillPath($coverBrush, $coverPath)
$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60, 225, 232, 242), 2)
$g.DrawPath($borderPen, $coverPath)

$g.SetClip($coverPath)

$gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(10, 255, 255, 255), 1)
for ($x = $coverX - 24; $x -lt ($coverX + $coverW + 24); $x += 52) {
  $g.DrawLine($gridPen, $x, $coverY, $x, $coverY + $coverH)
}
for ($y = $coverY - 24; $y -lt ($coverY + $coverH + 24); $y += 52) {
  $g.DrawLine($gridPen, $coverX, $y, $coverX + $coverW, $y)
}

$rightGlow = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new($coverX + $coverW - 90, $coverY)),
  ([System.Drawing.Point]::new($coverX + $coverW, $coverY)),
  ([System.Drawing.Color]::FromArgb(0, 255, 255, 255)),
  ([System.Drawing.Color]::FromArgb(18, 255, 255, 255))
)
$g.FillRectangle($rightGlow, $coverX + $coverW - 96, $coverY, 96, $coverH)

$topGlow = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new($coverX, $coverY)),
  ([System.Drawing.Point]::new($coverX, $coverY + 160)),
  ([System.Drawing.Color]::FromArgb(14, 255, 255, 255)),
  ([System.Drawing.Color]::FromArgb(0, 255, 255, 255))
)
$g.FillRectangle($topGlow, $coverX, $coverY, $coverW, 160)

$tagText = '工程师爸爸亲测版'
$tagFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$tagSize = $g.MeasureString($tagText, $tagFont)
$tagPadX = 26
$tagPadY = 14
$tagW = [int][Math]::Ceiling($tagSize.Width + $tagPadX * 2)
$tagH = [int][Math]::Ceiling($tagSize.Height + $tagPadY * 2)
$tagX = $coverX + 108
$tagY = $coverY + 102
$tagPath = New-RoundedRectPath $tagX $tagY $tagW $tagH 26
$tagFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 232, 96, 10))
$tagPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(178, 232, 96, 10), 2)
$tagBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 214, 188))
$g.FillPath($tagFill, $tagPath)
$g.DrawPath($tagPen, $tagPath)
$g.DrawString($tagText, $tagFont, $tagBrush, [float]($tagX + $tagPadX), [float]($tagY + $tagPadY - 2))

$titleFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 64, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(247, 248, 252))
$accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(242, 139, 69))
$measureFormat = [System.Drawing.StringFormat]::GenericTypographic

$titleX = [float]($coverX + 104)
$titleY = [float]($coverY + 248)

$line1Left = '从'
$line1Accent = '错误'
$line1Right = '开始：'
$w1 = $g.MeasureString($line1Left, $titleFont, 1000, $measureFormat).Width
$w2 = $g.MeasureString($line1Accent, $titleFont, 1000, $measureFormat).Width
$g.DrawString($line1Left, $titleFont, $titleBrush, $titleX, $titleY, $measureFormat)
$g.DrawString($line1Accent, $titleFont, $accentBrush, [float]($titleX + $w1), $titleY, $measureFormat)
$g.DrawString($line1Right, $titleFont, $titleBrush, [float]($titleX + $w1 + $w2), $titleY, $measureFormat)
$g.DrawString('一套真正能闭环的', $titleFont, $titleBrush, $titleX, [float]($titleY + 112), $measureFormat)
$g.DrawString('学习系统', $titleFont, $titleBrush, $titleX, [float]($titleY + 224), $measureFormat)

$dividerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(232, 96, 10))
$g.FillRectangle($dividerBrush, $coverX + 118, $coverY + 642, 96, 4)

$subtitleFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$subtitleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(216, 221, 233))
$subtitleRect = [System.Drawing.RectangleF]::new([float]($coverX + 104), [float]($coverY + 688), 430, 100)
$g.DrawString('用工厂管理逻辑重建孩子的学习方式', $subtitleFont, $subtitleBrush, $subtitleRect)

$footerY = $coverY + 972
$g.FillRectangle($dividerBrush, $coverX + 104, $footerY - 44, 62, 4)

$smallCapsFont = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$smallCapsBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(92, 255, 255, 255))
$g.DrawString('P  D  C  A', $smallCapsFont, $smallCapsBrush, [float]($coverX + 548), [float]($footerY - 64))

$authorFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 32, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$authorBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(249, 249, 252))
$g.DrawString('关博 · 工程爸', $authorFont, $authorBrush, [float]($coverX + 104), [float]$footerY)

$noteFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$noteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(122, 255, 255, 255))
$g.DrawString('公众号「工程爸的AI进化工厂」', $noteFont, $noteBrush, [float]($coverX + 104), [float]($footerY + 62))

$g.ResetClip()

$outputPath = Join-Path $PSScriptRoot '..\book\bookface.png'
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$spineFont.Dispose()
$spineBrushText.Dispose()
$spineFormat.Dispose()
$spineBrush.Dispose()
$spinePen.Dispose()
$spinePath.Dispose()
$gridPen.Dispose()
$rightGlow.Dispose()
$topGlow.Dispose()
$tagFont.Dispose()
$tagFill.Dispose()
$tagPen.Dispose()
$tagBrush.Dispose()
$tagPath.Dispose()
$titleFont.Dispose()
$titleBrush.Dispose()
$accentBrush.Dispose()
$dividerBrush.Dispose()
$subtitleFont.Dispose()
$subtitleBrush.Dispose()
$smallCapsFont.Dispose()
$smallCapsBrush.Dispose()
$authorFont.Dispose()
$authorBrush.Dispose()
$noteFont.Dispose()
$noteBrush.Dispose()
$measureFormat.Dispose()
$coverBrush.Dispose()
$borderPen.Dispose()
$coverPath.Dispose()
$bgBrush.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Output "Generated $outputPath"


