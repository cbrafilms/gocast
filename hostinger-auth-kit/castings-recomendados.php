<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

try {
  $pdo = db();
  $q = $pdo->query("SELECT id, titulo, descripcion, ubicacion, roles_json, estado, created_at FROM castings WHERE estado = 'activo' ORDER BY id DESC LIMIT 100");
  $rows = $q->fetchAll() ?: [];
  $out = array_map(function($r){
    return [
      'id' => (string)$r['id'],
      'titulo' => $r['titulo'],
      'descripcion' => $r['descripcion'],
      'ubicacion' => $r['ubicacion'],
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
