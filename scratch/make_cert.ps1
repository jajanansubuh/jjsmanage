try {
    # Use legacy CSP provider for compatibility with Windows PowerShell 5.1 / .NET Framework
    $cert = New-SelfSignedCertificate `
        -Subject "CN=localhost" `
        -TextExtension @("2.5.29.17={text}DNS=localhost&IPAddress=192.168.100.11") `
        -CertStoreLocation "cert:\CurrentUser\My" `
        -KeyExportPolicy Exportable `
        -Provider "Microsoft Enhanced RSA and AES Cryptographic Provider" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -NotAfter (Get-Date).AddYears(2)
    Write-Host "Created certificate with SANs: DNS=localhost, IP=192.168.100.11"

    if (-not (Test-Path "certificates")) {
        New-Item -ItemType Directory -Path "certificates" | Out-Null
    }

    # Export public certificate as PEM
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $certBase64 = [System.Convert]::ToBase64String($certBytes, "InsertLineBreaks")
    $certPem = "-----BEGIN CERTIFICATE-----`n$certBase64`n-----END CERTIFICATE-----"
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) "certificates\localhost.pem"), $certPem)
    Write-Host "Exported certificate PEM"
    
    # Export private key - with legacy CSP, .PrivateKey works
    $rsa = $cert.PrivateKey
    $cspBlob = $rsa.ExportCspBlob($true)
    
    # Convert CSP blob to RSA parameters, then to PKCS#1 DER manually
    $rsaParams = $rsa.ExportParameters($true)
    
    # Build RSA PKCS#1 private key using a temporary RSACryptoServiceProvider
    $tmpRsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider
    $tmpRsa.ImportParameters($rsaParams)
    
    # ExportCspBlob gives us the key blob, we need to convert to PKCS1
    # Use bouncy castle-like approach: export via PFX and openssl, or manual DER encoding
    
    # Simpler approach: export PFX and use certutil to extract PEM
    $pfxPath = Join-Path (Get-Location) "certificates\temp.pfx"
    $pfxPassword = ConvertTo-SecureString -String "temppass" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPassword | Out-Null
    
    # Use certutil to dump the key
    $pemKeyPath = Join-Path (Get-Location) "certificates\localhost-key.pem"
    
    # Try openssl first
    $hasOpenssl = Get-Command openssl -ErrorAction SilentlyContinue
    if ($hasOpenssl) {
        & openssl pkcs12 -in $pfxPath -nocerts -nodes -passin pass:temppass 2>$null | Out-File -FilePath $pemKeyPath -Encoding ascii
        Write-Host "Exported private key using openssl"
    } else {
        # Manual RSA PKCS#1 DER encoding from RSA parameters
        function ConvertTo-DerInteger($bytes) {
            # If high bit set, prepend 0x00
            if ($bytes[0] -band 0x80) {
                $bytes = @([byte]0x00) + $bytes
            }
            $len = $bytes.Length
            $result = @([byte]0x02) # INTEGER tag
            $result += (Get-DerLength $len)
            $result += $bytes
            return [byte[]]$result
        }
        
        function Get-DerLength($length) {
            if ($length -lt 128) {
                return @([byte]$length)
            } elseif ($length -lt 256) {
                return @([byte]0x81, [byte]$length)
            } else {
                return @([byte]0x82, [byte](($length -shr 8) -band 0xFF), [byte]($length -band 0xFF))
            }
        }
        
        # Build the SEQUENCE content
        $version = ConvertTo-DerInteger @([byte]0x00)
        $modulus = ConvertTo-DerInteger $rsaParams.Modulus
        $pubExp = ConvertTo-DerInteger $rsaParams.Exponent
        $privExp = ConvertTo-DerInteger $rsaParams.D
        $p = ConvertTo-DerInteger $rsaParams.P
        $q = ConvertTo-DerInteger $rsaParams.Q
        $dp = ConvertTo-DerInteger $rsaParams.DP
        $dq = ConvertTo-DerInteger $rsaParams.DQ
        $iq = ConvertTo-DerInteger $rsaParams.InverseQ
        
        $seqContent = $version + $modulus + $pubExp + $privExp + $p + $q + $dp + $dq + $iq
        $seqLen = Get-DerLength $seqContent.Length
        $derKey = @([byte]0x30) + $seqLen + $seqContent
        
        $keyBase64 = [System.Convert]::ToBase64String([byte[]]$derKey, "InsertLineBreaks")
        $keyPem = "-----BEGIN RSA PRIVATE KEY-----`n$keyBase64`n-----END RSA PRIVATE KEY-----"
        [System.IO.File]::WriteAllText($pemKeyPath, $keyPem)
        Write-Host "Exported private key using manual DER encoding"
    }
    
    # Cleanup temp PFX
    Remove-Item $pfxPath -Force -ErrorAction SilentlyContinue
    
    Write-Host "Saved certificates/localhost.pem and certificates/localhost-key.pem successfully!"
} catch {
    Write-Error $_
}
