# SaborExpress — Sistema Móvil de Pedidos para Restaurante (Equipo 5)

Aplicación móvil híbrida desarrollada con **React + Vite + Capacitor** para la plataforma Android.

## Instrucciones de instalación y compilación a Android Studio

1. Abre esta carpeta (`saborexpress`) en **VS Code**.
2. Abre la terminal integrada y ejecuta:
   ```bash
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. En **Android Studio**, espera a que finalice la sincronización de Gradle y presiona **Run (▶)** o genera el APK en **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.

## Credenciales de prueba rápida
* **Cliente:** `cliente@demo.com` (o botón de acceso rápido *Cliente* / *Continuar como invitado*)
* **Cocina:** `cocina@demo.com` (o botón de acceso rápido *Cocina*)
* **Administrador:** `admin@demo.com` (o botón de acceso rápido *Admin*)
