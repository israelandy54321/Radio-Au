let mediaRecorder;
let audioChunks = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const player = document.getElementById('player');

startBtn.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();

  audioChunks = [];
  mediaRecorder.addEventListener('dataavailable', e => {
    audioChunks.push(e.data);
  });

  mediaRecorder.addEventListener('stop', async () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    player.src = url;

    // Enviar al servidor
    const formData = new FormData();
    formData.append('audio', blob, 'grabacion.webm');
    await fetch('/upload', { method: 'POST', body: formData });
    alert('✅ Audio grabado y enviado al servidor.');
  });

  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
});
