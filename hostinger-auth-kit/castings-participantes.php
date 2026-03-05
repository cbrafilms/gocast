<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);
$castingId = (int)($_GET['id'] ?? 0);
if ($castingId <= 0) json_response(400, ['detail' => 'id inválido']);

try {
  $pdo = db();
  $q = $pdo->prepare('SELECT id, talento_id, talento_nombre, rol_nombre, estado FROM invitaciones WHERE casting_id = ? AND estado IN ("aceptada","rechazada") ORDER BY id DESC');
  $q->execute([$castingId]);
  $rows = $q->fetchAll() ?: [];
  $out = array_map(fn($r)=>[
    'id'=>(string)$r['id'],
    'talento_id'=>(string)$r['talento_id'],
    'talento_nombre'=>$r['talento_nombre'],
    'rol_nombre'=>$r['rol_nombre'],
    'estado'=>$r['estado'],
    'is_selected'=>false,
    'is_backup'=>false,
  ], $rows);
  json_response(200, $out);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar participantes']);
}
