// main.js

// Encapsulamos todo dentro de window.Main
window.Main = {
    // Variables globales
    rewardCount: 0, // Contador de recompensas
    punishmentCount: 0, // Contador de castigos
    utCount: 0, // Contador de Unidades Temporales
    nextSong: "css/macarena.mp3", // Canción configurada para la próxima activación
    currentSpeed: 1, // Velocidad inicial (1x)

    // Estados de los dispositivos con modos de activación
    deviceStates: {
        palanca: { active: false, activationMode: "mouse" },      // D1 - Palanca, solo ratón
        comedero: { active: false, activationMode: "both" },      // D2 - Comedero, manual y automático
        altavoz: { active: false, activationMode: "both" },       // D3 - Altavoz, manual y automático
        luz: { active: false, activationMode: "user" },           // D4 - Luz principal, solo manual
        luz2: { active: false, activationMode: "user" },          // D5 - Luz secundaria, solo manual
        rejilla: { active: false, activationMode: "both" }        // D6 - Rejilla eléctrica, manual y automático
    },

    // Estados del selector de canciones
    songs: {
        left: "css/macarena.mp3", // Canción para la posición izquierda
        right: "css/sultans.mp3"  // Canción para la posición derecha
    },

    // Estados de enfriamiento para dispositivos
    cooldownStates: {
        palanca: false, // Enfriamiento para la palanca
    },

    // Bitácora de eventos
    log: [], // Array para almacenar los eventos

    // Bandera para detectar si ya se ha interactuado con la palanca en la actual colisión
    palancaTouched: false,

    // Instancia del odómetro
    odometer: null,

    // Intervalo del reloj de UT
    utClockInterval: null,

    /**
     * Clase Odometer para implementar el contador con animación de rodillo
     */
    Odometer: class {
        constructor(element) {
            this.element = element;
            this.value = 0;
            this.digits = [];
            this.init();
        }

        init() {
            this.render();
        }

        render() {
            const valueStr = String(this.value).padStart(4, '0');
            this.digits = valueStr.split('');
            this.element.innerHTML = '';
            this.digits.forEach(digit => {
                const digitElement = document.createElement('div');
                digitElement.className = 'odometer-digit';
                digitElement.innerHTML = `
                    <div class="odometer-digit-inner">
                        ${Array.from({ length: 10 }, (_, i) => `<div class="odometer-value">${i}</div>`).join('')}
                    </div>
                `;
                this.element.appendChild(digitElement);
            });
            this.updateUI();
        }

        update(newValue) {
            this.value = newValue;
            this.updateUI();
        }

        updateUI() {
            const valueStr = String(this.value).padStart(4, '0');
            this.digits.forEach((digit, index) => {
                const currentDigitElement = this.element.children[index];
                const inner = currentDigitElement.querySelector('.odometer-digit-inner');
                const targetValue = parseInt(valueStr[index], 10);
                inner.style.transform = `translateY(-${targetValue * 10}%)`;
            });
        }
    },

    /**
     * Función de inicialización.
     * Se ejecuta cuando el DOM está completamente cargado.
     */
    initialize() {
        console.log("Inicializando Caja de Skinner...");
        this.setupDevices();
        this.setupSongSlider(); // Configura el deslizador de canciones
        this.setupSpeedControls(); // Configura los controles de velocidad
        this.updateInstructions("Comienza el condicionamiento.");
        this.initializeOdometer(); // Inicializa el odómetro
        this.startUTClock(); // Iniciar el reloj de Unidades Temporales
        this.setupDownloadButton(); // Configurar el botón de descarga
        // La función setInitialMouseDirection() se llama desde movement.js al cargar
    },

    /**
     * Inicializa el odómetro para mostrar las unidades temporales.
     */
    initializeOdometer() {
        const odometerElement = document.getElementById('contador');
        if (odometerElement) {
            this.odometer = new this.Odometer(odometerElement);
            this.odometer.update(this.utCount);
        } else {
            console.error("No se encontró el elemento con ID 'contador' para el odómetro.");
        }
    },

    /**
     * Configura el deslizador de canciones.
     */
    setupSongSlider() {
        const songSlider = document.getElementById("songSlider");

        if (!songSlider) {
            console.error("No se encontró el deslizador de canciones.");
            return;
        }

        // Establecer posición inicial si no está definida
        if (!songSlider.getAttribute("data-position")) {
            songSlider.setAttribute("data-position", "left");
        }

        // Escucha clics en el deslizador
        songSlider.addEventListener("click", () => {
            // Alternar entre posiciones izquierda y derecha
            const currentPosition = songSlider.getAttribute("data-position");
            const newPosition = currentPosition === "left" ? "right" : "left";

            // Actualizar la posición del deslizador
            songSlider.setAttribute("data-position", newPosition);

            // Actualizar la canción configurada para la próxima activación
            this.nextSong = this.songs[newPosition];

            console.log(`Posición del deslizador cambiada a: ${newPosition}. Próxima canción configurada: ${this.nextSong}`);
        });
    },

    /**
     * Configura los controles de velocidad.
     */
    setupSpeedControls() {
        const speedButtons = document.querySelectorAll('.speed-button');

        speedButtons.forEach(button => {
            button.addEventListener('click', () => {
                const speed = parseInt(button.getAttribute('data-speed'), 10);
                this.changeSpeed(speed);

                // Actualiza el estado visual de los botones
                speedButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    },

    /**
     * Cambia la velocidad del temporizador y del movimiento del ratón.
     * @param {number} speed - Nueva velocidad (1 = normal, 2 = doble, 4 = cuádruple).
     */
    changeSpeed(speed) {
        this.currentSpeed = speed;

        // Notifica a Movement.js sobre el cambio de velocidad
        if (window.Movement) {
            window.Movement.updateMoveSpeed();
        }

        // Reinicia el temporizador de UT con la nueva velocidad
        clearInterval(this.utClockInterval);
        this.startUTClock();

        console.log(`Velocidad cambiada a ${speed}x`);

        // Registrar el evento de cambio de velocidad
        this.logEvent("Cambio de Velocidad", `Velocidad ajustada a ${speed}x`);
    },

    /**
     * Inicia el reloj de Unidades Temporales (UT).
     */
    startUTClock() {
        const baseInterval = 5000; // Intervalo base de 5 segundos
        const adjustedInterval = baseInterval / this.currentSpeed; // Ajustar según la velocidad

        this.utClockInterval = setInterval(() => {
            this.utCount++; // Incrementar el contador de UT
            if (this.odometer) {
                this.odometer.update(this.utCount); // Actualizar el odómetro
            } else {
                console.error("El odómetro no está inicializado.");
            }
        }, adjustedInterval);
    },

    /**
     * Establece la dirección inicial del ratón basada en la variable 'direction'.
     */
    setInitialMouseDirection() {
        const mouse = document.getElementById("mouse");
        if (mouse) {
            mouse.classList.remove("looking-left", "looking-right");
            if (window.Movement.direction === 1) {
                mouse.classList.add("looking-right"); // Mirando a la derecha
            } else {
                mouse.classList.add("looking-left"); // Mirando a la izquierda
            }
        }
    },

    /**
     * Configura los dispositivos interactivos.
     */
    setupDevices() {
        const devices = ["palanca", "comedero", "altavoz", "luz", "luz2", "rejilla"];
        const audioElement = document.getElementById("altavozSound");

        // Registrar el evento 'ended' para reiniciar el audio si el altavoz sigue activo
        if (audioElement) {
            audioElement.addEventListener("ended", () => {
                if (this.deviceStates.altavoz.active) {
                    audioElement.currentTime = 0; // Reiniciar el audio
                    audioElement.play();         // Reproducir nuevamente
                }
            });
        }

        // Vincula eventos a todos los dispositivos
        devices.forEach((deviceId) => {
            const deviceElement = document.getElementById(deviceId);
            if (deviceElement) {
                deviceElement.addEventListener("click", () => this.handleDeviceInteraction(deviceId));
            }
        });
    },

    /**
     * Maneja las interacciones con los dispositivos.
     * @param {string} deviceId - ID del dispositivo que se ha activado.
     */
    handleDeviceInteraction(deviceId) {
        const device = this.deviceStates[deviceId];
        if (!device) return;

        // Verificar si el dispositivo puede activarse por el usuario
        if (device.activationMode === "mouse") {
            console.warn(`El dispositivo ${deviceId} no puede ser activado manualmente.`);
            return;
        }

        // Alternar el estado del dispositivo
        const isActivating = !device.active;

        // Desactivar otros dispositivos manuales si se está activando este
        if (isActivating && (device.activationMode === "user" || device.activationMode === "both")) {
            this.deactivateOtherManualDevices(deviceId);
        }

        device.active = isActivating;
        this.updateDeviceState(deviceId);

        // Reproducir o detener sonido si es el altavoz
        if (deviceId === "altavoz") {
            const altavozSound = document.getElementById("altavozSound");
            if (altavozSound) {
                if (device.active) {
                    altavozSound.src = this.nextSong; // Establecer la canción configurada
                    altavozSound.currentTime = 0;    // Reiniciar desde el inicio
                    altavozSound.play();             // Reproducir el sonido

                    // Obtener el nombre de la canción desde la ruta
                    const songName = this.nextSong.split('/').pop().replace('.mp3', '');

                    // Registrar el evento con la información de la canción
                    this.logEvent("Activación manual", deviceId, `Canción: ${songName}`);
                } else {
                    altavozSound.pause();
                    altavozSound.currentTime = 0;    // Detén y reinicia el sonido

                    // Registrar el evento sin información adicional
                    this.logEvent("Desactivación manual", deviceId);
                }
            }
        } else {
            // Registrar el evento sin información adicional para otros dispositivos
            const action = device.active ? "Activación manual" : "Desactivación manual";
            this.logEvent(action, deviceId);
        }

        // Mensajes específicos según el dispositivo
        const deviceNames = {
            palanca: "Palanca",
            comedero: "Comedero",
            altavoz: "Altavoz",
            luz: "Luz principal",
            luz2: "Luz secundaria",
            rejilla: "Rejilla eléctrica"
        };
        this.updateInstructions(`${deviceNames[deviceId]} se ha ${device.active ? "activado" : "desactivado"}.`);

        this.updateCounters(); // Actualizar contadores
    },

    /**
     * Desactiva todos los dispositivos manuales excepto el especificado.
     * @param {string} exceptionId - ID del dispositivo que no debe desactivarse.
     */
    deactivateOtherManualDevices(exceptionId) {
        Object.keys(this.deviceStates).forEach((deviceId) => {
            const device = this.deviceStates[deviceId];
            if ((device.activationMode === "user" || device.activationMode === "both") && deviceId !== exceptionId) {
                if (device.active) {
                    // Desactiva el dispositivo
                    device.active = false;
                    this.updateDeviceState(deviceId);

                    // Lógica adicional para dispositivos específicos
                    if (deviceId === "altavoz") {
                        const altavozSound = document.getElementById("altavozSound");
                        if (altavozSound) {
                            altavozSound.pause();
                            altavozSound.currentTime = 0; // Reinicia el sonido
                        }
                    }

                    // Registrar el evento
                    this.logEvent("Desactivación manual automática", deviceId);
                }
            }
        });
    },

    /**
     * Maneja la activación o desactivación de la Palanca (D1) por parte del ratón.
     * @param {boolean} activate - Estado deseado (true para activar, false para desactivar).
     */
    handlePalancaActivation(activate) {
        const deviceId = "palanca";
        const device = this.deviceStates[deviceId];
        if (!device || device.activationMode !== "mouse") return;

        // Alternar el estado de la palanca
        device.active = activate;
        this.updateDeviceState(deviceId);

        // Registrar el evento
        const action = activate ? "Activación por ratón" : "Desactivación por ratón";
        this.logEvent(action, deviceId);

        // Actualizar las instrucciones
        this.updateInstructions(`La Palanca ha sido ${activate ? "activada" : "desactivada"} por el ratón.`);

        // Actualizar contadores si es necesario
        if (activate) {
            this.rewardCount++;
        }
        this.updateCounters();
    },

    /**
     * Activa o desactiva un dispositivo automáticamente.
     * @param {string} deviceId - ID del dispositivo.
     * @param {boolean} activate - Estado deseado (true para activar, false para desactivar).
     */
    automateDevice(deviceId, activate) {
        const device = this.deviceStates[deviceId];
        if (!device) return;

        // Verificar si el dispositivo admite activación automática
        if (device.activationMode !== "both" && device.activationMode !== "automatic") {
            console.warn(`El dispositivo ${deviceId} no puede ser activado automáticamente.`);
            return;
        }

        // Desactivar otros dispositivos manuales si se está activando este
        if (activate) {
            this.deactivateOtherManualDevices(deviceId);
        }

        // Activar/desactivar el dispositivo
        device.active = activate;
        this.updateDeviceState(deviceId);

        // Reproducir o detener sonido si es el altavoz
        if (deviceId === "altavoz") {
            const altavozSound = document.getElementById("altavozSound");
            if (altavozSound) {
                if (device.active) {
                    altavozSound.src = this.nextSong; // Establecer la canción configurada
                    altavozSound.currentTime = 0;    // Reiniciar desde el inicio
                    altavozSound.play();             // Reproducir el sonido

                    // Obtener el nombre de la canción desde la ruta
                    const songName = this.nextSong.split('/').pop().replace('.mp3', '');

                    // Registrar el evento con la información de la canción
                    this.logEvent("Activación automática", deviceId, `Canción: ${songName}`);
                } else {
                    altavozSound.pause();
                    altavozSound.currentTime = 0;    // Detén y reinicia el sonido

                    // Registrar el evento sin información adicional
                    this.logEvent("Desactivación automática", deviceId);
                }
            }
        } else {
            // Registrar el evento sin información adicional para otros dispositivos
            const action = activate ? "Activación automática" : "Desactivación automática";
            this.logEvent(action, deviceId);
        }

        // Actualizar instrucciones
        const deviceNames = {
            palanca: "Palanca",
            comedero: "Comedero",
            altavoz: "Altavoz",
            luz: "Luz principal",
            luz2: "Luz secundaria",
            rejilla: "Rejilla eléctrica"
        };
        this.updateInstructions(`${deviceNames[deviceId]} se ha ${activate ? "activado automáticamente" : "desactivado automáticamente"}.`);
    },

    /**
     * Actualiza visualmente el estado de un dispositivo.
     * @param {string} deviceId - ID del dispositivo a actualizar.
     */
    updateDeviceState(deviceId) {
        const deviceElement = document.getElementById(deviceId);
        if (deviceElement) {
            if (this.deviceStates[deviceId].active) {
                deviceElement.classList.add("active"); // Clase para estado activo
            } else {
                deviceElement.classList.remove("active"); // Remover clase si está desactivado
            }
        }
    },

    /**
     * Actualiza las instrucciones en el cuadro de información.
     * @param {string} message - Mensaje a mostrar.
     */
    updateInstructions(message) {
        const instructionsElement = document.getElementById("instructions");
        if (instructionsElement) {
            instructionsElement.textContent = message;
        } else {
            console.error("El elemento con ID 'instructions' no existe en el HTML.");
        }
    },

    /**
     * Actualiza los contadores de recompensas y castigos en la interfaz.
     */
    updateCounters() {
        const countersElement = document.getElementById("counters");
        if (countersElement) {
            countersElement.innerHTML = `
                Recompensas: ${this.rewardCount} <br>
                Castigos: ${this.punishmentCount} <br>
                Unidades Temporales: ${this.utCount}
            `;
        }
    },

    /**
     * Registra un evento en la bitácora.
     * @param {string} eventType - Tipo de evento (e.g., Activación, Desactivación, Detención para Comer).
     * @param {string|object} details - Detalles del evento.
     * @param {string} [additionalInfo] - Información adicional opcional (e.g., nombre de la canción).
     */
    logEvent(eventType, details, additionalInfo = null) {
        const event = {
            tipo: eventType,
            detalles: details,
            UT: this.utCount,
            timestamp: new Date().toISOString()
        };

        if (additionalInfo) {
            event.infoAdicional = additionalInfo;
        }

        this.log.push(event);
        console.log("Evento registrado:", event);
    },

    /**
     * Configura el botón de descarga de la bitácora.
     */
    setupDownloadButton() {
        const downloadButton = document.getElementById("downloadLogButton");
        if (downloadButton) {
            downloadButton.addEventListener("click", () => {
                const fileName = prompt("Introduce el nombre para el archivo JSON:", "bitacora_condicionamiento");
                if (fileName) {
                    this.downloadJSON(this.log, `${fileName}.json`);
                }
            });
        } else {
            console.error("No se encontró el botón con ID 'downloadLogButton'");
        }
    },

    /**
     * Descarga un objeto JSON como archivo.
     * @param {object} data - Datos a descargar.
     * @param {string} filename - Nombre del archivo.
     */
    downloadJSON(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "bitacora.json";
        document.body.appendChild(a);
        a.click();

        // Limpia el DOM y revoca el objeto URL
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Hacemos accesibles las funciones necesarias desde movement.js
window.updateDeviceState = window.Main.updateDeviceState.bind(window.Main);
window.updateInstructions = window.Main.updateInstructions.bind(window.Main);
window.logEvent = window.Main.logEvent.bind(window.Main);
window.updateCounters = window.Main.updateCounters.bind(window.Main);
window.setInitialMouseDirection = window.Main.setInitialMouseDirection.bind(window.Main);
window.automateDevice = window.Main.automateDevice.bind(window.Main);
window.handlePalancaActivation = window.Main.handlePalancaActivation.bind(window.Main);

// Hacemos accesibles las variables necesarias desde movement.js
window.deviceStates = window.Main.deviceStates;
window.cooldownStates = window.Main.cooldownStates;
window.palancaTouched = window.Main.palancaTouched;
window.rewardCount = window.Main.rewardCount;
window.punishmentCount = window.Main.punishmentCount;
window.utCount = window.Main.utCount;
window.log = window.Main.log;
window.currentSpeed = window.Main.currentSpeed;

// Inicializa el script cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => window.Main.initialize());
