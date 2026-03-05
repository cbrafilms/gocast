<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);
$url = trim((string)($_GET['url_publica'] ?? ''));
$password = trim((string)($_GET['password'] ?? ''));
if ($url === '') json_response(400, ['detail' => 'url_publica inválida']);

try {
  $pdo = db();
  $pdo->exec("ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS cliente_access_password VARCHAR(64) NULL");
  $pdo->exec("ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS cliente_finalizado TINYINT(1) NOT NULL DEFAULT 0");

  $q = $pdo->prepare('SELECT s.id, s.nombre, s.url_publica, s.talentos_json, s.cliente_seleccion_json, s.cliente_finalizado, s.cliente_access_password, s.fecha_creacion, c.titulo AS casting_titulo
                      FROM shortlists s INNER JOIN castings c ON c.id = s.casting_id
                      WHERE s.url_publica = ? LIMIT 1');
  $q->execute([$url]);
  $s = $q->fetch();
  if (!$s) json_response(404, ['detail' => 'Shortlist no encontrado']);

  if (!empty($s['cliente_access_password']) && $password !== (string)$s['cliente_access_password']) {
    json_response(401, ['detail' => 'Contraseña inválida']);
  }

  $rawTalentos = json_decode($s['talentos_json'] ?? '[]', true);
  if (!is_array($rawTalentos)) $rawTalentos = [];

  $resultTalentos = [];
  foreach ($rawTalentos as $t) {
    $tid = (int)($t['talento_id'] ?? 0);
    if ($tid <= 0) continue;
    $pq = $pdo->prepare('SELECT nombre_completo, tipo_talento, edad, altura_cm, sexo, color_pelo, color_ojos, talla_camisa, ciudad, pais, descripcion_corta, fotos_json, videos_json FROM perfiles_talento WHERE user_id = ? LIMIT 1');
    $pq->execute([$tid]);
    $p = $pq->fetch();
    if (!$p) continue;
    $resultTalentos[] = [
      'talento_id' => (string)$tid,
      'rol_nombre' => $t['rol_nombre'] ?? 'General',
      'nombre_completo' => $p['nombre_completo'],
      'tipo_talento' => $p['tipo_talento'],
      'edad' => isset($p['edad']) ? (int)$p['edad'] : null,
      'altura_cm' => isset($p['altura_cm']) ? (int)$p['altura_cm'] : null,
      'sexo' => $p['sexo'],
      'color_pelo' => $p['color_pelo'],
      'color_ojos' => $p['color_ojos'],
      'talla_camisa' => $p['talla_camisa'],
      'ciudad' => $p['ciudad'],
      'pais' => $p['pais'],
      'descripcion_corta' => $p['descripcion_corta'],
      'fotos' => json_decode($p['fotos_json'] ?? '[]', true) ?: [],
      'videos' => json_decode($p['videos_json'] ?? '[]', true) ?: [],
    ];
  }

  json_response(200, [
    'id' => (string)$s['id'],
    'nombre' => $s['nombre'],
    'url_publica' => $s['url_publica'],
    'casting_titulo' => $s['casting_titulo'],
    'fecha_creacion' => $s['fecha_creacion'],
    'cliente_finalizado' => (bool)$s['cliente_finalizado'],
    'talentos' => $resultTalentos,
    'cliente_seleccion' => json_decode($s['cliente_seleccion_json'] ?? '{}', true) ?: new stdClass(),
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Shortlist no disponible']);
}
