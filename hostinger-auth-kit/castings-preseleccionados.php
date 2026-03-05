<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

$castingId = (int)($_GET['id'] ?? 0);
if ($castingId <= 0) json_response(400, ['detail' => 'id inválido']);

function auth_productora(PDO $pdo): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  $uid = (int)$payload['sub'];
  $q = $pdo->prepare('SELECT tipo_usuario FROM users WHERE id = ? LIMIT 1');
  $q->execute([$uid]);
  $u = $q->fetch();
  if (!$u || ($u['tipo_usuario'] ?? '') !== 'productora') json_response(403, ['detail' => 'Solo productoras']);
  return $uid;
}

try {
  $pdo = db();
  $productoraId = auth_productora($pdo);

  $q = $pdo->prepare('SELECT id FROM castings WHERE id = ? AND productora_id = ? LIMIT 1');
  $q->execute([$castingId, $productoraId]);
  if (!$q->fetch()) json_response(404, ['detail' => 'Casting no encontrado']);

  $pdo->exec("ALTER TABLE aplicaciones ADD COLUMN IF NOT EXISTS es_preseleccionado TINYINT(1) NOT NULL DEFAULT 0");
  $pdo->exec("ALTER TABLE aplicaciones ADD COLUMN IF NOT EXISTS es_backup TINYINT(1) NOT NULL DEFAULT 0");

  $sql = 'SELECT a.id, a.casting_id, a.talento_id, a.talento_nombre, a.estado, a.fecha_aplicacion, a.es_backup,
                 pt.nombre_completo, pt.tipo_talento, pt.edad, pt.altura_cm, pt.ciudad, pt.pais
          FROM aplicaciones a
          LEFT JOIN perfiles_talento pt ON pt.user_id = a.talento_id
          WHERE a.casting_id = ? AND a.es_preseleccionado = 1
          ORDER BY a.id DESC';
  $r = $pdo->prepare($sql);
  $r->execute([$castingId]);
  $rows = $r->fetchAll() ?: [];

  $out = array_map(function($x){
    return [
      'id' => (string)$x['id'],
      'casting_id' => (string)$x['casting_id'],
      'talento_id' => (string)$x['talento_id'],
      'talento_nombre' => $x['talento_nombre'],
      'estado' => $x['estado'],
      'fecha_aplicacion' => $x['fecha_aplicacion'],
      'es_backup' => (bool)$x['es_backup'],
      'talento_perfil' => [
        'nombre_completo' => $x['nombre_completo'] ?? $x['talento_nombre'],
        'tipo_talento' => $x['tipo_talento'] ?? null,
        'edad' => isset($x['edad']) ? (int)$x['edad'] : null,
        'altura_cm' => isset($x['altura_cm']) ? (int)$x['altura_cm'] : null,
        'ciudad' => $x['ciudad'] ?? null,
        'pais' => $x['pais'] ?? null,
      ]
    ];
  }, $rows);

  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar preseleccionados']);
}
