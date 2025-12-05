// movement.js

// Encapsulamos todo dentro de window.Movement
window.Movement = {
    // Variables para el movimiento del ratón
    mouseMoving: false, // Estado del movimiento del ratón
    direction: 1, // Dirección inicial: 1 para la derecha, -1 para la izquierda
    movementInterval: null, // Intervalo de movimiento
    movementTimeout: null, // Timeout para iniciar el movimiento
    stopTimeout: null, // Timeout para detener el movimiento

    baseMoveSpeed: 50, // Intervalo base en milisegundos para actualizar la posición
    moveDistance: 0.5, // Porcentaje que se mueve cada vez

    /**
     * Genera un número entero aleatorio entre min y max (inclusive).
     * @param {number} min - El valor mínimo.
     * @param {number} max - El valor máximo.
     * @returns {number} - Un número entero aleatorio entre min y max.
     */
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Inicia el movimiento aleatorio del ratón.
     */
    startRandomMovement() {
        const randomDelay = this.getRandomInt(1000, 5000);
        this.movementTimeout = setTimeout(() => {
            this.mouseMoving = true;
            this.setMoveInterval(); // Establece el intervalo de movimiento

            const randomMoveDuration = this.getRandomInt(2000, 5000);
            this.stopTimeout = setTimeout(() => {
                this.mouseMoving = false;
                clearInterval(this.movementInterval);
                this.startRandomMovement();
            }, randomMoveDuration / window.Main.currentSpeed); // Ajustar duración según la velocidad
        }, randomDelay / window.Main.currentSpeed); // Ajustar delay inicial según la velocidad
    },

    /**
     * Establece el intervalo de movimiento basado en la velocidad actual.
     */
    setMoveInterval() {
        const speedFactor = window.Main.currentSpeed || 1;
        const adjustedMoveSpeed = this.baseMoveSpeed / speedFactor;

        if (this.movementInterval) {
            clearInterval(this.movementInterval);
        }

        this.movementInterval = setInterval(() => this.moveMouse(), adjustedMoveSpeed);
    },

    /**
     * Actualiza la velocidad del movimiento.
     */
    updateMoveSpeed() {
        if (this.mouseMoving) {
            this.setMoveInterval();
        }
    },

    /**
     * Mueve el ratón en la dirección actual y detecta colisiones con comedero y palanca.
     */
    moveMouse() {
        const mouse = document.getElementById("mouse");
        const box = document.getElementById("skinnerBox");
        const comedero = document.getElementById("comedero");
        const palanca = document.getElementById("palanca");

        if (!mouse || !box || !comedero || !palanca) return;

        let currentLeft = parseFloat(mouse.style.left) || 10;
        let newLeft = currentLeft + (this.direction * this.moveDistance);

        // Cambia dirección si llega a los bordes
        if (newLeft > 90) {
            newLeft = 90;
            this.direction = -1;
            mouse.classList.remove("looking-right");
            mouse.classList.add("looking-left"); // Mirando a la izquierda
        } else if (newLeft < 10) {
            newLeft = 10;
            this.direction = 1;
            mouse.classList.remove("looking-left");
            mouse.classList.add("looking-right"); // Mirando a la derecha
        }

        mouse.style.left = `${newLeft}%`;

        // Detecta colisión con el comedero
        if (window.Main.deviceStates.comedero.active && this.checkCollision(mouse, comedero)) {
            this.stopToEat(mouse, comedero);
        }

        // Detecta colisión con la palanca
        if (this.checkCollision(mouse, palanca)) {
            this.handlePalancaInteraction();
        } else {
            // Si no hay colisión, restablece la bandera de interacción
            window.Main.palancaTouched = false;
        }
    },

    /**
     * Maneja la interacción con la palanca con una probabilidad del 4%.
     */
    handlePalancaInteraction() {
        if (window.Main.cooldownStates.palanca || window.Main.palancaTouched) return; // Evitar interacción si está en enfriamiento o ya interactuó

        const chance = this.getRandomInt(0, 99);
        if (chance < 4) { // 4% de probabilidad
            // Alterna el estado de la palanca a través de main.js
            const newState = !window.Main.deviceStates.palanca.active;
            window.Main.handlePalancaActivation(newState);

            // Activar el enfriamiento
            window.Main.cooldownStates.palanca = true;
            setTimeout(() => {
                window.Main.cooldownStates.palanca = false; // Desactivar enfriamiento después de 1 segundo ajustado
            }, 1000 / window.Main.currentSpeed);

            // Marcar que ya se interactuó con la palanca en esta colisión
            window.Main.palancaTouched = true;
        }
    },

    /**
     * Comprueba si el ratón está dentro del área de un dispositivo.
     * @param {HTMLElement} mouse - Elemento del ratón.
     * @param {HTMLElement} device - Elemento del dispositivo.
     * @returns {boolean} - True si hay colisión.
     */
    checkCollision(mouse, device) {
        const mouseRect = mouse.getBoundingClientRect();
        const deviceRect = device.getBoundingClientRect();

        // Reducir virtualmente el área de colisión del dispositivo
        const adjustedDevice = {
            top: deviceRect.top + 10,       // Ajuste en el margen superior
            left: deviceRect.left + 10,     // Ajuste en el margen izquierdo
            right: deviceRect.right - 10,   // Ajuste en el margen derecho
            bottom: deviceRect.bottom - 10  // Ajuste en el margen inferior
        };

        // Comprobación de colisión con los límites ajustados
        return !(
            mouseRect.right < adjustedDevice.left ||
            mouseRect.left > adjustedDevice.right ||
            mouseRect.bottom < adjustedDevice.top ||
            mouseRect.top > adjustedDevice.bottom
        );
    },

    /**
     * Detiene al ratón para comer durante 5 segundos.
     * @param {HTMLElement} mouse - Elemento del ratón.
     * @param {HTMLElement} comedero - Elemento del comedero.
     */
    stopToEat(mouse, comedero) {
        clearInterval(this.movementInterval); // Detiene el movimiento
        clearTimeout(this.stopTimeout); // Asegura que no haya timeouts pendientes
        this.mouseMoving = false;

        // Remueve las clases de dirección para evitar conflictos
        mouse.classList.remove("looking-left", "looking-right");

        // Inclina el ratón en la dirección de la marcha
        if (this.direction === 1) {
            mouse.classList.add("eating-right");
        } else {
            mouse.classList.add("eating-left");
        }

        // Calcula la posición correcta para detener el ratón
        const comederoRect = comedero.getBoundingClientRect(); // Coordenadas del comedero
        const boxRect = document.getElementById("skinnerBox").getBoundingClientRect(); // Coordenadas de la caja
        const mouseRect = mouse.getBoundingClientRect(); // Coordenadas del ratón

        // Calcula el centro del comedero relativo a la caja
        const comederoCenter = ((comederoRect.left + comederoRect.right) / 2) - boxRect.left;

        // Calcula la posición deseada del ratón basada en la dirección
        let desiredLeftPercentage;

        if (this.direction === 1) {
            // Ratón moviéndose de izquierda a derecha
            // Queremos que la parte derecha del ratón esté alineada con el centro del comedero
            const mouseWidth = (mouseRect.width / boxRect.width) * 100;
            desiredLeftPercentage = (comederoCenter / boxRect.width) * 100 - (mouseWidth / 2);
        } else {
            // Ratón moviéndose de derecha a izquierda
            desiredLeftPercentage = (comederoCenter / boxRect.width) * 100;
        }

        // Asegura que la posición no se salga de los límites
        desiredLeftPercentage = Math.max(0, Math.min(desiredLeftPercentage, 100 - (mouseRect.width / boxRect.width * 100)));

        // Actualiza la posición horizontal del ratón con una transición suave
        mouse.style.transition = "left 0.3s ease-in-out";
        mouse.style.left = `${desiredLeftPercentage}%`;

        // Opcional: Restablecer la transición después de que termine
        setTimeout(() => {
            mouse.style.transition = "";
        }, 300); // Coincide con la duración de la transición

        // Registrar el evento de detención para comer
        window.Main.logEvent("Detención para Comer", {
            dirección: this.direction === 1 ? "derecha" : "izquierda",
            posición: `${desiredLeftPercentage}%`
        });

        // Espera 5 segundos mientras come
        setTimeout(() => {
            // Recupera posición vertical del ratón
            mouse.classList.remove("eating-right", "eating-left");

            // Vuelve a agregar la clase de dirección
            window.Main.setInitialMouseDirection();

            // Desactiva el comedero a través de main.js para asegurar el registro correcto
            window.Main.automateDevice("comedero", false);
            window.Main.logEvent("Desactivación Automática", "comedero");

            // Reanuda el movimiento
            this.startRandomMovement();
        }, 5000 / window.Main.currentSpeed); // Ajustar el tiempo según la velocidad
    }
};

// Inicializa el movimiento al azar al cargar
document.addEventListener("DOMContentLoaded", () => {
    // Establece la dirección inicial del ratón
    window.Main.setInitialMouseDirection();
    // Inicia el movimiento aleatorio
    window.Movement.startRandomMovement();
});

// Hacemos accesible la función updateMoveSpeed
window.updateMoveSpeed = window.Movement.updateMoveSpeed.bind(window.Movement);
