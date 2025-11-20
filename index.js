const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const gTTS = require('gtts'); // << INTEGRADO

const app = express();
const PORT = 3000;
const API_KEY = '2f2742f976fb4d09a53b410c5f878d30'; // clave de noticias

const RADIO_FOLDER = '/home/israel-yanez/Documentos'; 
// 🕒 Intervalo de actualización (1 minuto) const RADIO_FOLDER = 'C:\\Users\\Oscar Portilla\\Desktop\\EGO RADIO\\NOTICIAS';
const INTERVALO_MS = 30 * 60 * 1000; // 30 minutos

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

// -----------------------------------------------------------------------------------------
// 🔹 LIMPIADOR Y REDACTOR AUTOMÁTICO (ELIMINA REPETICIONES)
// -----------------------------------------------------------------------------------------
function redactarNoticia(noticia) {
  if (!noticia) return null;

  const titulo = noticia.title || "";
  const descripcion = noticia.description || "";
  const contenido = (noticia.content || "").split("[")[0];

  // Unir todo
  let texto = `${titulo}. ${descripcion}. ${contenido}`;

  // ---- LIMPIEZA PROFESIONAL ----

  // 1️⃣ Eliminar frases repetidas exactas
  texto = texto
    .split('. ')
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join('. ');

  // 2️⃣ Eliminar frases que se incluyen unas dentro de otras
  const frases = texto.split('. ').sort((a, b) => b.length - a.length);
  let final = [];

  frases.forEach((f) => {
    if (!final.some((x) => x.includes(f) || f.includes(x))) {
      final.push(f);
    }
  });

  texto = final.join('. ') + '.';

  // 3️⃣ Corrección final
  texto = texto
    .replace(/\s+/g, ' ')
    .replace('..', '.')
    .trim();

  return texto;
}

// -----------------------------------------------------------------------------------------
// 🔹 Función estilo "locutor profesional"
// -----------------------------------------------------------------------------------------
function versionLocutor(textoBase) {
  return (
    "Atención oyentes: en información de última hora, " +
    textoBase +
    "  Manténgase en sintonía con Ego Radio Digital."
  );
}

// -----------------------------------------------------------------------------------------
// 🔹 Obtener noticia aleatoria sin repetirse y mejor redactada
// -----------------------------------------------------------------------------------------
async function obtenerNoticias() {
  try {
    const url = `https://newsapi.org/v2/everything?q=futbol+(ecuador+OR+europa+OR+uefa+OR+champions)&language=es&sortBy=publishedAt&pageSize=50&apiKey=${API_KEY}`;
    const response = await axios.get(url);
    const noticias = response.data.articles;

    if (!noticias.length) return null;

    // Mezclar noticias
    for (let i = noticias.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [noticias[i], noticias[j]] = [noticias[j], noticias[i]];
    }

    // Tomar noticia aleatoria
    const noticia = noticias[0];

    // Redacción profesional y limpia
    const textoLargo = redactarNoticia(noticia);

    const textoLocutor = versionLocutor(textoLargo);

    return `Flash informativo de Ego Radio Digital. ${textoLocutor}`;

  } catch (error) {
    console.error('❌ Error al obtener noticias:', error.message);
    return null;
  }
}

// -----------------------------------------------------------------------------------------
// 🔹 Convertir texto a audio con gTTS
// -----------------------------------------------------------------------------------------
async function textoAAudio(texto, nombreArchivo) {
  try {
    const rutaArchivo = path.join(RADIO_FOLDER, nombreArchivo);

    console.log('🎧 Generando audio con gTTS...');

    return new Promise((resolve, reject) => {
      const speech = new gTTS(texto, 'es'); 
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

// -----------------------------------------------------------------------------------------
// 🔹 Generar dos noticias sin que se repitan
// -----------------------------------------------------------------------------------------
async function generarNoticias() {
  console.log('🕒 Generando noticias...');

  let texto1 = await obtenerNoticias();
  let texto2 = await obtenerNoticias();

  // Si son iguales, reemplazar
  let intentos = 0;
  while (texto1 === texto2 && intentos < 5) {
    texto2 = await obtenerNoticias();
    intentos++;
  }

  if (!texto1 || !texto2) {
    console.log('⚠️ No se pudieron obtener noticias.');
    return;
  }

  await textoAAudio(texto1, 'noticia1.mp3');
  await textoAAudio(texto2, 'noticia2.mp3');
}

// -----------------------------------------------------------------------------------------

// Ejecutar al iniciar y cada minuto
generarNoticias();
setInterval(generarNoticias, INTERVALO_MS);

// Servidor
app.listen(PORT, () =>
  console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`)
);
