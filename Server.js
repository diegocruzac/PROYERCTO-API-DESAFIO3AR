const express = require('express');
const app = express();

app.use(express.json());

// Clave secreta que debe coincidir con la de tu sketch de Arduino (SECRET_DEVICE_KEY)
const DEVICE_KEY_ESPERADA = "TU_SECRET_DEVICE_KEY_AQUI"; 

// Variables en memoria para almacenar el estado actual del sistema
let estadoSistema = {
    modo: "manual",
    accion: "detenido",
    revision: "00000000-0000-0000-0000-000000000000",
    distancia: -1,
    motor: "detenido"
};

// Middleware de seguridad para validar el header 'x-device-key'
function validarKey(req, res, next) {
    const keyRecibida = req.headers['x-device-key'];
    if (keyRecibida !== DEVICE_KEY_ESPERADA) {
        return res.status(401).json({ error: "Unauthorized - Device Key inválida" });
    }
    next();
}

// 1. ENDPOINT /comando: El Arduino lo consulta constantemente (GET) 
// y la App de Android lo actualiza cuando el usuario presiona un botón o cambia de modo (POST)
app.get('/comando', validarKey, (req, res) => {
    res.json({
        modo: estadoSistema.modo,
        accion: estadoSistema.accion,
        revision: estadoSistema.revision
    });
});

app.post('/comando', validarKey, (req, res) => {
    const { modo, accion, revision } = req.body;
    
    if (modo) estadoSistema.modo = modo;
    if (accion) estadoSistema.accion = accion;
    if (revision) estadoSistema.revision = revision;

    console.log(`[COMANDO ACTUALIZADO] Modo: ${estadoSistema.modo} | Acción: ${estadoSistema.accion}`);
    res.json({ status: "success", message: "Comando actualizado correctamente" });
});

// 2. ENDPOINT /sensor: El Arduino reporta aquí la distancia y el motor (POST)
// y la App de Android consulta estos datos para mostrarlos en pantalla (GET)
app.get('/sensor', validarKey, (req, res) => {
    res.json({
        distancia: estadoSistema.distancia,
        motor: estadoSistema.motor
    });
});

app.post('/sensor', validarKey, (req, res) => {
    const { distancia, motor } = req.body;
    
    if (distancia !== undefined) estadoSistema.distancia = distancia;
    if (motor) estadoSistema.motor = motor;

    console.log(`[SENSOR REPORTADO] Distancia: ${estadoSistema.distancia} cm | Motor: ${estadoSistema.motor}`);
    res.json({ status: "success", message: "Lectura registrada" });
});

// Puerto de ejecución (Render asigna uno automáticamente por variable de entorno, o usa el 3000 local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});