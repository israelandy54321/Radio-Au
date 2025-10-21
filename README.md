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
