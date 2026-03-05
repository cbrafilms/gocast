<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);
$castingId = (int)($_GET['id'] ?? 0);
if ($castingId <= 0) json_response(400, ['detail' => 'id inválido']);

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
  $pid = auth_productora($pdo);
  $pdo->exec("CREATE TABLE IF NOT EXISTS contracts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    casting_id BIGINT UNSIGNED NOT NULL,
    talento_id BIGINT UNSIGNED NOT NULL,
    talento_nombre VARCHAR(120) NOT NULL,
    rol_nombre VARCHAR(120) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    pdf_url VARCHAR(500) NULL,
    signatures_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_contract_role (casting_id, talento_id, rol_nombre)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signatures_json JSON NULL");

  $q = $pdo->prepare('SELECT id FROM castings WHERE id = ? AND productora_id = ? LIMIT 1');
  $q->execute([$castingId, $pid]);
  if (!$q->fetch()) json_response(404, ['detail' => 'Casting no encontrado']);

  $s = $pdo->prepare('SELECT cliente_seleccion_json FROM shortlists WHERE casting_id = ? AND productora_id = ? AND cliente_finalizado = 1 ORDER BY id DESC LIMIT 1');
  $s->execute([$castingId, $pid]);
  $row = $s->fetch();
  if (!$row) json_response(400, ['detail' => 'No hay selección final del cliente']);

  $sel = json_decode($row['cliente_seleccion_json'] ?? '{}', true);
  if (!is_array($sel)) $sel = [];
  $created = 0;
  foreach ($sel as $rol => $v) {
    $states = $v['states'] ?? [];
    if (!is_array($states)) $states = [];
    $tid = 0;
    foreach ($states as $candidateId => $state) {
      if ($state === 'principal') { $tid = (int)$candidateId; break; }
    }
    if ($tid <= 0) continue;
    $uq = $pdo->prepare('SELECT nombre FROM users WHERE id = ? LIMIT 1');
    $uq->execute([$tid]);
    $u = $uq->fetch();
    if (!$u) continue;
    $ins = $pdo->prepare('INSERT INTO contracts (casting_id, talento_id, talento_nombre, rol_nombre, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = status');
    $ins->execute([$castingId, $tid, (string)$u['nombre'], (string)$rol, 'draft']);
    $created++;
  }

  json_response(200, ['ok' => true, 'message' => "Selección confirmada. Contratos generados: {$created}"]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al confirmar selección']);
}
