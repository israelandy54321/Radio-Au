# Radio-Au

Hola 12


const axios = require('axios');
const fs = require('fs');
const path = require('path');
const gTTS = require('google-tts-api');

const API_KEY = '50767f6d04af41efa715d95664bd743a';
const RADIO_FOLDER = '/home/israel-yanez/Documentos';

// Obtener noticia
async function obtenerNoticias() {
    try {
       const url = `https://newsapi.org/v2/everything?q=futbol+(ecuador+OR+europa+OR+uefa+OR+champions)&language=es&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`;

        const response = await axios.get(url);
        const noticias = response.data.articles;
        if (noticias.length === 0) return null;

        const noticia = noticias[Math.floor(Math.random() * noticias.length)];
        let texto = `Atentos, noticia del día. ${noticia.title}. ${noticia.description || ''}. ${noticia.content || ''}`;
        if (texto.length < 500)
            texto += ' Esta noticia continúa desarrollándose. Estaremos atentos a más detalles sobre el fútbol ecuatoriano.';
        return texto;
    } catch (error) {
        console.error('❌ Error al obtener noticias:', error.message);
        return null;
    }
}

// ✅ Nueva versión que soporta textos largos
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
        console.log('✅ Audio generado y guardado:', rutaArchivo);
    } catch (error) {
        console.error('❌ Error al convertir texto a audio:', error.message);
    }
}

// Principal
async function generarNoticiaAudio() {
    console.log('🕒 Generando nueva noticia en audio...');
    const texto = await obtenerNoticias();
    if (!texto) return;
    const nombreArchivo = `noticia_${Date.now()}.mp3`;
    await textoAAudio(texto, nombreArchivo);
}

// Ejecutar y repetir cada minuto
generarNoticiaAudio();
setInterval(generarNoticiaAudio, 60000);

















// Codigo con las voces actuales . 

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const API_KEY = '50767f6d04af41efa715d95664bd743a'; // clave de noticias
const ELEVEN_API_KEY = 'sk_8fc90b4f258fd8706bf2a527534511587a7da76ab684fa45'; // clave de ElevenLabs
const RADIO_FOLDER = '/home/israel-yanez/Documentos';

// 🕒 Intervalo de actualización (en milisegundos)
const INTERVALO_MS = 1 * 60 * 1000; // cada 1 minuto

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
    let texto = `La Noticia del momento en Ego Radio Digital ${noticia.title}. ${noticia.description || ''}. ${noticia.content || ''}`;
    if (texto.length < 500)
      texto += ' ';
    return texto;
  } catch (error) {
    console.error('❌ Error al obtener noticias:', error.message);
    return null;
  }
}

// 🔹 Convertir texto a audio con ElevenLabs
async function textoAAudio(texto, nombreArchivo) {
  try {
    const rutaArchivo = path.join(RADIO_FOLDER, nombreArchivo);

    // Divide el texto si es muy largo (por seguridad)
    const partes = texto.match(/.{1,900}(\s|$)/g);

    const audioBuffers = [];

    for (const parte of partes) {
      console.log(`🎧 Generando audio con ElevenLabs...`);
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/text-to-speech/EiNlNiXeDU1pqqOPrYMO', // tu voice_id
        {
          text: parte.trim(),
          model_id: 'eleven_multilingual_v2', // modelo con soporte para español
          voice_settings: {
            stability: 0.65,          // ligeramente más firme
            similarity_boost: 0.85,   // mantiene naturalidad
            style: 0.3,               // tono más serio tipo noticiero
          },
        },
        {
          headers: {
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      audioBuffers.push(Buffer.from(response.data));
    }

    fs.writeFileSync(rutaArchivo, Buffer.concat(audioBuffers));
    console.log(`✅ Archivo de audio creado: ${rutaArchivo}`);
  } catch (error) {
    console.error('❌ Error al convertir texto a audio (ElevenLabs):', error.message);
    if (error.response) {
      console.error('📩 Respuesta de la API:', error.response.status, error.response.data);
    }
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

// Servidor web
app.listen(PORT, () => console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`));



