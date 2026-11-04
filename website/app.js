const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3000);
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try { await navigator.clipboard.writeText(button.dataset.copy); toast('Endereço copiado. Cole na barra do navegador.'); }
  catch { toast(`Abra ${button.dataset.copy} na barra do navegador.`); }
});

let mode = 'after';
let clicks = 0;
function resetDemo() {
  clicks = 0;
  $('#simulation-tabs').innerHTML = '<span class="sim-tab active">Sua conversa <i>×</i></span>';
  $('#sim-title').textContent = 'Eu já estava aqui.';
  $('#sim-message').textContent = 'Pronta para a próxima conversa.';
  $('#sim-draft').textContent = 'Seu rascunho continua no lugar.';
  $('#sim-document').textContent = 'Mesma aba · documento preservado';
  $('#demo-status').textContent = 'A aba já está aberta. Pode clicar.';
}
all('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  all('[data-mode]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  resetDemo();
}));
$('#run-demo').addEventListener('click', () => {
  clicks++;
  if (mode === 'before') {
    if (clicks <= 3) {
      const tab = document.createElement('span'); tab.className = 'sim-tab'; tab.textContent = 'Mais uma aba…';
      $('#simulation-tabs').append(tab);
    }
    $('#sim-title').textContent = 'Continuar para continuar?';
    $('#sim-message').textContent = 'Nova aba. Página intermediária. Abrir aplicativo?';
    $('#sim-draft').textContent = 'Você só queria conversar.';
    $('#sim-document').textContent = 'Simulação de um fluxo relatado por usuários';
    $('#demo-status').textContent = `${clicks} clique${clicks > 1 ? 's' : ''}. E a aba original continua esperando.`;
  } else {
    $('#sim-title').textContent = 'Conversa nova. Mesma aba.';
    $('#sim-message').textContent = 'O contato mudou. A sessão continua.';
    $('#sim-draft').textContent = 'Olá! Vim pelo link e queria um orçamento.';
    $('#sim-document').textContent = 'Documento preservado · mensagem não enviada';
    $('#demo-status').textContent = 'A conversa chegou onde sua aba já estava.';
  }
});

const install = {
  chrome: {
    title: 'Chrome, sem peregrinação.',
    steps: '<li>Baixe e extraia o pacote da extensão.</li><li>Abra <button class="copy-code" data-copy="chrome://extensions" type="button">chrome://extensions <span aria-hidden="true">⧉</span></button> e ative <strong>Modo do desenvolvedor</strong>.</li><li>Clique em <strong>Carregar sem compactação</strong> e selecione a pasta extraída.</li><li>Mantenha o WhatsApp Web aberto e teste um link de conversa no mesmo navegador.</li>',
    note: 'Chrome 120+. Pacote local, sem instalação pela loja.'
  },
  firefox: {
    title: 'Firefox, sem dar voltas.',
    steps: '<li>Baixe e extraia o pacote da extensão.</li><li>Abra <button class="copy-code" data-copy="about:debugging#/runtime/this-firefox" type="button">about:debugging <span aria-hidden="true">⧉</span></button> e entre em <strong>Este Firefox</strong>.</li><li>Clique em <strong>Carregar extensão temporária</strong> e selecione o <strong>manifest.json</strong> da pasta extraída.</li><li>Mantenha o WhatsApp Web aberto e teste um link. Repita a instalação ao reiniciar o Firefox.</li>',
    note: 'Firefox 142+. Instalação temporária. O pacote ainda não tem assinatura da Mozilla.'
  }
};
all('[data-browser]').forEach(button => button.addEventListener('click', () => {
  const browser = button.dataset.browser;
  const name = browser === 'chrome' ? 'Chrome' : 'Firefox';
  all('[data-browser]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  $('#install-title').textContent = install[browser].title;
  $('#install-steps').innerHTML = install[browser].steps;
  $('#install-note').textContent = install[browser].note;
  $('#download-extension').href = `downloads/jata-${browser}.zip`;
  $('#download-extension').textContent = `Baixar para ${name} ↓`;
}));

let funding = null;
let selectedAmount = '100';
function selectedLink() {
  if (!funding?.enabled || funding.provider !== 'github') return null;
  try {
    const url = new URL(funding.githubSponsors);
    if (url.origin !== 'https://github.com' || url.pathname !== '/sponsors/klederson' || url.search || url.hash) return null;
    return url.href;
  } catch { return null; }
}
function updateSupport() {
  const link = selectedLink();
  $('#custom-note').hidden = selectedAmount !== 'custom';
  $('#support-submit').disabled = !link;
  $('#support-submit').textContent = link ? 'Escolher valor no GitHub Sponsors ↗' : 'Apoio financeiro em preparação';
  $('#support-status').textContent = link ? 'Você escolhe o valor e a modalidade na página do GitHub. Nenhuma cobrança ocorre neste site.' : 'O recebimento ainda não foi ativado. Nenhuma cobrança será feita.';
}
all('[data-amount]').forEach(button => button.addEventListener('click', () => {
  selectedAmount = button.dataset.amount;
  all('[data-amount]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  updateSupport();
}));
$('#support-form').addEventListener('submit', event => {
  event.preventDefault();
  const link = selectedLink();
  if (link) window.location.assign(link);
});
fetch('funding.json').then(response => {
  if (!response.ok) throw new Error('Configuração indisponível');
  return response.json();
}).then(config => { funding = config; updateSupport(); }).catch(() => updateSupport());
