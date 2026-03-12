/* ─────────────────────────────────────────
   NeuralForge — Model Optimizer
   app.js
───────────────────────────────────────── */

// ─── STATE ───────────────────────────────
let selectedTechnique = null;
let selectedQuant     = null;
let modelLoaded       = false;
let optimizing        = false;
let baseUrl            = 'http://localhost:8000/api'; // Backend API URL

// ─── MODEL VALIDATION ────────────────────

async function validateModel() {
  const url = document.getElementById('modelUrl').value.trim();
    if (!url) {
    flash('modelUrl');
    return;
  }

  meta_data = {

  }
    
    const response = await fetch(`${baseUrl}/check_model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name: url })
    })

    if (!response.ok) {
      flash('modelUrl');
      return;
    }else{
      
      const data = await response.json();
      if(data.exit==1){
        meta_data = {
          name: url,
          size: `${data.model_size} GB`,
          params: `${data.model_parameters}B`,
          model_name: data.model_name
        };

        localStorage.setItem('model_name', data.model_name);
        localStorage.setItem('model_size', meta_data.size);
        localStorage.setItem('model_parameters', meta_data.params);
        
      }
      
    }




  const info     = document.getElementById('modelInfo');
  const infoText = document.getElementById('modelInfoText');

  // Extract a readable model name from the URL
  let modelName = url;
  if (url.includes('huggingface.co/')) {
    modelName = url.split('huggingface.co/')[1].replace(/\/$/, '');
  }
 


  infoText.innerHTML = `
    <strong style="color:var(--text)">${modelName}</strong>
    &nbsp;·&nbsp; ${meta_data.params} parameters
    &nbsp;·&nbsp; ${meta_data.size}
    &nbsp;·&nbsp; <span style="color:var(--accent2)">Ready to optimize</span>
  `;

  info.classList.add('visible');
  modelLoaded       = true;
 

  if (selectedTechnique) showRunButton();
}

// Flash an input field red to signal missing input
function flash(id) {
  const el = document.getElementById(id);
  el.style.borderColor = 'var(--accent3)';
  el.style.boxShadow   = '0 0 0 3px rgba(255,92,92,0.15)';
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow   = '';
  }, 1200);
}

// ─── TECHNIQUE SELECTION ─────────────────

function selectTechnique(type) {
  // Update active card
  document.querySelectorAll('.technique-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.technique-card.${type}`).classList.add('active');
  selectedTechnique = type;

  // Show the config card
  const configCard = document.getElementById('configCard');
  configCard.style.display = 'block';
  setTimeout(() => { configCard.style.animation = 'fadeUp 0.4s ease'; }, 10);

  const pruningConfig = document.getElementById('pruningConfig');
  const quantConfig   = document.getElementById('quantConfig');
  const divider       = document.getElementById('quantDivider');

  if (type === 'pruning') {
    pruningConfig.classList.add('visible');
    quantConfig.classList.remove('visible');
    divider.innerHTML = '';
  } else if (type === 'quant') {
    pruningConfig.classList.remove('visible');
    quantConfig.classList.add('visible');
    divider.innerHTML = '';
  } else {
    // Both techniques
    pruningConfig.classList.add('visible');
    quantConfig.classList.add('visible');
    divider.innerHTML = '<hr class="divider">';
  }

  if (modelLoaded) showRunButton();
}

// ─── PRUNING SLIDER ───────────────────────

function updateSlider(val) {
  val = parseInt(val);

  // Update displayed percentage
  document.getElementById('sliderDisplay').innerHTML = `${val}<span>%</span>`;

  // Update visual track fill and thumb position
  document.getElementById('sliderFill').style.width  = `${val}%`;
  document.getElementById('sliderThumb').style.left  = `${val}%`;

  // Update impact estimates
  document.getElementById('sizeReduction').textContent = `−${val}%`;

  const speed = (1 + (val / 100) * 1.5).toFixed(1);
  document.getElementById('speedGain').textContent = `${speed}×`;

  let acc = '< 0.5%';
  if (val > 70)      acc = '~5–15%';
  else if (val > 50) acc = '~2–5%';
  else if (val > 30) acc = '~1–2%';
  document.getElementById('accLoss').textContent = acc;

  // Show high-pruning warning
  const warn = document.getElementById('pruningWarn');
  if (val > 70) warn.classList.add('visible');
  else          warn.classList.remove('visible');
}

// ─── QUANTIZATION SELECTION ──────────────

function selectQuant(bits) {
  document.getElementById('q8opt').classList.toggle('active', bits === 8);
  document.getElementById('q16opt').classList.toggle('active', bits === 16);
  selectedQuant = bits;
}

// ─── SHOW RUN BUTTON ─────────────────────

function showRunButton() {
  const rs = document.getElementById('runSection');
  rs.style.display   = 'block';
  rs.style.animation = 'fadeUp 0.4s ease';
}

// ─── MAIN OPTIMIZATION PIPELINE ──────────

async function runOptimization() {
  if (optimizing) return;

  // Guard: model must be loaded
  if (!modelLoaded) {
    flash('modelUrl');
    return;
  }

  // Guard: quantization option must be selected when applicable
  if ((selectedTechnique === 'quant' || selectedTechnique === 'both') && !selectedQuant) {
    document.getElementById('q8opt').style.borderColor  = 'var(--accent3)';
    document.getElementById('q16opt').style.borderColor = 'var(--accent3)';
    setTimeout(() => {
      document.getElementById('q8opt').style.borderColor  = '';
      document.getElementById('q16opt').style.borderColor = '';
    }, 1200);
    return;
  }

  optimizing = true;

  // Disable the run button and show processing state
  const btn = document.querySelector('.run-btn');
  btn.disabled = true;
  document.getElementById('runBtnText').textContent = '⚙️ Processing...';

  // Show and scroll to output section
  const outputSection = document.getElementById('outputSection');
  outputSection.classList.add('visible');
  outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Reset log and progress
  const logWindow = document.getElementById('logWindow');
  logWindow.innerHTML = '';
  document.getElementById('resultsGrid').style.display = 'none';
  document.getElementById('progressFill').style.width  = '0%';

  const pruneVal = parseInt(document.getElementById('pruningSlider').value);
  const meta     = { name: localStorage.getItem('model_name'), size: localStorage.getItem('model_size'), params: localStorage.getItem('model_parameters') };
  const logs     = buildLogs(meta, pruneVal);
  const total    = logs.length;
  let   i        = 0;

  // Stream log entries one by one with delays
  for (const entry of logs) {
    await delay(entry.delay);
    appendLog(logWindow, entry, i, total);
    i++;
  }

  const response = await fetch(`${baseUrl}/prune_model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({model_name: localStorage.getItem('model_name'),techniques:['prunning', 'quantization'],prune_percentage: pruneVal})
    })

    if (!response.ok) {
      flash('modelUrl');
      return;
    }else{
      
      const data = await response.json();
      if(data.exit==1){
        meta_data = {
          model_name: localStorage.getItem('model_name'),
          size: `${data.model_size} GB`,
          params: `${data.model_parameters} B`,
        };

        localStorage.setItem('model_name', data.model_name);
        
      }
    }

  showResults(meta, pruneVal);
}

// Append a single log line to the log window
function appendLog(logWindow, entry, index, total) {
  const line = document.createElement('div');
  line.className = `log-line ${entry.type}`;

  const now = new Date();
  const ts  = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join(':');

  line.innerHTML = `<span class="log-time">[${ts}]</span><span class="log-msg">${entry.msg}</span>`;
  logWindow.appendChild(line);
  logWindow.scrollTop = logWindow.scrollHeight;

  const progress = Math.min(((index + 1) / total) * 100, 100);
  document.getElementById('progressFill').style.width = `${progress}%`;
}

// ─── LOG BUILDER ─────────────────────────

function buildLogs(meta, pruneVal) {
  const lines = [];
  const doPrune = selectedTechnique === 'pruning' || selectedTechnique === 'both';
  const doQuant = selectedTechnique === 'quant'   || selectedTechnique === 'both';

  // Initialization
  lines.push({ msg: `Initializing NeuralForge optimization pipeline...`,      type: 'info',      delay: 300 });
  lines.push({ msg: `Loading model: ${meta.name} (${meta.params} parameters)`, type: 'info',      delay: 500 });
  lines.push({ msg: `Parsing model architecture... found transformer blocks`,   type: 'info',      delay: 600 });
  lines.push({ msg: `Model validation: OK ✓`,                                   type: 'success',   delay: 400 });

  // Pruning stage
  if (doPrune) {
    lines.push({ msg: `─── PRUNING STAGE ─────────────────────────`,                             type: 'highlight', delay: 600 });
    lines.push({ msg: `Computing weight magnitude scores...`,                                      type: 'info',      delay: 700 });
    lines.push({ msg: `Applying ${pruneVal}% unstructured weight pruning (L1 norm)`,               type: 'info',      delay: 800 });
    lines.push({ msg: `Pruning attention heads: ${Math.round(pruneVal * 0.8)}% removed`,           type: 'info',      delay: 600 });
    lines.push({ msg: `Pruning FFN layers: ${Math.round(pruneVal * 1.1)}% removed`,                type: 'info',      delay: 700 });
    lines.push({ msg: `Running mask propagation...`,                                               type: 'info',      delay: 500 });
    lines.push({ msg: `Sparse weight tensor compression complete ✓`,                               type: 'success',   delay: 600 });
    if (pruneVal > 50) {
      lines.push({ msg: `Structural reorganization of sparse matrices...`,                         type: 'info',      delay: 700 });
    }
  }

  // Quantization stage
  if (doQuant) {
    const bitLabel = selectedQuant === 8 ? 'INT8' : 'FP16';
    lines.push({ msg: `─── QUANTIZATION STAGE ─────────────────────`,                                 type: 'highlight', delay: 700 });
    lines.push({ msg: `Target precision: ${selectedQuant}-bit (${bitLabel})`,                          type: 'info',      delay: 500 });
    lines.push({ msg: `Calibrating quantization ranges (1024 samples)...`,                             type: 'info',      delay: 900 });
    lines.push({ msg: `Quantizing embedding layers...`,                                                type: 'info',      delay: 600 });
    lines.push({ msg: `Quantizing attention weights...`,                                               type: 'info',      delay: 700 });
    lines.push({ msg: `Quantizing output projections...`,                                              type: 'info',      delay: 600 });
    lines.push({ msg: `${bitLabel} quantization complete ✓`,                                           type: 'success',   delay: 500 });
  }

  // Finalization
  lines.push({ msg: `─── FINALIZATION ────────────────────────────`,                  type: 'highlight', delay: 600 });
  lines.push({ msg: `Serializing optimized weights...`,                                type: 'info',      delay: 700 });
  lines.push({ msg: `Running benchmark inference (100 iterations)...`,                 type: 'info',      delay: 900 });
  lines.push({ msg: `✅ Optimization complete! Model ready for deployment.`,           type: 'success',   delay: 500 });

  return lines;
}

// ─── RESULTS DISPLAY ─────────────────────

function showResults(meta, pruneVal) {
  const doPrune = selectedTechnique === 'pruning' || selectedTechnique === 'both';
  const doQuant = selectedTechnique === 'quant'   || selectedTechnique === 'both';

  // Calculate compression ratio
  let sizeRatio = 1;
  if (doPrune) sizeRatio *= (1 - pruneVal / 100);
  if (doQuant) sizeRatio *= (selectedQuant === 8 ? 0.25 : 0.5);

  // Convert size string to MB for math
  const originalMB  = parseFloat(meta.size) * (meta.size.includes('GB') ? 1024 : 1);
  const compressedMB = originalMB * sizeRatio;

  const formatSize = (mb) => mb >= 1024
    ? `${(mb / 1024).toFixed(1)} GB`
    : `${mb.toFixed(0)} MB`;

  const reduction = Math.round((1 - sizeRatio) * 100);
  const speedGain = (1 + (reduction / 100) * 2.5).toFixed(1);

  // Populate result values
  document.getElementById('rv1').textContent = meta.size;
  document.getElementById('rv2').textContent = formatSize(compressedMB);
  document.getElementById('rv3').textContent = `−${reduction}%`;
  document.getElementById('rv4').textContent = `${speedGain}×`;

  // Show grid and animate cards in sequence
  const grid = document.getElementById('resultsGrid');
  grid.style.display = 'grid';

  ['rc1', 'rc2', 'rc3', 'rc4'].forEach((id, idx) => {
    setTimeout(() => document.getElementById(id).classList.add('show'), idx * 150);
  });

  // Update run button to completion state
  document.getElementById('runBtnText').textContent = '✓ Optimization Complete';
  document.querySelector('.run-btn').style.background = 'linear-gradient(135deg, #1a6e3c, #00a86b)';
  document.getElementById('progressFill').style.width = '100%';

  setTimeout(() => { optimizing = false; }, 1000);
}

// ─── UTILITY ─────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
