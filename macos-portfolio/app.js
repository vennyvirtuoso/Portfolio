/**
 * macOS Desktop Portfolio System — Vijendra Kumar Vaishya (IIT Bombay)
 * Window Manager, Dock Magnification, VS Code Simulator, 3D Badge & Canvas Physics
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. Starry Cosmic Canvas Background
  // ============================================================================
  const starCanvas = document.getElementById('wallpaper-canvas');
  if (starCanvas) {
    const ctx = starCanvas.getContext('2d');
    let width = (starCanvas.width = window.innerWidth);
    let height = (starCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = starCanvas.width = window.innerWidth;
      height = starCanvas.height = window.innerHeight;
      initStars();
    });

    const STARS_COUNT = 180;
    const stars = [];

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < STARS_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.4,
          alpha: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.02 + 0.005,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1
        });
      }
    }

    function renderStars() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.alpha += s.twinkleSpeed * s.twinkleDir;
        if (s.alpha >= 0.95) s.twinkleDir = -1;
        if (s.alpha <= 0.2) s.twinkleDir = 1;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.fill();

        // subtle drift
        s.y -= s.speed;
        if (s.y < 0) s.y = height;
      }
      requestAnimationFrame(renderStars);
    }

    initStars();
    renderStars();
  }

  // ============================================================================
  // 2. Real-Time macOS Menu Bar Clock
  // ============================================================================
  const clockEl = document.getElementById('menu-clock');
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    clockEl.textContent = `${day} ${date} ${month} ${hours}:${minutes} ${ampm}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ============================================================================
  // 3. Window Manager (Z-index, Dragging, Traffic Lights)
  // ============================================================================
  let highestZ = 100;
  const activeAppNameEl = document.getElementById('menu-active-app');

  const appNames = {
    'win-vscode': 'Code',
    'win-terminal': 'Terminal',
    'win-research': 'Research Papers',
    'win-scrapbook': 'About Me',
    'win-gallery': '3D Gallery'
  };

  const windows = document.querySelectorAll('.window');

  function bringToFront(win) {
    if (!win) return;
    highestZ += 1;
    win.style.zIndex = highestZ;
    windows.forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    win.classList.remove('minimized');
    win.style.display = 'flex';

    if (activeAppNameEl && appNames[win.id]) {
      activeAppNameEl.textContent = appNames[win.id];
    }

    // Update active dock item
    const appId = win.id.replace('win-', '');
    document.querySelectorAll('.dock-item').forEach(item => {
      if (item.dataset.app === appId) {
        item.classList.add('running', 'active');
      } else if (item.dataset.app) {
        item.classList.remove('active');
      }
    });
  }

  windows.forEach(win => {
    win.addEventListener('mousedown', () => bringToFront(win));

    // Traffic light buttons
    const header = win.querySelector('.window-header');
    if (header) {
      // Traffic lights
      const closeBtn = header.querySelector('.traffic-btn.close');
      const minBtn = header.querySelector('.traffic-btn.minimize');
      const maxBtn = header.querySelector('.traffic-btn.maximize');

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          win.style.display = 'none';
          const appId = win.id.replace('win-', '');
          const dockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
          if (dockItem) dockItem.classList.remove('running', 'active');
        });
      }

      if (minBtn) {
        minBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          win.classList.add('minimized');
          const appId = win.id.replace('win-', '');
          const dockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
          if (dockItem) dockItem.classList.remove('active');
        });
      }

      if (maxBtn) {
        maxBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (win.dataset.isMaximized === 'true') {
            win.style.width = win.dataset.origW;
            win.style.height = win.dataset.origH;
            win.style.left = win.dataset.origL;
            win.style.top = win.dataset.origT;
            win.dataset.isMaximized = 'false';
          } else {
            win.dataset.origW = win.style.width || `${win.offsetWidth}px`;
            win.dataset.origH = win.style.height || `${win.offsetHeight}px`;
            win.dataset.origL = win.style.left;
            win.dataset.origT = win.style.top;
            win.style.width = 'calc(100vw - 20px)';
            win.style.height = 'calc(100vh - 120px)';
            win.style.left = '10px';
            win.style.top = '36px';
            win.dataset.isMaximized = 'true';
          }
        });
      }

      // Dragging logic
      let isDragging = false;
      let startX, startY, origLeft, origTop;

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.traffic-btn')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = win.offsetLeft;
        origTop = win.offsetTop;
        bringToFront(win);
        document.body.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        let newLeft = origLeft + dx;
        let newTop = origTop + dy;

        // Bounding limits
        newTop = Math.max(30, Math.min(window.innerHeight - 100, newTop));
        newLeft = Math.max(-win.offsetWidth + 80, Math.min(window.innerWidth - 80, newLeft));

        win.style.left = `${newLeft}px`;
        win.style.top = `${newTop}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = 'default';
        }
      });
    }
  });

  // ============================================================================
  // 4. macOS Dock Interaction & Magnification
  // ============================================================================
  const dock = document.getElementById('dock');
  const dockItems = document.querySelectorAll('.dock-item');

  dockItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const app = item.dataset.app;
      if (!app) return; // external link handled by <a>

      item.classList.add('bouncing');
      setTimeout(() => item.classList.remove('bouncing'), 1000);

      const targetWin = document.getElementById(`win-${app}`);
      if (targetWin) {
        if (targetWin.style.display === 'none' || targetWin.classList.contains('minimized')) {
          targetWin.style.display = 'flex';
          targetWin.classList.remove('minimized');
        }
        bringToFront(targetWin);
      }
    });
  });

  // Dock magnification calculation
  if (dock) {
    dock.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      dockItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.left + rect.width / 2;
        const dist = Math.abs(mouseX - itemCenter);
        const maxDist = 120;

        if (dist < maxDist) {
          const scale = 1 + (1 - dist / maxDist) * 0.42; // max 1.42x
          item.style.transform = `scale(${scale}) translateY(-${(scale - 1) * 16}px)`;
        } else {
          item.style.transform = 'scale(1) translateY(0)';
        }
      });
    });

    dock.addEventListener('mouseleave', () => {
      dockItems.forEach(item => {
        item.style.transform = 'scale(1) translateY(0)';
      });
    });
  }

  // ============================================================================
  // 5. VS Code Editor Content Database & Interactions
  // ============================================================================
  const codeFiles = {
    readme: {
      title: 'README.md',
      lang: 'Markdown',
      content: `
# Vijendra Kumar Vaishya 👋
### M.S. by Research Scholar in Computer Science & Engineering @ IIT Bombay
*Center for Indian Language Technology (CFILT) & KCDH Lab*

---

### 🔬 Core Research Focus
- **Intersectional Fairness & Bias Detection in LLMs**:
  Formulated multi-axis demographic bias detection as continuous retrieval over composed stereotype spaces (*Under Review, EACL 2027*).
- **Spatio-Temporal Mamba (MIST)**:
  Selective State-Space Models (SSMs) & Cross-Attention Fusion for DSA intracranial vessel segmentation (*Accepted at WACV 2027*, **0.7801 Dice**).
- **Clinical Knowledge Graphs (KCDH Lab & PHFI)**:
  Ontology-aware conversational segmentation over 6,900 medical concepts with 33k+ edges (**58% Recall@3**, **0.497 MRR**).
- **NLTM-Bhashini SSMT (MeitY, Govt. of India)**:
  Full-stack sequence labeling models & automated MLOps pipelines expanding corpus from 4.2k to 13.9k+ annotations (**85.05% F1**).

---

### ⚡ Systems Engineering
- **Bare-Metal C++17 FFN Inference Engine**:
  Custom 8-wide ARM NEON microkernels with INT8 quantization, reaching **41.7 GFLOP/s** throughput (<0.6% error) and **37–84× speedup** over scalar baseline.
- **Gaussian Process Surrogate & Bayesian Optimization**:
  From-scratch GP surrogate using Cholesky factorizations ($LL^T$) and analytical acquisition functions converging in 50 evaluations.

---

### 🎓 Academic Record
- **IIT Bombay**: M.S. by Research in CSE (2024 – 2027) · **CPI: 8.9 / 10**
- **Jabalpur Engineering College (RGPV)**: B.Tech in IT (2020 – 2024) · **CPI: 8.06 / 10**
- **Achievements**: Qualified **JEE Advanced**, 3rd District Rank (Class 12th), **100% in Mathematics** (CBSE Boards), **500+ LeetCode problems** solved.
      `
    },
    bias: {
      title: 'bias_retriever.py',
      lang: 'Python',
      content: `
<span class="syn-comment"># Beyond Single-Axis Fairness: Learning to Detect Intersectional Biases</span>
<span class="syn-comment"># EACL 2027 (Under Review) — Vijendra Kumar Vaishya, Nihar Ranjan Sahoo, Pushpak Bhattacharyya</span>

<span class="syn-kw">import</span> torch
<span class="syn-kw">import</span> torch.nn <span class="syn-kw">as</span> nn
<span class="syn-kw">import</span> torch.nn.functional <span class="syn-kw">as</span> F
<span class="syn-kw">from</span> sentence_transformers <span class="syn-kw">import</span> SentenceTransformer

<span class="syn-kw">class</span> <span class="syn-type">BiasRetriever</span>(nn.Module):
    <span class="syn-str">"""
    Dual-Encoder contrastive architecture for intersectional bias detection.
    Maps disjoint demographic stereotype anchors into a continuous Riemannian manifold.
    """</span>
    <span class="syn-kw">def</span> <span class="syn-fn">__init__</span>(self, model_name: <span class="syn-type">str</span> = <span class="syn-str">"BAAI/bge-large-en-v1.5"</span>, proj_dim: <span class="syn-type">int</span> = 512):
        <span class="syn-fn">super</span>().<span class="syn-fn">__init__</span>()
        self.encoder = SentenceTransformer(model_name)
        self.projection = nn.Sequential(
            nn.Linear(1024, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.GELU(),
            nn.Linear(proj_dim, proj_dim)
        )
        self.temperature = nn.Parameter(torch.ones([]) * 0.07)

    <span class="syn-kw">def</span> <span class="syn-fn">forward</span>(self, query_texts, stereotype_anchors):
        q_embeds = self.projection(self.encoder.encode(query_texts, convert_to_tensor=<span class="syn-num">True</span>))
        a_embeds = self.projection(self.encoder.encode(stereotype_anchors, convert_to_tensor=<span class="syn-num">True</span>))

        <span class="syn-comment"># L2 Normalization</span>
        q_norm = F.normalize(q_embeds, p=2, dim=-1)
        a_norm = F.normalize(a_embeds, p=2, dim=-1)

        <span class="syn-comment"># Cosine similarity matrix scaled by learnable temperature</span>
        logits = torch.matmul(q_norm, a_norm.T) * torch.exp(self.temperature)
        <span class="syn-kw">return</span> logits <span class="syn-comment"># Result: +18 Jaccard gain over LLM classifier</span>
`
    },
    swiglu: {
      title: 'swiglu_neon.cpp',
      lang: 'C++',
      content: `
<span class="syn-comment">// Bare-Metal C++17 ARM NEON SIMD Transformer FFN Microkernel</span>
<span class="syn-comment">// Optimized for Apple M-Series & ARMv8/v9 — Throughput: 41.7 GFLOP/s (INT8)</span>

<span class="syn-kw">#include</span> <span class="syn-str">&lt;arm_neon.h&gt;</span>
<span class="syn-kw">#include</span> <span class="syn-str">&lt;cmath&gt;</span>
<span class="syn-kw">#include</span> <span class="syn-str">&lt;iostream&gt;</span>

<span class="syn-kw">inline</span> float32x4_t <span class="syn-fn">silu_neon</span>(float32x4_t x) {
    <span class="syn-comment">// Fast reciprocal sigmoid approx using NEON registers</span>
    float32x4_t neg_x = vnegq_f32(x);
    float32x4_t exp_val = exp_approx_f32(neg_x);
    float32x4_t one = vdupq_n_f32(1.0f);
    float32x4_t denom = vaddq_f32(one, exp_val);
    <span class="syn-kw">return</span> vmulq_f32(x, vrecpeq_f32(denom));
}

<span class="syn-comment">// 8-wide unrolled fused SwiGLU vector pass</span>
<span class="syn-kw">void</span> <span class="syn-fn">fused_swiglu_kernel</span>(<span class="syn-kw">const float</span>* __restrict gate, 
                         <span class="syn-kw">const float</span>* __restrict up, 
                         <span class="syn-kw">float</span>* __restrict out, 
                         <span class="syn-type">size_t</span> dim) {
    <span class="syn-kw">for</span> (<span class="syn-type">size_t</span> i = 0; i &lt; dim; i += 8) {
        float32x4_t g0 = vld1q_f32(gate + i);
        float32x4_t g1 = vld1q_f32(gate + i + 4);
        float32x4_t u0 = vld1q_f32(up + i);
        float32x4_t u1 = vld1q_f32(up + i + 4);

        float32x4_t res0 = vmulq_f32(silu_neon(g0), u0);
        float32x4_t res1 = vmulq_f32(silu_neon(g1), u1);

        vst1q_f32(out + i, res0);
        vst1q_f32(out + i + 4, res1);
    }
    <span class="syn-comment">// Result: 37–84x speedup over un-vectorized baseline</span>
}
`
    },
    skills: {
      title: 'skills.json',
      lang: 'JSON',
      content: `
{
  <span class="syn-str">"candidate"</span>: <span class="syn-str">"Vijendra Kumar Vaishya"</span>,
  <span class="syn-str">"affiliation"</span>: <span class="syn-str">"Indian Institute of Technology Bombay"</span>,
  <span class="syn-str">"degree"</span>: <span class="syn-str">"M.S. by Research in CSE (CPI: 8.9 / 10)"</span>,
  <span class="syn-str">"languages"</span>: [<span class="syn-str">"Python"</span>, <span class="syn-str">"C++17"</span>, <span class="syn-str">"C"</span>, <span class="syn-str">"CUDA"</span>, <span class="syn-str">"Bash"</span>, <span class="syn-str">"SQL"</span>],
  <span class="syn-str">"ml_frameworks"</span>: [<span class="syn-str">"PyTorch"</span>, <span class="syn-str">"Hugging Face Transformers"</span>, <span class="syn-str">"OpenCV"</span>, <span class="syn-str">"NumPy"</span>, <span class="syn-str">"FAISS"</span>],
  <span class="syn-str">"architectures"</span>: [
    <span class="syn-str">"Mamba State-Space Models (SSMs)"</span>,
    <span class="syn-str">"Retrieval-Augmented Generation (RAG)"</span>,
    <span class="syn-str">"Contrastive Representation Learning"</span>,
    <span class="syn-str">"Vision Transformers (ViT)"</span>,
    <span class="syn-str">"INT8 Post-Training Quantization"</span>
  ],
  <span class="syn-str">"systems"</span>: [
    <span class="syn-str">"ARM NEON SIMD Vectorization"</span>,
    <span class="syn-str">"Register & Cache Memory Fusion"</span>,
    <span class="syn-str">"Docker"</span>,
    <span class="syn-str">"MLOps Retraining Engines"</span>,
    <span class="syn-str">"Linux Kernel & Shell"</span>
  ],
  <span class="syn-str">"competitive_coding"</span>: <span class="syn-str">"500+ LeetCode problems solved"</span>
}
`
    }
  };

  const codeViewEl = document.getElementById('code-content-view');
  const crumbEl = document.getElementById('editor-active-crumb');
  const langEl = document.getElementById('editor-lang-indicator');

  function openFile(fileKey) {
    const data = codeFiles[fileKey];
    if (!data || !codeViewEl) return;

    if (fileKey === 'readme') {
      // Format markdown nicely
      codeViewEl.innerHTML = `
        <div style="max-width: 650px; line-height: 1.65; color: #e2e8f0; font-family: var(--font-sans);">
          <div style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 4px;">Vijendra Kumar Vaishya 👋</div>
          <div style="font-size: 13.5px; color: #38bdf8; margin-bottom: 16px;">M.S. by Research Scholar · Computer Science & Engineering @ IIT Bombay</div>
          <p style="font-size: 13px; color: #94a3b8;">
            AI Researcher & Systems Engineer focusing on <strong>Intersectional Bias in Large Language Models</strong>, <strong>State-Space Models (Mamba) for Spatio-Temporal Video</strong>, and <strong>Bare-Metal C++17 ARM NEON SIMD inference engines</strong>.
          </p>
          <div style="display:flex; gap:10px; margin: 16px 0;">
            <span style="background:rgba(56,189,248,0.15); color:#38bdf8; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600;">IIT BOMBAY (CPI 8.9)</span>
            <span style="background:rgba(16,185,129,0.15); color:#10b981; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600;">EACL '27 & WACV '27</span>
            <span style="background:rgba(244,63,94,0.15); color:#f43f5e; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600;">500+ LEETCODE</span>
          </div>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0;">
          <h4 style="color:#fff; font-size: 14px; margin-bottom: 8px;">📚 Peer-Reviewed Research</h4>
          <ul style="padding-left: 18px; font-size: 12.5px; color: #94a3b8; line-height: 1.8;">
            <li><strong>Beyond Single-Axis Fairness: Learning to Detect Intersectional Biases</strong> (EACL '27 Under Review) — Built <code>BiasRetriever</code>, boosting Jaccard score by +18 points.</li>
            <li><strong>MIST: Mamba-based Spatio-Temporal Model for Vessel Segmentation</strong> (Accepted at WACV 2027) — Achieved 0.7801 Dice with zero retraining.</li>
            <li><strong>Clinical Conversational Chatbot for Tobacco Cessation</strong> (KCDH Lab & PHFI) — 6,900 concepts, 33k+ edges, 58% Recall@3.</li>
            <li><strong>NLTM-Bhashini Machine Translation</strong> (MeitY) — 85.05% test F1 on Marathi MWE labeling.</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0;">
          <h4 style="color:#fff; font-size: 14px; margin-bottom: 8px;">⚡ Systems & Architecture</h4>
          <ul style="padding-left: 18px; font-size: 12.5px; color: #94a3b8; line-height: 1.8;">
            <li><strong>Fused SwiGLU / Transformer FFN Engine:</strong> Bare-metal C++17 with 8-wide NEON vectorization, 37–84× speedup, 41.7 GFLOP/s INT8 throughput.</li>
            <li><strong>Custom Gaussian Process Engine:</strong> From-scratch Cholesky factorizations ($LL^T$) & log-marginal optimization.</li>
          </ul>
        </div>
      `;
    } else {
      codeViewEl.innerHTML = `<pre style="margin:0; font-family:var(--font-mono); font-size:12.5px;"><code>${data.content}</code></pre>`;
    }

    if (crumbEl) crumbEl.textContent = data.title;
    if (langEl) langEl.textContent = data.lang;

    // Update active tab and file-tree highlights
    document.querySelectorAll('.editor-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === fileKey);
    });
    document.querySelectorAll('.tree-file').forEach(f => {
      f.classList.toggle('active', f.dataset.file === fileKey);
    });
  }

  // Bind clicks on file tree and tabs
  document.querySelectorAll('.tree-file').forEach(f => {
    f.addEventListener('click', () => openFile(f.dataset.file));
  });
  document.querySelectorAll('.editor-tab').forEach(t => {
    t.addEventListener('click', () => openFile(t.dataset.tab));
  });

  // Default file
  openFile('readme');

  // 3D Lanyard ID Badge Tilt & Flip
  const badgeStage = document.getElementById('badge-stage');
  const idCard = document.getElementById('iitb-id-card');
  let isFlipped = false;

  if (badgeStage && idCard) {
    badgeStage.addEventListener('mousemove', (e) => {
      if (isFlipped) return;
      const rect = idCard.getBoundingClientRect();
      const cardX = rect.left + rect.width / 2;
      const cardY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - cardX;
      const mouseY = e.clientY - cardY;

      const rotateY = (mouseX / (rect.width / 2)) * 18; // max 18deg
      const rotateX = -(mouseY / (rect.height / 2)) * 18;

      idCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    badgeStage.addEventListener('mouseleave', () => {
      if (!isFlipped) {
        idCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }
    });

    idCard.addEventListener('click', () => {
      isFlipped = !isFlipped;
      if (isFlipped) {
        idCard.style.transform = 'rotateY(180deg)';
      } else {
        idCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }
    });
  }

  // ============================================================================
  // 6. iTerm2 Terminal Emulator Logic
  // ============================================================================
  const cliInput = document.getElementById('cli-input');
  const cliHistory = document.getElementById('terminal-output-history');

  const termCommands = {
    help: () => `
<div style="color:var(--accent-blue); font-weight:600; margin-bottom:4px;">Available Commands:</div>
  <span style="color:#10b981;">neofetch</span>    - Profile summary, photo, specs & education
  <span style="color:#10b981;">research</span>    - Review publications and thesis work
  <span style="color:#10b981;">systems</span>     - C++17 ARM NEON SIMD microkernel benchmarks
  <span style="color:#10b981;">about</span>       - Bio, background and competitive milestones
  <span style="color:#10b981;">resume</span>      - Open curriculum vitae [PDF]
  <span style="color:#10b981;">contact</span>     - Email and academic social links
  <span style="color:#10b981;">clear</span>       - Clear the terminal screen
`,
    about: () => `
<div>
  <strong>Vijendra Kumar Vaishya</strong><br>
  M.S. by Research Candidate in CSE at IIT Bombay (CPI: <strong>8.9 / 10</strong>).<br>
  B.Tech in Information Technology from Jabalpur Engineering College (CPI: 8.06).<br>
  Solved <strong>500+ LeetCode problems</strong>; qualified JEE Advanced; 3rd District Rank in Class 12th Board.
</div>
`,
    research: () => `
<div>
  <div style="color:#38bdf8; font-weight:600;">Selected Research @ IIT Bombay:</div>
  1. <strong>BiasRetriever</strong> (EACL '27 Under Review) — Intersectional bias detection (+18 Jaccard gain).<br>
  2. <strong>MIST SSM</strong> (Accepted at WACV 2027) — Spatio-temporal Mamba for vessel segmentation (0.7801 Dice).<br>
  3. <strong>Clinical Ontologies</strong> (KCDH Lab & PHFI) — Tobacco cessation decision graph (58% Recall@3).<br>
  4. <strong>NLTM-Bhashini</strong> (MeitY) — Speech-to-speech translation annotation platform (85.05% F1).
</div>
`,
    systems: () => `
<div>
  <div style="color:#10b981; font-weight:600;">Systems & High-Performance Compute:</div>
  • <strong>Fused SwiGLU / Transformer FFN Engine:</strong> 8-wide ARM NEON microkernel, 37–84× speedup.<br>
  • <strong>INT8 Quantization:</strong> 41.7 GFLOP/s compute throughput with &lt;0.6% NRMSE error.<br>
  • <strong>Gaussian Process Engine:</strong> Cholesky factorization ($LL^T$) surrogate model converging in 50 evaluations.
</div>
`,
    resume: () => {
      window.open('cv.pdf', '_blank');
      return `<div>Opening curriculum vitae (cv.pdf)...</div>`;
    },
    contact: () => `
<div>
  • <strong>IITB Email:</strong> <a href="mailto:vijendra@cse.iitb.ac.in" style="color:#38bdf8;">vijendra@cse.iitb.ac.in</a><br>
  • <strong>Personal:</strong> <a href="mailto:vijendra9753@gmail.com" style="color:#38bdf8;">vijendra9753@gmail.com</a><br>
  • <strong>GitHub:</strong> <a href="https://github.com/vennyvirtuoso" target="_blank" style="color:#38bdf8;">github.com/vennyvirtuoso</a><br>
  • <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/vijendra-kumar-vaishya" target="_blank" style="color:#38bdf8;">linkedin.com/in/vijendra-kumar-vaishya</a>
</div>
`,
    clear: () => {
      if (cliHistory) cliHistory.innerHTML = '';
      return '';
    }
  };

  if (cliInput && cliHistory) {
    cliInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const rawCmd = cliInput.value.trim();
        const cmd = rawCmd.toLowerCase();
        cliInput.value = '';

        if (!rawCmd) return;

        // Print entered command
        const cmdLog = document.createElement('div');
        cmdLog.style.marginBottom = '6px';
        cmdLog.innerHTML = `<span style="color:#10b981; font-weight:600;">vijendra@iitb:~$</span> <span style="color:#fff;">${rawCmd}</span>`;
        cliHistory.appendChild(cmdLog);

        if (cmd === 'clear') {
          termCommands.clear();
          return;
        }

        // Execute command
        const outDiv = document.createElement('div');
        outDiv.style.marginBottom = '12px';
        outDiv.style.color = '#cbd5e1';

        if (termCommands[cmd]) {
          outDiv.innerHTML = termCommands[cmd]();
        } else {
          outDiv.innerHTML = `<span style="color:#f43f5e;">zsh: command not found: ${rawCmd}</span>. Type <span style="color:#38bdf8;">help</span> for commands.`;
        }
        cliHistory.appendChild(outDiv);

        const termBody = document.getElementById('terminal-body');
        if (termBody) termBody.scrollTop = termBody.scrollHeight;
      }
    });
  }

  // ============================================================================
  // 7. Interactive 3D Photo Globe / Canvas Physics
  // ============================================================================
  const globeCanvas = document.getElementById('globe-canvas');
  const globeViewport = document.getElementById('globe-viewport');

  if (globeCanvas && globeViewport) {
    const gCtx = globeCanvas.getContext('2d');
    let gW = (globeCanvas.width = globeViewport.clientWidth);
    let gH = (globeCanvas.height = globeViewport.clientHeight);

    window.addEventListener('resize', () => {
      if (globeViewport.clientWidth > 0 && globeViewport.clientHeight > 0) {
        gW = globeCanvas.width = globeViewport.clientWidth;
        gH = globeCanvas.height = globeViewport.clientHeight;
      }
    });

    const NODES_COUNT = 38;
    const nodes = [];
    const RADIUS = 180;

    // Distribute nodes evenly over a sphere using Fibonacci sphere algorithm
    for (let i = 0; i < NODES_COUNT; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / NODES_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      nodes.push({
        x: RADIUS * Math.sin(phi) * Math.cos(theta),
        y: RADIUS * Math.sin(phi) * Math.sin(theta),
        z: RADIUS * Math.cos(phi),
        label: i % 4 === 0 ? 'IITB' : (i % 4 === 1 ? 'CFILT' : (i % 4 === 2 ? 'NEON' : 'MAMBA')),
        color: i % 3 === 0 ? '#38bdf8' : (i % 3 === 1 ? '#818cf8' : '#34d399')
      });
    }

    let rotX = 0;
    let rotY = 0;
    let velX = 0.003;
    let velY = 0.002;
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    globeViewport.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      velX = 0;
      velY = 0;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      velY = dx * 0.005;
      velX = -dy * 0.005;
      rotY += velY;
      rotX += velX;
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    function renderGlobe() {
      gCtx.clearRect(0, 0, gW, gH);

      if (!isMouseDown) {
        rotY += velY;
        rotX += velX;
        velX *= 0.96; // inertia
        velY *= 0.96;
        if (Math.abs(velX) < 0.001) velX = 0.0015;
        if (Math.abs(velY) < 0.001) velY = 0.002;
      }

      const cx = gW / 2;
      const cy = gH / 2;

      // Sort nodes by projected Z for correct painter's depth
      const projected = nodes.map(node => {
        // Rotate around X
        let y1 = node.y * Math.cos(rotX) - node.z * Math.sin(rotX);
        let z1 = node.y * Math.sin(rotX) + node.z * Math.cos(rotX);

        // Rotate around Y
        let x2 = node.x * Math.cos(rotY) + z1 * Math.sin(rotY);
        let z2 = -node.x * Math.sin(rotY) + z1 * Math.cos(rotY);

        const fov = 400;
        const scale = fov / (fov + z2);
        return {
          px: cx + x2 * scale,
          py: cy + y1 * scale,
          scale: scale,
          z: z2,
          color: node.color,
          label: node.label
        };
      }).sort((a, b) => b.z - a.z);

      // Draw connecting lines between nearby points
      gCtx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);
          if (dist < 75) {
            const alpha = Math.max(0, (1 - dist / 75) * 0.25 * ((p1.scale + p2.scale) / 2));
            gCtx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            gCtx.beginPath();
            gCtx.moveTo(p1.px, p1.py);
            gCtx.lineTo(p2.px, p2.py);
            gCtx.stroke();
          }
        }
      }

      // Draw node cards / dots
      projected.forEach(p => {
        const radius = Math.max(1.5, 3.5 * p.scale);
        const alpha = Math.max(0.2, Math.min(1, (p.z + RADIUS) / (2 * RADIUS)));

        gCtx.beginPath();
        gCtx.arc(p.px, p.py, radius, 0, Math.PI * 2);
        gCtx.fillStyle = p.color;
        gCtx.globalAlpha = alpha;
        gCtx.fill();

        // Node label
        if (p.scale > 0.85) {
          gCtx.font = `600 ${Math.round(10 * p.scale)}px sans-serif`;
          gCtx.fillStyle = '#f8fafc';
          gCtx.fillText(p.label, p.px + 8, p.py + 3);
        }
        gCtx.globalAlpha = 1;
      });

      requestAnimationFrame(renderGlobe);
    }

    renderGlobe();
  }

})();
