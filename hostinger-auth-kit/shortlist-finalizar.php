<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);
$url = trim((string)($_GET['url_publica'] ?? ''));
if ($url === '') json_response(400, ['detail' => 'url_publica inválida']);

try {
  $pdo = db();
  $pdo->exec("ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS cliente_finalizado TINYINT(1) NOT NULL DEFAULT 0");

  $q = $pdo->prepare('SELECT s.id, s.nombre, s.cliente_seleccion_json, c.titulo as casting_titulo, u.email as productora_email, u.nombre as productora_nombre
                      FROM shortlists s
                      INNER JOIN castings c ON c.id = s.casting_id
                      INNER JOIN users u ON u.id = s.productora_id
                      WHERE s.url_publica = ? LIMIT 1');
  $q->execute([$url]);
  $s = $q->fetch();
  if (!$s) json_response(404, ['detail' => 'Shortlist no encontrado']);

  $u = $pdo->prepare('UPDATE shortlists SET cliente_finalizado = 1 WHERE id = ?');
  $u->execute([(int)$s['id']]);

  $sel = json_decode($s['cliente_seleccion_json'] ?? '{}', true);
  if (!is_array($sel)) $sel = [];
  $lines = [];
  foreach ($sel as $rol => $v) {
    $lines[] = "- {$rol}: " . (($v['principal_talento_id'] ?? null) ? "talento #".$v['principal_talento_id'] : 'sin selección');
  }

  $to = trim((string)($s['productora_email'] ?? ''));
  if (filter_var($to, FILTER_VALIDATE_EMAIL)) {
    $subject = 'Cliente confirmó selección de shortlist - GOCAST';
    $body = "Hola {$s['productora_nombre']},\n\nEl cliente confirmó la selección del casting '{$s['casting_titulo']}' (shortlist: {$s['nombre']}).\n\nSelección por rol:\n" . implode("\n", $lines) . "\n\nIngresa a GOCAST para revisar y continuar.\n";
    @mail($to, $subject, $body, "From: no-reply@gocast.me\r\n");
  }

  json_response(200, ['ok' => true]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'No se pudo finalizar selección']);
}
