# Test de Stroop (Records)

## Autor
**Tomás Cuesta**

## Descripción del Proyecto
"Test de Stroop" es una aplicación interactiva que implementa el famoso test de Stroop, diseñado para evaluar la capacidad de los usuarios de identificar el color de la tinta de palabras que representan diferentes colores, ignorando el significado de las palabras en sí. Este test es ampliamente utilizado en Psicología y Neurociencia para estudiar la atención selectiva y la inhibición de respuestas automáticas. Esta aplicación ofrece al alumnado una herramienta educativa para explorar cómo el cerebro maneja información conflictiva en tiempo real.

El programa muestra palabras de colores ("Rojo", "Verde", "Azul", etc.) en tintas que pueden no coincidir con el significado de la palabra, y el usuario debe seleccionar el color de la tinta, no el de la palabra. Este proceso permite al alumnado experimentar y reflexionar sobre el procesamiento visual y lingüístico, observando los desafíos que esta interferencia representa para el cerebro.

## Relación con el Test de Stroop y la Psicología Cognitiva
El test de Stroop es una prueba clásica de interferencia cognitiva en la que los participantes deben ignorar el significado de una palabra (por ejemplo, "Azul") y centrarse solo en el color de la tinta (por ejemplo, rojo). Este proceso activa la atención selectiva y el control inhibitorio, ya que el cerebro debe inhibir una respuesta automática para responder correctamente al color. 

La aplicación de esta prueba permite al alumnado explorar principios de la teoría cognitiva de la atención y el control inhibitorio, aspectos esenciales en Psicología. Les ofrece una experiencia práctica para observar el desarrollo de procesos mentales complejos en presencia de información conflictiva, ayudándoles a comprender las respuestas cognitivas.

## Cómo Usar el Programa
1. **Abrir el Programa**: La aplicación se puede ejecutar en cualquier navegador moderno (Chrome, Firefox, Edge, etc.).
2. **Iniciar el Test**: Haz clic en el botón "Iniciar" en la pantalla de bienvenida para comenzar el ejercicio.
3. **Selección de Respuestas**: 
   - El programa mostrará una palabra con un color de tinta específico. Selecciona el color de la tinta en la lista de opciones.
   - Ignora el significado de la palabra y concéntrate únicamente en el color de la tinta.
   - Si seleccionas un color incorrecto, aparecerá una cruz negra en la pantalla durante un breve momento, acompañada de un sonido de zumbido generado por la Web Audio API. Deberás intentar de nuevo hasta elegir el color correcto.
4. **Resultados**: Al final de la prueba, el programa muestra los resultados:
   - **Tiempo Total**: Indica el tiempo total que has tardado en completar el test.
   - **Errores**: Muestra la cantidad de respuestas incorrectas registradas durante el test.
5. **Reiniciar el Test**: Al finalizar, podrás reiniciar el test haciendo clic en el botón "Reiniciar" para repetir el ejercicio con un nuevo orden aleatorio de palabras y colores.

## Tecnologías Utilizadas
- **HTML** y **CSS**: Para la estructura y diseño visual de la interfaz.
- **JavaScript**: Para la lógica de visualización, generación aleatoria de palabras y colores, y manejo de la interacción del usuario.
- **Web Audio API**: Para generar un sonido de zumbido cuando el usuario selecciona una respuesta incorrecta, mejorando la retroalimentación.

## Propósito Educativo
El objetivo de este programa es proporcionar al alumnado una herramienta interactiva para explorar el efecto Stroop y comprender los procesos cognitivos de atención selectiva e inhibición de respuestas automáticas. Es una herramienta educativa útil en clases de Psicología y Neurociencia, donde el alumnado puede experimentar cómo el cerebro enfrenta tareas que requieren control cognitivo frente a la interferencia.
