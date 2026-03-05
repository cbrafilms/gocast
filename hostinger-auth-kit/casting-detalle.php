<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_response(400, ['detail' => 'id inválido']);

try {
  $pdo = db();
  $q = $pdo->prepare('SELECT id, titulo, descripcion, ubicacion, territorios_json, roles_json, estado, productora_nombre, created_at FROM castings WHERE id = ? LIMIT 1');
  $q->execute([$id]);
  $r = $q->fetch();
  if (!$r) json_response(404, ['detail' => 'Casting no encontrado']);

  json_response(200, [
    'id' => (string)$r['id'],
    'titulo' => $r['titulo'],
    'descripcion' => $r['descripcion'],
    'ubicacion' => $r['ubicacion'],
    'territorios' => json_decode($r['territorios_json'] ?? '[]', true) ?: [],
    'roles' => json_decode($r['roles_json'] ?? '[]', true) ?: [],
    'estado' => $r['estado'],
    'productora_nombre' => $r['productora_nombre'],
    'fecha_creacion' => $r['created_at'],
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar casting']);
}
