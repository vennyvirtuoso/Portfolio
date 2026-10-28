/**
 * VIJENDRA KUMAR VAISHYA · TERMINAL PORTFOLIO SCRIPT
 * Interactive Terminal Emulator, Command Dispatcher, Neofetch,
 * Systems Benchmarks, Autocomplete, History, and Matrix Rain.
 */

document.addEventListener("DOMContentLoaded", () => {

  const terminalInput = document.getElementById("terminal-input");
  const ghostHint = document.getElementById("ghost-hint");
  const promptClearBtn = document.getElementById("prompt-clear-btn");
  const statusClock = document.getElementById("status-clock");
  const outputHistory = document.getElementById("output-history");
  const terminalBody = document.getElementById("terminal-body");
  const terminalWindow = document.getElementById("terminal-window");
  const themeSelector = document.getElementById("theme-selector");
  const cmdPills = document.querySelectorAll(".cmd-pill");
  const matrixCanvas = document.getElementById("matrix-canvas");

  // Window control buttons
  const btnClose = document.getElementById("btn-close");
  const btnMinimize = document.getElementById("btn-minimize");
  const btnMaximize = document.getElementById("btn-maximize");

  // Command History State
  const commandHistory = [];
  let historyIndex = -1;
  let matrixActive = false;
  let matrixInterval = null;

  // Command Palette DOM refs
  const cmdPaletteOverlay = document.getElementById("cmd-palette-overlay");
  const cmdPaletteInput = document.getElementById("cmd-palette-input");
  const cmdPaletteList = document.getElementById("cmd-palette-list");

  // Command descriptions for palette
  const commandDescriptions = {
    "help": "Show all available commands & keyboard shortcuts",
    "neofetch": "Profile photo, academic stats, links & system info",
    "about": "Research background, engineering philosophy, and bio",
    "whoami": "Current user identity & system groups",
    "research": "Published papers: WACV '27, EACL '27, arXiv",
    "systems": "Bare-metal C++17 NEON SwiGLU microkernel",
    "benchmark": "Interactive microkernel throughput benchmarks",
    "disasm": "AArch64 ARM NEON vectorized assembly output",
    "roofline": "Roofline model: arithmetic intensity vs. ceilings",
    "compile": "Live C++17 kernel compilation simulation",
    "htop": "CPU core utilization & research process monitor",
    "nvtop": "NVIDIA A100 GPU VRAM, compute & power monitor",
    "git log": "Career timeline as stylized git commit history",
    "timeline": "Visual career & research milestone timeline",
    "ping": "Ping IIT Bombay research server",
    "vim": "Open resume.txt in vim (easter egg)",
    "projects": "Open-source GitHub repos and implementations",
    "skills": "Categorized technical skills overview",
    "education": "Academic record: IIT Bombay, JEC, Class 12",
    "resume": "Download official PDF resume",
    "contact": "Email, GitHub, LinkedIn & office address",
    "ls": "List virtual workspace files",
    "cat": "Print contents of a virtual workspace file",
    "theme": "Switch color theme: cyan, matrix, dracula, amber, mono",
    "matrix": "Toggle background digital matrix rain",
    "sound": "Toggle mechanical keyboard audio",
    "history": "View past command history",
    "quote": "Random systems & architecture philosophy quote",
    "fortune": "Random tech wisdom quote",
    "uname": "Show system kernel and architecture info",
    "date": "Show current date and time",
    "uptime": "Show research cluster uptime",
    "clear": "Clear the terminal screen",
    "boot": "Replay boot intro sequence",
    "sudo": "Try to gain root access (good luck)",
  };

  // Available Commands for Tab Autocomplete
  const availableCommands = [
    "help", "neofetch", "about", "whoami", "research", "systems",
    "benchmark", "disasm", "roofline", "compile", "htop", "nvtop",
    "projects", "skills", "education", "resume", "cv", "contact", "email",
    "ls", "cat", "theme", "matrix", "sound", "history", "quote", "curl",
    "clear", "date", "uptime", "sudo", "git", "ping", "vim", "nano",
    "timeline", "uname", "fortune", "boot"
  ];

  // Available Files for 'cat'
  const virtualFiles = {
    "about.txt": "about",
    "education.txt": "education",
    "skills.md": "skills",
    "research.tex": "research",
    "benchmark.cpp": "benchmark",
    "disasm.s": "disasm",
    "roofline.dat": "roofline",
    "htop.sh": "htop",
    "nvtop.sh": "nvtop",
    "resume.pdf": "resume",
    "contact.sh": "contact",
    "projects.json": "projects"
  };

  // Focus Input on Terminal Click
  if (terminalBody) {
    terminalBody.addEventListener("click", () => {
      if (terminalInput) terminalInput.focus();
    });
  }

  // Safe Storage Helper
  const safeStorage = {
    get: (key, fallback = null) => {
      try {
        return localStorage.getItem(key) || fallback;
      } catch (e) {
        return fallback;
      }
    },
    set: (key, val) => {
      try {
        localStorage.setItem(key, val);
      } catch (e) { }
    }
  };

  // =========================================================================
  // Theme Manager (Direct One-Click Themes: Slate, Paper, Navy, Emerald)
  // =========================================================================
  const themeChips = document.querySelectorAll(".theme-chip");

  const setGlobalTheme = (themeName) => {
    document.documentElement.setAttribute("data-theme", themeName);
    themeChips.forEach(chip => {
      const isActive = chip.getAttribute("data-theme") === themeName;
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-checked", isActive ? "true" : "false");
    });
    safeStorage.set("portfolio-theme", themeName);
  };

  themeChips.forEach(chip => {
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      const theme = chip.getAttribute("data-theme");
      if (theme) setGlobalTheme(theme);
    });
  });

  const savedTheme = safeStorage.get("portfolio-theme", "classic-dark");
  setGlobalTheme(savedTheme);

  // Window Maximize Toggle
  if (btnMaximize) {
    btnMaximize.addEventListener("click", () => {
      terminalWindow.classList.toggle("is-maximized");
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      outputHistory.innerHTML = "";
    });
  }

  if (btnMinimize) {
    btnMinimize.addEventListener("click", () => {
      printCommandOutput("minimize", "<span class='term-dim'>[Window minimized to status bar · Press Maximize or click inside to expand]</span>");
    });
  }

  // =========================================================================
  // Mechanical Keyboard Sound Synthesizer (Web Audio API)
  // =========================================================================
  let audioCtx = null;
  let soundEnabled = true;
  const soundToggleBtn = document.getElementById("sound-toggle");
  const soundIcon = document.getElementById("sound-icon");

  const playKeySound = (isEnter = false) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      // Subtle mechanical click: randomized frequency
      const freq = isEnter ? 260 : (480 + Math.random() * 240);
      osc.type = isEnter ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(isEnter ? 0.05 : 0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isEnter ? 0.08 : 0.04));

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + (isEnter ? 0.08 : 0.04));
    } catch (e) { }
  };

  const setSoundState = (enabled) => {
    soundEnabled = enabled;
    if (soundToggleBtn) {
      soundToggleBtn.classList.toggle("active", soundEnabled);
      const label = soundToggleBtn.querySelector(".sound-label");
      if (label) label.textContent = soundEnabled ? "Audio: ON" : "Audio: OFF";
      if (soundIcon) soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
    }
  };

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", () => {
      setSoundState(!soundEnabled);
      playKeySound(true);
    });
  }

  // =========================================================================
  // Terminal Tabs Switching
  // =========================================================================
  const termTabs = document.querySelectorAll(".term-tab");
  termTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      termTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      playKeySound();

      const cmd = tab.getAttribute("data-cmd");
      if (cmd) {
        executeCommand(cmd);
      } else if (tab.getAttribute("data-tab") === "zsh") {
        if (terminalInput) terminalInput.focus();
      }
    });
  });

  // Delegate clicks on quick pills & inline commands
  document.addEventListener("click", (e) => {
    const pill = e.target.closest(".cmd-pill");
    if (pill) {
      e.preventDefault();
      e.stopPropagation();
      const cmd = pill.getAttribute("data-cmd") || pill.textContent.trim();
      if (cmd) executeCommand(cmd);
      return;
    }

    const inlineCmd = e.target.closest(".term-cmd-inline, .help-cmd");
    if (inlineCmd) {
      e.preventDefault();
      const cmd = inlineCmd.getAttribute("data-cmd") || inlineCmd.textContent.trim();
      if (cmd) executeCommand(cmd);
    }
  });

  // =========================================================================
  // Matrix Digital Rain
  // =========================================================================
  const toggleMatrixRain = () => {
    if (!matrixCanvas) return;
    matrixActive = !matrixActive;

    if (!matrixActive) {
      if (matrixInterval) clearInterval(matrixInterval);
      const ctx = matrixCanvas.getContext("2d");
      ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      return "Matrix rain deactivated.";
    }

    const ctx = matrixCanvas.getContext("2d");
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    const chars = "0101010101010101ABCDEFАБВГДЕ0123456789λμπθΣΩC++17NEON";
    const fontSize = 14;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const drawMatrix = () => {
      ctx.fillStyle = "rgba(7, 11, 20, 0.08)";
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

      ctx.fillStyle = document.documentElement.getAttribute("data-theme") === "matrix" ? "#22c55e" : "#38bdf8";
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    matrixInterval = setInterval(drawMatrix, 35);
    return "⚡ Matrix digital rain activated. Type <span class='term-cmd-inline'>matrix</span> again to toggle off.";
  };

  // =========================================================================
  // Command Definitions & Content Generators
  // =========================================================================
  const getBannerHTML = () => {
    return `
<div class="ascii-banner">
██╗   ██╗██╗     ██╗███████╗███╗   ██╗██████╗ ██████╗  █████╗ 
██║   ██║██║     ██║██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔══██╗
██║   ██║██║     ██║█████╗  ██╔██╗ ██║██║  ██║██████╔╝███████║
╚██╗ ██╔╝██║██   ██║██╔══╝  ██║╚██╗██║██║  ██║██╔══██╗██╔══██║
 ╚████╔╝ ██║╚█████╔╝███████╗██║ ╚████║██████╔╝██║  ██║██║  ██║
  ╚═══╝  ╚═╝ ╚════╝ ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
</div>
<div class="welcome-lead"><strong>Vijendra Kumar Vaishya</strong> · AI Researcher & Systems Engineer</div>
<div class="welcome-sub">M.S. by Research @ <span class="term-strong">Indian Institute of Technology Bombay (IIT Bombay)</span></div>
<div class="welcome-tip">Type <span class="term-cmd-inline">help</span> to view available commands, or click the quick pills above.</div>
`;
  };

  const getNeofetchHTML = () => {
    return `
<div class="neofetch-container">
  <div class="neofetch-avatar-wrap">
    <img src="assets/vijendra_profile.png" alt="Vijendra Kumar Vaishya" class="neofetch-avatar" width="180" height="180">
    <div class="neofetch-role-tag"><a href="https://www.cfilt.iitb.ac.in/" target="_blank" style="color:inherit; text-decoration:none;">IIT BOMBAY · CFILT LAB</a></div>
  </div>
  <div class="neofetch-details">
    <div class="neofetch-header">vijendra@iitb · M.S. by Research Candidate (Roll: 24M2133)</div>
    <div class="neofetch-row"><span class="neofetch-label">Host:</span><span class="neofetch-val">Indian Institute of Technology Bombay (IIT Bombay)</span></div>
    <div class="neofetch-row"><span class="neofetch-label">Degree:</span><span class="neofetch-val"><strong>M.S. by Research in CSE</strong> · CPI: <strong>8.9 / 10</strong></span></div>
    <div class="neofetch-row"><span class="neofetch-label">Advisor:</span><span class="neofetch-val"><strong>Prof. Pushpak Bhattacharyya</strong> (CFILT Lab, IIT Bombay)</span></div>
    <div class="neofetch-row"><span class="neofetch-label">Research:</span><span class="neofetch-val">WACV '27 (MIST SSM) &nbsp;·&nbsp; EACL '27 (BiasRetriever)</span></div>
    <div class="neofetch-row"><span class="neofetch-label">Systems:</span><span class="neofetch-val"><strong style="color:var(--accent-alt);">84.2×</strong> C++17 NEON SwiGLU FFN Engine</span></div>
    <div class="neofetch-row"><span class="neofetch-label">LeetCode:</span><span class="neofetch-val"><strong>500+</strong> Problems Solved (Algorithms &amp; Data Structures)</span></div>
    <div class="neofetch-row"><span class="neofetch-label">Links:</span><span class="neofetch-val"><a href="https://github.com/vennyvirtuoso" target="_blank" style="color:var(--accent);">GitHub</a> &nbsp;·&nbsp; <a href="https://linkedin.com/in/vijendra-kumar-vaishya" target="_blank" style="color:var(--accent);">LinkedIn</a></span></div>
    <div class="neofetch-row"><span class="neofetch-label">Status:</span><span class="neofetch-val" style="color: var(--accent-alt);">● Open to AI Research &amp; Systems Engineering Roles</span></div>
  </div>
</div>
`;
  };

  const getHelpHTML = () => {
    return `
<div class="help-grid">
  <div class="help-cmd" data-cmd="neofetch">neofetch</div>
  <div class="help-desc">Profile photo, academic stats, links, and system specs</div>

  <div class="help-cmd" data-cmd="about">about</div>
  <div class="help-desc">Research background, engineering philosophy, and bio</div>

  <div class="help-cmd" data-cmd="research">research</div>
  <div class="help-desc">Conference papers: WACV '27, EACL '27, Tobacco Chatbot, MeitY Bhashini</div>

  <div class="help-cmd" data-cmd="systems">systems</div>
  <div class="help-desc">Bare-metal C++17 NEON SwiGLU FFN inference microkernel</div>

  <div class="help-cmd" data-cmd="benchmark">benchmark</div>
  <div class="help-desc">Interactive 5-stage NEON throughput &amp; speedup benchmark</div>

  <div class="help-cmd" data-cmd="projects">projects</div>
  <div class="help-desc">Self projects &amp; IIT Bombay graduate course projects</div>

  <div class="help-cmd" data-cmd="skills">skills</div>
  <div class="help-desc">Categorized technical skills directly from PDF resumes</div>

  <div class="help-cmd" data-cmd="education">education</div>
  <div class="help-desc">Academic record: IIT Bombay (8.9 CPI), JEC (8.06 CPI), DPS Nigahi</div>

  <div class="help-cmd" data-cmd="resume">resume</div>
  <div class="help-desc">Download official PDF resume</div>

  <div class="help-cmd" data-cmd="contact">contact</div>
  <div class="help-desc">Email, GitHub, LinkedIn, and research office address</div>

  <div class="help-cmd" data-cmd="ls">ls</div>
  <div class="help-desc">List virtual workspace files</div>

  <div class="help-cmd" data-cmd="clear">clear</div>
  <div class="help-desc">Clear the terminal screen</div>
</div>
`;
  };

  const getAboutHTML = () => {
    return `
<div class="term-card">
  <div class="term-card-top">
    <span class="term-card-title">Vijendra Kumar Vaishya</span>
    <span class="term-card-tag">Profile Bio</span>
  </div>
  <div class="term-card-inst">Graduate Researcher · Computer Science &amp; Engineering · IIT Bombay</div>
  <div class="term-card-desc">
    I am a graduate researcher in Computer Science at IIT Bombay working across the machine learning stack—from foundational model design and representation alignment to low-level systems execution.
    <br><br>
    My research focuses on making language and vision systems both reliable and efficient: advancing state-space models (Mamba SSMs) for spatiotemporal sequence modeling (WACV 2027), contrastive intersectional bias detection in language representations (EACL 2027), clinical conversational ontologies, and bare-metal C++17 ARM NEON inference optimization.
  </div>
  <div class="term-card-meta">
    <span class="term-metric-pill">Accepted @ WACV 2027</span>
    <span class="term-metric-pill">EACL 2027 (Under Review)</span>
    <span class="term-metric-pill">IIT Bombay CSE</span>
  </div>
</div>
`;
  };

  const getEducationHTML = () => {
    return `
<div class="term-card-list">
  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title">Indian Institute of Technology Bombay (IIT Bombay)</span>
      <span class="term-card-tag">2024 – 2027</span>
    </div>
    <div class="term-card-inst">M.S. by Research in Computer Science and Engineering · Roll: 24M2133</div>
    <div class="term-card-desc">
      CPI: <strong>8.9 / 10</strong> (Core Credits: 28 | Total Credits: 58). Advised by <strong>Prof. Pushpak Bhattacharyya</strong> in the <strong>CFILT Lab</strong>. 
      Focusing on Mamba SSMs, intersectional bias evaluation, clinical RAG engines, and low-level C++17 NEON SIMD systems acceleration.
    </div>
    <div class="term-card-meta">
      <span class="term-metric-pill">CPI: 8.9 / 10</span>
      <span class="term-tag">IIT Bombay CSE</span>
      <span class="term-tag">CFILT Lab</span>
    </div>
  </div>

  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title">Jabalpur Engineering College (RGPV)</span>
      <span class="term-card-tag">2020 – 2024</span>
    </div>
    <div class="term-card-inst">Bachelor of Technology (B.Tech) in Information Technology</div>
    <div class="term-card-desc">
      CPI: <strong>8.06 / 10</strong>. Specialization in Information Technology. Core coursework in Algorithms, Operating Systems, Computer Architecture, Compiler Design. Solved 500+ problems on LeetCode.
    </div>
    <div class="term-card-meta">
      <span class="term-metric-pill">CPI: 8.06 / 10</span>
      <span class="term-tag">500+ LeetCode</span>
    </div>
  </div>

  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title">DPS Nigahi (CBSE Class XII)</span>
      <span class="term-card-tag">2020</span>
    </div>
    <div class="term-card-inst">Senior Secondary Certificate Examination</div>
    <div class="term-card-desc">
      Secured <strong>3rd Rank across the entire district</strong> with <strong>96.00% aggregate</strong>. Achieved a <strong>perfect 100% score in Mathematics</strong>. Qualified the JEE Advanced examination.
    </div>
    <div class="term-card-meta">
      <span class="term-metric-pill">100% Mathematics</span>
      <span class="term-metric-pill">96.00% Aggregate</span>
      <span class="term-tag">District Rank 3</span>
      <span class="term-tag">JEE Advanced</span>
    </div>
  </div>
</div>
`;
  };

  const getSkillsHTML = () => {
    return `
<div class="skills-term-grid">
  <div class="skills-category-box">
    <div class="skills-category-title">💻 Programming Languages</div>
    <div class="skills-tags-wrap">
      <span class="skill-pill starred">Python</span>
      <span class="skill-pill starred">C++ (17)</span>
      <span class="skill-pill">C</span>
      <span class="skill-pill">Bash Scripting</span>
    </div>
  </div>

  <div class="skills-category-box">
    <div class="skills-category-title">🧠 ML / DL Frameworks</div>
    <div class="skills-tags-wrap">
      <span class="skill-pill starred">PyTorch</span>
      <span class="skill-pill starred">Hugging Face Transformers</span>
      <span class="skill-pill">OpenCV</span>
      <span class="skill-pill">NumPy</span>
      <span class="skill-pill">CUDA</span>
    </div>
  </div>

  <div class="skills-category-box">
    <div class="skills-category-title">🔬 ML Techniques &amp; Architectures</div>
    <div class="skills-tags-wrap">
      <span class="skill-pill starred">Mamba / State-Space Models</span>
      <span class="skill-pill starred">Vision Transformers</span>
      <span class="skill-pill starred">RAG</span>
      <span class="skill-pill">Contrastive Learning</span>
      <span class="skill-pill">LLM Fine-Tuning &amp; INT8 Quantization</span>
      <span class="skill-pill">Bayesian Optimization</span>
    </div>
  </div>

  <div class="skills-category-box">
    <div class="skills-category-title">⚡ Systems, Backend &amp; Infrastructure</div>
    <div class="skills-tags-wrap">
      <span class="skill-pill starred">ARM NEON SIMD</span>
      <span class="skill-pill">Flask</span>
      <span class="skill-pill">MLOps Pipelines</span>
      <span class="skill-pill">FAISS</span>
      <span class="skill-pill">Docker</span>
      <span class="skill-pill">MySQL</span>
    </div>
  </div>
</div>
`;
  };

  const getResearchHTML = () => {
    return `
<div class="term-card-list">
  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title">MIST: Mamba-based Integrated Spatio-Temporal Model for DSA Segmentation</span>
      <span class="term-card-tag" style="background:rgba(16,185,129,0.15);color:#34d399;border-color:rgba(16,185,129,0.3);">Accepted at WACV 2027</span>
    </div>
    <div class="term-card-inst">Vijendra Kumar Vaishya, Viraj Singh Gaur, Amruth Sagar, Swapna Sourav Rout, Kshitij Sharad Jadhav</div>
    <div class="term-card-desc">
      Dual-branch spatio-temporal architecture with <strong>CrossSTF Cross-Attention Fusion</strong>. Achieved a <strong>Dice score of 0.7801</strong> on independent DSCA benchmark without retraining.
    </div>
  </div>

  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title">Beyond Single-Axis Fairness: Learning to Detect Intersectional Biases</span>
      <span class="term-card-tag">EACL 2027 (Under Review)</span>
    </div>
    <div class="term-card-inst">Vijendra Kumar Vaishya, Nihar Ranjan Sahoo, Pushpak Bhattacharyya</div>
    <div class="term-card-desc">
      Introduced <strong>BiasRetriever</strong>, a contrastively trained retriever using canonical single-axis stereotype embeddings. Boosted <strong>Jaccard score by 18 points</strong> over the strongest LLM baseline across disjoint corpora.
    </div>
  </div>

  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title">Ontology-Aware Tobacco Cessation Chatbot</span>
      <span class="term-card-tag">KCDH Lab &amp; PHFI</span>
    </div>
    <div class="term-card-desc">
      Built 6,900-concept clinical ontology with 33k+ edges. Reduced broken mid-sentence chunk splits from 84.6% to 5.6%. Achieved <strong>58% Recall@3</strong> and <strong>0.497 MRR</strong>.
    </div>
  </div>
</div>
`;
  };

  const getSystemsHTML = () => {
    return `
<div class="term-card-list">
  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title">Fused SwiGLU / Transformer FFN Inference Engine</span>
      <span class="term-card-tag">Bare-Metal C++17</span>
    </div>
    <div class="term-card-inst">Target: Apple Silicon / ARM Cortex AArch64 · Zero External Dependencies</div>
    <div class="term-card-desc">
      Hand-wrote 8-wide ARM NEON SIMD microkernel with 5-stage optimization ladder to INT8. Reached <strong>37–84x speedup</strong> over scalar baseline. Applied INT8 quantization for <strong>41.7 GFLOP/s throughput at &lt;0.6% NRMSE error</strong>. Fused ops in registers with P-/E-core scheduling for 1.43–1.48x further gain.
    </div>
    <div class="term-card-meta">
      <span class="term-metric-pill">37–84x Speedup</span>
      <span class="term-metric-pill">41.7 GFLOP/s Peak</span>
      <span class="term-metric-pill">NRMSE &lt;0.6%</span>
      <span class="term-tag">C++17</span>
      <span class="term-tag">ARM NEON</span>
    </div>
  </div>
</div>
`;
  };

  const getBenchmarkHTML = () => {
    return `
<div class="benchmark-box">
  <div class="bench-header">
    <span class="bench-title">⚡ SwiGLU FFN Microkernel Benchmark (C++17 NEON vs Scalar)</span>
    <span class="bench-badge">5-STAGE OPTIMIZATION LADDER</span>
  </div>

  <div class="bench-bar-row">
    <div class="bench-label-row">
      <span>1. Baseline Scalar C++ (O3)</span>
      <span>0.50 GFLOP/s · 1.0×</span>
    </div>
    <div class="bench-bar-track"><div class="bench-bar-fill" style="width: 1.2%;"></div></div>
  </div>

  <div class="bench-bar-row">
    <div class="bench-label-row">
      <span>2. Auto-Vectorized Clang NEON</span>
      <span>18.6 GFLOP/s · 37.2×</span>
    </div>
    <div class="bench-bar-track"><div class="bench-bar-fill" style="width: 44%;"></div></div>
  </div>

  <div class="bench-bar-row">
    <div class="bench-label-row">
      <span>3. Hand-Written 8-Wide NEON Microkernel</span>
      <span>36.8 GFLOP/s · 73.6×</span>
    </div>
    <div class="bench-bar-track"><div class="bench-bar-fill" style="width: 87%;"></div></div>
  </div>

  <div class="bench-bar-row">
    <div class="bench-label-row">
      <span><strong>4. Fully Register-Fused NEON + INT8 Quant (Ours)</strong></span>
      <span style="color: var(--accent-alt); font-weight:700;">41.7 GFLOP/s · 84.2×</span>
    </div>
    <div class="bench-bar-track"><div class="bench-bar-fill fill-green" style="width: 100%;"></div></div>
  </div>

  <div style="margin-top: 14px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
    <button class="interactive-action-btn rerun-bench-btn" type="button">⚡ Re-Run Benchmark Simulation</button>
    <button class="copy-btn" type="button" data-copy="41.7 GFLOP/s (84.2x) C++17 NEON FFN Engine (<0.6% NRMSE)">📋 Copy Benchmark Stats</button>
  </div>
</div>
`;
  };

  const getProjectsHTML = () => {
    return `
<div class="term-card-list">
  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title"><a href="https://github.com/vennyvirtuoso" target="_blank">Fused SwiGLU / Transformer FFN Inference Engine</a></span>
      <span class="term-card-tag">Systems / C++17</span>
    </div>
    <div class="term-card-desc">
      Bare-metal C++17 inference engine for LLaMA/Mistral FFN with 5-stage optimization ladder. Hand-written 8-wide NEON microkernel reaching 37–84x speedup over scalar baseline and 41.7 GFLOP/s at &lt;0.6% NRMSE error.
    </div>
    <div class="term-card-meta">
      <span class="term-metric-pill">37–84x Speedup</span>
      <span class="term-tag">C++17</span>
      <span class="term-tag">ARM NEON</span>
      <span class="term-tag">INT8 Quant</span>
    </div>
  </div>

  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title"><a href="https://github.com/vennyvirtuoso" target="_blank">Custom Gaussian Process &amp; Bayesian Optimization Engine</a></span>
      <span class="term-card-tag">Machine Learning Theory</span>
    </div>
    <div class="term-card-desc">
      From-scratch GP surrogate using Cholesky factorizations (LL^T) and log-marginal optimization. Formulated analytical Expected Improvement &amp; Probability of Improvement acquisition functions, converging in 50 evaluations.
    </div>
    <div class="term-card-meta">
      <span class="term-metric-pill">Cholesky LL^T</span>
      <span class="term-tag">Bayesian Optimization</span>
      <span class="term-tag">Python &amp; NumPy</span>
    </div>
  </div>

  <div class="term-card">
    <div class="term-card-top">
      <span class="term-card-title"><a href="https://github.com/vennyvirtuoso" target="_blank">StoriesbySafarnama — Collaborative Digital Storytelling</a></span>
      <span class="term-card-tag">Full-Stack / Platform</span>
    </div>
    <div class="term-card-desc">
      Founded and built Safarnama, a private platform for creating and sharing collaborative digital memory timelines with scalable media backend and integrated DODO Payments.
    </div>
    <div class="term-card-meta">
      <span class="term-metric-pill">DODO Payments</span>
      <span class="term-tag">Full-Stack</span>
      <span class="term-tag">Media Backend</span>
    </div>
  </div>
</div>
`;
  };

  const getContactHTML = () => {
    return `
<div class="term-card">
  <div class="term-card-top">
    <span class="term-card-title">Contact & Communication Endpoints</span>
    <span class="term-card-tag">Online</span>
  </div>
  <div class="term-card-desc">
    Feel free to reach out for research collaborations, graduate fellowships, systems engineering opportunities, or kernel benchmarks.
    <br><br>
    📧 <strong>Email:</strong> <a href="mailto:vijendra9753@gmail.com" style="color: var(--accent);">vijendra9753@gmail.com</a> <button class="copy-btn" type="button" data-copy="vijendra9753@gmail.com">📋 Copy</button><br><br>
    💻 <strong>GitHub:</strong> <a href="https://github.com/vennyvirtuoso" target="_blank" style="color: var(--accent);">github.com/vennyvirtuoso</a><br>
    🔗 <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/vijendra-kumar-vaishya" target="_blank" style="color: var(--accent);">linkedin.com/in/vijendra-kumar-vaishya</a><br>
    🏛️ <strong>Office:</strong> Department of Computer Science & Engineering, IIT Bombay, Powai, Mumbai 400076, India
  </div>
</div>
`;
  };

  const getLsHTML = () => {
    return `
<div style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.8;">
  <span style="color: #64748b;">drwxr-xr-x  8 vijendra staff   256B Sep 10 06:00</span> <span style="color: var(--accent-purple); font-weight: 700;">.</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  1.4KB Sep 10 06:00</span> <span class="term-cmd-inline">about.txt</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  1.8KB Sep 10 06:00</span> <span class="term-cmd-inline">education.txt</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  2.1KB Sep 10 06:00</span> <span class="term-cmd-inline">skills.md</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  3.2KB Sep 10 06:00</span> <span class="term-cmd-inline">research.tex</span><br>
  <span style="color: #64748b;">-rwxr-xr-x  1 vijendra staff  4.8KB Sep 10 06:00</span> <span class="term-cmd-inline">benchmark.cpp</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  3.1KB Sep 10 06:00</span> <span class="term-cmd-inline">disasm.s</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  1.6KB Sep 10 06:00</span> <span class="term-cmd-inline">roofline.dat</span><br>
  <span style="color: #64748b;">-rwxr-xr-x  1 vijendra staff  1.2KB Sep 10 06:00</span> <span class="term-cmd-inline">htop.sh</span><br>
  <span style="color: #64748b;">-rwxr-xr-x  1 vijendra staff  1.1KB Sep 10 06:00</span> <span class="term-cmd-inline">nvtop.sh</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  120KB Sep 10 06:00</span> <span style="color: var(--accent-alt); font-weight: 700;"><a href="./vijendra_resume.pdf" download style="color:inherit; text-decoration:none;">resume.pdf</a></span><br>
  <span style="color: #64748b;">-rwxr-xr-x  1 vijendra staff   620B Sep 10 06:00</span> <span class="term-cmd-inline">contact.sh</span><br>
  <span style="color: #64748b;">-rw-r--r--  1 vijendra staff  3.8KB Sep 10 06:00</span> <span class="term-cmd-inline">projects.json</span>
</div>
`;
  };

  const getHtopHTML = () => {
    return `
<div class="htop-box">
  <div class="htop-header">
    <span>HTOP 3.2.2 · IIT Bombay Research Node · 8 CPU Cores</span>
    <span style="color: var(--text-dim);">Uptime: 142 days, 16:42</span>
  </div>

  <div class="htop-meters-grid">
    <div class="meter-row">
      <span class="meter-label">CPU 0</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-green" style="width: 94%;"></div></div>
      <span class="meter-val">94.2%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label">CPU 1</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-green" style="width: 88%;"></div></div>
      <span class="meter-val">88.5%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label">CPU 2</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-green" style="width: 91%;"></div></div>
      <span class="meter-val">91.0%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label">CPU 3</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-green" style="width: 85%;"></div></div>
      <span class="meter-val">85.4%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label">CPU 4</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-amber" style="width: 42%;"></div></div>
      <span class="meter-val">42.1%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label">CPU 5</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-amber" style="width: 38%;"></div></div>
      <span class="meter-val">38.7%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label">CPU 6</span>
      <div class="meter-bar-track"><div class="meter-bar-fill" style="width: 14%;"></div></div>
      <span class="meter-val">14.2%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label">CPU 7</span>
      <div class="meter-bar-track"><div class="meter-bar-fill" style="width: 12%;"></div></div>
      <span class="meter-val">12.0%</span>
    </div>
  </div>

  <div class="meter-row" style="margin-bottom: 12px;">
    <span class="meter-label" style="width: 70px;">Mem [RAM]</span>
    <div class="meter-bar-track"><div class="meter-bar-fill" style="width: 34%;"></div></div>
    <span class="meter-val" style="width: 80px;">21.8G / 64.0G</span>
  </div>

  <table class="process-table">
    <thead>
      <tr>
        <th>PID</th>
        <th>USER</th>
        <th>PRI</th>
        <th>%CPU</th>
        <th>%MEM</th>
        <th>TIME+</th>
        <th>Command</th>
      </tr>
    </thead>
    <tbody>
      <tr class="proc-highlight">
        <td>1084</td>
        <td>vijendra</td>
        <td>20</td>
        <td>94.2</td>
        <td>2.4</td>
        <td>18:42.10</td>
        <td>./swiglu_engine --opt=INT8_NEON --threads=8</td>
      </tr>
      <tr>
        <td>1209</td>
        <td>vijendra</td>
        <td>20</td>
        <td>45.1</td>
        <td>8.6</td>
        <td>44:12.80</td>
        <td>python3 train_mist_mamba_3d.py --dataset=DSCA</td>
      </tr>
      <tr>
        <td>1340</td>
        <td>vijendra</td>
        <td>20</td>
        <td>14.8</td>
        <td>3.2</td>
        <td>08:19.45</td>
        <td>python3 phfi_clinical_retriever.py --kcdh</td>
      </tr>
      <tr>
        <td>0842</td>
        <td>root</td>
        <td>20</td>
        <td>0.4</td>
        <td>0.1</td>
        <td>01:04.12</td>
        <td>systemd-journald</td>
      </tr>
    </tbody>
  </table>
</div>
`;
  };

  const getNvtopHTML = () => {
    return `
<div class="nvtop-box">
  <div class="nvtop-header">
    <span>NVTOP 3.0.2 · NVIDIA A100-SXM4-80GB · PCIe Gen4 x16</span>
    <span style="color: var(--accent-alt);">● ONLINE (P0)</span>
  </div>

  <div class="htop-meters-grid" style="grid-template-columns: 1fr;">
    <div class="meter-row">
      <span class="meter-label" style="width: 80px;">GPU Util</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-green" style="width: 92%;"></div></div>
      <span class="meter-val">92%</span>
    </div>
    <div class="meter-row">
      <span class="meter-label" style="width: 80px;">VRAM Util</span>
      <div class="meter-bar-track"><div class="meter-bar-fill" style="width: 35%;"></div></div>
      <span class="meter-val" style="width: 90px;">28.4G / 80.0G</span>
    </div>
    <div class="meter-row">
      <span class="meter-label" style="width: 80px;">Power Draw</span>
      <div class="meter-bar-track"><div class="meter-bar-fill fill-amber" style="width: 66%;"></div></div>
      <span class="meter-val" style="width: 90px;">265W / 400W</span>
    </div>
  </div>

  <div style="display:flex; justify-content:space-between; font-size: 0.78rem; color: var(--text-dim); margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
    <span>Temp: <strong style="color:var(--text-main);">54°C</strong></span>
    <span>Clock: <strong style="color:var(--text-main);">1410 MHz</strong></span>
    <span>Fan: <strong style="color:var(--text-main);">Auto (62%)</strong></span>
    <span>Driver: <strong style="color:var(--text-main);">535.129.03</strong></span>
    <span>CUDA: <strong style="color:var(--text-main);">12.2</strong></span>
  </div>

  <table class="process-table">
    <thead>
      <tr>
        <th>PID</th>
        <th>USER</th>
        <th>GPU%</th>
        <th>VRAM</th>
        <th>SM%</th>
        <th>Command</th>
      </tr>
    </thead>
    <tbody>
      <tr class="proc-highlight">
        <td>2401</td>
        <td>vijendra</td>
        <td>92%</td>
        <td>28.4 GB</td>
        <td>96%</td>
        <td>python3 train_mist_mamba_3d.py --dataset=DSCA --model=MIST</td>
      </tr>
      <tr>
        <td>1988</td>
        <td>vijendra</td>
        <td>--</td>
        <td>1.2 GB</td>
        <td>--</td>
        <td>torch.distributed.run --nproc_per_node=1</td>
      </tr>
    </tbody>
  </table>
</div>
`;
  };

  const getDisasmHTML = () => {
    return `
<div class="disasm-box">
  <div class="htop-header">
    <span>🔬 Bare-Metal AArch64 ARM NEON Disassembly · SwiGLU Gating Microkernel</span>
    <span class="term-tag">v0–v7 Pinned in SRAM</span>
  </div>

  <div class="asm-code-block">
<span class="asm-comment">// Signature: void swiglu_fused_neon_8wide(const float* in, const float* gate, int8_t* out, size_t n)</span>
<span class="asm-label">.global _swiglu_fused_neon_8wide:</span>
    <span class="asm-comment">// 1. Vectorized Load: 8 float32 lanes from memory into 128-bit vector registers</span>
    <span class="asm-inst">ld1</span>         {<span class="asm-reg">v0.4s</span>, <span class="asm-reg">v1.4s</span>}, [<span class="asm-reg">x0</span>], <span class="asm-imm">#32</span>      <span class="asm-comment">// Load 8 inputs into v0 (lanes 0-3), v1 (lanes 4-7)</span>
    <span class="asm-inst">ld1</span>         {<span class="asm-reg">v2.4s</span>, <span class="asm-reg">v3.4s</span>}, [<span class="asm-reg">x1</span>], <span class="asm-imm">#32</span>      <span class="asm-comment">// Load 8 gate weights into v2, v3</span>

    <span class="asm-comment">// 2. SwiGLU Gating: y = (x * sigmoid(beta * x)) * gate</span>
    <span class="asm-inst">fmul</span>        <span class="asm-reg">v4.4s</span>, <span class="asm-reg">v0.4s</span>, <span class="asm-reg">v2.4s</span>            <span class="asm-comment">// v4 = v0 * v2 (vectorized 4-lane multiply)</span>
    <span class="asm-inst">fmul</span>        <span class="asm-reg">v5.4s</span>, <span class="asm-reg">v1.4s</span>, <span class="asm-reg">v3.4s</span>            <span class="asm-comment">// v5 = v1 * v3 (vectorized 4-lane multiply)</span>
    <span class="asm-inst">fmla</span>        <span class="asm-reg">v4.4s</span>, <span class="asm-reg">v4.4s</span>, <span class="asm-reg">v0.4s</span>            <span class="asm-comment">// Fused Multiply-Accumulate in SRAM register</span>

    <span class="asm-comment">// 3. Register-Level INT8 Quantization: Scale and Saturate</span>
    <span class="asm-inst">fcvtn</span>       <span class="asm-reg">v6.4h</span>, <span class="asm-reg">v4.4s</span>                   <span class="asm-comment">// Narrow float32 vector to float16 vector</span>
    <span class="asm-inst">fcvtn2</span>      <span class="asm-reg">v6.8h</span>, <span class="asm-reg">v5.4s</span>                   <span class="asm-comment">// Pack upper 4 lanes into 8-lane half vector</span>
    <span class="asm-inst">sqxtn</span>       <span class="asm-reg">v7.8b</span>, <span class="asm-reg">v6.8h</span>                   <span class="asm-comment">// Signed saturate narrow: 8 x int16 -> 8 x int8</span>

    <span class="asm-comment">// 4. Single-Cycle Memory Store (Zero DRAM roundtrips)</span>
    <span class="asm-inst">st1</span>         {<span class="asm-reg">v7.8b</span>}, [<span class="asm-reg">x2</span>], <span class="asm-imm">#8</span>              <span class="asm-comment">// Direct 8-byte write to output</span>
    <span class="asm-inst">subs</span>        <span class="asm-reg">x3</span>, <span class="asm-reg">x3</span>, <span class="asm-imm">#8</span>                     <span class="asm-comment">// Decrement loop counter by 8 lanes</span>
    <span class="asm-inst">b.ne</span>        <span class="asm-label">_swiglu_fused_neon_8wide</span>       <span class="asm-comment">// Branch if remaining > 0</span>
    <span class="asm-inst">ret</span>                                        <span class="asm-comment">// Microkernel return</span>
  </div>

  <div style="margin-top: 12px; font-size: 0.8rem; color: var(--text-dim); border-top: 1px solid var(--border-subtle); padding-top: 8px;">
    » Target Hardware: <strong>Apple Silicon M-Series / ARM Cortex AArch64</strong> · Latency: <strong>14.2 µs</strong> · Arithmetic Intensity: <strong>84.2× speedup</strong>
  </div>
</div>
`;
  };

  const getRooflineHTML = () => {
    return `
<div class="roofline-box">
  <div class="htop-header">
    <span>📈 Roofline Model Analysis · Arithmetic Intensity vs Hardware Ceilings</span>
    <span class="term-tag">Compute Bound: 41.7 GFLOP/s</span>
  </div>

  <div class="roofline-chart">
 Performance (GFLOP/s)
    ▲
50 ─┤                                         ╭───────────────────── Peak Compute Roof (41.7 GFLOP/s)
    │                                     ╭───╯ [★] Fused NEON Microkernel (Ours: 84.2×)
40 ─┤                                 ╭───╯
    │                             ╭───╯
30 ─┤                         ╭───╯
    │                     ╭───╯
20 ─┤                 ╭───╯ [●] Auto-Vectorized Clang (18.6 GFLOP/s)
    │             ╭───╯
10 ─┤         ╭───╯ 
    │     ╭───╯ [▲] Baseline Scalar C++ (0.50 GFLOP/s)
 0 ─┴─────┴───────┴───────┴───────┴───────┴───────┴───────┴───────►
    0.1  0.25    0.5     1.0     2.0     4.0     8.0     16.0    Arithmetic Intensity (FLOP/Byte)
    ◄─── Memory-Bound Ceiling (DRAM Spill) ───► ◄─── Compute-Bound (Register Fused) ───►
  </div>

  <div class="term-card-meta" style="font-size: 0.82rem;">
    <span class="term-metric-pill">DRAM Spills: 0 (Eliminated)</span>
    <span class="term-metric-pill">L1 Hit Rate: 100%</span>
    <span class="term-tag">Roofline Saturated</span>
  </div>
</div>
`;
  };

  const getCompileHTML = () => {
    return `
<div class="compile-box">
  <div class="htop-header">
    <span>⚡ Compiler Pipeline & Benchmark Stream</span>
    <span style="color: var(--accent-alt);">BUILD SUCCESSFUL</span>
  </div>
  <div class="compile-log-line"><span class="compile-tag">$</span> <code>clang++ -O3 -std=c++17 -march=armv8.2-a+simd swiglu_microkernel.cpp -o swiglu_engine</code></div>
  <div class="compile-log-line"><span class="compile-ok">✓ [1/4]</span> Parsing AST & inlining activation arithmetic ................. (8.4ms)</div>
  <div class="compile-log-line"><span class="compile-ok">✓ [2/4]</span> Vector loop unrolling: 8-wide ARM NEON register pack ......... (14.1ms)</div>
  <div class="compile-log-line"><span class="compile-ok">✓ [3/4]</span> Register allocator: Pinned v0–v7 in SRAM (0 spills) ........ (6.2ms)</div>
  <div class="compile-log-line"><span class="compile-ok">✓ [4/4]</span> Generating optimized AArch64 machine code ................... (11.8ms)</div>
  <div class="compile-log-line" style="margin-top: 8px;"><span class="compile-tag">==></span> Generated Binary: <strong>./swiglu_engine</strong> (28 KB)</div>
  <div class="compile-log-line"><span class="compile-tag">==></span> Running warm microbenchmark (1,000,000 iterations)...</div>
  <div class="compile-log-line" style="color: var(--accent-alt); font-weight:700;">✓ Execution time: 14.2 µs | Peak Throughput: 41.7 GFLOP/s | Speedup: 84.2× vs scalar!</div>
</div>
`;
  };

  const quotes = [
    { text: "Premature optimization is the root of all evil. But when you are at the bare-metal kernel boundary, every clock cycle counts.", author: "Donald Knuth / Systems Proverb" },
    { text: "Hardware is the canvas upon which algorithms achieve physical reality.", author: "Jim Keller" },
    { text: "Deep learning without hardware awareness is just slow algebra.", author: "Systems Architecture Principle" },
    { text: "Nature does not compute in float32. It computes in continuous physical state spaces.", author: "Richard Feynman" }
  ];

  const getQuoteHTML = () => {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    return `
<div class="term-card">
  <div style="font-style: italic; font-size: 0.95rem; margin-bottom: 8px; color: var(--text-main);">
    "${q.text}"
  </div>
  <div style="color: var(--accent); font-weight: 700; font-size: 0.8rem;">
    — ${q.author}
  </div>
</div>
`;
  };

  const getHistoryHTML = () => {
    if (commandHistory.length === 0) return "<span class='term-dim'>No command history yet.</span>";
    return `
<div style="font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.6;">
  ${commandHistory.map((cmd, i) => `<div><span style="color: var(--text-dim); width: 32px; display:inline-block;">${i + 1}</span> <span class="term-cmd-inline">${escapeHtml(cmd)}</span></div>`).join("")}
</div>
`;
  };

  const getCurlResumeHTML = () => {
    return `
<div class="term-card" style="white-space: pre; font-size: 0.78rem; line-height: 1.5; color: var(--text-main);">
================================================================================
VIJENDRA KUMAR VAISHYA · AI Researcher & Systems Engineer · IIT Bombay
================================================================================
Email: vijendra9753@gmail.com  |  GitHub: https://github.com/vennyvirtuoso
Phone: +91 9302619572                  |  LinkedIn: in/vijendra-kumar-vaishya
Office: Department of CSE, IIT Bombay, Powai, Mumbai 400076, India
--------------------------------------------------------------------------------
EDUCATION:
• M.S. by Research, Computer Science & Engineering, IIT Bombay (2024–2027)
  CPI: 8.9 / 10 | Advisor: Prof. Pushpak Bhattacharyya (CFILT Lab, IIT Bombay)
• B.Tech, Information Technology, Jabalpur Engineering College (2020–2024)
  CPI: 8.06 / 10 | 500+ LeetCode Challenges Solved
• CBSE Class XII, DPS Nigahi (2018–2020)
  Aggregate: 96.00% (District Rank 3) | 100/100 in Mathematics | Qualified JEE Adv.

RESEARCH & PUBLICATIONS:
• MIST: Mamba Spatio-Temporal Model for DSA Segmentation (Accepted at WACV 2027)
• BiasRetriever: Contrastive Intersectional Bias Evaluation (EACL 2027 Under Review)
• NLTM-Bhashini: Active Learning Annotation Pipeline (13,900+ gold annotations)

SYSTEMS & KERNELS:
• Bare-Metal C++17 NEON Inference Microkernel: 84.2× speedup, 41.7 GFLOP/s
• GP-Surrogate Constrained Optimization Engine: Bayesian Optimization with Analytical EI/PI
--------------------------------------------------------------------------------
[PDF Version Downloadable via command: resume, or click '📄 CV' in top titlebar]
</div>
<div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
  <a href="./vijendra_resume.pdf" download="Vijendra_Kumar_Resume.pdf" class="interactive-action-btn">⬇️ Download Official PDF</a>
  <button class="copy-btn" type="button" data-copy="VIJENDRA KUMAR VAISHYA · AI Researcher & Systems Engineer · IIT Bombay&#10;Email: vijendra9753@gmail.com | GitHub: https://github.com/vennyvirtuoso&#10;Advisor: Prof. Pushpak Bhattacharyya (CFILT Lab) | CPI: 8.9/10">📋 Copy Text Summary</button>
</div>
`;
  };

  // =========================================================================
  // Command Execution Dispatcher
  // =========================================================================
  const printCommandOutput = (rawCmd, outputHTML) => {
    if (!outputHistory) return;

    const entry = document.createElement("div");
    entry.className = "term-entry";

    entry.innerHTML = `
      <div class="term-executed-cmd">
        <span class="prompt-prefix">
          <span class="p-user">vijendra</span><span class="p-at">@</span><span class="p-host">iitb</span><span class="p-colon">:</span><span class="p-dir">~</span><span class="p-sym">$</span>
        </span>
        <span class="term-cmd-text">${escapeHtml(rawCmd)}</span>
      </div>
      <div class="term-output">${outputHTML}</div>
    `;

    outputHistory.appendChild(entry);
    if (terminalBody) {
      setTimeout(() => {
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }, 30);
    }
  };

  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const executeCommand = (cmdLine) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) return;

    // Add to history
    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1] ? parts[1].toLowerCase() : "";

    let output = "";

    switch (cmd) {
      case "help":
      case "?":
        output = getHelpHTML();
        break;

      case "neofetch":
      case "profile":
        output = getNeofetchHTML();
        break;

      case "about":
      case "whoami":
      case "bio":
        output = getAboutHTML();
        break;

      case "education":
      case "edu":
      case "academics":
        output = getEducationHTML();
        break;

      case "skills":
      case "tech":
      case "stack":
        output = getSkillsHTML();
        break;

      case "research":
      case "publications":
      case "papers":
        output = getResearchHTML();
        break;

      case "systems":
      case "kernels":
      case "neon":
        output = getSystemsHTML();
        break;

      case "benchmark":
      case "benchmarks":
      case "bench":
        output = getBenchmarkHTML();
        break;

      case "htop":
        output = getHtopHTML();
        break;

      case "nvtop":
        output = getNvtopHTML();
        break;

      case "disasm":
      case "asm":
        output = getDisasmHTML();
        break;

      case "roofline":
        output = getRooflineHTML();
        break;

      case "compile":
      case "build":
      case "./build.sh":
      case "./compile_swiglu.sh":
        output = getCompileHTML();
        break;

      case "quote":
      case "philosophy":
        output = getQuoteHTML();
        break;

      case "history":
        output = getHistoryHTML();
        break;

      case "curl":
        if (arg === "resume" || arg === "cv" || arg === "resume.pdf") {
          output = getCurlResumeHTML();
        } else {
          output = `<span style="color:var(--accent-amber);">Usage: curl resume (or type <span class="term-cmd-inline">resume</span>)</span>`;
        }
        break;

      case "sound":
      case "audio":
        if (arg === "on" || arg === "enable") {
          setSoundState(true);
          output = "🔊 Mechanical typing audio enabled.";
        } else if (arg === "off" || arg === "disable") {
          setSoundState(false);
          output = "🔇 Mechanical typing audio muted.";
        } else {
          setSoundState(!soundEnabled);
          output = soundEnabled ? "🔊 Mechanical typing audio enabled." : "🔇 Mechanical typing audio muted.";
        }
        break;

      case "echo":
        output = `<span>${escapeHtml(parts.slice(1).join(" "))}</span>`;
        break;

      case "projects":
      case "repos":
        output = getProjectsHTML();
        break;

      case "contact":
      case "email":
        output = getContactHTML();
        break;

      case "resume":
      case "cv":
        output = `
          <div class="term-card">
            <div class="term-card-top">
              <span class="term-card-title">Vijendra Kumar Vaishya · Resume</span>
              <span class="term-card-tag">PDF</span>
            </div>
            <div class="term-card-desc">
              Official curriculum vitae ready for download. Contains complete publications, bare-metal C++17 NEON systems benchmarks, and IIT Bombay research experience.
            </div>
            <div style="margin-top: 8px;">
              <a href="./vijendra_resume.pdf" download="Vijendra_Kumar_Resume.pdf" class="quick-cv-btn">⬇️ Download Vijendra_Kumar_Resume.pdf</a>
            </div>
          </div>
        `;
        break;

      case "ls":
      case "dir":
        output = getLsHTML();
        break;

      case "cat":
        if (!arg) {
          output = "<span style='color: var(--accent-amber);'>Usage: cat [filename] (e.g. cat about.txt, cat research.tex, cat education.txt)</span>";
        } else if (virtualFiles[arg]) {
          // Dispatch corresponding command
          executeCommand(virtualFiles[arg]);
          return;
        } else {
          output = `<span style='color: var(--accent-red);'>cat: ${escapeHtml(arg)}: No such file in virtual directory. Type <span class='term-cmd-inline'>ls</span> to view files.</span>`;
        }
        break;

      case "theme":
        if (!arg) {
          output = `Current theme: <strong>${document.documentElement.getAttribute("data-theme")}</strong>.<br>Usage: <span class='term-cmd-inline'>theme slate</span>, <span class='term-cmd-inline'>theme paper</span>, <span class='term-cmd-inline'>theme navy</span>, <span class='term-cmd-inline'>theme emerald</span>`;
        } else {
          const themeMap = {
            "slate": "classic-dark",
            "dark": "classic-dark",
            "classic-dark": "classic-dark",
            "cyan": "classic-dark",
            "paper": "classic-light",
            "light": "classic-light",
            "classic-light": "classic-light",
            "white": "classic-light",
            "navy": "midnight-navy",
            "midnight-navy": "midnight-navy",
            "indigo": "midnight-navy",
            "emerald": "emerald-dark",
            "emerald-dark": "emerald-dark",
            "green": "emerald-dark",
            "matrix": "emerald-dark"
          };
          if (themeMap[arg]) {
            setGlobalTheme(themeMap[arg]);
            output = `Switched theme to <strong>${themeMap[arg]}</strong>.`;
          } else {
            output = `<span style='color: var(--accent-red);'>Unknown theme '${escapeHtml(arg)}'. Available: slate, paper, navy, emerald</span>`;
          }
        }
        break;

      case "matrix":
        output = toggleMatrixRain();
        break;

      case "clear":
      case "cls":
        outputHistory.innerHTML = "";
        return;

      case "date":
        output = `<span>${new Date().toString()}</span>`;
        break;

      case "uptime":
        output = `<span>IIT Bombay DGX A100 Cluster up 142 days, 16:42, 1 user, load averages: 0.12, 0.08, 0.04</span>`;
        break;

      case "sudo":
        output = `<span style='color: var(--accent-red);'>Permission denied: vijendra is already root user in this research sandbox.</span>`;
        break;

      case "exit":
      case "quit":
        output = `<span>Terminal session is persistent. To clear, type <span class='term-cmd-inline'>clear</span>.</span>`;
        break;

      default:
        output = `<span style='color: var(--accent-red);'>zsh: command not found: ${escapeHtml(cmd)}. Type <span class='term-cmd-inline'>help</span> to see available commands.</span>`;
        break;
    }

    printCommandOutput(cmdLine, output);
  };

  // Ghost Text & Autocomplete Engine
  const updateGhostHint = () => {
    if (!ghostHint) return;
    const val = terminalInput ? terminalInput.value : "";
    if (!val) {
      ghostHint.textContent = "";
      if (promptClearBtn) promptClearBtn.style.opacity = "0";
      return;
    }
    if (promptClearBtn) promptClearBtn.style.opacity = "1";

    const trimmed = val.trim();
    const lower = trimmed.toLowerCase();

    // Check virtual file arguments for 'cat '
    if (lower.startsWith("cat ")) {
      const fileArg = lower.slice(4);
      const fileMatch = Object.keys(virtualFiles).find(f => f.startsWith(fileArg));
      if (fileMatch && fileMatch !== fileArg) {
        ghostHint.textContent = val + fileMatch.slice(fileArg.length);
        return;
      }
    }

    // Check theme arguments for 'theme '
    if (lower.startsWith("theme ")) {
      const themeArg = lower.slice(6);
      const themeMatch = ["cyan", "matrix", "dracula", "amber", "mono"].find(t => t.startsWith(themeArg));
      if (themeMatch && themeMatch !== themeArg) {
        ghostHint.textContent = val + themeMatch.slice(themeArg.length);
        return;
      }
    }

    // Standard command matching
    const match = availableCommands.find(cmd => cmd.startsWith(lower));
    if (match && match !== lower) {
      ghostHint.textContent = val + match.slice(lower.length);
    } else {
      ghostHint.textContent = "";
    }
  };

  // Keyboard Event Handlers
  if (terminalInput) {
    terminalInput.addEventListener("input", () => {
      updateGhostHint();
    });

    terminalInput.addEventListener("keydown", (e) => {
      playKeySound(e.key === "Enter");

      // Enter -> Run command
      if (e.key === "Enter") {
        const value = terminalInput.value;
        terminalInput.value = "";
        updateGhostHint();
        executeCommand(value);
      }
      // Arrow Up -> History previous
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (commandHistory.length > 0 && historyIndex > 0) {
          historyIndex--;
          terminalInput.value = commandHistory[historyIndex];
          updateGhostHint();
        }
      }
      // Arrow Down -> History next
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          terminalInput.value = commandHistory[historyIndex];
          updateGhostHint();
        } else {
          historyIndex = commandHistory.length;
          terminalInput.value = "";
          updateGhostHint();
        }
      }
      // Tab -> Complete suggestion
      else if (e.key === "Tab") {
        e.preventDefault();
        if (ghostHint && ghostHint.textContent) {
          terminalInput.value = ghostHint.textContent;
          updateGhostHint();
        } else {
          const current = terminalInput.value.trim().toLowerCase();
          if (current) {
            const match = availableCommands.find(c => c.startsWith(current));
            if (match) {
              terminalInput.value = match;
              updateGhostHint();
            }
          }
        }
      }
      // Arrow Right -> Accept suggestion if at end of input
      else if (e.key === "ArrowRight") {
        if (ghostHint && ghostHint.textContent && terminalInput.selectionStart === terminalInput.value.length) {
          e.preventDefault();
          terminalInput.value = ghostHint.textContent;
          updateGhostHint();
        }
      }
      // Escape -> Clear input
      else if (e.key === "Escape") {
        e.preventDefault();
        terminalInput.value = "";
        updateGhostHint();
      }
      // Ctrl+L -> Clear
      else if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        outputHistory.innerHTML = "";
      }
    });
  }

  // Clear button click
  if (promptClearBtn) {
    promptClearBtn.addEventListener("click", () => {
      if (terminalInput) {
        terminalInput.value = "";
        updateGhostHint();
        terminalInput.focus();
      }
    });
  }

  // Live System Clock in Status Bar
  const updateStatusClock = () => {
    if (!statusClock) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    statusClock.textContent = `${hours}:${minutes}:${seconds} IST`;
  };
  setInterval(updateStatusClock, 1000);
  updateStatusClock();

  // Delegation for Copy buttons and Interactive Benchmark Re-Run
  document.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
      const textToCopy = copyBtn.getAttribute("data-copy") || copyBtn.dataset.copy;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = "✓ Copied!";
          copyBtn.classList.add("copied");
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove("copied");
          }, 2000);
        }).catch(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = "✓ Copied!";
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 2000);
        });
      }
    }

    const benchRerun = e.target.closest(".rerun-bench-btn");
    if (benchRerun) {
      const benchBox = benchRerun.closest(".benchmark-box") || benchRerun.closest(".term-card");
      if (benchBox) {
        const fills = benchBox.querySelectorAll(".bench-bar-fill");
        fills.forEach(f => {
          const origW = f.style.width;
          f.style.transition = "none";
          f.style.width = "0%";
          setTimeout(() => {
            f.style.transition = "width 0.7s cubic-bezier(0.16, 1, 0.3, 1)";
            f.style.width = origW;
          }, 60);
        });
        benchRerun.textContent = "⚡ Ran in 14.2 µs!";
        setTimeout(() => {
          benchRerun.textContent = "⚡ Re-Run Benchmark Simulation";
        }, 2200);
      }
    }
  });

  // =========================================================================
  // VIEW SWITCHER CONTROLLER (WEB PORTFOLIO <-> FULLSCREEN TERMINAL)
  // =========================================================================
  const btnModeGui = document.getElementById("btn-mode-gui");
  const btnModeTerminal = document.getElementById("btn-mode-terminal");
  const switchToTermBtns = document.querySelectorAll(".switch-to-term-btn");

  const switchView = (viewName) => {
    if (viewName === "terminal") {
      document.documentElement.classList.remove("view-mode-gui");
      document.documentElement.classList.add("view-mode-terminal");
      if (btnModeGui) {
        btnModeGui.classList.remove("active");
        btnModeGui.setAttribute("aria-checked", "false");
      }
      if (btnModeTerminal) {
        btnModeTerminal.classList.add("active");
        btnModeTerminal.setAttribute("aria-checked", "true");
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      if (terminalInput) {
        setTimeout(() => {
          terminalInput.focus();
          if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 100);
      }
    } else {
      document.documentElement.classList.remove("view-mode-terminal");
      document.documentElement.classList.add("view-mode-gui");
      if (btnModeTerminal) {
        btnModeTerminal.classList.remove("active");
        btnModeTerminal.setAttribute("aria-checked", "false");
      }
      if (btnModeGui) {
        btnModeGui.classList.add("active");
        btnModeGui.setAttribute("aria-checked", "true");
      }
    }
    safeStorage.set("portfolio-view", viewName);
  };

  if (btnModeGui) {
    btnModeGui.addEventListener("click", () => switchView("gui"));
  }
  if (btnModeTerminal) {
    btnModeTerminal.addEventListener("click", () => switchView("terminal"));
  }

  switchToTermBtns.forEach(btn => {
    btn.addEventListener("click", () => switchView("terminal"));
  });

  // When clicking any regular navigation anchor while in terminal mode, switch to web view smoothly
  document.querySelectorAll(".nav-links a, .nav-brand").forEach(link => {
    link.addEventListener("click", () => {
      if (document.documentElement.classList.contains("view-mode-terminal")) {
        switchView("gui");
      }
    });
  });

  // Restore saved view mode (default: gui)
  const savedView = safeStorage.get("portfolio-view", "gui");
  switchView(savedView);

  // GUI Benchmark Simulation Button Handler
  const guiRerunBenchBtn = document.getElementById("gui-rerun-bench");
  if (guiRerunBenchBtn) {
    guiRerunBenchBtn.addEventListener("click", () => {
      const fills = document.querySelectorAll(".gui-progress-fill");
      fills.forEach(fill => {
        const origWidth = fill.style.width;
        fill.style.transition = "none";
        fill.style.width = "0%";
        setTimeout(() => {
          fill.style.transition = "width 1s cubic-bezier(0.16, 1, 0.3, 1)";
          fill.style.width = origWidth;
        }, 50);
      });
      guiRerunBenchBtn.innerHTML = "<span>⚡ Microkernel Ran in 14.2 µs!</span>";
      setTimeout(() => {
        guiRerunBenchBtn.innerHTML = "<span>⚡ Run Live Benchmark Simulation</span>";
      }, 2500);
    });
  }

  // Copy Email Handlers
  document.querySelectorAll(".copy-email-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-email") || "vijendra9753@gmail.com";
      navigator.clipboard.writeText(email).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = "<span>✓ Email Copied!</span>";
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2200);
      }).catch(() => {
        alert(`Email: ${email}`);
      });
    });
  });

  // Initial Welcome Screen Execution
  printCommandOutput("banner", getBannerHTML());
  printCommandOutput("neofetch", getNeofetchHTML());

  // Focus prompt if terminal is active
  if (savedView === "terminal" && terminalInput) {
    terminalInput.focus();
  }

});


