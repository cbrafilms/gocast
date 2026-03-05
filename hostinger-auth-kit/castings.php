<?php
require __DIR__ . '/config.php';
handle_cors();

function auth_user(PDO $pdo): array {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  $q = $pdo->prepare('SELECT id, tipo_usuario, nombre FROM users WHERE id = ? LIMIT 1');
  $q->execute([(int)$payload['sub']]);
  $u = $q->fetch();
  if (!$u) json_response(401, ['detail' => 'Usuario no encontrado']);
  return $u;
}

function ensure_schema(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS castings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    ubicacion VARCHAR(150) NOT NULL,
    territorios_json JSON NOT NULL,
    duracion_exhibicion VARCHAR(120) NULL,
    fecha_limite_postulacion VARCHAR(30) NULL,
    fecha_produccion VARCHAR(30) NULL,
    requisitos_generales TEXT NULL,
    roles_json JSON NOT NULL,
    productora_id BIGINT UNSIGNED NOT NULL,
    productora_nombre VARCHAR(120) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_castings_productora (productora_id),
    CONSTRAINT fk_castings_user FOREIGN KEY (productora_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);

try {
  $pdo = db();
  ensure_schema($pdo);
  $u = auth_user($pdo);
  if ($u['tipo_usuario'] !== 'productora') json_response(403, ['detail' => 'Solo productoras pueden crear castings']);

  $in = get_json_input();
  $titulo = trim((string)($in['titulo'] ?? ''));
  $descripcion = trim((string)($in['descripcion'] ?? ''));
  $ubicacion = trim((string)($in['ubicacion'] ?? ''));
  $territorios = $in['territorios'] ?? [];
  $roles = $in['roles'] ?? [];

  if ($titulo === '' || $descripcion === '' || $ubicacion === '') json_response(400, ['detail' => 'Faltan campos requeridos']);
  if (!is_array($territorios) || count($territorios) === 0) json_response(400, ['detail' => 'Selecciona al menos un territorio']);
  if (!is_array($roles) || count($roles) === 0) json_response(400, ['detail' => 'Debes incluir al menos un rol']);

  $stmt = $pdo->prepare('INSERT INTO castings (titulo, descripcion, ubicacion, territorios_json, duracion_exhibicion, fecha_limite_postulacion, fecha_produccion, requisitos_generales, roles_json, productora_id, productora_nombre, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  $stmt->execute([
    $titulo,
    $descripcion,
    $ubicacion,
    json_encode(array_values($territorios), JSON_UNESCAPED_UNICODE),
    trim((string)($in['duracion_exhibicion'] ?? '')) ?: null,
    trim((string)($in['fecha_limite_postulacion'] ?? '')) ?: null,
    trim((string)($in['fecha_produccion'] ?? '')) ?: null,
    trim((string)($in['requisitos_generales'] ?? '')) ?: null,
    json_encode($roles, JSON_UNESCAPED_UNICODE),
    (int)$u['id'],
    (string)$u['nombre'],
    'activo'
  ]);

  $id = (int)$pdo->lastInsertId();
  json_response(200, [
    'id' => (string)$id,
    'titulo' => $titulo,
    'descripcion' => $descripcion,
    'ubicacion' => $ubicacion,
    'territorios' => array_values($territorios),
    'roles' => $roles,
    'productora_id' => (string)$u['id'],
    'productora_nombre' => (string)$u['nombre'],
    'estado' => 'activo',
    'fecha_creacion' => gmdate('c')
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al crear el casting']);
}
