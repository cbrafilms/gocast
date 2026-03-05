<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);
$contractId = (int)($_GET['id'] ?? 0);
if ($contractId <= 0) json_response(400, ['detail' => 'id inválido']);

function auth_user(PDO $pdo): array {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  $q = $pdo->prepare('SELECT id, nombre FROM users WHERE id = ? LIMIT 1');
  $q->execute([(int)$payload['sub']]);
  $u = $q->fetch();
  if (!$u) json_response(401, ['detail' => 'Usuario no encontrado']);
  return $u;
}

$in = get_json_input();
if (!($in['accept_terms'] ?? false)) json_response(400, ['detail' => 'Debes aceptar condiciones']);

try {
  $pdo = db();
  $u = auth_user($pdo);
  $pdo->exec("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signatures_json JSON NULL");

  $q = $pdo->prepare('SELECT id, talento_id, signatures_json FROM contracts WHERE id = ? LIMIT 1');
  $q->execute([$contractId]);
  $c = $q->fetch();
  if (!$c) json_response(404, ['detail' => 'Contrato no encontrado']);
  if ((int)$c['talento_id'] !== (int)$u['id']) json_response(403, ['detail' => 'No autorizado']);

  $sigs = json_decode($c['signatures_json'] ?? '[]', true);
  if (!is_array($sigs)) $sigs = [];
  $sigs[] = ['by' => 'talento', 'user_id' => (string)$u['id'], 'name' => $u['nombre'], 'at' => gmdate('c')];

  $up = $pdo->prepare('UPDATE contracts SET status = ?, signatures_json = ? WHERE id = ?');
  $up->execute(['signed_by_talento', json_encode($sigs, JSON_UNESCAPED_UNICODE), $contractId]);

  json_response(200, ['ok' => true]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al firmar contrato']);
}
