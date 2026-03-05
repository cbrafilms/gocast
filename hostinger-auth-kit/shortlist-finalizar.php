<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);
$url = trim((string)($_GET['url_publica'] ?? ''));
$in = get_json_input();
$password = trim((string)($in['password'] ?? ''));
if ($url === '') json_response(400, ['detail' => 'url_publica inválida']);

try {
  $pdo = db();
  $pdo->exec("ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS cliente_finalizado TINYINT(1) NOT NULL DEFAULT 0");

  $q = $pdo->prepare('SELECT s.id, s.nombre, s.cliente_access_password, s.cliente_seleccion_json, c.titulo as casting_titulo, u.email as productora_email, u.nombre as productora_nombre
                      FROM shortlists s INNER JOIN castings c ON c.id = s.casting_id INNER JOIN users u ON u.id = s.productora_id
                      WHERE s.url_publica = ? LIMIT 1');
  $q->execute([$url]);
  $s = $q->fetch();
  if (!$s) json_response(404, ['detail' => 'Shortlist no encontrado']);
  if (!empty($s['cliente_access_password']) && $password !== (string)$s['cliente_access_password']) json_response(401, ['detail' => 'Contraseña inválida']);

  $u = $pdo->prepare('UPDATE shortlists SET cliente_finalizado = 1 WHERE id = ?');
  $u->execute([(int)$s['id']]);

  @mail((string)$s['productora_email'], 'Cliente confirmó selección de shortlist - GOCAST',
    "Hola {$s['productora_nombre']},\n\nEl cliente confirmó la selección del casting '{$s['casting_titulo']}' (shortlist: {$s['nombre']}).\nIngresa a GOCAST para revisar y continuar.\n",
    "From: no-reply@gocast.me\r\n");

  json_response(200, ['ok' => true]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'No se pudo finalizar selección']);
}
