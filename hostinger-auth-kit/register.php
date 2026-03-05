<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(405, ['detail' => 'Method Not Allowed']);
}

$in = get_json_input();
$nombre = trim((string)($in['nombre'] ?? ''));
$email = mb_strtolower(trim((string)($in['email'] ?? '')));
$password = (string)($in['password'] ?? '');
$tipo = (string)($in['tipo_usuario'] ?? '');
$acepta = (bool)($in['acepta_terminos'] ?? false);
$logoUrlIn = trim((string)($in['logo_url'] ?? ''));
$reelUrl = trim((string)($in['reel_url'] ?? ''));
$logoDataUrl = trim((string)($in['logo_data_url'] ?? ''));

if (!$acepta) json_response(400, ['detail' => 'Debes aceptar los términos y condiciones para registrarte']);
if (!in_array($tipo, ['talento', 'productora'], true)) json_response(400, ['detail' => "Tipo de usuario inválido. Debe ser 'talento' o 'productora'"]);
if ($nombre === '') json_response(400, ['detail' => 'El nombre es requerido']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(400, ['detail' => 'Email inválido']);
if (strlen($password) < 6) json_response(400, ['detail' => 'La contraseña debe tener al menos 6 caracteres']);

function save_logo_data_url(string $dataUrl): ?string {
  if ($dataUrl === '') return null;
  if (!preg_match('#^data:(image/(png|jpeg|jpg|webp));base64,(.+)$#i', $dataUrl, $m)) {
    return null;
  }

  $mime = strtolower($m[1]);
  $ext = 'png';
  if (str_contains($mime, 'jpeg') || str_contains($mime, 'jpg')) $ext = 'jpg';
  if (str_contains($mime, 'webp')) $ext = 'webp';

  $bin = base64_decode($m[3], true);
  if ($bin === false || strlen($bin) > 5 * 1024 * 1024) return null;

  $root = dirname(__DIR__) . '/public_html';
  if (!is_dir($root)) $root = dirname(__DIR__);
  $dir = $root . '/uploads/logos';
  if (!is_dir($dir)) @mkdir($dir, 0775, true);

  $name = bin2hex(random_bytes(16)) . '.' . $ext;
  $path = $dir . '/' . $name;
  if (file_put_contents($path, $bin) === false) return null;

  return 'https://gocast.me/uploads/logos/' . $name;
}

try {
  $pdo = db();

  $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL");
  $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS reel_url VARCHAR(500) NULL");

  $q = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
  $q->execute([$email]);
  if ($q->fetch()) {
    json_response(400, ['detail' => 'Este email ya está registrado']);
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $logoUrl = $logoUrlIn;
  if ($tipo === 'productora' && $logoDataUrl !== '') {
    $saved = save_logo_data_url($logoDataUrl);
    if ($saved) $logoUrl = $saved;
  }

  $ins = $pdo->prepare('INSERT INTO users (nombre, email, password_hash, tipo_usuario, logo_url, reel_url) VALUES (?, ?, ?, ?, ?, ?)');
  $ins->execute([$nombre, $email, $hash, $tipo, $logoUrl !== '' ? $logoUrl : null, $reelUrl !== '' ? $reelUrl : null]);

  $id = (int)$pdo->lastInsertId();
  json_response(200, [
    'id' => (string)$id,
    'nombre' => $nombre,
    'email' => $email,
    'tipo_usuario' => $tipo,
    'perfil_completo' => false,
    'activo' => true,
    'logo_url' => $logoUrl !== '' ? $logoUrl : null,
    'reel_url' => $reelUrl !== '' ? $reelUrl : null,
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') {
    json_response(500, ['detail' => $e->getMessage()]);
  }
  json_response(500, ['detail' => 'Error al crear el usuario']);
}
