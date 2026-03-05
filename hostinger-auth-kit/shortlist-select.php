<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);

$url = trim((string)($_GET['url_publica'] ?? ''));
if ($url === '') json_response(400, ['detail' => 'url_publica inválida']);

$in = get_json_input();
$rol = trim((string)($in['rol_nombre'] ?? ''));
$principal = (string)($in['principal_talento_id'] ?? '');
$backup = (string)($in['backup_talento_id'] ?? '');
if ($rol === '') json_response(400, ['detail' => 'rol_nombre requerido']);

try {
  $pdo = db();
  $pdo->exec("ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS cliente_seleccion_json JSON NULL");

  $q = $pdo->prepare('SELECT id, cliente_seleccion_json FROM shortlists WHERE url_publica = ? LIMIT 1');
  $q->execute([$url]);
  $s = $q->fetch();
  if (!$s) json_response(404, ['detail' => 'Shortlist no encontrado']);

  $sel = json_decode($s['cliente_seleccion_json'] ?? '{}', true);
  if (!is_array($sel)) $sel = [];
  $sel[$rol] = [
    'principal_talento_id' => $principal !== '' ? $principal : null,
    'backup_talento_id' => $backup !== '' ? $backup : null,
    'updated_at' => gmdate('c')
  ];

  $u = $pdo->prepare('UPDATE shortlists SET cliente_seleccion_json = ? WHERE id = ?');
  $u->execute([json_encode($sel, JSON_UNESCAPED_UNICODE), (int)$s['id']]);

  json_response(200, ['ok' => true, 'rol_nombre' => $rol, 'seleccion' => $sel[$rol]]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'No se pudo guardar selección']);
}
