document.addEventListener('DOMContentLoaded', () => {
  const liviaApiUrlInput = document.getElementById('liviaApiUrl');
  const liviaApiTokenInput = document.getElementById('liviaApiToken');
  const companyNameInput = document.getElementById('companyName');
  const companyNicheInput = document.getElementById('companyNiche');
  const companyCityInput = document.getElementById('companyCity');
  const companyNeighborhoodInput = document.getElementById('companyNeighborhood');
  const companyWhatsappInput = document.getElementById('companyWhatsapp');
  const toneOfVoiceInput = document.getElementById('toneOfVoice');

  const btnSave = document.getElementById('btn-save');
  const saveMsg = document.getElementById('save-msg');
  const btnTestConnection = document.getElementById('btn-test-connection');
  const connectionStatus = document.getElementById('connection-status');

  // Carrega configurações salvas
  chrome.storage.sync.get({
    liviaApiUrl: 'https://livia.conectweb.online/api',
    liviaApiToken: '',
    companyName: 'ConectWeb Soluções Digitais',
    companyNiche: 'Marketing Digital e Desenvolvimento de Sistemas',
    companyCity: 'Bauru',
    companyNeighborhood: 'Centro',
    companyWhatsapp: '5514996988997',
    toneOfVoice: 'amigavel'
  }, (items) => {
    liviaApiUrlInput.value = items.liviaApiUrl;
    liviaApiTokenInput.value = items.liviaApiToken;
    companyNameInput.value = items.companyName;
    companyNicheInput.value = items.companyNiche;
    companyCityInput.value = items.companyCity;
    companyNeighborhoodInput.value = items.companyNeighborhood;
    companyWhatsappInput.value = items.companyWhatsapp;
    toneOfVoiceInput.value = items.toneOfVoice;
  });

  // Salva configurações
  btnSave.addEventListener('click', () => {
    const configToSave = {
      liviaApiUrl: liviaApiUrlInput.value.trim(),
      liviaApiToken: liviaApiTokenInput.value.trim(),
      companyName: companyNameInput.value.trim(),
      companyNiche: companyNicheInput.value.trim(),
      companyCity: companyCityInput.value.trim(),
      companyNeighborhood: companyNeighborhoodInput.value.trim(),
      companyWhatsapp: companyWhatsappInput.value.trim(),
      toneOfVoice: toneOfVoiceInput.value
    };

    chrome.storage.sync.set(configToSave, () => {
      saveMsg.className = 'status-msg status-success';
      saveMsg.innerText = '✅ Configurações salvas com sucesso!';
      setTimeout(() => {
        saveMsg.innerText = '';
      }, 3500);
    });
  });

  // Testa conexão com o servidor da Lívia
  btnTestConnection.addEventListener('click', async () => {
    connectionStatus.className = 'status-msg';
    connectionStatus.innerText = 'Testando comunicação com a Lívia...';

    const url = liviaApiUrlInput.value.trim();
    const token = liviaApiTokenInput.value.trim();

    try {
      // Teste real de ping via fetch
      const res = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        connectionStatus.className = 'status-msg status-success';
        connectionStatus.innerText = '🟢 Conexão com a Lívia estabelecida com sucesso!';
      } else {
        connectionStatus.className = 'status-msg status-error';
        connectionStatus.innerText = `🟡 Servidor respondeu com status ${res.status}. Verifique o token de acesso.`;
      }
    } catch (err) {
      connectionStatus.className = 'status-msg status-error';
      connectionStatus.innerText = `🔴 Não foi possível conectar ao servidor (${err.message}). O modo local autônomo está ativo.`;
    }
  });
});
