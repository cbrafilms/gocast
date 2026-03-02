<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  json_response(405, ['detail' => 'Method Not Allowed']);
}

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
  json_response(401, ['detail' => 'Token inválido']);
}

$payload = verify_jwt(trim($m[1]));
if (!$payload || empty($payload['sub'])) {
  json_response(401, ['detail' => 'Token inválido']);
}

try {
  $pdo = db();
  $q = $pdo->prepare('SELECT id, nombre, email, tipo_usuario, perfil_completo, activo FROM users WHERE id = ? LIMIT 1');
  $q->execute([(int)$payload['sub']]);
  $u = $q->fetch();

  if (!$u) json_response(401, ['detail' => 'Usuario no encontrado']);

  json_response(200, [
    'id' => (string)$u['id'],
    'nombre' => $u['nombre'],
    'email' => $u['email'],
    'tipo_usuario' => $u['tipo_usuario'],
    'perfil_completo' => (bool)$u['perfil_completo'],
    'activo' => (bool)$u['activo'],
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') {
    json_response(500, ['detail' => $e->getMessage()]);
  }
  json_response(500, ['detail' => 'No se pudo validar el token']);
}
