# AETHER RAZE

Matamarcianos horizontal de desplazamiento lateral para PC. Seis pantallas, seis jefes, armas cambiables, power-ups, puntuación arcade y banda sonora electrónica original sintetizada en tiempo real.

Identidad, naves, enemigos, escenarios y música son originales. El diseño se inspira en la *filosofía* del género (preciso, justo, adictivo), no en obras protegidas.

## Cómo jugar

### Windows
1. Instala [Python 3](https://www.python.org/downloads/) (opcional pero recomendado).
2. Doble clic en `game/play.bat`.
3. El juego se abre en el navegador a **1920×1080** (se adapta a la ventana, relación 16:9).
4. Pulsa **F11** para pantalla completa.

Si no hay Python, `play.bat` abre `index.html` directamente.

### Linux / macOS
```bash
cd game
python3 play.py
```
o:
```bash
chmod +x play.sh && ./play.sh
```

También puedes abrir `game/index.html` en Chrome, Edge o Firefox.

## Controles

| Acción | Teclado | Mando |
|---|---|---|
| Mover | WASD / flechas | Palanca izquierda / cruceta |
| Disparar | Espacio | A / gatillo derecho |
| Cargar disparo | Mantener disparo | Mantener disparo |
| Especial / bomba | Shift | RB |
| Foco (más lento, hitbox visible) | Ctrl | LT |
| Pausa | Esc | Start |
| Pantalla completa | F11 | — |

Todas las teclas se pueden reasignar en **Opciones → Controles**.

## Sistemas

- **Armas:** Vulcano, láser perforante, dispersión, misiles teledirigidos, disparo cargado y especial con energía/bombas.
- **Power-ups:** potencia, láser, dispersión, misiles, escudo, vida, bomba, multiplicador, velocidad.
- **Puntuación:** bajas, cadenas, bonus de jefes, bonus sin muerte, bonus de tiempo, tabla de records.
- **Dificultad:** Novato, Arcade, Veterano e Infierno (se desbloquea al terminar las 6 pantallas).
- **Progreso:** fases desbloqueadas, records y estadísticas se guardan en el navegador (`localStorage`).

## Las 6 pantallas

1. **Frontera de Acero** — ciudad industrial. Jefe: KRAST-09 Derribamuros.
2. **Océano de Titanio** — complejo abisal. Jefe: MYRION, el Vientre de Marea.
3. **Planeta Rojo** — asedio en Vhar-Kesh. Jefe: SKARATH, el Sol de Asedio.
4. **Ciudad Neón** — Noxveil, con túnel de alta velocidad. Jefe: VELA-NOVA.
5. **Mundo Biomecánico** — interior de Orthos. Jefe: ORTHOS, la Puerta Viva.
6. **El Núcleo** — clímax contra HELIXAR PRIME.

## Requisitos

- PC de gama media, navegador actual (Chrome / Edge / Firefox).
- Objetivo: **60 FPS** a 1920×1080.
- Teclado o mando compatible (API Gamepad).

## Créditos

Aether Line Studio — diseño, código, audio procedural y dirección. 2026.
