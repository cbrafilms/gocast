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
  $q = $pdo->prepare('SELECT id, nombre, email, password_hash, tipo_usuario, perfil_completo, activo FROM users WHERE email = ? LIMIT 1');
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
    ]
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') {
    json_response(500, ['detail' => $e->getMessage()]);
  }
  json_response(500, ['detail' => 'Error al iniciar sesión']);
}
