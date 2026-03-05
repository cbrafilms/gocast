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
  $uid = auth_user_id();
  $q = $pdo->prepare('SELECT id, titulo, descripcion, ubicacion, territorios_json, roles_json, estado, created_at FROM castings WHERE productora_id = ? ORDER BY id DESC');
  $q->execute([$uid]);
  $rows = $q->fetchAll() ?: [];

  $out = array_map(function($r) {
    return [
      'id' => (string)$r['id'],
      'titulo' => $r['titulo'],
      'descripcion' => $r['descripcion'],
      'ubicacion' => $r['ubicacion'],
      'territorios' => json_decode($r['territorios_json'] ?? '[]', true) ?: [],
      'roles' => json_decode($r['roles_json'] ?? '[]', true) ?: [],
      'estado' => $r['estado'],
      'fecha_creacion' => $r['created_at'],
    ];
  }, $rows);

  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar castings']);
}
