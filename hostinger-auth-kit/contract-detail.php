<?php
require __DIR__ . '/config.php';
handle_cors();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(405, ['detail' => 'Method Not Allowed']);
$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_response(400, ['detail' => 'id inválido']);

function auth_user_id(): int {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) json_response(401, ['detail' => 'Token inválido']);
  $payload = verify_jwt(trim($m[1]));
  if (!$payload || empty($payload['sub'])) json_response(401, ['detail' => 'Token inválido']);
  return (int)$payload['sub'];
}

try {
  $pdo = db();
  $uid = auth_user_id();
  $pdo->exec("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signatures_json JSON NULL");

  $q = $pdo->prepare('SELECT ct.id, ct.casting_id, ct.talento_id, ct.talento_nombre, ct.rol_nombre, ct.status, ct.signatures_json, ct.created_at, c.titulo as casting_titulo, c.productora_nombre, c.productora_id
                      FROM contracts ct
                      INNER JOIN castings c ON c.id = ct.casting_id
                      WHERE ct.id = ? LIMIT 1');
  $q->execute([$id]);
  $r = $q->fetch();
  if (!$r) json_response(404, ['detail' => 'Contrato no encontrado']);
  if ((int)$uid !== (int)$r['talento_id'] && (int)$uid !== (int)$r['productora_id']) json_response(403, ['detail' => 'No autorizado']);

  $signatures = json_decode($r['signatures_json'] ?? '[]', true);
  if (!is_array($signatures)) $signatures = [];

  $texto = "CONTRATO DE PRESTACIÓN DE SERVICIOS ARTÍSTICOS\n\n" .
           "Casting: {$r['casting_titulo']}\n" .
           "Productora: {$r['productora_nombre']}\n" .
           "Talento: {$r['talento_nombre']}\n" .
           "Rol: {$r['rol_nombre']}\n\n" .
           "1) El talento acepta participar en el casting/proyecto indicado.\n" .
           "2) Las condiciones comerciales finales serán definidas por la productora.\n" .
           "3) Este documento registra aceptación digital en GOCAST.\n";

  json_response(200, [
    'id' => (string)$r['id'],
    'casting_id' => (string)$r['casting_id'],
    'casting_titulo' => $r['casting_titulo'],
    'productora_nombre' => $r['productora_nombre'],
    'talento_nombre' => $r['talento_nombre'],
    'rol_nombre' => $r['rol_nombre'],
    'status' => $r['status'],
    'created_at' => $r['created_at'],
    'signatures' => $signatures,
    'texto' => $texto,
    'pdf_url' => '/api/contracts/' . $r['id'] . '/pdf'
  ]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al cargar contrato']);
}
