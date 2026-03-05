<?php
require __DIR__ . '/config.php';
handle_cors();

function auth_user_id(): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  return (int)$payload['sub'];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

try {
  $pdo = db();
  auth_user_id();

  $sql = 'SELECT user_id, tipo_talento, nombre_completo, edad, ciudad, pais, altura_cm, color_pelo, color_ojos, sexo, talla_camisa, talla_pantalon, talla_zapatos, descripcion_corta, fotos_json, videos_json FROM perfiles_talento WHERE 1=1';
  $params = [];

  $eqFields = ['tipo_talento','sexo','color_pelo','color_ojos','talla_camisa','talla_pantalon','talla_zapatos','ciudad','pais'];
  foreach ($eqFields as $f) {
    $v = trim((string)($_GET[$f] ?? ''));
    if ($v !== '') {
      $sql .= " AND LOWER($f) = LOWER(?)";
      $params[] = $v;
    }
  }

  $edadMin = trim((string)($_GET['edad_min'] ?? ''));
  $edadMax = trim((string)($_GET['edad_max'] ?? ''));
  $alturaMin = trim((string)($_GET['altura_min'] ?? ''));
  $alturaMax = trim((string)($_GET['altura_max'] ?? ''));

  if ($edadMin !== '') { $sql .= ' AND edad >= ?'; $params[] = (int)$edadMin; }
  if ($edadMax !== '') { $sql .= ' AND edad <= ?'; $params[] = (int)$edadMax; }
  if ($alturaMin !== '') { $sql .= ' AND altura_cm >= ?'; $params[] = (int)$alturaMin; }
  if ($alturaMax !== '') { $sql .= ' AND altura_cm <= ?'; $params[] = (int)$alturaMax; }

  $sql .= ' ORDER BY user_id DESC LIMIT 200';

  $q = $pdo->prepare($sql);
  $q->execute($params);
  $rows = $q->fetchAll() ?: [];

  $out = array_map(function($r) {
    return [
      'user_id' => (string)$r['user_id'],
      'nombre_completo' => $r['nombre_completo'],
      'tipo_talento' => $r['tipo_talento'],
      'edad' => (int)$r['edad'],
      'ciudad' => $r['ciudad'],
      'pais' => $r['pais'],
      'altura_cm' => (int)$r['altura_cm'],
      'color_pelo' => $r['color_pelo'],
      'color_ojos' => $r['color_ojos'],
      'sexo' => $r['sexo'],
      'talla_camisa' => $r['talla_camisa'],
      'talla_pantalon' => $r['talla_pantalon'],
      'talla_zapatos' => $r['talla_zapatos'],
      'descripcion_corta' => $r['descripcion_corta'],
      'fotos' => json_decode($r['fotos_json'] ?? '[]', true) ?: [],
      'videos' => json_decode($r['videos_json'] ?? '[]', true) ?: [],
    ];
  }, $rows);

  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al buscar talentos']);
}
