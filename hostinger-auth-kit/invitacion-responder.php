<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_response(405, ['detail' => 'Method Not Allowed']);

$id = (int)($_GET['id'] ?? 0);
$respuesta = trim((string)($_GET['respuesta'] ?? ''));
$mensaje = trim((string)($_GET['mensaje_respuesta'] ?? ''));
if ($id <= 0 || !in_array($respuesta, ['aceptada','rechazada'], true)) json_response(400, ['detail' => 'Parámetros inválidos']);

function auth_talento(PDO $pdo): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  $uid = (int)$payload['sub'];
  $q = $pdo->prepare('SELECT tipo_usuario FROM users WHERE id = ? LIMIT 1');
  $q->execute([$uid]);
  $u = $q->fetch();
  if (!$u || ($u['tipo_usuario'] ?? '') !== 'talento') json_response(403, ['detail' => 'Solo talentos']);
  return $uid;
}

try {
  $pdo = db();
  $uid = auth_talento($pdo);
  $q = $pdo->prepare('UPDATE invitaciones SET estado = ?, mensaje_respuesta = ?, fecha_respuesta = NOW() WHERE id = ? AND talento_id = ?');
  $q->execute([$respuesta, $mensaje !== '' ? $mensaje : null, $id, $uid]);
  if ($q->rowCount() === 0) json_response(404, ['detail' => 'Invitación no encontrada']);
  json_response(200, ['ok' => true]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al responder invitación']);
}
