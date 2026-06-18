Add-Type -AssemblyName System.Drawing
Get-ChildItem public\*.png | ForEach-Object {
    $bmp = [System.Drawing.Image]::FromFile($_.FullName)
    Write-Host "$($_.Name): $($bmp.Width)x$($bmp.Height)"
    $bmp.Dispose()
}
