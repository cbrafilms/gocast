<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(405, ['detail' => 'Method Not Allowed']);
}

// Auth opcional (si llega Bearer y JWT_SECRET está configurado, lo valida)
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) {
    json_response(401, ['detail' => 'Token inválido']);
  }
}

if (!isset($_FILES['file'])) {
  json_response(400, ['detail' => 'Archivo no enviado (campo: file)']);
}

$file = $_FILES['file'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  json_response(400, ['detail' => 'Error de carga de archivo']);
}

$kind = strtolower(trim((string)($_POST['kind'] ?? 'foto'))); // foto|video
if (!in_array($kind, ['foto', 'video'], true)) {
  json_response(400, ['detail' => 'kind inválido (foto|video)']);
}

$maxPhoto = 5 * 1024 * 1024;   // 5MB
$maxVideo = 80 * 1024 * 1024;  // 80MB
$size = (int)($file['size'] ?? 0);
if ($kind === 'foto' && $size > $maxPhoto) json_response(400, ['detail' => 'Foto excede 5MB']);
if ($kind === 'video' && $size > $maxVideo) json_response(400, ['detail' => 'Video excede 80MB']);

$tmpPath = $file['tmp_name'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($tmpPath) ?: 'application/octet-stream';

$allowedPhoto = [
  'image/jpeg' => 'jpg',
  'image/png' => 'png',
  'image/webp' => 'webp',
];
$allowedVideo = [
  'video/mp4' => 'mp4',
  'video/quicktime' => 'mov',
  'video/webm' => 'webm',
];

$map = $kind === 'foto' ? $allowedPhoto : $allowedVideo;
if (!isset($map[$mime])) {
  json_response(400, ['detail' => 'Tipo de archivo no permitido']);
}

$ext = $map[$mime];
$baseUploadDir = dirname(__DIR__) . '/uploads';
$subDir = $kind === 'foto' ? 'fotos' : 'videos';
$targetDir = $baseUploadDir . '/' . $subDir;

if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true)) {
  json_response(500, ['detail' => 'No se pudo crear directorio de subida']);
}

$filename = bin2hex(random_bytes(16)) . '.' . $ext;
$targetPath = $targetDir . '/' . $filename;

if (!move_uploaded_file($tmpPath, $targetPath)) {
  json_response(500, ['detail' => 'No se pudo guardar el archivo']);
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$url = $scheme . '://' . $host . '/uploads/' . $subDir . '/' . $filename;

json_response(200, [
  'url' => $url,
  'kind' => $kind,
  'mime' => $mime,
  'size' => $size
]);
