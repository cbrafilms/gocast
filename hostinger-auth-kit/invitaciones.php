<?php
require __DIR__ . '/config.php';
handle_cors();

function auth_user(PDO $pdo): array {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  $q = $pdo->prepare('SELECT id, nombre, email, tipo_usuario FROM users WHERE id = ? LIMIT 1');
  $q->execute([(int)$payload['sub']]);
  $u = $q->fetch();
  if (!$u) json_response(401, ['detail' => 'Usuario no encontrado']);
  return $u;
}

function ensure_schema(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS invitaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    casting_id BIGINT UNSIGNED NOT NULL,
    productora_id BIGINT UNSIGNED NOT NULL,
    productora_nombre VARCHAR(120) NOT NULL,
    talento_id BIGINT UNSIGNED NOT NULL,
    talento_nombre VARCHAR(120) NOT NULL,
    rol_nombre VARCHAR(120) NOT NULL,
    mensaje TEXT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    mensaje_respuesta TEXT NULL,
    fecha_invitacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL,
    UNIQUE KEY uq_invitacion (casting_id, talento_id, rol_nombre),
    KEY idx_inv_talento (talento_id),
    KEY idx_inv_casting (casting_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

try {
  $pdo = db();
  ensure_schema($pdo);
  $u = auth_user($pdo);

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (($u['tipo_usuario'] ?? '') !== 'productora') json_response(403, ['detail' => 'Solo productoras pueden invitar']);
    $in = get_json_input();
    $castingId = (int)($in['casting_id'] ?? 0);
    $talentoId = (int)($in['talento_id'] ?? 0);
    $rol = trim((string)($in['rol_nombre'] ?? ''));
    $mensaje = trim((string)($in['mensaje'] ?? ''));

    if ($castingId <= 0 || $talentoId <= 0 || $rol === '') json_response(400, ['detail' => 'Datos inválidos para invitación']);

    $cq = $pdo->prepare('SELECT id, titulo FROM castings WHERE id = ? AND productora_id = ? LIMIT 1');
    $cq->execute([$castingId, (int)$u['id']]);
    $cast = $cq->fetch();
    if (!$cast) json_response(404, ['detail' => 'Casting no encontrado']);

    $tq = $pdo->prepare('SELECT id, nombre, email, tipo_usuario FROM users WHERE id = ? LIMIT 1');
    $tq->execute([$talentoId]);
    $tal = $tq->fetch();
    if (!$tal || ($tal['tipo_usuario'] ?? '') !== 'talento') json_response(404, ['detail' => 'Talento no encontrado']);

    $stmt = $pdo->prepare('INSERT INTO invitaciones (casting_id, productora_id, productora_nombre, talento_id, talento_nombre, rol_nombre, mensaje, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE mensaje=VALUES(mensaje), estado="pendiente", fecha_respuesta=NULL');
    $stmt->execute([$castingId, (int)$u['id'], (string)$u['nombre'], $talentoId, (string)$tal['nombre'], $rol, $mensaje !== '' ? $mensaje : null, 'pendiente']);

    json_response(200, ['ok' => true]);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (($u['tipo_usuario'] ?? '') === 'talento') {
      $q = $pdo->prepare('SELECT i.id, i.casting_id, i.productora_nombre, i.rol_nombre, i.mensaje, i.estado, i.fecha_invitacion, c.titulo as casting_titulo FROM invitaciones i LEFT JOIN castings c ON c.id = i.casting_id WHERE i.talento_id = ? ORDER BY i.id DESC');
      $q->execute([(int)$u['id']]);
      $rows = $q->fetchAll() ?: [];
      $out = array_map(fn($r) => [
        'id' => (string)$r['id'],
        'casting_id' => (string)$r['casting_id'],
        'casting_titulo' => $r['casting_titulo'] ?? ('Casting #' . $r['casting_id']),
        'productora_nombre' => $r['productora_nombre'],
        'rol_nombre' => $r['rol_nombre'],
        'mensaje' => $r['mensaje'],
        'estado' => $r['estado'],
        'fecha_invitacion' => $r['fecha_invitacion'],
      ], $rows);
      json_response(200, $out);
    }

    // productora: invitaciones por sus castings
    $q = $pdo->prepare('SELECT i.* FROM invitaciones i INNER JOIN castings c ON c.id = i.casting_id WHERE c.productora_id = ? ORDER BY i.id DESC');
    $q->execute([(int)$u['id']]);
    json_response(200, $q->fetchAll() ?: []);
  }

  json_response(405, ['detail' => 'Method Not Allowed']);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al enviar invitación']);
}
