<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);

$userId = (int)($_GET['user_id'] ?? 0);
if ($userId <= 0) json_response(400, ['detail' => 'user_id inválido']);

try {
  $pdo = db();
  $uq = $pdo->prepare('SELECT id, nombre, email, tipo_usuario FROM users WHERE id = ? LIMIT 1');
  $uq->execute([$userId]);
  $u = $uq->fetch();
  if (!$u) json_response(404, ['detail' => 'Talento no encontrado']);

  $pq = $pdo->prepare('SELECT * FROM perfiles_talento WHERE user_id = ? LIMIT 1');
  $pq->execute([$userId]);
  $p = $pq->fetch();
  if (!$p) json_response(404, ['detail' => 'Perfil de talento no encontrado']);

  json_response(200, [
    'user' => [
      'id' => (string)$u['id'],
      'nombre' => $u['nombre'],
      'email' => $u['email'],
      'tipo_usuario' => $u['tipo_usuario'],
    ],
    'perfil' => [
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
      'disponibilidad' => json_decode($p['disponibilidad_json'] ?? '[]', true) ?: [],
      'fotos' => json_decode($p['fotos_json'] ?? '[]', true) ?: [],
      'videos' => json_decode($p['videos_json'] ?? '[]', true) ?: [],
      'contacto_email' => $p['contacto_email'] ?? '',
      'contacto_whatsapp' => $p['contacto_whatsapp'] ?? '',
    ]
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar perfil de talento']);
}
