<script lang="ts">
  import { BookOpen, Zap, Download, Globe, Star, ArrowRight, CheckCircle2, Puzzle, BookMarked, FileSearch, HighlighterIcon, Layers } from 'lucide-svelte'

  const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/scholaflow/feahkklpopelmpcnmjolmbhpkhjhocfo?authuser=0&hl=pt-BR&pli=1'

  const features = [
    {
      icon: FileSearch,
      title: 'One-Click Paper Capture',
      description: 'Detect and save academic papers instantly from Google Scholar, arXiv, PubMed, and thousands of journal sites. Metadata is extracted automatically.',
    },
    {
      icon: BookMarked,
      title: 'Smart Reference Import',
      description: 'Automatically extract title, authors, abstract, DOI, year, and journal — no manual typing. Papers land directly in your PaperHub library.',
    },
    {
      icon: HighlighterIcon,
      title: 'Highlight While You Read',
      description: 'Highlight passages on any webpage or PDF and attach them as notes to the corresponding reference. Your insights follow the paper, not the browser tab.',
    },
    {
      icon: Layers,
      title: 'PDF Pass-Through',
      description: 'Open a PDF in your browser and send it straight to PaperHub with one click — full-text stored, ready for annotation inside the app.',
    },
    {
      icon: Zap,
      title: 'Instant Sync',
      description: 'Works with your existing PaperHub account. Everything you capture in the browser is immediately available across all your devices.',
    },
    {
      icon: Star,
      title: 'Works Everywhere',
      description: 'Supports Google Scholar, Semantic Scholar, arXiv, PubMed, IEEE Xplore, ACM DL, Springer, Elsevier, and more.',
    },
  ]

  const steps = [
    { step: '01', text: 'Install the extension from the Chrome Web Store' },
    { step: '02', text: 'Log in with your PaperHub account' },
    { step: '03', text: 'Browse to any paper — click the Scholaflow button to save it' },
  ]
</script>

<div class="page">

  <!-- Hero -->
  <div class="hero">
    <div class="hero-badge">
      <Puzzle size={14} />
      Browser Extension
    </div>
    <div class="hero-logo">
      <BookOpen size={40} strokeWidth={1.5} />
    </div>
    <h1 class="hero-title">Scholaflow</h1>
    <p class="hero-tagline">
      Capture, annotate, and sync academic papers<br />from the web straight into PaperHub — in one click.
    </p>
    <div class="cta-row">
      <a
        href={CHROME_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="btn-primary"
      >
        <svg class="browser-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9"/>
          <path d="M12 8h8.5a9 9 0 1 0-4.5 7.794" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 8l-4.5 7.794" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M20.5 8l-4.5 7.794" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Download for Chrome
        <ArrowRight size={16} />
      </a>
      <button class="btn-secondary" disabled>
        <Globe size={16} />
        Safari — Coming Soon
      </button>
    </div>
  </div>

  <!-- How it works -->
  <div class="section">
    <h2 class="section-title">How it works</h2>
    <div class="steps-row">
      {#each steps as { step, text }}
        <div class="step-card">
          <span class="step-number">{step}</span>
          <p class="step-text">{text}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Features -->
  <div class="section">
    <h2 class="section-title">Everything you need</h2>
    <div class="features-grid">
      {#each features as feat}
        <div class="feature-card">
          <div class="feature-icon">
            <feat.icon size={20} />
          </div>
          <div class="feature-body">
            <h3 class="feature-title">{feat.title}</h3>
            <p class="feature-desc">{feat.description}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Compatibility -->
  <div class="section">
    <h2 class="section-title">Supported browsers</h2>
    <div class="compat-row">
      <div class="compat-card available">
        <div class="compat-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9"/>
            <path d="M12 8h8.5a9 9 0 1 0-4.5 7.794" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 8l-4.5 7.794" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M20.5 8l-4.5 7.794" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="compat-info">
          <span class="compat-name">Google Chrome</span>
          <span class="compat-status available-badge">
            <CheckCircle2 size={12} /> Available now
          </span>
        </div>
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="compat-btn"
        >
          <Download size={14} /> Install
        </a>
      </div>

      <div class="compat-card soon">
        <div class="compat-icon muted">
          <Globe size={28} />
        </div>
        <div class="compat-info">
          <span class="compat-name muted">Apple Safari</span>
          <span class="compat-status soon-badge">Coming Soon</span>
        </div>
        <button class="compat-btn" disabled>
          <Download size={14} /> Install
        </button>
      </div>
    </div>
  </div>

</div>

<style>
  .page { max-width: 100%; }

  /* ── Hero ── */
  .hero {
    text-align: center;
    padding: 48px 24px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-surface-3);
    border-radius: 16px;
    margin-bottom: 32px;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-primary);
    background: var(--color-primary-subtle);
    padding: 4px 12px;
    border-radius: 999px;
    letter-spacing: 0.02em;
  }
  .hero-logo {
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: var(--color-primary-subtle);
  }
  .hero-title {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--color-text-primary);
  }
  .hero-tagline {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.65;
  }
  .cta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: var(--color-primary);
    color: #fff;
    border-radius: 10px;
    font-size: 0.9375rem;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .btn-primary:hover { opacity: 0.88; }
  .browser-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: var(--color-surface-0);
    color: var(--color-text-disabled);
    border: 1px solid var(--color-surface-3);
    border-radius: 10px;
    font-size: 0.9375rem;
    cursor: not-allowed;
  }

  /* ── Sections ── */
  .section { margin-bottom: 36px; }
  .section-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--color-text-primary);
    margin: 0 0 18px;
  }

  /* ── Steps ── */
  .steps-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  .step-card {
    background: var(--color-surface-1);
    border: 1px solid var(--color-surface-3);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .step-number {
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--color-primary);
    line-height: 1;
  }
  .step-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }

  /* ── Features ── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }
  .feature-card {
    display: flex;
    gap: 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-surface-3);
    border-radius: 12px;
    padding: 18px;
  }
  .feature-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--color-primary-subtle);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .feature-body { display: flex; flex-direction: column; gap: 4px; }
  .feature-title { margin: 0; font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary); }
  .feature-desc  { margin: 0; font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.55; }

  /* ── Compatibility ── */
  .compat-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  .compat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-surface-3);
    border-radius: 12px;
    padding: 16px 18px;
  }
  .compat-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
  }
  .compat-icon svg { width: 28px; height: 28px; }
  .compat-icon.muted { color: var(--color-text-disabled); }
  .compat-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .compat-name { font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary); }
  .compat-name.muted { color: var(--color-text-disabled); }
  .compat-status { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 500; }
  .available-badge { color: #1e8e3e; }
  .soon-badge { color: var(--color-text-disabled); }
  .compat-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
    border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0);
    color: var(--color-text-primary);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.15s;
  }
  a.compat-btn:hover { background: var(--color-surface-2); }
  .compat-btn:disabled { color: var(--color-text-disabled); cursor: not-allowed; }
</style>
