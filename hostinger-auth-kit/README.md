# Hostinger Auth Kit (PHP + MySQL)

Archivos mínimos para habilitar **registro/login** compatibles con tu frontend actual (`/api/register`, `/api/login`, `/api/verify-token`).

## 1) Crear tabla
En phpMyAdmin, ejecutar `schema.sql`.

## 2) Subir archivos
Sube estos archivos a `public_html/api/`:
- `config.php` (copiar desde `config.example.php` y completar)
- `register.php`
- `login.php`
- `verify-token.php`
- `.htaccess`

## 3) Configurar frontend
En frontend:
```env
REACT_APP_BACKEND_URL=https://TU-DOMINIO
```

## 4) Probar endpoints
```bash
curl -X POST https://TU-DOMINIO/api/register \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Test","email":"test@example.com","password":"123456","tipo_usuario":"talento","acepta_terminos":true}'

curl -X POST https://TU-DOMINIO/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"123456"}'
```

## Notas rápidas
- Usa `password_hash` / `password_verify` (ya incluido).
- Cambia `JWT_SECRET` por uno robusto.
- En producción, fija `ALLOWED_ORIGIN` al dominio real.
