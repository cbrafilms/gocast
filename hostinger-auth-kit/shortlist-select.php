<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);

$url = trim((string)($_GET['url_publica'] ?? ''));
if ($url === '') json_response(400, ['detail' => 'url_publica inválida']);

$in = get_json_input();
$password = trim((string)($in['password'] ?? ''));
$rol = trim((string)($in['rol_nombre'] ?? ''));
$talentoId = trim((string)($in['talento_id'] ?? ''));
$estado = trim((string)($in['estado'] ?? ''));
if ($rol === '' || $talentoId === '' || !in_array($estado, ['principal','backup','quizas','rechazado','none'], true)) {
  json_response(400, ['detail' => 'Parámetros inválidos']);
}

try {
  $pdo = db();
  $pdo->exec("ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS cliente_access_password VARCHAR(64) NULL");
  $q = $pdo->prepare('SELECT id, cliente_access_password, cliente_seleccion_json FROM shortlists WHERE url_publica = ? LIMIT 1');
  $q->execute([$url]);
  $s = $q->fetch();
  if (!$s) json_response(404, ['detail' => 'Shortlist no encontrado']);
  if (!empty($s['cliente_access_password']) && $password !== (string)$s['cliente_access_password']) json_response(401, ['detail' => 'Contraseña inválida']);

  $sel = json_decode($s['cliente_seleccion_json'] ?? '{}', true);
  if (!is_array($sel)) $sel = [];
  if (!isset($sel[$rol]) || !is_array($sel[$rol])) $sel[$rol] = ['states' => []];
  if (!isset($sel[$rol]['states']) || !is_array($sel[$rol]['states'])) $sel[$rol]['states'] = [];

  if ($estado === 'none') {
    unset($sel[$rol]['states'][$talentoId]);
  } else {
    // mantener máximo 1 principal y 1 backup por rol
    if (in_array($estado, ['principal','backup'], true)) {
      foreach ($sel[$rol]['states'] as $tid => $st) {
        if ($st === $estado && (string)$tid !== (string)$talentoId) {
          unset($sel[$rol]['states'][$tid]);
        }
      }
      // evitar que el mismo talento quede principal y backup a la vez
      $other = $estado === 'principal' ? 'backup' : 'principal';
      if (($sel[$rol]['states'][$talentoId] ?? null) === $other) {
        unset($sel[$rol]['states'][$talentoId]);
      }
    }
    $sel[$rol]['states'][$talentoId] = $estado;
  }
  $sel[$rol]['updated_at'] = gmdate('c');

  $u = $pdo->prepare('UPDATE shortlists SET cliente_seleccion_json = ? WHERE id = ?');
  $u->execute([json_encode($sel, JSON_UNESCAPED_UNICODE), (int)$s['id']]);

  json_response(200, ['ok' => true]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'No se pudo guardar selección']);
}
