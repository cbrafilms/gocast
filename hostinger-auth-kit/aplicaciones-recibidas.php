<?php
require __DIR__ . '/config.php';
handle_cors();

function auth_productora(PDO $pdo): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);

  $uid = (int)$payload['sub'];
  $q = $pdo->prepare('SELECT id, tipo_usuario FROM users WHERE id = ? LIMIT 1');
  $q->execute([$uid]);
  $u = $q->fetch();
  if (!$u) json_response(401, ['detail' => 'Usuario no encontrado']);
  if (($u['tipo_usuario'] ?? '') !== 'productora') json_response(403, ['detail' => 'Solo productoras']);
  return $uid;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

try {
  $pdo = db();
  $productoraId = auth_productora($pdo);

  $sql = 'SELECT a.id, a.casting_id, a.talento_id, a.talento_nombre, a.mensaje, a.estado, a.fecha_aplicacion,
                 pt.nombre_completo, pt.tipo_talento, pt.edad, pt.altura_cm, pt.ciudad, pt.pais, pt.fotos_json, pt.videos_json
          FROM aplicaciones a
          INNER JOIN castings c ON c.id = a.casting_id
          LEFT JOIN perfiles_talento pt ON pt.user_id = a.talento_id
          WHERE c.productora_id = ?
          ORDER BY a.id DESC';

  $q = $pdo->prepare($sql);
  $q->execute([$productoraId]);
  $rows = $q->fetchAll() ?: [];

  $out = array_map(function($r) {
    return [
      'id' => (string)$r['id'],
      'casting_id' => (string)$r['casting_id'],
      'talento_id' => (string)$r['talento_id'],
      'talento_nombre' => $r['talento_nombre'],
      'mensaje' => $r['mensaje'],
      'estado' => $r['estado'],
      'fecha_aplicacion' => $r['fecha_aplicacion'],
      'talento_perfil' => [
        'nombre_completo' => $r['nombre_completo'] ?? $r['talento_nombre'],
        'tipo_talento' => $r['tipo_talento'] ?? null,
        'edad' => isset($r['edad']) ? (int)$r['edad'] : null,
        'altura_cm' => isset($r['altura_cm']) ? (int)$r['altura_cm'] : null,
        'ciudad' => $r['ciudad'] ?? null,
        'pais' => $r['pais'] ?? null,
        'fotos' => json_decode($r['fotos_json'] ?? '[]', true) ?: [],
        'videos' => json_decode($r['videos_json'] ?? '[]', true) ?: [],
      ]
    ];
  }, $rows);

  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar aplicaciones recibidas']);
}
