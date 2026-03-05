<?php
require __DIR__ . '/config.php';
handle_cors();

function require_auth_user_id(): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
    json_response(401, ['detail' => 'Token inválido']);
  }
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) {
    json_response(401, ['detail' => 'Token inválido']);
  }
  return (int)$payload['sub'];
}

function ensure_schema(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS perfiles_talento (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    tipo_talento VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    edad INT NOT NULL,
    ciudad VARCHAR(120) NOT NULL,
    pais VARCHAR(120) NOT NULL,
    altura_cm INT NOT NULL,
    color_pelo VARCHAR(50) NOT NULL,
    color_ojos VARCHAR(50) NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    talla_camisa VARCHAR(20) NOT NULL,
    talla_pantalon VARCHAR(20) NOT NULL,
    talla_zapatos VARCHAR(20) NOT NULL,
    descripcion_corta TEXT NOT NULL,
    talentos_especiales TEXT NULL,
    disponibilidad_json JSON NOT NULL,
    fotos_json JSON NOT NULL,
    videos_json JSON NOT NULL,
    contacto_email VARCHAR(190) NULL,
    contacto_whatsapp VARCHAR(60) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_perfil_user (user_id),
    CONSTRAINT fk_perfil_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $pdo->exec("ALTER TABLE perfiles_talento ADD COLUMN IF NOT EXISTS contacto_email VARCHAR(190) NULL");
  $pdo->exec("ALTER TABLE perfiles_talento ADD COLUMN IF NOT EXISTS contacto_whatsapp VARCHAR(60) NULL");
}

function decode_json_list(?string $json): array {
  if (!$json) return [];
  $arr = json_decode($json, true);
  return is_array($arr) ? $arr : [];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
  $pdo = db();
  ensure_schema($pdo);
  $userId = require_auth_user_id();

  if ($method === 'GET') {
    $q = $pdo->prepare('SELECT * FROM perfiles_talento WHERE user_id = ? LIMIT 1');
    $q->execute([$userId]);
    $p = $q->fetch();

    if (!$p) {
      json_response(404, ['detail' => 'Perfil no encontrado']);
    }

    json_response(200, [
      'tipo_talento' => $p['tipo_talento'],
      'nombre_completo' => $p['nombre_completo'],
      'edad' => (int)$p['edad'],
      'ciudad' => $p['ciudad'],
      'pais' => $p['pais'],
      'altura_cm' => (int)$p['altura_cm'],
      'color_pelo' => $p['color_pelo'],
      'color_ojos' => $p['color_ojos'],
      'sexo' => $p['sexo'],
      'talla_camisa' => $p['talla_camisa'],
      'talla_pantalon' => $p['talla_pantalon'],
      'talla_zapatos' => $p['talla_zapatos'],
      'descripcion_corta' => $p['descripcion_corta'],
      'talentos_especiales' => $p['talentos_especiales'] ?? '',
      'disponibilidad' => decode_json_list($p['disponibilidad_json']),
      'fotos' => decode_json_list($p['fotos_json']),
      'videos' => decode_json_list($p['videos_json']),
      'contacto_email' => $p['contacto_email'] ?? '',
      'contacto_whatsapp' => $p['contacto_whatsapp'] ?? '',
    ]);
  }

  if ($method === 'POST') {
    $in = get_json_input();

    $required = [
      'tipo_talento', 'nombre_completo', 'edad', 'ciudad', 'pais', 'altura_cm',
      'color_pelo', 'color_ojos', 'sexo', 'talla_camisa', 'talla_pantalon',
      'talla_zapatos', 'descripcion_corta'
    ];

    foreach ($required as $f) {
      if (!isset($in[$f]) || trim((string)$in[$f]) === '') {
        json_response(400, ['detail' => "Campo requerido: $f"]);
      }
    }

    $disponibilidad = $in['disponibilidad'] ?? [];
    $fotos = $in['fotos'] ?? [];
    $videos = $in['videos'] ?? [];

    if (!is_array($disponibilidad) || count($disponibilidad) === 0) {
      json_response(400, ['detail' => 'Selecciona al menos 1 día de disponibilidad']);
    }
    if (!is_array($fotos) || count($fotos) < 1) {
      json_response(400, ['detail' => 'Debes agregar al menos 1 foto']);
    }
    if (!is_array($videos) || count($videos) < 1) {
      json_response(400, ['detail' => 'Debes agregar al menos 1 video']);
    }

    $sql = 'INSERT INTO perfiles_talento (
      user_id, tipo_talento, nombre_completo, edad, ciudad, pais, altura_cm,
      color_pelo, color_ojos, sexo, talla_camisa, talla_pantalon, talla_zapatos,
      descripcion_corta, talentos_especiales, disponibilidad_json, fotos_json, videos_json, contacto_email, contacto_whatsapp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      tipo_talento=VALUES(tipo_talento),
      nombre_completo=VALUES(nombre_completo),
      edad=VALUES(edad),
      ciudad=VALUES(ciudad),
      pais=VALUES(pais),
      altura_cm=VALUES(altura_cm),
      color_pelo=VALUES(color_pelo),
      color_ojos=VALUES(color_ojos),
      sexo=VALUES(sexo),
      talla_camisa=VALUES(talla_camisa),
      talla_pantalon=VALUES(talla_pantalon),
      talla_zapatos=VALUES(talla_zapatos),
      descripcion_corta=VALUES(descripcion_corta),
      talentos_especiales=VALUES(talentos_especiales),
      disponibilidad_json=VALUES(disponibilidad_json),
      fotos_json=VALUES(fotos_json),
      videos_json=VALUES(videos_json),
      contacto_email=VALUES(contacto_email),
      contacto_whatsapp=VALUES(contacto_whatsapp)';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
      $userId,
      trim((string)$in['tipo_talento']),
      trim((string)$in['nombre_completo']),
      (int)$in['edad'],
      trim((string)$in['ciudad']),
      trim((string)$in['pais']),
      (int)$in['altura_cm'],
      trim((string)$in['color_pelo']),
      trim((string)$in['color_ojos']),
      trim((string)$in['sexo']),
      trim((string)$in['talla_camisa']),
      trim((string)$in['talla_pantalon']),
      trim((string)$in['talla_zapatos']),
      trim((string)$in['descripcion_corta']),
      isset($in['talentos_especiales']) ? trim((string)$in['talentos_especiales']) : null,
      json_encode(array_values($disponibilidad), JSON_UNESCAPED_UNICODE),
      json_encode(array_values($fotos), JSON_UNESCAPED_UNICODE),
      json_encode(array_values($videos), JSON_UNESCAPED_UNICODE),
      trim((string)($in['contacto_email'] ?? '')) ?: null,
      trim((string)($in['contacto_whatsapp'] ?? '')) ?: null,
    ]);

    $u = $pdo->prepare('UPDATE users SET perfil_completo = 1 WHERE id = ?');
    $u->execute([$userId]);

    json_response(200, ['ok' => true]);
  }

  json_response(405, ['detail' => 'Method Not Allowed']);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') {
    json_response(500, ['detail' => $e->getMessage()]);
  }
  json_response(500, ['detail' => 'Error al guardar perfil']);
}
