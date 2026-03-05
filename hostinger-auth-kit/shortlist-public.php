<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

$url = trim((string)($_GET['url_publica'] ?? ''));
if ($url === '') json_response(400, ['detail' => 'url_publica inválida']);

try {
  $pdo = db();

  $q = $pdo->prepare('SELECT s.id, s.nombre, s.url_publica, s.talentos_json, s.fecha_creacion, c.titulo AS casting_titulo
                      FROM shortlists s
                      INNER JOIN castings c ON c.id = s.casting_id
                      WHERE s.url_publica = ?
                      LIMIT 1');
  $q->execute([$url]);
  $s = $q->fetch();
  if (!$s) json_response(404, ['detail' => 'Shortlist no encontrado']);

  $rawTalentos = json_decode($s['talentos_json'] ?? '[]', true);
  if (!is_array($rawTalentos)) $rawTalentos = [];

  $resultTalentos = [];
  foreach ($rawTalentos as $t) {
    $tid = (int)($t['talento_id'] ?? 0);
    if ($tid <= 0) continue;

    $pq = $pdo->prepare('SELECT nombre_completo, tipo_talento, edad, altura_cm, sexo, color_pelo, color_ojos, talla_camisa, ciudad, pais, descripcion_corta, fotos_json, videos_json
                         FROM perfiles_talento WHERE user_id = ? LIMIT 1');
    $pq->execute([$tid]);
    $p = $pq->fetch();

    if ($p) {
      $fotos = json_decode($p['fotos_json'] ?? '[]', true) ?: [];
      $videos = json_decode($p['videos_json'] ?? '[]', true) ?: [];
      $resultTalentos[] = [
        'talento_id' => (string)$tid,
        'rol_nombre' => $t['rol_nombre'] ?? 'General',
        'es_backup' => (bool)($t['es_backup'] ?? false),
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
        'fotos' => $fotos,
        'videos' => $videos,
      ];
    }
  }

  json_response(200, [
    'id' => (string)$s['id'],
    'nombre' => $s['nombre'],
    'url_publica' => $s['url_publica'],
    'casting_titulo' => $s['casting_titulo'],
    'fecha_creacion' => $s['fecha_creacion'],
    'talentos' => $resultTalentos,
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Shortlist no disponible']);
}
