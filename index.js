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
// const RADIO_FOLDER = 'C:\\Users\\Oscar Portilla\\Desktop\\EGO RADIO\\NOTICIAS';

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
// 🔹 REDACTOR PERIODÍSTICO PROFESIONAL
// -----------------------------------------------------------------------------------------
function mejorarRedaccionPeriodista(texto) {
  if (!texto) return texto;

  // Capitalizar cada frase
  texto = texto
    .split('. ')
    .map(frase => frase.charAt(0).toUpperCase() + frase.slice(1))
    .join('. ');

  // Reemplazos estilo periodista
  let reemplazos = [
    { de: /según reportes/i, a: "de acuerdo con información confirmada por diversas fuentes" },
    { de: /informaron/i, a: "indicaron fuentes consultadas" },
    { de: /se conoció que/i, a: "tras investigaciones se determinó que" },
    { de: /por su parte/i, a: "mientras tanto" },
    { de: /además/i, a: "adicionalmente" }
  ];

  reemplazos.forEach(r => {
    texto = texto.replace(r.de, r.a);
  });

  // Transiciones naturales
  texto = texto.replace(/\. /g, ". Asimismo, ");

  // Limpieza final
  texto = texto
    .replace(/Asimismo, Asimismo,/g, "Asimismo,")
    .replace(/\s+/g, ' ')
    .trim();

  return texto;
}

// -----------------------------------------------------------------------------------------
// 🔹 LIMPIAR Y REDACTAR NOTICIA (SIN TÍTULO)
// -----------------------------------------------------------------------------------------
function redactarNoticia(noticia) {
  if (!noticia) return null;

  const descripcion = noticia.description || "";
  const contenido = (noticia.content || "").split("[")[0];

  // SOLO descripción + contenido (sin título)
  let texto = `${descripcion}. ${contenido}`;

  // eliminar repetidos exactos
  texto = texto
    .split('. ')
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join('. ');

  // mejorar redacción estilo reportero
  texto = mejorarRedaccionPeriodista(texto);

  return texto + ".";
}

// -----------------------------------------------------------------------------------------
// 🔹 LOCUTOR PROFESIONAL
// -----------------------------------------------------------------------------------------
function versionLocutor(textoBase) {
  return (
    "Atención oyentes, aquí el informe especial de última hora. " +
    textoBase +
    " Manténganse en sintonía con Ego Radio Digital para más información."
  );
}

// -----------------------------------------------------------------------------------------
// 🔹 OBTENER NOTICIA Y REESCRIBIRLA (SOLO FÚTBOL)
// -----------------------------------------------------------------------------------------
async function obtenerNoticias() {
  try {

    // 🔥 SOLO NOTICIAS DE FÚTBOL
    const url =
      `https://newsapi.org/v2/everything?` +
      `q=futbol+OR+liga+OR+champions+OR+fifa+OR+uefa+OR+conmebol+OR+seleccion+OR+club+OR+jugador` +
      `&language=es&sortBy=publishedAt&pageSize=50&apiKey=${API_KEY}`;

    const response = await axios.get(url);
    const noticias = response.data.articles;

    if (!noticias.length) return null;

    // Mezclar noticias
    for (let i = noticias.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [noticias[i], noticias[j]] = [noticias[j], noticias[i]];
    }

    const noticia = noticias[0];

    const textoLimpio = redactarNoticia(noticia);
    const textoLocutor = versionLocutor(textoLimpio);

    return `Flash informativo de Ego Radio Digital. ${textoLocutor}`;

  } catch (error) {
    console.error('❌ Error al obtener noticias:', error.message);
    return null;
  }
}

// -----------------------------------------------------------------------------------------
// 🔹 TEXTO → AUDIO (gTTS)
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
// 🔹 GENERAR DOS NOTICIAS SIN REPETIR
// -----------------------------------------------------------------------------------------
async function generarNoticias() {
  console.log('🕒 Generando noticias...');

  let texto1 = await obtenerNoticias();
  let texto2 = await obtenerNoticias();

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

generarNoticias();
setInterval(generarNoticias, INTERVALO_MS);

app.listen(PORT, () =>
  console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`)
);
