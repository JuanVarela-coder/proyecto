<#
.SYNOPSIS
    Generates a synthetic 15-second anime test video and transcodes it to HLS for local streaming.
#>
param (
    [string]$OutputDir = "./videos/sample"
)

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$rawVideo = "$OutputDir/test_source.mp4"

Write-Host "1. Generating test source MP4 (1080p, 15 seconds)..." -ForegroundColor Cyan
$genArgs = @(
    "-y",
    "-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=30",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
    "-t", "15",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    $rawVideo
)

Start-Process -FilePath "ffmpeg" -ArgumentList $genArgs -NoNewWindow -Wait

Write-Host "2. Transcoding test video to HLS..." -ForegroundColor Cyan
& "$PSScriptRoot/transcode-hls.ps1" -InputFile $rawVideo -OutputDir $OutputDir
