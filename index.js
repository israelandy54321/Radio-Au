const axios = require('axios');
const fs = require('fs');
const path = require('path');
const gTTS = require('google-tts-api');

// Tu API Key de NewsAPI
const API_KEY = '50767f6d04af41efa715d95664bd743a';
const RADIO_FOLDER = '/home/israel-yanez/Documentos'; // Cambia esto a tu carpeta de RadioBOSS

// Función para obtener noticias de fútbol de Ecuador
async function obtenerNoticias() {
    try {
        const url = `https://newsapi.org/v2/everything?q=futbol+ecuador&language=es&apiKey=${API_KEY}`;
        const response = await axios.get(url);
        const noticias = response.data.articles;
        if (noticias.length === 0) {
            console.log('No hay noticias disponibles.');
            return null;
        }
        // Selecciona una noticia aleatoria
        const noticia = noticias[Math.floor(Math.random() * noticias.length)];
        return noticia.title + '. ' + (noticia.description || '');
    } catch (error) {
        console.error('Error al obtener noticias:', error.message);
        return null;
    }
}

// Función para convertir texto a audio y guardar
async function textoAAudio(texto, nombreArchivo) {
    try {
        const url = gTTS.getAudioUrl(texto, {
            lang: 'es',
            slow: false,
            host: 'https://translate.google.com',
        });

        const audioResponse = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
        });

        fs.writeFileSync(path.join(RADIO_FOLDER, nombreArchivo), audioResponse.data);
        console.log('Audio generado y guardado:', nombreArchivo);
    } catch (error) {
        console.error('Error al convertir texto a audio:', error.message);
    }
}

// Función principal
async function main() {
    const texto = await obtenerNoticias();
    if (!texto) return;

    // Nombre del archivo aleatorio
    const nombreArchivo = `noticia_${Date.now()}.mp3`;

    await textoAAudio(texto, nombreArchivo);
}

// Ejecutar
main();
