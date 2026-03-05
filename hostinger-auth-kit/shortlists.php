<?php
require __DIR__ . '/config.php';
handle_cors();

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

  $pdo->exec("CREATE TABLE IF NOT EXISTS shortlists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    casting_id BIGINT UNSIGNED NOT NULL,
    productora_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    url_publica VARCHAR(80) NOT NULL,
    talentos_json JSON NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_shortlist_url (url_publica),
    KEY idx_shortlist_casting (casting_id),
    CONSTRAINT fk_shortlist_casting FOREIGN KEY (casting_id) REFERENCES castings(id) ON DELETE CASCADE,
    CONSTRAINT fk_shortlist_user FOREIGN KEY (productora_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $in = get_json_input();
    $castingId = (int)($in['casting_id'] ?? 0);
    $nombre = trim((string)($in['nombre'] ?? ''));
    $talentos = $in['talentos'] ?? [];

    if ($castingId <= 0) json_response(400, ['detail' => 'casting_id inválido']);
    if ($nombre === '') json_response(400, ['detail' => 'Nombre requerido']);
    if (!is_array($talentos) || count($talentos) === 0) json_response(400, ['detail' => 'Selecciona talentos']);

    $q = $pdo->prepare('SELECT id FROM castings WHERE id = ? AND productora_id = ? LIMIT 1');
    $q->execute([$castingId, $productoraId]);
    if (!$q->fetch()) json_response(404, ['detail' => 'Casting no encontrado']);

    $urlPublica = bin2hex(random_bytes(8));
    $ins = $pdo->prepare('INSERT INTO shortlists (casting_id, productora_id, nombre, url_publica, talentos_json) VALUES (?, ?, ?, ?, ?)');
    $ins->execute([$castingId, $productoraId, $nombre, $urlPublica, json_encode($talentos, JSON_UNESCAPED_UNICODE)]);

    json_response(200, [
      'id' => (string)$pdo->lastInsertId(),
      'casting_id' => (string)$castingId,
      'nombre' => $nombre,
      'url_publica' => $urlPublica,
      'talentos' => $talentos,
      'fecha_creacion' => gmdate('c')
    ]);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $castingId = (int)($_GET['casting_id'] ?? 0);
    if ($castingId <= 0) json_response(400, ['detail' => 'casting_id inválido']);

    $q = $pdo->prepare('SELECT id, nombre, url_publica, talentos_json, fecha_creacion FROM shortlists WHERE casting_id = ? AND productora_id = ? ORDER BY id DESC');
    $q->execute([$castingId, $productoraId]);
    $rows = $q->fetchAll() ?: [];

    $out = array_map(function($r){
      return [
        'id' => (string)$r['id'],
        'nombre' => $r['nombre'],
        'url_publica' => $r['url_publica'],
        'talentos' => json_decode($r['talentos_json'] ?? '[]', true) ?: [],
        'fecha_creacion' => $r['fecha_creacion'],
      ];
    }, $rows);

    json_response(200, $out);
  }

  json_response(405, ['detail' => 'Method Not Allowed']);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al operar shortlists']);
}
