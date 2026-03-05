<?php
require __DIR__ . '/config.php';
handle_cors();

function auth_user(PDO $pdo): array {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  $q = $pdo->prepare('SELECT id, tipo_usuario, nombre, email FROM users WHERE id = ? LIMIT 1');
  $q->execute([(int)$payload['sub']]);
  $u = $q->fetch();
  if (!$u) json_response(401, ['detail' => 'Usuario no encontrado']);
  return $u;
}

function ensure_schema(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS aplicaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    casting_id BIGINT UNSIGNED NOT NULL,
    talento_id BIGINT UNSIGNED NOT NULL,
    talento_nombre VARCHAR(120) NOT NULL,
    mensaje TEXT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    fecha_aplicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_aplicacion (casting_id, talento_id),
    KEY idx_aplicaciones_talento (talento_id),
    CONSTRAINT fk_aplicacion_casting FOREIGN KEY (casting_id) REFERENCES castings(id) ON DELETE CASCADE,
    CONSTRAINT fk_aplicacion_talento FOREIGN KEY (talento_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

try {
  $pdo = db();
  ensure_schema($pdo);
  $u = auth_user($pdo);

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($u['tipo_usuario'] !== 'talento') json_response(403, ['detail' => 'Solo talentos pueden aplicar']);
    $in = get_json_input();
    $castingId = (int)($in['casting_id'] ?? 0);
    $mensaje = trim((string)($in['mensaje'] ?? ''));
    if ($castingId <= 0) json_response(400, ['detail' => 'casting_id inválido']);

    $cq = $pdo->prepare('SELECT id FROM castings WHERE id = ? LIMIT 1');
    $cq->execute([$castingId]);
    if (!$cq->fetch()) json_response(404, ['detail' => 'Casting no encontrado']);

    $stmt = $pdo->prepare('INSERT INTO aplicaciones (casting_id, talento_id, talento_nombre, mensaje, estado) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE mensaje=VALUES(mensaje), estado=estado');
    $stmt->execute([$castingId, (int)$u['id'], (string)$u['nombre'], $mensaje !== '' ? $mensaje : null, 'pendiente']);

    $id = (int)$pdo->lastInsertId();
    if ($id === 0) {
      $q = $pdo->prepare('SELECT id, fecha_aplicacion FROM aplicaciones WHERE casting_id = ? AND talento_id = ? LIMIT 1');
      $q->execute([$castingId, (int)$u['id']]);
      $row = $q->fetch();
      json_response(200, [
        'id' => (string)($row['id'] ?? ''),
        'casting_id' => (string)$castingId,
        'talento_id' => (string)$u['id'],
        'estado' => 'pendiente',
        'fecha_aplicacion' => $row['fecha_aplicacion'] ?? gmdate('c')
      ]);
    }

    json_response(200, [
      'id' => (string)$id,
      'casting_id' => (string)$castingId,
      'talento_id' => (string)$u['id'],
      'estado' => 'pendiente',
      'fecha_aplicacion' => gmdate('c')
    ]);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = $pdo->prepare('SELECT id, casting_id, talento_id, talento_nombre, mensaje, estado, fecha_aplicacion FROM aplicaciones WHERE talento_id = ? ORDER BY id DESC');
    $q->execute([(int)$u['id']]);
    $rows = $q->fetchAll() ?: [];
    $out = array_map(fn($r) => [
      'id' => (string)$r['id'],
      'casting_id' => (string)$r['casting_id'],
      'talento_id' => (string)$r['talento_id'],
      'talento_nombre' => $r['talento_nombre'],
      'mensaje' => $r['mensaje'],
      'estado' => $r['estado'],
      'fecha_aplicacion' => $r['fecha_aplicacion'],
    ], $rows);
    json_response(200, $out);
  }

  json_response(405, ['detail' => 'Method Not Allowed']);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al aplicar al casting']);
}
