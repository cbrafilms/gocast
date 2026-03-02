<?php
// Copiar como config.php y completar con credenciales reales.

define('DB_HOST', 'localhost');
define('DB_NAME', 'TU_DB');
define('DB_USER', 'TU_USUARIO_DB');
define('DB_PASS', 'TU_PASSWORD_DB');

define('APP_ENV', 'production');
define('JWT_SECRET', 'CAMBIA_ESTA_CLAVE_SUPER_LARGA'); // mínimo 32 chars

define('ALLOWED_ORIGIN', '*'); // en prod ideal: https://tudominio.com

function json_response(int $status, array $data): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function handle_cors(): void {
  header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  return $pdo;
}

function get_json_input(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function base64url_encode(string $data): string {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function create_jwt(array $payload, int $ttlSeconds = 604800): string {
  $now = time();
  $header = ['alg' => 'HS256', 'typ' => 'JWT'];
  $payload['iat'] = $now;
  $payload['exp'] = $now + $ttlSeconds;

  $h = base64url_encode(json_encode($header));
  $p = base64url_encode(json_encode($payload));
  $sig = hash_hmac('sha256', "$h.$p", JWT_SECRET, true);
  $s = base64url_encode($sig);

  return "$h.$p.$s";
}

function verify_jwt(string $jwt): ?array {
  $parts = explode('.', $jwt);
  if (count($parts) !== 3) return null;
  [$h, $p, $s] = $parts;

  $calc = base64url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
  if (!hash_equals($calc, $s)) return null;

  $payload = json_decode(base64_decode(strtr($p, '-_', '+/')), true);
  if (!is_array($payload)) return null;
  if (($payload['exp'] ?? 0) < time()) return null;

  return $payload;
}
