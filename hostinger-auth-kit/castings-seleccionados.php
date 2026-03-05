<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);
$castingId = (int)($_GET['id'] ?? 0);
if ($castingId <= 0) json_response(400, ['detail' => 'id inválido']);

try {
  $pdo = db();
  $q = $pdo->prepare('SELECT cliente_seleccion_json FROM shortlists WHERE casting_id = ? AND cliente_finalizado = 1 ORDER BY id DESC LIMIT 1');
  $q->execute([$castingId]);
  $row = $q->fetch();
  if (!$row) json_response(200, []);

  $sel = json_decode($row['cliente_seleccion_json'] ?? '{}', true);
  if (!is_array($sel)) $sel = [];
  $out = [];
  foreach ($sel as $rol => $data) {
    $states = $data['states'] ?? [];
    if (!is_array($states)) $states = [];
    foreach ($states as $talentoId => $estado) {
      if (!in_array($estado, ['principal','backup','quizas','rechazado'], true)) continue;
      $uq = $pdo->prepare('SELECT nombre FROM users WHERE id = ? LIMIT 1');
      $uq->execute([(int)$talentoId]);
      $u = $uq->fetch();
      $out[] = [
        'talento_id' => (string)$talentoId,
        'talento_nombre' => $u['nombre'] ?? ('Talento #' . $talentoId),
        'rol_nombre' => $rol,
        'estado_cliente' => $estado,
      ];
    }
  }
  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar seleccionados']);
}
