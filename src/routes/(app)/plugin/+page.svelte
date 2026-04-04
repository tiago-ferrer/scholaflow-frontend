<script lang="ts">
    import {
        ArrowRight,
        BookMarked,
        BookOpen,
        CheckCircle2,
        Download,
        FileSearch,
        Globe,
        HighlighterIcon,
        Layers,
        Puzzle,
        Star,
        Zap
    } from 'lucide-svelte'

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
            description: 'Automatically extract title, authors, abstract, DOI, year, and journal — no manual typing. Papers land directly in your Scholaflow library.',
        },
        {
            icon: HighlighterIcon,
            title: 'Highlight While You Read',
            description: 'Highlight passages on any webpage or PDF and attach them as notes to the corresponding reference. Your insights follow the paper, not the browser tab.',
        },
        {
            icon: Layers,
            title: 'PDF Pass-Through',
            description: 'Open a PDF in your browser and send it straight to Scholaflow with one click — full-text stored, ready for annotation inside the app.',
        },
        {
            icon: Zap,
            title: 'Instant Sync',
            description: 'Works with your existing Scholaflow account. Everything you capture in the browser is immediately available across all your devices.',
        },
        {
            icon: Star,
            title: 'Works Everywhere',
            description: 'Supports Google Scholar, Semantic Scholar, arXiv, PubMed, IEEE Xplore, ACM DL, Springer, Elsevier, and more.',
        },
    ]

    const steps = [
        {step: '01', text: 'Install the extension from the Chrome Web Store'},
        {step: '02', text: 'Log in with your Scholaflow account'},
        {step: '03', text: 'Browse to any paper — click the Scholaflow button to save it'},
    ]
</script>

<div class="page">

    <!-- Hero -->
    <div class="hero">
        <div class="hero-badge">
            <Puzzle size={14}/>
            Browser Extension
        </div>
        <div class="hero-logo">
            <BookOpen size={40} strokeWidth={1.5}/>
        </div>
        <h1 class="hero-title">Scholaflow</h1>
        <p class="hero-tagline">
            Capture, annotate, and sync academic papers<br/>from the web straight into Scholaflow — in one click.
        </p>
        <div class="cta-row">
            <a
                    href={CHROME_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-primary"
            >
                <svg width="40px" height="40px" viewBox="-0.82 0 437.46 437.46" xmlns="http://www.w3.org/2000/svg">
                    <path d="M217.341.039s128.478-5.783 196.57 123.337H206.416s-39.188-1.289-72.593 46.255c-9.634 19.916-19.91 40.473-8.349 80.937C108.773 222.309 36.823 97.04 36.823 97.04S87.578 5.176 217.341.039z"
                          fill="#c6352e"/>
                    <path d="M407.223 327.871s-59.247 114.143-205.118 108.533c17.995-31.148 103.772-179.682 103.772-179.682s20.709-33.289-3.744-85.991c-12.431-18.305-25.09-37.486-65.919-47.713 32.836-.326 177.285.021 177.285.021s54.168 89.891-6.276 204.832z"
                          fill="#f4d911"/>
                    <path d="M28.373 328.738s-69.224-108.395 8.58-231.908c17.979 31.16 103.71 179.72 103.71 179.72s18.469 34.578 76.341 39.756c22.061-1.609 45.007-2.982 74.279-33.223-16.139 28.594-88.673 153.521-88.673 153.521S97.681 438.56 28.373 328.738z"
                          fill="#81b354"/>
                    <path d="M202.105 437.46l29.187-121.793s32.092-2.504 58.982-32.017c-16.693 29.365-88.169 153.81-88.169 153.81z"
                          fill="#7baa50"/>
                    <path d="M119.59 220.093c0-53.69 43.52-97.215 97.215-97.215 53.69 0 97.214 43.524 97.214 97.215 0 53.693-43.522 97.219-97.214 97.219-53.695 0-97.215-43.525-97.215-97.219z"
                          fill="#ffffff"/>
                    <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="-829.128" y1="1417.339" x2="-829.128"
                                    y2="1261.441" gradientTransform="matrix(1 0 0 -1 1045.93 1557.636)">
                        <stop offset="0" stop-color="#a2c0e6"/>
                        <stop offset="1" stop-color="#406cb1"/>
                    </linearGradient>
                    <path d="M135.86 220.093c0-44.702 36.238-80.941 80.945-80.941 44.698 0 80.94 36.239 80.94 80.941 0 44.703-36.242 80.945-80.94 80.945-44.707.001-80.945-36.244-80.945-80.945z"
                          fill="url(#a)"/>
                    <path d="M413.5 123.039l-120.183 35.237s-18.123-26.596-57.104-35.258c33.776-.115 177.287.021 177.287.021z"
                          fill="#e7ce12"/>
                    <path d="M123.137 246.197c-16.89-29.25-86.31-149.16-86.31-149.16l89.029 88.07s-9.149 18.82-5.68 45.7l2.961 15.39z"
                          fill="#bc332c"/>
                </svg>
                Download for Chrome
                <ArrowRight size={16}/>
            </a>
            <button class="btn-secondary" disabled>
                <svg width="40px" height="40px" viewBox="0 0 5120 5120" xmlns="http://www.w3.org/2000/svg">
                    <linearGradient id="a" x2="0" y2="100%">
                        <stop offset="0" stop-color="#19d7ff"/>
                        <stop offset="1" stop-color="#1e64f0"/>
                    </linearGradient>
                    <g fill="#ffffff">
                        <rect width="5130" height="5120" rx="1050"/>
                        <circle cx="2560" cy="2560" r="2240" fill="url(#a)"/>
                        <path fill="red" d="M4090 1020 2370 2370l4e2 4e2z"/>
                        <path d="M1020 4090l1350-1720 4e2 4e2z"/>
                    </g>
                    <path stroke="#ffffff" stroke-width="30" d="M2560 540v330m0 3370v330m350-4e3-57 325m-586 3318-57 327M3250 662l-113 310M1984 4138l-113 310m339-3878 57 325m586 3318 57 327M1870 662l113 310m1152 3166 113 310M1552 810l166 286m1685 2918 165 286M1265 1010l212 253m2166 2582 212 253M1015 1258l253 212m2582 2168 253 212M813 1548l286 165m2920 1685 286 165M665 1866l310 113m3166 1150 310 113M574 2202l326 58m3320 588 325 57M545 2555h330m3370 0h330M575 2905l325-57m3320-586 325-57M668 3245l310-113m3165-1152 310-113M815 3563l286-165m2920-1685 286-165M1016 3850l253-212m2580-2166 253-212M1262 41e2l212-253m2166-2582 212-253M1552 43e2l166-286m1685-2918 165-286M2384 548l16 180m320 3656 16 180M2038 610l47 174m950 3544 47 174M1708 730l76 163m1550 3326 77 163M1404 904l103 148m2106 3006 103 148M1135 1130l127 127m2596 2596 127 127M910 14e2l148 103m3006 2107 146 1e2M734 1703l163 76m3326 1550 163 77M614 2033l174 47m3544 950 174 47M553 2380l180 16m3656 320 180 16m-4014 0 180-16m3656-320 180-16M614 3077l174-47m3544-950 174-47M734 3407l163-76m3326-1550 163-76M910 3710l148-103m3006-2107 146-1e2M1404 4206l103-148m2105-3006 104-148M1708 4380l77-163M3335 890l77-163M2038 45e2l47-174m950-3544 47-174m-698 3952 16-180m320-3656 16-180"/>
                </svg>
                Safari — Coming Soon
            </button>
        </div>
    </div>

    <!-- How it works -->
    <div class="section">
        <h2 class="section-title">How it works</h2>
        <div class="steps-row">
            {#each steps as {step, text}}
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
                        <feat.icon size={20}/>
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
                    <svg width="30px" height="30px" viewBox="-0.82 0 437.46 437.46" xmlns="http://www.w3.org/2000/svg">
                        <path d="M217.341.039s128.478-5.783 196.57 123.337H206.416s-39.188-1.289-72.593 46.255c-9.634 19.916-19.91 40.473-8.349 80.937C108.773 222.309 36.823 97.04 36.823 97.04S87.578 5.176 217.341.039z"
                              fill="#c6352e"/>
                        <path d="M407.223 327.871s-59.247 114.143-205.118 108.533c17.995-31.148 103.772-179.682 103.772-179.682s20.709-33.289-3.744-85.991c-12.431-18.305-25.09-37.486-65.919-47.713 32.836-.326 177.285.021 177.285.021s54.168 89.891-6.276 204.832z"
                              fill="#f4d911"/>
                        <path d="M28.373 328.738s-69.224-108.395 8.58-231.908c17.979 31.16 103.71 179.72 103.71 179.72s18.469 34.578 76.341 39.756c22.061-1.609 45.007-2.982 74.279-33.223-16.139 28.594-88.673 153.521-88.673 153.521S97.681 438.56 28.373 328.738z"
                              fill="#81b354"/>
                        <path d="M202.105 437.46l29.187-121.793s32.092-2.504 58.982-32.017c-16.693 29.365-88.169 153.81-88.169 153.81z"
                              fill="#7baa50"/>
                        <path d="M119.59 220.093c0-53.69 43.52-97.215 97.215-97.215 53.69 0 97.214 43.524 97.214 97.215 0 53.693-43.522 97.219-97.214 97.219-53.695 0-97.215-43.525-97.215-97.219z"
                              fill="#ffffff"/>
                        <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="-829.128" y1="1417.339" x2="-829.128"
                                        y2="1261.441" gradientTransform="matrix(1 0 0 -1 1045.93 1557.636)">
                            <stop offset="0" stop-color="#a2c0e6"/>
                            <stop offset="1" stop-color="#406cb1"/>
                        </linearGradient>
                        <path d="M135.86 220.093c0-44.702 36.238-80.941 80.945-80.941 44.698 0 80.94 36.239 80.94 80.941 0 44.703-36.242 80.945-80.94 80.945-44.707.001-80.945-36.244-80.945-80.945z"
                              fill="url(#a)"/>
                        <path d="M413.5 123.039l-120.183 35.237s-18.123-26.596-57.104-35.258c33.776-.115 177.287.021 177.287.021z"
                              fill="#e7ce12"/>
                        <path d="M123.137 246.197c-16.89-29.25-86.31-149.16-86.31-149.16l89.029 88.07s-9.149 18.82-5.68 45.7l2.961 15.39z"
                              fill="#bc332c"/>
                    </svg>
                </div>
                <div class="compat-info">
                    <span class="compat-name">Google Chrome</span>
                    <span class="compat-status available-badge">
            <CheckCircle2 size={12}/> Available now
          </span>
                </div>
                <a
                        href={CHROME_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="compat-btn"
                >
                    <Download size={14}/>
                    Install
                </a>
            </div>

            <div class="compat-card soon">
                <div class="compat-icon muted">
                    <svg width="30px" height="30px" viewBox="0 0 5120 5120" xmlns="http://www.w3.org/2000/svg">
                        <linearGradient id="a" x2="0" y2="100%">
                            <stop offset="0" stop-color="#19d7ff"/>
                            <stop offset="1" stop-color="#1e64f0"/>
                        </linearGradient>
                        <g fill="#ffffff">
                            <rect width="5130" height="5120" rx="1050"/>
                            <circle cx="2560" cy="2560" r="2240" fill="url(#a)"/>
                            <path fill="red" d="M4090 1020 2370 2370l4e2 4e2z"/>
                            <path d="M1020 4090l1350-1720 4e2 4e2z"/>
                        </g>
                        <path stroke="#ffffff" stroke-width="30" d="M2560 540v330m0 3370v330m350-4e3-57 325m-586 3318-57 327M3250 662l-113 310M1984 4138l-113 310m339-3878 57 325m586 3318 57 327M1870 662l113 310m1152 3166 113 310M1552 810l166 286m1685 2918 165 286M1265 1010l212 253m2166 2582 212 253M1015 1258l253 212m2582 2168 253 212M813 1548l286 165m2920 1685 286 165M665 1866l310 113m3166 1150 310 113M574 2202l326 58m3320 588 325 57M545 2555h330m3370 0h330M575 2905l325-57m3320-586 325-57M668 3245l310-113m3165-1152 310-113M815 3563l286-165m2920-1685 286-165M1016 3850l253-212m2580-2166 253-212M1262 41e2l212-253m2166-2582 212-253M1552 43e2l166-286m1685-2918 165-286M2384 548l16 180m320 3656 16 180M2038 610l47 174m950 3544 47 174M1708 730l76 163m1550 3326 77 163M1404 904l103 148m2106 3006 103 148M1135 1130l127 127m2596 2596 127 127M910 14e2l148 103m3006 2107 146 1e2M734 1703l163 76m3326 1550 163 77M614 2033l174 47m3544 950 174 47M553 2380l180 16m3656 320 180 16m-4014 0 180-16m3656-320 180-16M614 3077l174-47m3544-950 174-47M734 3407l163-76m3326-1550 163-76M910 3710l148-103m3006-2107 146-1e2M1404 4206l103-148m2105-3006 104-148M1708 4380l77-163M3335 890l77-163M2038 45e2l47-174m950-3544 47-174m-698 3952 16-180m320-3656 16-180"/>
                    </svg>
                </div>
                <div class="compat-info">
                    <span class="compat-name muted">Apple Safari</span>
                    <span class="compat-status soon-badge">Coming Soon</span>
                </div>
                <button class="compat-btn" disabled>
                    <Download size={14}/>
                    Install
                </button>
            </div>
        </div>
    </div>

</div>

<style>
    .page {
        max-width: 100%;
    }

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

    .btn-primary:hover {
        opacity: 0.88;
    }

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
    .section {
        margin-bottom: 36px;
    }

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

    .feature-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .feature-title {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
    }

    .feature-desc {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--color-text-secondary);
        line-height: 1.55;
    }

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

    .compat-icon svg {
        width: 28px;
        height: 28px;
    }

    .compat-icon.muted {
        color: var(--color-text-disabled);
    }

    .compat-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .compat-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
    }

    .compat-name.muted {
        color: var(--color-text-disabled);
    }

    .compat-status {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .available-badge {
        color: #1e8e3e;
    }

    .soon-badge {
        color: var(--color-text-disabled);
    }

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

    a.compat-btn:hover {
        background: var(--color-surface-2);
    }

    .compat-btn:disabled {
        color: var(--color-text-disabled);
        cursor: not-allowed;
    }
</style>
