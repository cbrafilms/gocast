<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

function auth_user_id(): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  return (int)$payload['sub'];
}

try {
  $pdo = db();
  $uid = auth_user_id();
  $pdo->exec("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signatures_json JSON NULL");
  $q = $pdo->prepare('SELECT ct.id, ct.casting_id, ct.rol_nombre, ct.status, ct.pdf_url, ct.signatures_json, ct.created_at, c.titulo as casting_titulo FROM contracts ct INNER JOIN castings c ON c.id = ct.casting_id WHERE ct.talento_id = ? ORDER BY ct.id DESC');
  $q->execute([$uid]);
  $rows = $q->fetchAll() ?: [];
  $out = array_map(fn($r) => [
    'id' => (string)$r['id'], 'casting_id' => (string)$r['casting_id'], 'casting_titulo' => $r['casting_titulo'],
    'rol_nombre' => $r['rol_nombre'], 'status' => $r['status'], 'pdf_url' => $r['pdf_url'],
    'signatures' => json_decode($r['signatures_json'] ?? '[]', true) ?: [], 'created_at' => $r['created_at']
  ], $rows);
  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar contratos']);
}
