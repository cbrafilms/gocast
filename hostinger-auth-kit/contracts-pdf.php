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

function pdf_escape($s) {
  return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);
}

try {
  $pdo = db();
  $uid = auth_user_id();
  $q = $pdo->prepare('SELECT ct.id, ct.talento_id, ct.talento_nombre, ct.rol_nombre, ct.status, ct.created_at, c.titulo as casting_titulo, c.productora_nombre, c.productora_id
                      FROM contracts ct INNER JOIN castings c ON c.id = ct.casting_id WHERE ct.id = ? LIMIT 1');
  $q->execute([$id]);
  $r = $q->fetch();
  if (!$r) json_response(404, ['detail' => 'Contrato no encontrado']);
  if ((int)$uid !== (int)$r['talento_id'] && (int)$uid !== (int)$r['productora_id']) json_response(403, ['detail' => 'No autorizado']);

  $lines = [
    'CONTRATO GOCAST',
    'Casting: ' . $r['casting_titulo'],
    'Productora: ' . $r['productora_nombre'],
    'Talento: ' . $r['talento_nombre'],
    'Rol: ' . $r['rol_nombre'],
    'Estado: ' . $r['status'],
    'Fecha: ' . $r['created_at'],
    '---',
    'Documento generado por GOCAST'
  ];

  $content = "BT /F1 12 Tf 50 780 Td ";
  $first = true;
  foreach ($lines as $ln) {
    if (!$first) $content .= " T* ";
    $content .= "(" . pdf_escape($ln) . ") Tj";
    $first = false;
  }
  $content .= " ET";

  $objs = [];
  $objs[] = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj";
  $objs[] = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj";
  $objs[] = "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj";
  $objs[] = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj";
  $objs[] = "5 0 obj << /Length " . strlen($content) . " >> stream\n" . $content . "\nendstream endobj";

  $pdf = "%PDF-1.4\n";
  $offsets = [0];
  foreach ($objs as $o) {
    $offsets[] = strlen($pdf);
    $pdf .= $o . "\n";
  }
  $xref = strlen($pdf);
  $pdf .= "xref\n0 " . (count($objs) + 1) . "\n";
  $pdf .= "0000000000 65535 f \n";
  for ($i = 1; $i <= count($objs); $i++) {
    $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
  }
  $pdf .= "trailer << /Size " . (count($objs) + 1) . " /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";

  header('Content-Type: application/pdf');
  header('Content-Disposition: attachment; filename="contrato-' . $id . '.pdf"');
  echo $pdf;
  exit;
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al generar PDF']);
}
