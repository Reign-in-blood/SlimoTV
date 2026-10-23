import './style.css';
import { COMMAND_IDS, DEFAULT_CODES, normalizeIrCode, type CommandId, type IrCodeMap } from './ir/codes';
import { isIrAvailable, transmitIr } from './ir/transmitter';

const STORAGE_KEY = 'slimotv:ir-codes:v1';
const labels: Record<CommandId, string> = {
  power: 'Marche / Arrêt',
  volumeUp: 'Volume +',
  volumeDown: 'Volume −',
};

function loadCodes(): IrCodeMap {
  const defaults = { ...DEFAULT_CODES };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    for (const id of COMMAND_IDS) {
      if (typeof stored[id] === 'string') {
        const normalized = normalizeIrCode(stored[id]);
        if (normalized) defaults[id] = normalized as never;
      }
    }
  } catch {
    // Le profil par défaut reste disponible si le stockage local est désactivé.
  }
  return defaults;
}

let activeCodes: IrCodeMap = loadCodes();
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Élément #app introuvable.');

app.innerHTML = `
  <main class="shell">
    <header class="header">
      <div>
        <p class="eyebrow">LG 42CS460-ZA · 2012</p>
        <h1>Slimo<span>TV</span></h1>
        <p class="subtitle">Télécommande infrarouge</p>
      </div>
      <span class="chip">TEST v0.1</span>
    </header>

    <section class="remote" aria-label="Télécommande SlimoTV">
      <div class="remote-top">
        <p class="section-caption">POWER</p>
        <button type="button" class="remote-button power-button" data-command="power" aria-label="Marche ou arrêt">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2.8v9.3M6.15 5.95a8 8 0 1 0 11.7 0"
              stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="separator"></div>
      <div class="volume-section">
        <p class="section-caption">VOLUME</p>
        <div class="volume-controls">
          <button type="button" class="remote-button volume-button" data-command="volumeUp" aria-label="Augmenter le volume">
            <span class="volume-symbol">+</span>
            <span class="button-subtitle">VOL</span>
          </button>
          <button type="button" class="remote-button volume-button" data-command="volumeDown" aria-label="Diminuer le volume">
            <span class="volume-symbol">−</span>
            <span class="button-subtitle">VOL</span>
          </button>
        </div>
      </div>
      <div class="remote-foot">LG · NEC1 · 38 kHz</div>
    </section>

    <p class="status" id="status" role="status" aria-live="polite">Vérification de l’émetteur infrarouge…</p>

    <details class="settings" id="settings">
      <summary>Réglages avancés <span>Codes IR</span></summary>
      <div class="settings-content">
        <p>Profil initial : LG 6710V00090N Older TV. Si un bouton ne fonctionne pas, modifie son code NEC hexadécimal sur 32 bits.</p>
        <form id="codes-form">
          ${COMMAND_IDS.map(id => `
            <label class="code-field" for="code-${id}">
              <span>${labels[id]}</span>
              <input id="code-${id}" name="${id}" type="text" inputmode="text"
                value="${activeCodes[id]}" maxlength="10" spellcheck="false" autocapitalize="off"
                aria-label="Code IR ${labels[id]}" required/>
            </label>`).join('')}
          <div class="settings-actions">
            <button type="submit" class="action-button">Enregistrer</button>
            <button type="button" class="action-button secondary" id="reset-codes">Réinitialiser</button>
          </div>
        </form>
      </div>
    </details>

    <footer>SlimoTV · Prototype Android</footer>
  </main>
`;

const status = document.querySelector<HTMLParagraphElement>('#status')!;
function showStatus(message: string, state: 'ready' | 'error' | 'neutral' = 'neutral'): void {
  status.textContent = message;
  status.dataset.state = state;
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-command]')) {
  button.addEventListener('click', async () => {
    const id = button.dataset.command as CommandId;
    if (!COMMAND_IDS.includes(id)) return;
    button.disabled = true;
    try {
      await transmitIr(activeCodes[id]);
      showStatus(`${labels[id]} · signal envoyé`, 'ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showStatus(`Impossible d’envoyer le signal : ${message}`, 'error');
    } finally {
      button.disabled = false;
    }
  });
}

const form = document.querySelector<HTMLFormElement>('#codes-form')!;
const readInput = (id: CommandId): HTMLInputElement =>
  document.querySelector<HTMLInputElement>(`#code-${id}`)!;

form.addEventListener('submit', event => {
  event.preventDefault();
  const next: IrCodeMap = { ...activeCodes };
  for (const id of COMMAND_IDS) {
    const normalized = normalizeIrCode(readInput(id).value);
    if (!normalized) {
      showStatus(`Code invalide pour ${labels[id]}. Format attendu : 0x20DF10EF.`, 'error');
      readInput(id).focus();
      return;
    }
    next[id] = normalized;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    activeCodes = next;
    for (const id of COMMAND_IDS) readInput(id).value = activeCodes[id];
    showStatus('Codes IR enregistrés sur cet appareil.', 'ready');
  } catch {
    showStatus('Enregistrement impossible : stockage local indisponible.', 'error');
  }
});

document.querySelector<HTMLButtonElement>('#reset-codes')!.addEventListener('click', () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    activeCodes = { ...DEFAULT_CODES };
    for (const id of COMMAND_IDS) readInput(id).value = activeCodes[id];
    showStatus('Codes IR LG d’origine restaurés.', 'ready');
  } catch {
    showStatus('Réinitialisation impossible : stockage local indisponible.', 'error');
  }
});

void (async () => {
  const available = await isIrAvailable();
  showStatus(
    available ? 'Émetteur IR disponible · prêt pour les tests' : 'Émetteur IR indisponible ou navigateur web.',
    available ? 'ready' : 'neutral',
  );
})();
