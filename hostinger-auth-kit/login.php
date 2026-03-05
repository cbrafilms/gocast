<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(405, ['detail' => 'Method Not Allowed']);
}

$in = get_json_input();
$email = mb_strtolower(trim((string)($in['email'] ?? '')));
$password = (string)($in['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
  json_response(401, ['detail' => 'Email o contraseña incorrectos']);
}

try {
  $pdo = db();
  $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL");
  $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS reel_url VARCHAR(500) NULL");
  $q = $pdo->prepare('SELECT id, nombre, email, password_hash, tipo_usuario, perfil_completo, activo, created_at, logo_url, reel_url FROM users WHERE email = ? LIMIT 1');
  $q->execute([$email]);
  $u = $q->fetch();

  if (!$u || !password_verify($password, $u['password_hash'])) {
    json_response(401, ['detail' => 'Email o contraseña incorrectos']);
  }

  if (!(int)$u['activo']) {
    json_response(403, ['detail' => 'Usuario inactivo']);
  }

  $token = create_jwt(['sub' => (string)$u['id']]);

  json_response(200, [
    'token' => $token,
    'user' => [
      'id' => (string)$u['id'],
      'nombre' => $u['nombre'],
      'email' => $u['email'],
      'tipo_usuario' => $u['tipo_usuario'],
      'perfil_completo' => (bool)$u['perfil_completo'],
      'activo' => (bool)$u['activo'],
      'fecha_registro' => $u['created_at'],
      'logo_url' => $u['logo_url'] ?? null,
      'reel_url' => $u['reel_url'] ?? null,
    ]
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') {
    json_response(500, ['detail' => $e->getMessage()]);
  }
  json_response(500, ['detail' => 'Error al iniciar sesión']);
}
