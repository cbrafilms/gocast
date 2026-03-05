<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);
$castingId = (int)($_GET['id'] ?? 0);
if ($castingId <= 0) json_response(400, ['detail' => 'id inválido']);

try {
  $pdo = db();
  $c = $pdo->prepare('SELECT titulo FROM castings WHERE id = ? LIMIT 1');
  $c->execute([$castingId]);
  $casting = $c->fetch();
  if (!$casting) json_response(404, ['detail' => 'Casting no encontrado']);

  $s = $pdo->prepare('SELECT cliente_seleccion_json FROM shortlists WHERE casting_id = ? AND cliente_finalizado = 1 ORDER BY id DESC LIMIT 1');
  $s->execute([$castingId]);
  $row = $s->fetch();
  if (!$row) json_response(400, ['detail' => 'No hay selección final del cliente']);
  $sel = json_decode($row['cliente_seleccion_json'] ?? '{}', true);
  if (!is_array($sel)) $sel = [];

  $sent = 0;
  foreach ($sel as $rol => $v) {
    $states = $v['states'] ?? [];
    if (!is_array($states)) $states = [];
    $tid = 0;
    foreach ($states as $candidateId => $state) {
      if ($state === 'principal') { $tid = (int)$candidateId; break; }
    }
    if ($tid <= 0) continue;
    $u = $pdo->prepare('SELECT nombre,email FROM users WHERE id = ? LIMIT 1');
    $u->execute([$tid]);
    $tal = $u->fetch();
    if (!$tal) continue;
    if (filter_var($tal['email'], FILTER_VALIDATE_EMAIL)) {
      $subject = 'Has sido seleccionado/a - GOCAST';
      $body = "Hola {$tal['nombre']},\n\nFuiste seleccionado/a para el rol '{$rol}' en el casting '{$casting['titulo']}'.\nPronto recibirás contrato y próximos pasos en la plataforma.\n";
      @mail($tal['email'], $subject, $body, "From: no-reply@gocast.me\r\n");
      $sent++;
    }
  }

  json_response(200, ['ok' => true, 'sent' => $sent]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al avisar talentos']);
}
