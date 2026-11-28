# Pruebas unitarias · Épica 4 · Sprint 4

## Alcance

La tabla de casos de pantalla contiene 23 pruebas unitarias de caja negra (HE4-S4-I1-PU001–PU023) para la Épica 4 (Sprint 4): comunicarse con un asesor por WhatsApp (HE4-HU1), consultar el historial de pedidos (HE4-HU2), consultar el detalle de un pedido (HE4-HU3) y volver a comprar desde el historial (HE4-HU4). El detalle está en [Casos_HE4-S4.md](Casos_HE4-S4.md).

| Historia | Casos | Resultado |
|---|---|---|
| HE4-HU1 · Botón de WhatsApp | PU001–PU010 | 10 OK |
| HE4-HU2 · Historial de pedidos | PU011–PU015 | 5 OK |
| HE4-HU3 · Detalle del pedido | PU016–PU018 | 3 OK |
| HE4-HU4 · Volver a comprar | PU019–PU023 | 5 OK |

## Cómo ejecutar

Las pruebas automáticas del proyecto se ejecutan desde la carpeta de cada parte:

```bash
cd Backend
npm test

cd ../Frontend
npm test
```

## Estado

| Iteración | Fecha | Casos | Resultado | Motivo | Excel |
|---|---|---|---|---|---|
| 1 | 24/11/2026 | 23 (PU001–PU023) | 23 OK, 0 NOK | Primera ejecución de la Épica 4 sobre el código de las ramas HE4-HU1 a HE4-HU4. | [Excel · Iteración 1](https://docs.google.com/spreadsheets/d/1JXkivUm--sc8OIgztae_QJXPEK2oy1EoN-pIzp-V2Jg/edit?gid=475146260#gid=475146260) |

### Observaciones de la Iteración 1

- **D-01** (severidad baja, abierta): el botón flotante de WhatsApp tapa parte de los controles del carrito cuando la ventana es más pequeña que el lienzo del Figma (1440×1024). Tapa el campo «Dirección de envío» a 1200×746 y parte del selector de método de pago a 1024×768 y en celular. Se vio al revisar las capturas de PU006 y PU019 a PU022. No hizo fallar ningún caso, porque el botón sigue funcionando. Archivos: `Frontend/src/componentes/BotonWhatsApp.css` y `Frontend/src/paginas/Carrito.css`.

## Límites de estas pruebas

Los casos se ejecutaron con el backend real (Express) y el Oracle simulado en memoria de `Backend/pruebas/ayudasCompras.js`, no con un Oracle real. La consulta del historial (`LEFT JOIN` con `SUM`) no se ha comprobado contra la base real.

WhatsApp es un servicio externo: las pruebas llegan hasta que se abre wa.me con el número y el mensaje correctos. No se envió ningún mensaje ni se probó la atención del asesor.

El Excel de historias de usuario de la Épica 4 ubica «Volver a comprar» en el detalle del pedido, pero el Figma del Sprint 4 lo muestra en cada fila del historial. Los casos PU019 a PU023 prueban lo que muestra el Figma.

Las pruebas automáticas HE4-S4-PU001–PU016 de `Backend/pruebas/HE4-S4.test.js` y las de `Frontend/src/whatsapp.test.js`, `Frontend/src/historial.test.js` y `Frontend/src/carrito.test.js` son independientes de los casos de pantalla HE4-S4-I1-PU001–PU023. La tabla de [Casos_HE4-S4.md](Casos_HE4-S4.md) recoge únicamente estos últimos y relaciona cada uno con su prueba automática. El prefijo I1 identifica la familia de casos de pantalla, no la iteración en la que se ejecutaron.

## Excel de referencia

- [Iteración 1 · ejecución del 24/11/2026 (versión actual)](https://docs.google.com/spreadsheets/d/1JXkivUm--sc8OIgztae_QJXPEK2oy1EoN-pIzp-V2Jg/edit?gid=475146260#gid=475146260)
