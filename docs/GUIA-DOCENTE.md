# Guía para el docente: La Finca Matemática

Esta guía explica cómo instalar la aplicación, crear perfiles, usar el panel docente y exportar los datos. La aplicación funciona sin internet una vez instalada.

## 1. Instalar la aplicación en los celulares

Hay tres formas (los detalles técnicos están en el README):

- **Con señal de internet** (por ejemplo, en el pueblo): abra en Chrome la dirección donde está publicada la aplicación, espere el aviso **«Lista para usar sin internet»** y toque **«Instalar en este celular»**. Si no aparece la ventana, abra el menú ⋮ de Chrome y elija **«Agregar a pantalla de inicio»** o **«Instalar aplicación»**.
- **En iPhone o iPad**: abra la dirección en **Safari** (o en Chrome con iOS 16.4 o superior). La app muestra los pasos: botón **Compartir** → **«Agregar a inicio»** → **«Agregar»**. Ojo: lo jugado en Safari no pasa a la app instalada; instálela antes de crear perfiles o use «Exportar copia» / «Importar copia» en Ajustes.
- **Si el enlace llegó por WhatsApp o Facebook**: ábralo primero en Chrome (Android) o Safari (iPhone). Dentro de esas aplicaciones no se puede instalar; la app lo avisa y ofrece un botón para abrirla en el navegador.
- Mientras la app no esté instalada, **cada vez que se abra desde el navegador** aparecerá la invitación para instalarla (con «Ahora no» se oculta hasta la próxima vez).
- **Desde el computador del colegio**, por la red local. Lea en el README la nota sobre HTTPS: sin HTTPS, la app no queda guardada para usarla sin conexión.
- **Con el archivo APK**: cópielo al celular por cable, memoria o Bluetooth y ábralo. Hay que permitir *Instalar apps de fuentes desconocidas*.

Para comprobar la instalación, active el **modo avión** y abra la app: debe funcionar igual.

## 2. Crear perfiles

1. En la primera pantalla, el niño o la niña toca **«Soy estudiante»**.
2. Elige su **grado** (1.º a 5.º) y un **personaje**.
3. La aplicación crea un **apodo** (por ejemplo, «Mazorca Veloz 27») y un **código anónimo** (por ejemplo, `FM-3-K7Q2`, donde el 3 es el grado). El apodo se puede cambiar, pero recomiende no usar el nombre real.
4. Empieza directamente en el **nivel 0**, un tutorial que enseña a tocar, arrastrar y usar el teclado.

Como los celulares se comparten, cada celular admite **varios perfiles**. Al abrir la app aparece **«¿Quién va a jugar?»** con los personajes guardados y el botón **«Nuevo jugador»**.

**Sugerencia:** anote en su cuaderno qué código corresponde a cada estudiante. Así cruza los datos exportados sin guardar nombres en el celular.

Las familias crean su propio perfil con **«Soy papá, mamá o cuidador»**. Encuentran problemas para adultos (compras, jornales, cosecha, porcentajes), consejos para acompañar a sus hijos y el avance de los niños del celular.

## 3. Cómo funciona el juego

- Cada grado tiene **niveles del 0 al 100** que se desbloquean de uno en uno.
- Un nivel tiene **5 ejercicios** (4 en 1.º). Se aprueba con 4 de 5 (3 de 4 en 1.º).
- **Estrellas:** 3 sin errores ni pistas, 2 con una ayuda y 1 con más ayudas.
- Si no aprueba, puede repetir con ejercicios nuevos. Después de **dos intentos fallidos**, se ofrece un **repaso** con ejercicios un poco más fáciles y pistas visibles. Nunca se pierde progreso ni semillas.
- Los niveles 10, 20, 30… son **niveles de cosecha**: repasan lo de la decena anterior y dan una insignia.
- Cada ejercicio tiene **tres pistas**: una pregunta, un dibujo y un paso resuelto. Después se muestra la solución explicada y un ejercicio parecido para practicar.
- Ante un error, la app reconoce errores típicos y responde con un mensaje específico: suma sin llevar, resta del menor al mayor, operación equivocada, tabla vecina, residuo ignorado o conteo.
- **Semillas, planta e insignias** premian la constancia, no la velocidad. No hay clasificaciones entre estudiantes ni cronómetros.
- **Silo de la escuela:** reúne las semillas de todos los perfiles del celular. Cuando se llena, hay una celebración colectiva.
- **Reto en pareja:** dos estudiantes de grados cercanos (máximo un grado de diferencia) resuelven por turnos los pasos de un problema en el mismo celular.

**Cambiar de grado:** en **Ajustes → Cambiar grado**, un adulto resuelve una multiplicación sencilla para confirmar. El progreso de cada grado se guarda por separado.

## 4. Panel docente

1. En la pantalla de inicio o en «¿Quién va a jugar?», **mantenga presionado el logo durante 3 segundos**.
2. La primera vez, **cree un PIN** de 4 a 6 cifras y repítalo. Las siguientes veces se pide ese PIN.
3. El panel muestra una tabla por perfil con:
   - código y grado;
   - nivel máximo alcanzado y estrellas;
   - porcentaje de aciertos por operación (suma, resta, multiplicación, división), con el número de ejercicios entre paréntesis;
   - los tipos de error más frecuentes.
4. En la misma tabla puede **reiniciar** un perfil (borra niveles, semillas y registro) o **eliminarlo**. Ambas acciones piden confirmación.

Si olvida el PIN, restaure una copia de seguridad o borre los datos del sitio en Chrome. Al borrar los datos se pierden los avances.

## 5. Modo investigación

- Viene **desactivado**. Al activarlo, la app guarda un registro detallado de cada ejercicio: fecha, nivel, plantilla, operación, si fue correcto, intentos, pistas usadas, tipo de error y tiempo. Guarda como máximo 3.000 registros por perfil y borra los más antiguos.
- **Actívelo solo con el consentimiento informado firmado por las familias**, como lo exige la tesis.
- Con el modo apagado, la app guarda solo los resúmenes agregados que muestra la tabla.

## 6. Exportar los datos

En el panel docente, **«Exportar datos»** descarga archivos al celular, sin internet:

- **Resumen CSV:** una fila por perfil con nivel, estrellas, porcentajes por operación y errores frecuentes. Se abre en Excel o LibreOffice.
- **Registro CSV:** una fila por ejercicio; solo tiene datos si el modo investigación estuvo activo.
- **JSON:** todo lo anterior en un solo archivo para análisis.

Los archivos usan **códigos, nunca apodos ni nombres**. Quedan en la carpeta *Descargas* del celular; desde ahí puede pasarlos al computador por cable o Bluetooth.

## 7. Copia de seguridad

En **Ajustes → Copia de seguridad**:

- **Exportar copia** guarda un archivo `.json` con todos los perfiles y avances del celular. Hágalo con frecuencia, por ejemplo cada semana.
- **Importar copia** (requiere confirmación de un adulto) **reemplaza** los datos del celular por los de la copia. Sirve si se cambia de celular o se borraron los datos.

## 8. Videos de ayuda

Cada lección trae un video corto de YouTube en español, y las familias tienen una guía de videos en *Cuaderno de la finca → Videos para acompañar en casa*. En los ejercicios, el video aparece cuando el niño pide dos o más pistas o ve la solución.

- Necesitan internet; sin señal la app avisa y todo lo demás funciona igual.
- Se pueden apagar en **Ajustes → Videos de ayuda de YouTube** (por ejemplo, durante el pilotaje o si el colegio lo prefiere).
- La lista completa, con enlaces y una columna para marcar la revisión, está en [VIDEOS.md](VIDEOS.md). Revíselos antes de usarlos con los niños: son de terceros y pueden cambiar.

## 9. Recomendaciones de uso

- Sesiones cortas, de 10 a 20 minutos, con el teléfono en vertical.
- En el aula multigrado, organice turnos y anime a los estudiantes a ayudarse: el reto en pareja está pensado para eso.
- Use los resultados para decidir qué reforzar, no como nota.
- Si un estudiante está bloqueado en un nivel, el repaso con pistas le permite avanzar. Acompáñelo con material concreto (granos, piedritas, tapas).
- Antes de usarla con estudiantes, la plataforma debe pasar por la validación de expertos y el pilotaje previstos en la tesis (apartado 5.8).
