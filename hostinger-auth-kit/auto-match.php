<?php
require __DIR__ . '/config.php';
handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(405, ['detail' => 'Method Not Allowed']);

try {
  $pdo = db();
  $in = get_json_input();

  $sql = 'SELECT user_id, nombre_completo, tipo_talento, edad, ciudad, pais, altura_cm, color_pelo, color_ojos, sexo FROM perfiles_talento WHERE 1=1';
  $params = [];

  $tipo = trim((string)($in['tipo_talento'] ?? ''));
  if ($tipo !== '') { $sql .= ' AND LOWER(tipo_talento)=LOWER(?)'; $params[] = $tipo; }

  $sexo = trim((string)($in['sexo'] ?? ''));
  if ($sexo !== '') { $sql .= ' AND LOWER(sexo)=LOWER(?)'; $params[] = $sexo; }

  foreach ([['edad_min','edad','>='],['edad_max','edad','<='],['altura_min','altura_cm','>='],['altura_max','altura_cm','<=']] as $f) {
    [$inKey,$col,$op] = $f;
    $v = $in[$inKey] ?? null;
    if ($v !== null && $v !== '') { $sql .= " AND $col $op ?"; $params[] = (int)$v; }
  }

  $cp = trim((string)($in['color_pelo'] ?? ''));
  if ($cp !== '') { $sql .= ' AND LOWER(color_pelo)=LOWER(?)'; $params[] = $cp; }
  $co = trim((string)($in['color_ojos'] ?? ''));
  if ($co !== '') { $sql .= ' AND LOWER(color_ojos)=LOWER(?)'; $params[] = $co; }

  $sql .= ' ORDER BY user_id DESC LIMIT 50';

  $q = $pdo->prepare($sql);
  $q->execute($params);
  $rows = $q->fetchAll() ?: [];

  $talentos = array_map(function($r){
    return [
      'user_id' => (string)$r['user_id'],
      'nombre_completo' => $r['nombre_completo'],
      'tipo_talento' => $r['tipo_talento'],
      'edad' => (int)$r['edad'],
      'ciudad' => $r['ciudad'],
      'pais' => $r['pais'],
      'altura_cm' => (int)$r['altura_cm'],
      'color_pelo' => $r['color_pelo'],
      'color_ojos' => $r['color_ojos'],
      'sexo' => $r['sexo'],
    ];
  }, $rows);

  json_response(200, ['total_matches' => count($talentos), 'talentos' => $talentos]);
} catch (Throwable $e) {
  if (APP_ENV !== 'production') json_response(500, ['detail' => $e->getMessage()]);
  json_response(500, ['detail' => 'Error al calcular coincidencias']);
}
