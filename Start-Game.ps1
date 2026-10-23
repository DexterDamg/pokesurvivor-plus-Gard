param([switch]$NoBrowser, [int]$Port=8765)
$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()
$port = $listener.LocalEndpoint.Port
$url = "http://127.0.0.1:$port/"
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json'; '.webmanifest'='application/manifest+json'; '.png'='image/png'; '.webp'='image/webp'; '.gif'='image/gif'; '.jpg'='image/jpeg'; '.ico'='image/x-icon'; '.mp3'='audio/mpeg'; '.ogg'='audio/ogg'; '.ttf'='font/ttf' }
Write-Host "PokeSurvivor Merged is running at $url"
Write-Host 'Keep this window open while playing. Close it to stop the server.'
if (!$NoBrowser) { Start-Process $url }
try {
 while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
   $client.ReceiveTimeout=5000; $client.SendTimeout=10000
   $stream=$client.GetStream()
   $reader=[IO.StreamReader]::new($stream,[Text.Encoding]::ASCII,$false,1024,$true)
   $request=$reader.ReadLine()
   if (!$request) { continue }
   while ($reader.ReadLine()) {}
   $parts=$request.Split(' ')
   if ($parts.Length -lt 2) { continue }
   $method=$parts[0]
   $relative=[Uri]::UnescapeDataString(($parts[1] -split '\?',2)[0]).TrimStart('/')
   if (!$relative) { $relative='index.html' }
   $target=[IO.Path]::GetFullPath([IO.Path]::Combine($gameRoot,$relative))
   $status='200 OK'; $type='application/octet-stream'; $body=[byte[]]@()
   if ($method -notin @('GET','HEAD')) { $status='405 Method Not Allowed' }
   elseif (!$target.StartsWith($gameRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { $status='403 Forbidden' }
   elseif (![IO.File]::Exists($target)) { $status='404 Not Found' }
   else {
    $body=[IO.File]::ReadAllBytes($target)
    $extension=[IO.Path]::GetExtension($target).ToLowerInvariant()
    if ($types.ContainsKey($extension)) { $type=$types[$extension] }
   }
   $header=[Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n")
   $stream.Write($header,0,$header.Length)
   if ($method -eq 'GET' -and $body.Length) { $stream.Write($body,0,$body.Length) }
   $stream.Flush()
  } catch { Write-Verbose $_ } finally { $client.Dispose() }
 }
} finally { $listener.Stop() }
