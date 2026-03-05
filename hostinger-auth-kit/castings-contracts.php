<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);
$castingId = (int)($_GET['id'] ?? 0);
if ($castingId <= 0) json_response(400, ['detail' => 'id inválido']);

try {
  $pdo = db();
  $pdo->exec("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signatures_json JSON NULL");
  $q = $pdo->prepare('SELECT id, casting_id, talento_id, talento_nombre, rol_nombre, status, pdf_url, signatures_json, created_at FROM contracts WHERE casting_id = ? ORDER BY id DESC');
  $q->execute([$castingId]);
  $rows = $q->fetchAll() ?: [];
  $out = array_map(fn($r) => [
    'id' => (string)$r['id'], 'casting_id' => (string)$r['casting_id'], 'talento_id' => (string)$r['talento_id'],
    'talento_nombre' => $r['talento_nombre'], 'rol_nombre' => $r['rol_nombre'], 'status' => $r['status'],
    'pdf_url' => ($r['pdf_url'] ?: ('/api/contracts/' . $r['id'] . '/pdf')), 'signatures' => json_decode($r['signatures_json'] ?? '[]', true) ?: [],
    'created_at' => $r['created_at']
  ], $rows);
  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar contratos']);
}
