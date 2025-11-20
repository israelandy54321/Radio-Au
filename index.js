

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const gTTS = require('gtts'); // << INTEGRADO

const app = express();
const PORT = 3000;
const API_KEY = '2f2742f976fb4d09a53b410c5f878d30'; // clave de noticias

const RADIO_FOLDER = 'C:\\Users\\Oscar Portilla\\Desktop\\EGO RADIO\\NOTICIAS';

// 🕒 Intervalo de actualización (1 minuto)
const INTERVALO_MS = 1 * 60 * 1000;

// Servir archivos estáticos
app.use(express.static('public'));

// MULTER (guardar audios grabados)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RADIO_FOLDER),
  filename: (req, file, cb) => {
    const nombre = `grabacion_${Date.now()}.webm`;
    cb(null, nombre);
  },
});
const upload = multer({ storage });

// Subir audio grabado
app.post('/upload', upload.single('audio'), (req, res) => {
  console.log('🎙️ Nuevo audio recibido:', req.file.path);
  res.json({ mensaje: '✅ Audio guardado correctamente', archivo: req.file.filename });
});

// 🔹 Obtener noticia
async function obtenerNoticias() {
  try {
    const url = `https://newsapi.org/v2/everything?q=futbol+(ecuador+OR+europa+OR+uefa+OR+champions)&language=es&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`;
    const response = await axios.get(url);
    const noticias = response.data.articles;

    if (!noticias.length) return null;

    const noticia = noticias[Math.floor(Math.random() * noticias.length)];

    return `Flash informativo de Ego Radio Digital. ${noticia.title}.`;
  } catch (error) {
    console.error('❌ Error al obtener noticias:', error.message);
    return null;
  }
}

// 🔹 Convertir texto a audio con gTTS (Google Translate)
async function textoAAudio(texto, nombreArchivo) {
  try {
    const rutaArchivo = path.join(RADIO_FOLDER, nombreArchivo);

    console.log('🎧 Generando audio con gTTS...');

    return new Promise((resolve, reject) => {
      const speech = new gTTS(texto, 'es'); // Voz estándar de Google Translate
      speech.save(rutaArchivo, (err) => {
        if (err) {
          console.error('❌ Error en gTTS:', err);
          reject(err);
        } else {
          console.log(`✅ Audio creado: ${rutaArchivo}`);
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('❌ Error al convertir texto a audio:', error.message);
  }
}

// 🔹 Generar dos noticias
async function generarNoticias() {
  console.log('🕒 Generando noticias...');
  const texto1 = await obtenerNoticias();
  const texto2 = await obtenerNoticias();

  if (!texto1 || !texto2) {
    console.log('⚠️ No se pudieron obtener noticias.');
    return;
  }

  await textoAAudio(texto1, 'noticia1.mp3');
  await textoAAudio(texto2, 'noticia2.mp3');
}

// Ejecutar al iniciar y cada minuto
generarNoticias();
setInterval(generarNoticias, INTERVALO_MS);

// Servidor
app.listen(PORT, () => console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`));
