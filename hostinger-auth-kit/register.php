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

if (!$acepta) json_response(400, ['detail' => 'Debes aceptar los términos y condiciones para registrarte']);
if (!in_array($tipo, ['talento', 'productora'], true)) json_response(400, ['detail' => "Tipo de usuario inválido. Debe ser 'talento' o 'productora'"]);
if ($nombre === '') json_response(400, ['detail' => 'El nombre es requerido']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(400, ['detail' => 'Email inválido']);
if (strlen($password) < 6) json_response(400, ['detail' => 'La contraseña debe tener al menos 6 caracteres']);

try {
  $pdo = db();

  $q = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
  $q->execute([$email]);
  if ($q->fetch()) {
    json_response(400, ['detail' => 'Este email ya está registrado']);
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $ins = $pdo->prepare('INSERT INTO users (nombre, email, password_hash, tipo_usuario) VALUES (?, ?, ?, ?)');
  $ins->execute([$nombre, $email, $hash, $tipo]);

  $id = (int)$pdo->lastInsertId();
  json_response(200, [
    'id' => (string)$id,
    'nombre' => $nombre,
    'email' => $email,
    'tipo_usuario' => $tipo,
    'perfil_completo' => false,
    'activo' => true,
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') {
    json_response(500, ['detail' => $e->getMessage()]);
  }
  json_response(500, ['detail' => 'Error al crear el usuario']);
}
