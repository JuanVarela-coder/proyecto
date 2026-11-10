<#
.SYNOPSIS
    Multi-bitrate HLS Transcoding Pipeline for Platform-X Anime (PowerShell)
.PARAMETER InputFile
    Path to input MP4 video
.PARAMETER OutputDir
    Directory where .m3u8 playlists and .ts chunks will be written
#>
param (
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "./videos/output"
)

if (-not (Test-Path $InputFile)) {
    Write-Error "Input file '$InputFile' does not exist."
    exit 1
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🎬 Transcoding $InputFile to Adaptive HLS (1080p, 720p, 480p)" -ForegroundColor Green
Write-Host "Output: $OutputDir" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$filterComplex = "[0:v]split=3[v1][v2][v3];[v1]scale=w=1920:h=1080[v1out];[v2]scale=w=1280:h=720[v2out];[v3]scale=w=854:h=480[v3out]"

$ffmpegArgs = @(
    "-y",
    "-i", $InputFile,
    "-filter_complex", $filterComplex,
    "-map", "[v1out]", "-c:v:0", "libx264", "-b:v:0", "5000k", "-maxrate:v:0", "5350k", "-bufsize:v:0", "7500k",
    "-map", "[v2out]", "-c:v:1", "libx264", "-b:v:1", "2800k", "-maxrate:v:1", "2996k", "-bufsize:v:1", "4200k",
    "-map", "[v3out]", "-c:v:2", "libx264", "-b:v:2", "1400k", "-maxrate:v:2", "1498k", "-bufsize:v:2", "2100k",
    "-map", "0:a", "-c:a:0", "aac", "-b:a:0", "192k", "-ac", "2",
    "-map", "0:a", "-c:a:1", "aac", "-b:a:1", "128k", "-ac", "2",
    "-map", "0:a", "-c:a:2", "aac", "-b:a:2", "96k", "-ac", "2",
    "-f", "hls",
    "-hls_time", "6",
    "-hls_playlist_type", "vod",
    "-hls_flags", "independent_segments",
    "-hls_segment_type", "mpegts",
    "-hls_segment_filename", "$OutputDir/stream_%v_data%03d.ts",
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", "v:0,a:0 v:1,a:1 v:2,a:2",
    "$OutputDir/stream_%v.m3u8"
)

Start-Process -FilePath "ffmpeg" -ArgumentList $ffmpegArgs -NoNewWindow -Wait

Write-Host "✅ HLS Transcoding Complete! Master playlist at: $OutputDir/master.m3u8" -ForegroundColor Green
