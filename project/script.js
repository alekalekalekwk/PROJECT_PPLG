

// simpan dan ambil data dari localStorage
function getReports() {
  var data = localStorage.getItem("trafficReports");
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

function saveReports(reports) {
  localStorage.setItem("trafficReports", JSON.stringify(reports));
}

// ID generator 
function generateId() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = 'RPT-';
  for (var i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function updateClock() {
  var now = new Date();
  var days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  var day = days[now.getDay()];
  var h = now.getHours();
  var m = now.getMinutes();
  var s = now.getSeconds();
  var ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  if (m < 10) m = "0" + m;
  if (s < 10) s = "0" + s;
  var el = document.getElementById("liveClock");
  if (el) {
    el.textContent = day + " " + h + ":" + m + ":" + s + " " + ampm;
  }
}


function updateStats() {
  var reports = getReports();
  var total = reports.length;

  // rata-rata suhu
  // looping data dijumlahin + bagi total = dibuletin using toFixed
  var avgTemp = "--";
  if (total > 0) {
    var sumTemp = 0;
    for (var i = 0; i < reports.length; i++) {
      sumTemp = sumTemp + Number(reports[i].temperature);
    }
    avgTemp = (sumTemp / total).toFixed(1);
  }


  // rata-rata traffic
  // buat skala 1-10 
  var avgTraffic = "--";
  if (total > 0) {
    var sumTraffic = 0;
    for (var i = 0; i < reports.length; i++) {
      sumTraffic = sumTraffic + Number(reports[i].trafficScale);
    }
    avgTraffic = (sumTraffic / total).toFixed(1);
  }



  // status paling sering
  var topStatus = "--";
  if (total > 0) {
    var counts = {};
    // hitung jumlah status paling sering
    for (var i = 0; i < reports.length; i++) {
      var st = reports[i].status;
      if (counts[st]) {
        counts[st] = counts[st] + 1;
      } else {
        counts[st] = 1;
      }
    }
    var maxCount = 0; //nyari data tertinggi 
    for (var key in counts) {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        topStatus = key;
      }
    }
  }

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statTemp").textContent = avgTemp !== "--" ? avgTemp + "°C" : "--";
  document.getElementById("statTraffic").textContent = avgTraffic !== "--" ? avgTraffic + "/10" : "--";
  document.getElementById("statStatus").textContent = topStatus;
}

// warna traffic berdasarkan skala
function getTrafficColor(scale) {
  var n = Number(scale);
  if (n <= 2) return "#10b981";
  if (n <= 4) return "#34d399";
  if (n <= 5) return "#fbbf24";
  if (n <= 7) return "#f97316";
  if (n <= 9) return "#ef4444";
  return "#dc2626";
}

// ===== WAKTU LALU =====
function timeAgo(timestamp) {
  var diff = Date.now() - new Date(timestamp).getTime();
  var minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return minutes + "m ago";
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  var days = Math.floor(hours / 24);
  return days + "d ago";
}

// ===== STATUS HELPER =====
function getStatusClass(status) {
  return status.toLowerCase().replace(/ /g, "-");
}

function getStatusIcon(status) {
  if (status === "Lancar") return "✅";
  if (status === "Agak Macet") return "🟡";
  if (status === "Macet") return "🟠";
  if (status === "Kecelakaan") return "🔴";
  if (status === "Kecelakaan") window.alert("Hati-hati ada kecelakaan!");
  if (status === "Jalan Ditutup") return "⛔";
  return "📍";
}

// anti hack/bug
//mencegah input berbahaya dari user agar tidak dieksekusi sebagai html atau js kayak: script alert("HACKED")
function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


// ===== COLOR PICKER =====
var cpOpen = false;
var cpH = 220, cpS = 70, cpL = 58;

function toggleColorPicker() {
  var panel = document.getElementById('colorPickerPanel');
  if (!panel) return;
  cpOpen = !cpOpen;
  if (cpOpen) {
    panel.style.display = 'block';
    drawSpectrum();
    syncSlidersFromVars();
    updateCpPreview();
    syncSatLightGradients();
  } else {
    panel.style.display = 'none';
  }
}

function drawSpectrum() {
  var canvas = document.getElementById('spectrumCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var grad = ctx.createLinearGradient(0, 0, w, 0);
  for (var i = 0; i <= 360; i += 30) {
    grad.addColorStop(i / 360, 'hsl(' + i + ',85%,55%)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // marker buat hue
  var x = Math.round((cpH / 360) * w);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, h / 2, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function spectrumClick(e) {
  var canvas = document.getElementById('spectrumCanvas');
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var x = e.clientX - rect.left;
  cpH = Math.round((x / rect.width) * 360);
  cpH = Math.max(0, Math.min(360, cpH));
  document.getElementById('hueSlider').value = cpH;
  document.getElementById('hueValue').textContent = cpH + '°';
  syncSatLightGradients();
  applyPreviewColor();
  drawSpectrum();
}

function syncSlidersFromVars() {
  var root = document.documentElement;
  var hStr = getComputedStyle(root).getPropertyValue('--accent-h').trim();
  var sStr = getComputedStyle(root).getPropertyValue('--accent-s').trim();
  var lStr = getComputedStyle(root).getPropertyValue('--accent-l').trim();
  cpH = parseInt(hStr) || 220;
  cpS = parseInt(sStr) || 70;
  cpL = parseInt(lStr) || 58;
  var hs = document.getElementById('hueSlider');
  var ss = document.getElementById('satSlider');
  var ls = document.getElementById('lightSlider');
  if (hs) { hs.value = cpH; document.getElementById('hueValue').textContent = cpH + '°'; }
  if (ss) ss.value = cpS;
  if (ls) ls.value = cpL;
}

function syncSatLightGradients() {
  var ss = document.getElementById('satSlider');
  var ls = document.getElementById('lightSlider');
  if (ss) ss.style.background =
    'linear-gradient(to right, hsl(' + cpH + ',30%,' + cpL + '%), hsl(' + cpH + ',100%,' + cpL + '%))';
  if (ls) ls.style.background =
    'linear-gradient(to right, hsl(' + cpH + ',' + cpS + '%,25%), hsl(' + cpH + ',' + cpS + '%,58%), hsl(' + cpH + ',' + cpS + '%,78%))';
}

function updateCpPreview() {
  var prev = document.getElementById('colorPreview');
  if (prev) prev.style.background = 'hsl(' + cpH + ',' + cpS + '%,' + cpL + '%)';
  var applyBtn = document.querySelector('.cp-apply');
  if (applyBtn) applyBtn.style.background = 'hsl(' + cpH + ',' + cpS + '%,' + cpL + '%)';
}

function applyPreviewColor() {
  updateCpPreview();
  // live real-time preview on the page
  var root = document.documentElement;
  root.style.setProperty('--accent-h', cpH);
  root.style.setProperty('--accent-s', cpS + '%');
  root.style.setProperty('--accent-l', cpL + '%');
  root.style.setProperty('--accent', 'hsl(' + cpH + ',' + cpS + '%,' + cpL + '%)');
  root.style.setProperty('--accent-dim', 'hsla(' + cpH + ',' + cpS + '%,' + cpL + '%,0.15)');
  root.style.setProperty('--accent-border', 'hsla(' + cpH + ',' + cpS + '%,' + cpL + '%,0.35)');
  root.style.setProperty('--accent-dark', 'hsl(' + cpH + ',' + cpS + '%,' + (cpL - 10) + '%)');
}

function applyThemeColor() {
  applyPreviewColor();
  localStorage.setItem('themeColor', JSON.stringify({ h: cpH, s: cpS, l: cpL }));
  toggleColorPicker();
  showToast('🎨 Warna tema diperbarui!');
}

function initThemeColor() {
  var saved = localStorage.getItem('themeColor');
  if (saved) {
    try {
      var c = JSON.parse(saved);
      cpH = c.h; cpS = c.s; cpL = c.l;
      applyPreviewColor();
    } catch(e) {}
  }
}

function initColorPickerEvents() {
  var canvas = document.getElementById('spectrumCanvas');
  if (canvas) {
    canvas.addEventListener('click', spectrumClick);
    canvas.addEventListener('mousemove', function(e) {
      if (e.buttons === 1) spectrumClick(e);
    });
  }

  var hueSlider = document.getElementById('hueSlider');
  if (hueSlider) {
    hueSlider.addEventListener('input', function() {
      cpH = parseInt(this.value);
      document.getElementById('hueValue').textContent = cpH + '°';
      syncSatLightGradients();
      applyPreviewColor();
      drawSpectrum();
    });
  }

  var satSlider = document.getElementById('satSlider');
  if (satSlider) {
    satSlider.addEventListener('input', function() {
      cpS = parseInt(this.value);
      syncSatLightGradients();
      applyPreviewColor();
    });
  }

  var lightSlider = document.getElementById('lightSlider');
  if (lightSlider) {
    lightSlider.addEventListener('input', function() {
      cpL = parseInt(this.value);
      syncSatLightGradients();
      applyPreviewColor();
    });
  }

  var presets = document.querySelectorAll('.cp-preset');
  for (var i = 0; i < presets.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        cpH = parseInt(btn.getAttribute('data-hue'));
        cpS = parseInt(btn.getAttribute('data-sat'));
        cpL = parseInt(btn.getAttribute('data-light'));
        document.getElementById('hueSlider').value = cpH;
        document.getElementById('hueValue').textContent = cpH + '°';
        document.getElementById('satSlider').value = cpS;
        document.getElementById('lightSlider').value = cpL;
        var all = document.querySelectorAll('.cp-preset');
        for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
        btn.classList.add('active');
        syncSatLightGradients();
        applyPreviewColor();
        drawSpectrum();
      });
    })(presets[i]);
  }

  // click ga overload
  var panel = document.getElementById('colorPickerPanel');
  if (panel) {
    panel.addEventListener('click', function(e) { e.stopPropagation(); });
  }

  // close panel pas klik diluar panel
  document.addEventListener('click', function(e) {
    var pickerBtn = document.getElementById('colorPickerBtn');
    if (cpOpen && e.target !== pickerBtn) {
      cpOpen = false;
      var p = document.getElementById('colorPickerPanel');
      if (p) p.style.display = 'none';
    }
  });
}


// show report
function renderReports() {
  var reports = getReports();
  var feed = document.getElementById("reportsFeed");
  var searchVal = document.getElementById("searchInput").value.toLowerCase().trim();
  var activeBtn = document.querySelector(".filter-btn.active");
  var filterStatus = activeBtn ? activeBtn.getAttribute("data-status") : "All";

  // filter
  var filtered = [];
  for (var i = 0; i < reports.length; i++) {
    var r = reports[i];
    if (filterStatus !== "All" && r.status !== filterStatus) continue;
    if (searchVal && r.location.toLowerCase().indexOf(searchVal) === -1) continue;
    filtered.push(r);
  }

  // sort terbaru dulu
  filtered.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  // update count
  var countText = filtered.length + " report";
  if (filtered.length !== 1) countText = countText + "s";
  document.getElementById("reportCount").textContent = countText;

  // kalo kosong
  if (filtered.length === 0) {
    feed.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-icon">🚦</div>' +
      '<h3>Belum ada laporan!</h3>' +
      '<p>Jadi warga pertama yang melapor!</p>' +
      '</div>';
    updateStats();
    return;
  }

  // render cards
  var html = "";
  for (var i = 0; i < filtered.length; i++) {
    var r = filtered[i];
    html = html +
      '<div class="report-card" data-status="' + r.status + '">' +
        '<div class="card-top">' +
          '<div class="card-location">' +
            '<span class="icon">📍</span>' +
            escapeHtml(r.location) +
          '</div>' +
          '<div class="card-top-right">' +
            '<span class="card-id">' + r.id + '</span>' +
            '<span class="card-time">' + timeAgo(r.timestamp) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-details">' +
          '<div class="detail-item">' +
            '<div class="detail-label">Temperatur</div>' +
            '<div class="detail-value temp">🌡️ ' + r.temperature + '°C</div>' +
          '</div>' +
          '<div class="detail-item">' +
            '<div class="detail-label">Skala Kemacetan</div>' +
            '<div class="detail-value" style="color:' + getTrafficColor(r.trafficScale) + '">' +
              r.trafficScale + '/10' +
            '</div>' +
            '<div class="traffic-bar">' +
              '<div class="traffic-fill" style="width:' + (r.trafficScale * 10) + '%;background:' + getTrafficColor(r.trafficScale) + '"></div>' +
            '</div>' +
          '</div>' +
          '<div class="detail-item">' +
            '<div class="detail-label">Status</div>' +
            '<span class="status-badge ' + getStatusClass(r.status) + '">' +
              getStatusIcon(r.status) + ' ' + r.status +
            '</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-bottom">' +
          '<span class="card-notes">' + (r.notes ? escapeHtml(r.notes) : "") + '</span>' +
          '<button class="btn-delete" onclick="deleteReport(\'' + r.id + '\')">✕ Hapus</button>' +
        '</div>' +
      '</div>';
  }
  feed.innerHTML = html;

  updateStats();
}

// addReport
function addReport(e) {
  e.preventDefault();

  var location = document.getElementById("inputLocation").value.trim();
  var temperature = document.getElementById("inputTemp").value;
  var trafficScale = document.getElementById("inputScale").value;
  var status = document.getElementById("inputStatus").value;
  var notes = document.getElementById("inputNotes").value.trim();

  if (!location) {
    showToast("⚠️ Mohon masukkan lokasi", true);
    document.getElementById("inputLocation").focus();
    return;
  }
  if (!temperature) {
    showToast("⚠️ Mohon masukkan suhu", true);
    document.getElementById("inputTemp").focus();
    return;
  }

  var id = generateId();
  var report = {
    id: id,
    location: location,
    temperature: Number(temperature),
    trafficScale: Number(trafficScale),
    status: status,
    notes: notes,
    timestamp: new Date().toISOString()
  };

  var reports = getReports();
  reports.push(report);
  saveReports(reports);

  document.getElementById("reportForm").reset();
  document.getElementById("scaleDisplay").textContent = "5";
  document.getElementById("scaleDisplay").style.color = getTrafficColor(5);

  renderReports();
  showToast("✅ Laporan berhasil dikirim!");
}

// del report
function deleteReport(id) {
  var reports = getReports();
  var filtered = [];
  for (var i = 0; i < reports.length; i++) {
    if (reports[i].id !== id) {
      filtered.push(reports[i]);
    }
  }
  saveReports(filtered);
  renderReports();
  showToast("Laporan dihapus");
}

// ===== TOAST =====
function showToast(message, isWarning) {
  var existing = document.querySelector(".toast");
  if (existing) existing.remove();

  var toast = document.createElement("div");
  toast.className = "toast";
  if (isWarning) {
    toast.style.background = "rgba(245, 158, 11, 0.15)";
    toast.style.borderColor = "rgba(245, 158, 11, 0.3)";
    toast.style.color = "#fbbf24";
  }
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3200);
}

// slider
function updateScaleDisplay(val) {
  document.getElementById("scaleDisplay").textContent = val;
  document.getElementById("scaleDisplay").style.color = getTrafficColor(val);
}

// filter search
function setFilter(btn) {
  var buttons = document.querySelectorAll(".filter-btn");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }
  btn.classList.add("active");
  renderReports();
}

// light mode
function initTheme() {
  var toggleBtn = document.getElementById('themeToggle');
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (toggleBtn) toggleBtn.textContent = '🌙';
  } else {
    if (toggleBtn) toggleBtn.textContent = '☀️';
  }
}

function darkMode() {
  document.body.classList.toggle('light-mode');
  var isLight = document.body.classList.contains('light-mode');
  var toggleBtn = document.getElementById('themeToggle');
  
  if (isLight) {
    localStorage.setItem('theme', 'light');
    if (toggleBtn) toggleBtn.textContent = '🌙';
  } else {
    localStorage.setItem('theme', 'dark');
    if (toggleBtn) toggleBtn.textContent = '☀️';
  }
}


document.addEventListener("DOMContentLoaded", function() {
  // theme init
  initTheme();

  // jam
  updateClock();
  setInterval(updateClock, 1000);

  // form submit
  document.getElementById("reportForm").addEventListener("submit", addReport);

  // range slider
  var slider = document.getElementById("inputScale");
  slider.addEventListener("input", function() {
    updateScaleDisplay(slider.value);
  });
  document.getElementById("scaleDisplay").style.color = getTrafficColor(slider.value);

  // search
  document.getElementById("searchInput").addEventListener("input", renderReports);

  // filter buttons
  var filterBtns = document.querySelectorAll(".filter-btn");
  for (var i = 0; i < filterBtns.length; i++) {
    (function(btn) {
      btn.addEventListener("click", function() { setFilter(btn); });
    })(filterBtns[i]);
  }

  // render awal
  renderReports();

  // auto refresh
  setInterval(renderReports, 5000);

  // color picker
  initThemeColor();
  initColorPickerEvents();
});
