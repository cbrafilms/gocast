<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);

$appId = (int)($_GET['id'] ?? 0);
$esBackup = filter_var($_GET['es_backup'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
if ($appId <= 0) json_response(400, ['detail' => 'id inválido']);

function auth_productora(PDO $pdo): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  $uid = (int)$payload['sub'];
  $q = $pdo->prepare('SELECT tipo_usuario FROM users WHERE id = ? LIMIT 1');
  $q->execute([$uid]);
  $u = $q->fetch();
  if (!$u || ($u['tipo_usuario'] ?? '') !== 'productora') json_response(403, ['detail' => 'Solo productoras']);
  return $uid;
}

try {
  $pdo = db();
  $productoraId = auth_productora($pdo);

  $pdo->exec("ALTER TABLE aplicaciones ADD COLUMN IF NOT EXISTS es_preseleccionado TINYINT(1) NOT NULL DEFAULT 0");
  $pdo->exec("ALTER TABLE aplicaciones ADD COLUMN IF NOT EXISTS es_backup TINYINT(1) NOT NULL DEFAULT 0");

  $q = $pdo->prepare('SELECT a.id, a.casting_id FROM aplicaciones a INNER JOIN castings c ON c.id = a.casting_id WHERE a.id = ? AND c.productora_id = ? LIMIT 1');
  $q->execute([$appId, $productoraId]);
  $app = $q->fetch();
  if (!$app) json_response(404, ['detail' => 'Aplicación no encontrada']);

  $u = $pdo->prepare('UPDATE aplicaciones SET es_preseleccionado = 1, es_backup = ?, estado = ? WHERE id = ?');
  $u->execute([$esBackup ? 1 : 0, $esBackup ? 'backup' : 'preseleccionada', $appId]);

  json_response(200, ['ok' => true, 'id' => (string)$appId, 'es_backup' => $esBackup]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al preseleccionar']);
}
