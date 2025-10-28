const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const gTTS = require('google-tts-api');

const app = express();
const PORT = 3000;
const API_KEY = '50767f6d04af41efa715d95664bd743a';
const RADIO_FOLDER = '/home/israel-yanez/Documentos';

// 🕒 Configura aquí cada cuánto tiempo se actualizan las noticias (en milisegundos)
const INTERVALO_MS = 1 * 60 * 1000; // cada 1 minuto (solo para pruebas)


// Middleware para servir archivos estáticos
app.use(express.static('public'));

// Configuración de multer (para subir audios grabados)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RADIO_FOLDER),
  filename: (req, file, cb) => {
    const nombre = `grabacion_${Date.now()}.webm`;
    cb(null, nombre);
  },
});
const upload = multer({ storage });

// Ruta para subir audio grabado
app.post('/upload', upload.single('audio'), (req, res) => {
  console.log('🎙️ Nuevo audio recibido:', req.file.path);
  res.json({ mensaje: '✅ Audio guardado correctamente', archivo: req.file.filename });
});

// 🔹 Obtener noticia aleatoria
async function obtenerNoticias() {
  try {
    const url = `https://newsapi.org/v2/everything?q=futbol+(ecuador+OR+europa+OR+uefa+OR+champions)&language=es&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`;
    const response = await axios.get(url);
    const noticias = response.data.articles;
    if (noticias.length === 0) return null;

    const noticia = noticias[Math.floor(Math.random() * noticias.length)];
    let texto = `Atención, noticia del día. ${noticia.title}. ${noticia.description || ''}. ${noticia.content || ''}`;
    if (texto.length < 500)
      texto += ' Seguiremos informando sobre el fútbol ecuatoriano y europeo.';
    return texto;
  } catch (error) {
    console.error('❌ Error al obtener noticias:', error.message);
    return null;
  }
}

// 🔹 Convertir texto a audio
async function textoAAudio(texto, nombreArchivo) {
  try {
    const partes = texto.match(/.{1,200}(\s|$)/g);
    const rutaArchivo = path.join(RADIO_FOLDER, nombreArchivo);
    const chunks = [];

    for (const parte of partes) {
      const url = gTTS.getAudioUrl(parte.trim(), {
        lang: 'es',
        slow: false,
        host: 'https://translate.google.com',
      });

      const audioResponse = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      chunks.push(Buffer.from(audioResponse.data));
    }

    fs.writeFileSync(rutaArchivo, Buffer.concat(chunks));
    console.log(`✅ Archivo actualizado: ${rutaArchivo}`);
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
    console.log('⚠️ No se pudieron obtener noticias nuevas.');
    return;
  }

  await textoAAudio(texto1, 'noticia1.mp3');
  await textoAAudio(texto2, 'noticia2.mp3');
}

// 🔁 Generar al iniciar y cada cierto tiempo
generarNoticias();
setInterval(generarNoticias, INTERVALO_MS);