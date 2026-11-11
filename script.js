import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ==========================================
// 1. FUNGSI UI & GLOBAL BINDING
// ==========================================
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

window.switchTab = function(tab) {
    const btnReview = document.getElementById('btnTabReview');
    const btnStatTps = document.getElementById('btnTabStatTps');
    const btnInput = document.getElementById('btnTabInput');
    
    const viewReview = document.getElementById('tabReview');
    const viewStatTps = document.getElementById('tabStatTps');
    const viewInput = document.getElementById('tabInput');

    btnReview.className = "sidebar-inactive flex items-center px-5 py-3 text-sm transition text-left font-semibold";
    btnStatTps.className = "sidebar-inactive flex items-center px-5 py-3 text-sm transition text-left font-semibold";
    
    if(!btnInput.classList.contains('hidden')) {
        btnInput.className = "sidebar-inactive flex items-center px-5 py-3 text-sm transition text-left font-semibold admin-only";
    }
    
    viewReview.classList.add('hidden');
    viewStatTps.classList.add('hidden');
    viewInput.classList.add('hidden');

    if (tab === 'review') {
        btnReview.className = "sidebar-active flex items-center px-5 py-3 text-sm transition text-left font-semibold";
        viewReview.classList.remove('hidden');
    } else if (tab === 'statTps') {
        btnStatTps.className = "sidebar-active flex items-center px-5 py-3 text-sm transition text-left font-semibold";
        viewStatTps.classList.remove('hidden');
    } else {
        btnInput.className = "sidebar-active flex items-center px-5 py-3 text-sm transition text-left font-semibold admin-only";
        viewInput.classList.remove('hidden');
    }
    if(window.innerWidth < 768) window.toggleSidebar();
}

window.triggerSplash = function() {
    const splash = document.getElementById('splashScreen');
    splash.classList.add('show');
    setTimeout(() => { splash.classList.remove('show'); }, 10000); 
}
setInterval(window.triggerSplash, 300000);

window.openModal = function(id) { 
    document.getElementById(id).classList.remove("hidden"); 
}

window.closeModal = function(id) {
    document.getElementById(id).classList.add("hidden");
    if (id === 'modalInputTps') {
        document.getElementById("tpsForm").reset();
        document.getElementById("editingTpsId").value = "";
        document.getElementById("tpsSelect").disabled = false;
        window.dispatchEvent(new Event('calculateUnused')); 
    }
}

window.showToast = function(msg) {
    const t = document.getElementById("toast");
    document.getElementById("toastMessage").innerText = msg;
    t.classList.remove("translate-y-20", "opacity-0");
    setTimeout(() => t.classList.add("translate-y-20", "opacity-0"), 3000);
}

window.toggleAccordion = function(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    
    // Toggle class hidden pada konten
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.remove('rotate-180'); // Kembalikan arah panah ke atas
    } else {
        content.classList.add('hidden');
        icon.classList.add('rotate-180');    // Putar panah ke bawah
    }
}

// ==========================================
// 2. FIREBASE & LOGIKA APLIKASI
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAAklGcl6VnYUd2XHHlriG49Y1YQmrmjFg",
    authDomain: "quickcount-40d54.firebaseapp.com",
    databaseURL: "https://quickcount-40d54-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quickcount-40d54",
    storageBucket: "quickcount-40d54.firebasestorage.app",
    messagingSenderId: "1018646071529",
    appId: "1:1018646071529:web:d1f73cdcfb2c2754b0c878"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const DB_PATH = "pawon_quickcount";
let isAdmin = false; 

// ==== LOGIKA AUTHENTICATION ====
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const adminProfile = document.getElementById('adminProfile');

btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => alert("Login gagal: " + error.message));
});

btnLogout.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.showToast("Berhasil logout");
        window.switchTab('review'); 
    });
});

let adminEmails = ['yutukiyempraker34@gmail.com']; // Variabel global penyimpan array admin

onAuthStateChanged(auth, async (user) => {
    const adminElements = document.querySelectorAll('.admin-only');
    const logoOverlay = document.getElementById('logoUploadOverlay');
    
    if (user) {
        // Ambil daftar admin dari database saat user mencoba login
        const snapshot = await get(ref(db, `${DB_PATH}/admins`));
        const data = snapshot.val();
        let currentAdmins = data ? (Array.isArray(data) ? data : Object.values(data)) : ['yutukiyempraker34@gmail.com'];
        
        // Pastikan email utama selalu ada sebagai Super Admin
        if (!currentAdmins.includes('yutukiyempraker34@gmail.com')) {
            currentAdmins.push('yutukiyempraker34@gmail.com');
        }

        if (currentAdmins.includes(user.email)) {
            isAdmin = true;
            
            btnLogin.classList.add('hidden');
            adminProfile.classList.remove('hidden');
            document.getElementById('adminName').innerText = user.displayName;
            document.getElementById('adminAvatar').src = user.photoURL;

            adminElements.forEach(el => el.classList.remove('hidden'));
            logoOverlay.classList.remove('hidden'); 
            
            // --- LOGIKA BARU UNTUK SUPER ADMIN ---
            const panelKelola = document.getElementById('panelKelolaAdmin');
            if (user.email === 'yutukiyempraker34@gmail.com') {
                if(panelKelola) panelKelola.classList.remove('hidden');
            } else {
                if(panelKelola) panelKelola.classList.add('hidden');
            }
            // -------------------------------------
            
            renderAll();

        } else {

            alert("Akses Ditolak! Akun " + user.email + " tidak terdaftar sebagai Admin.");
            signOut(auth);
        }
    } else {
        isAdmin = false;
        btnLogin.classList.remove('hidden');
        adminProfile.classList.add('hidden');
        adminElements.forEach(el => el.classList.add('hidden'));
        logoOverlay.classList.add('hidden');
        
        renderAll(); 
    }
});

// ==== VARIABEL STATE UTAMA ====
const TPS_LIST = Array.from({length: 10}, (_, i) => ({
    id: `TPS-${String(i+1).padStart(2, '0')}`,
    name: `TPS ${String(i+1).padStart(2, '0')}`
}));

const DEFAULT_CANDIDATES = [
    { id: 1, number: "01", name: "H. Ahmad Syafe'i", color: "#ef4444", photo: "" }, 
    { id: 2, number: "02", name: "Drs. Budi Santoso", color: "#3b82f6", photo: "" }, 
    { id: 3, number: "03", name: "Hendra Wijaya", color: "#eab308", photo: "" }, 
    { id: 4, number: "04", name: "Calon Baru", color: "#22c55e", photo: "" }  
];

let candidates = [...DEFAULT_CANDIDATES];
let reports = [];
let mainPieChartInstance;

// ==== SINKRONISASI DATABASE ====
onValue(ref(db, `${DB_PATH}/logo`), (snapshot) => {
    const savedLogo = snapshot.val();
    if(savedLogo) applyLogo(savedLogo);
});

onValue(ref(db, `${DB_PATH}/candidates`), (snapshot) => {
    const data = snapshot.val();
    candidates = data ? (Array.isArray(data) ? data : Object.values(data)) : [...DEFAULT_CANDIDATES];
    renderAll();
});

onValue(ref(db, `${DB_PATH}/reports`), (snapshot) => {
    const data = snapshot.val();
    reports = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
    renderAll();
});

function syncCandidates() { if(isAdmin) set(ref(db, `${DB_PATH}/candidates`), candidates); }
function syncReports() { if(isAdmin) set(ref(db, `${DB_PATH}/reports`), reports); }

// ==== INISIALISASI DOM ====
document.addEventListener("DOMContentLoaded", () => {
    initFormSelects();
    document.getElementById('appLogoUpload').addEventListener('change', handleLogoUpload);
    document.getElementById('btnAddCandidate').addEventListener('click', addCandidate);
    document.getElementById('btnResetMaster').addEventListener('click', () => resetData('candidates'));
    document.getElementById('btnResetReports').addEventListener('click', () => resetData('reports'));
    document.getElementById('tpsForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('inputInvalidVotes').addEventListener('input', window.calculateUnused);
    document.getElementById('inputTotalBallots').addEventListener('input', window.calculateUnused);
    window.addEventListener('calculateUnused', window.calculateUnused);
});

function applyLogo(src) {
    document.getElementById('appLogo').src = src;
    document.getElementById('appLogo').classList.remove('hidden');
    document.getElementById('appLogoDefault').classList.add('hidden');
    document.getElementById('splashLogo').src = src;
    document.getElementById('splashLogo').classList.remove('hidden');
    document.getElementById('splashDefault').classList.add('hidden');
}

function handleLogoUpload(event) {
    if(!isAdmin) return;
    const file = event.target.files[0];
    if (file) {
        if (file.size > 500 * 1024) { 
            alert("Gagal!\nUkuran file logo maksimal 500KB.");
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            set(ref(db, `${DB_PATH}/logo`), e.target.result)
                .then(() => window.showToast("Logo diubah"));
        };
        reader.readAsDataURL(file);
    }
}

function resetData(type) {
    if(!isAdmin) return;
    if (type === 'candidates' && confirm("Kembali ke 4 calon bawaan?")) {
        candidates = JSON.parse(JSON.stringify(DEFAULT_CANDIDATES));
        syncCandidates(); window.showToast("Master Calon direset.");
    } else if (type === 'reports' && confirm("Hapus SELURUH laporan TPS?")) {
        reports = [];
        syncReports(); window.showToast("Data TPS dikosongkan.");
    }
}

function addCandidate() {
    if(!isAdmin) return;
    const id = Date.now();
    const num = String(candidates.length + 1).padStart(2, '0');
    const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    candidates.push({ id, number: num, name: "Calon Baru", color, photo: "" });
    syncCandidates();
}

window.handleCandPhotoUpload = (event, id) => {
    if(!isAdmin) return;
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const c = candidates.find(x => x.id === id);
            if (c) { c.photo = e.target.result; syncCandidates(); }
        };
        reader.readAsDataURL(file);
    }
};

window.deleteCandidate = (id) => {
    if(!isAdmin) return;
    if (candidates.length <= 1) return alert("Minimal 1 calon tersisa.");
    if (confirm("Hapus calon ini?")) {
        candidates = candidates.filter(c => c.id !== id);
        candidates.forEach((c, i) => c.number = String(i + 1).padStart(2, '0'));
        syncCandidates();
    }
};

window.updateCandName = (id, name) => { if(!isAdmin) return; const c = candidates.find(x => x.id === id); if (c) { c.name = name; syncCandidates(); } };
window.updateCandColor = (id, color) => { if(!isAdmin) return; const c = candidates.find(x => x.id === id); if (c) { c.color = color; syncCandidates(); } };

window.calculateUnused = () => {
    let totalSah = 0;
    candidates.forEach(c => {
        const el = document.getElementById(`inputCand_${c.id}`);
        if (el) totalSah += Number(el.value) || 0;
    });
    const invalid = Number(document.getElementById("inputInvalidVotes").value) || 0;
    const totalDiterima = Number(document.getElementById("inputTotalBallots").value) || 0;
    const unused = totalDiterima - (totalSah + invalid);
    const unusedInput = document.getElementById("inputUnusedBallots");
    
    unusedInput.value = unused;
    if (unused < 0) {
        unusedInput.classList.replace("text-slate-500", "text-rose-600");
        unusedInput.classList.replace("bg-slate-200", "bg-rose-100");
        unusedInput.classList.replace("border-slate-200", "border-rose-300");
    } else {
        unusedInput.classList.replace("text-rose-600", "text-slate-500");
        unusedInput.classList.replace("bg-rose-100", "bg-slate-200");
        unusedInput.classList.replace("border-rose-300", "border-slate-200");
    }
};

function renderAll() {
    // --- BAGIAN YANG DIUBAH ---
    if (isAdmin) {
        renderCandidateEditor();
        
        const panelKelola = document.getElementById('panelKelolaAdmin');
        if (panelKelola && !panelKelola.classList.contains('hidden')) {
            renderAdminList();
        }
    }
    // --------------------------

    renderFormInputs();
    const metrics = calculateMetrics();
    updateGlobalStats(metrics);
    renderCandidateCards(metrics);
    renderPieChart(metrics);
    renderDistributionTable(metrics);
    if (isAdmin) renderTpsTable();
    renderStatTpsTable();
}

function calculateMetrics() {
    let totalValid = 0, totalInvalid = 0, totalBallots = 0, unusedBallots = 0;
    const candTotals = {};
    candidates.forEach(c => candTotals[c.id] = 0);
    let maxVotes = -1, winnerId = null;

    reports.forEach(r => {
        totalInvalid += Number(r.invalid || 0);
        totalBallots += Number(r.totalBallots || 0);
        unusedBallots += Number(r.unusedBallots || 0);
        candidates.forEach(c => {
            const count = Number(r.votes[c.id] || 0);
            candTotals[c.id] += count;
            totalValid += count;
        });
    });

    if (totalValid > 0) {
        Object.keys(candTotals).forEach(id => {
            if (candTotals[id] > maxVotes) { maxVotes = candTotals[id]; winnerId = parseInt(id); }
        });
    }
    return { totalValid, totalInvalid, totalVotes: totalValid + totalInvalid, totalBallots, unusedBallots, candTotals, winnerId };
}

function renderCandidateEditor() {
    const list = document.getElementById("candidateEditorList");
    if(!list) return;
    list.innerHTML = candidates.map(c => {
        const photoSrc = c.photo ? c.photo : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(c.color)}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        return `
        <div class="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm" style="border: 2px solid ${c.color}">
            <input type="file" id="photoCand_${c.id}" accept="image/*" class="hidden" onchange="window.handleCandPhotoUpload(event, ${c.id})">
            <div class="relative w-8 h-8 rounded-full border-2 overflow-hidden cursor-pointer upload-container flex-shrink-0 admin-only" style="border-color: ${c.color};" onclick="document.getElementById('photoCand_${c.id}').click()">
                <img src="${photoSrc}" class="w-full h-full object-cover">
                <div class="upload-overlay absolute inset-0 flex items-center justify-center text-white">
                    <i class="fa-solid fa-camera text-[8px]"></i>
                </div>
            </div>
            <div class="w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center flex-shrink-0" style="background-color: ${c.color}; color: white;">
                ${c.number}
            </div>
            <input type="text" value="${c.name}" onchange="window.updateCandName(${c.id}, this.value)" class="flex-grow text-xs font-semibold p-1 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-brand-500 outline-none">
            <input type="color" value="${c.color}" onchange="window.updateCandColor(${c.id}, this.value)" class="w-6 h-6 rounded cursor-pointer border border-slate-300 flex-shrink-0" title="Ubah Warna">
            <button onclick="window.deleteCandidate(${c.id})" class="p-1.5 text-slate-400 hover:text-rose-600 transition bg-white border border-slate-200 rounded">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
        </div>
    `}).join('');
}

function renderCandidateCards(m) {
    const container = document.getElementById("candidateCardsContainer");
    container.innerHTML = candidates.map(c => {
        const votes = m.candTotals[c.id] || 0;
        const percent = m.totalValid > 0 ? ((votes / m.totalValid) * 100).toFixed(1) : "0.0";
        const photoSrc = c.photo ? c.photo : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(c.color)}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        const isWinner = (c.id === m.winnerId);
        const winnerClass = isWinner ? "winner-card" : "";
        const winnerBadge = isWinner ? `<div class="absolute -top-3 -right-3 text-yellow-400 drop-shadow-md text-3xl rotate-12"><i class="fa-solid fa-crown"></i></div>` : "";
        return `
            <div class="rounded-xl shadow-sm p-3 relative overflow-visible flex flex-col h-full ${winnerClass}" style="background-color: ${c.color}; border: 2px solid ${c.color}">
                ${winnerBadge}
                <div class="flex items-center space-x-3 mb-2.5">
                    <div class="relative flex-shrink-0 z-20">
                        <img src="${photoSrc}" class="w-10 h-10 rounded-full object-cover border-2 shadow-sm" style="border-color: rgba(255,255,255,0.8); background-color: white;">
                        <span class="absolute -bottom-1 -right-1 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow" style="background-color: white; color: ${c.color}">${c.number}</span>
                    </div>
                    <div class="overflow-hidden z-20">
                        <h4 class="font-bold text-white text-xs sm:text-sm leading-tight truncate">${c.name}</h4>
                    </div>
                </div>
                <div class="mt-auto z-20">
                    <div class="flex justify-between items-baseline mb-1.5 text-white">
                        <span class="text-xl font-black">${votes.toLocaleString("id-ID")}</span>
                        <span class="text-xs font-bold">${percent}%</span>
                    </div>
                    <div class="w-full rounded-full h-1.5" style="background-color: rgba(255,255,255,0.3)">
                        <div class="h-1.5 rounded-full transition-all duration-700 bg-white" style="width: ${percent}%;"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderPieChart(m) {
    const ctx = document.getElementById('mainPieChart').getContext('2d');
    const data = candidates.map(c => m.candTotals[c.id] || 0);
    const labels = candidates.map(c => `${c.number} - ${c.name}`);
    const colors = candidates.map(c => c.color);

    if (mainPieChartInstance) mainPieChartInstance.destroy();
    const isEmpty = data.every(v => v === 0);
    
    mainPieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: isEmpty ? ['Belum ada data'] : labels,
            datasets: [{
                data: isEmpty ? [1] : data,
                backgroundColor: isEmpty ? ['#e2e8f0'] : colors,
                borderWidth: 2, hoverOffset: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: {family:'Inter', size:10} } } }
        }
    });
}

function updateGlobalStats(m) {
    document.getElementById("statTotalVotes").innerText = m.totalVotes.toLocaleString("id-ID");
    document.getElementById("statValidVotes").innerText = m.totalValid.toLocaleString("id-ID");
    document.getElementById("statInvalidVotes").innerText = m.totalInvalid.toLocaleString("id-ID");
    document.getElementById("statTotalBallots").innerText = m.totalBallots.toLocaleString("id-ID");
    document.getElementById("statUnusedBallots").innerText = m.unusedBallots.toLocaleString("id-ID");
}

function renderDistributionTable() {
    const table = document.getElementById("distributionTable");
    let thead = `<tr class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
        <th class="px-2 py-2 w-8 text-center text-[10px]">No</th>
        <th class="px-2 py-2 sticky left-0 bg-slate-50 border-r border-slate-200 z-10 text-center text-[10px]">Nama Calon</th>`;
    TPS_LIST.forEach(tps => {
        thead += `<th class="px-2 py-2 text-center whitespace-nowrap text-[10px]">${tps.name.split(' ')[0]} ${tps.name.split(' ')[1]}</th>`;
    });
    thead += `<th class="px-3 py-2 text-center font-bold bg-slate-100 text-slate-700 border-l border-slate-200 text-[10px]">Total Sah</th></tr>`;

    const sortedCandidates = candidates.map(c => {
        let total = 0;
        TPS_LIST.forEach(tps => { const r = reports.find(x => x.tpsId === tps.id); total += r ? (r.votes[c.id] || 0) : 0; });
        return { ...c, totalVotes: total };
    }).sort((a, b) => b.totalVotes - a.totalVotes);

    let tbody = sortedCandidates.map(c => {
        const photoSrc = c.photo ? c.photo : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(c.color)}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        let row = `<tr class="border-b border-slate-100 hover:bg-slate-50 transition">
            <td class="px-2 py-1.5 text-center font-bold text-[10px]" style="color: ${c.color}">${c.number}</td>
            <td class="px-2 py-1.5 sticky left-0 bg-white border-r border-slate-200 z-10 flex items-center space-x-1.5 min-w-[120px]">
                <img src="${photoSrc}" class="w-4 h-4 rounded-full object-cover">
                <span class="font-bold text-slate-800 truncate text-[10px]">${c.name}</span>
            </td>`;
        TPS_LIST.forEach(tps => {
            const r = reports.find(x => x.tpsId === tps.id);
            const votes = r ? (r.votes[c.id] || 0) : 0;
            row += `<td class="px-2 py-1.5 text-center font-medium text-slate-600 text-[10px]">${votes.toLocaleString('id-ID')}</td>`;
        });
        row += `<td class="px-2 py-1.5 text-center border-l border-slate-200"><div class="px-2 py-1 font-black text-[10px] rounded" style="border: 1px solid ${c.color}; color: ${c.color};">${c.totalVotes.toLocaleString('id-ID')}</div></td></tr>`;
        return row;
    }).join('');
    table.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
}

function renderStatTpsTable() {
    const tbody = document.getElementById("statTpsTableBody");
    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-sm text-slate-400">Belum ada laporan TPS yang diinput.</td></tr>`;
        return;
    }
    const mergedData = TPS_LIST.map(tps => {
        const r = reports.find(x => x.tpsId === tps.id);
        if (!r) return null;
        let totalSahTps = 0;
        candidates.forEach(c => { totalSahTps += (r.votes[c.id] || 0); });
        const totalSuaraTps = totalSahTps + (r.invalid || 0);
        return { name: tps.name, totalSuara: totalSuaraTps, sah: totalSahTps, invalid: r.invalid || 0, ballots: r.totalBallots || 0, unused: r.unusedBallots || 0 };
    }).filter(item => item !== null);

    tbody.innerHTML = mergedData.map(d => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-50">
            <td class="px-4 py-3 font-bold text-slate-800 border-r border-slate-100">${d.name}</td>
            <td class="px-3 py-3 text-center font-black text-slate-700 border-r border-slate-100">${d.totalSuara.toLocaleString('id-ID')}</td>
            <td class="px-3 py-3 text-center font-bold text-emerald-600 border-r border-slate-100 bg-emerald-50/30">${d.sah.toLocaleString('id-ID')}</td>
            <td class="px-3 py-3 text-center font-bold text-rose-600 border-r border-slate-100 bg-rose-50/30">${d.invalid.toLocaleString('id-ID')}</td>
            <td class="px-3 py-3 text-center font-bold text-indigo-600 border-r border-slate-100 bg-indigo-50/30">${d.ballots.toLocaleString('id-ID')}</td>
            <td class="px-3 py-3 text-center font-bold text-amber-600 bg-amber-50/30">${d.unused.toLocaleString('id-ID')}</td>
        </tr>
    `).join('');
}

function initFormSelects() {
    const select = document.getElementById("tpsSelect");
    select.innerHTML = '<option value="">-- Pilih Nomor TPS --</option>';
    TPS_LIST.forEach(tps => {
        const opt = document.createElement("option");
        opt.value = tps.id; opt.textContent = tps.name;
        select.appendChild(opt);
    });
}

function renderFormInputs() {
    const container = document.getElementById("candidateInputList");
    if(!container) return;
    container.innerHTML = candidates.map(c => `
        <div class="flex items-center justify-between p-2 rounded-lg bg-white shadow-sm" style="border: 2px solid ${c.color}">
            <div class="flex items-center space-x-2">
                <span class="w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center" style="background-color: ${c.color}; color: white;">${c.number}</span>
                <span class="text-xs font-bold text-slate-800">${c.name}</span>
            </div>
            <input type="number" id="inputCand_${c.id}" oninput="window.calculateUnused()" min="0" required value="0" class="w-20 text-xs p-1.5 border border-slate-300 rounded text-center focus:ring-1 outline-none bg-slate-50 font-bold">
        </div>
    `).join('');
}

function handleFormSubmit(e) {
    e.preventDefault();
    if(!isAdmin) return;
    const tpsId = document.getElementById("tpsSelect").value;
    const editingId = document.getElementById("editingTpsId").value;
    if (!tpsId) return;

    let totalSah = 0;
    const votes = {};
    candidates.forEach(c => {
        const v = Number(document.getElementById(`inputCand_${c.id}`).value) || 0;
        votes[c.id] = v;
        totalSah += v;
    });

    const invalidVotes = Number(document.getElementById("inputInvalidVotes").value) || 0;
    const totalBallots = Number(document.getElementById("inputTotalBallots").value) || 0;
    
    if (totalBallots < (totalSah + invalidVotes)) {
        alert("GAGAL MENYIMPAN!\nTotal Surat Diterima harus >= (Suara Sah + Suara Tidak Sah).");
        return;
    }
    
    const unusedBallots = totalBallots - (totalSah + invalidVotes);
    const reportData = { tpsId, votes, invalid: invalidVotes, totalBallots: totalBallots, unusedBallots: unusedBallots };

    const idx = reports.findIndex(r => r.tpsId === tpsId);
    if (editingId && idx !== -1) {
        reports[idx] = reportData; 
        syncReports();
        window.showToast("Data Diperbarui!");
    } else {
        if (idx !== -1 && !confirm("TPS ini sudah punya data. Timpa?")) return;
        if (idx !== -1) reports[idx] = reportData; else reports.push(reportData);
        syncReports();
        window.showToast("Laporan Disimpan!");
    }
    window.closeModal("modalInputTps");
}

function renderTpsTable() {
    const tbody = document.getElementById("tpsTableBody");
    if(!tbody) return;
    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-[11px] text-slate-400">Belum ada laporan TPS.</td></tr>`;
        return;
    }
    tbody.innerHTML = reports.map(r => {
        const t = TPS_LIST.find(x => x.id === r.tpsId) || {name:r.tpsId};
        return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="px-4 py-2 font-bold text-slate-800 text-[11px]">${t.name}</td>
                <td class="px-3 py-2 text-center text-rose-600 font-medium text-[11px]">${r.invalid || 0}</td>
                <td class="px-3 py-2 text-center text-slate-600 font-medium text-[11px]">${r.totalBallots || 0}</td>
                <td class="px-3 py-2 text-center text-slate-600 font-medium text-[11px]">${r.unusedBallots || 0}</td>
                <td class="px-4 py-2 text-right">
                    <button onclick="window.editTps('${r.tpsId}')" class="p-1 text-slate-400 hover:text-brand-600"><i class="fa-solid fa-pen text-[11px]"></i></button>
                    <button onclick="window.delTps('${r.tpsId}')" class="p-1 text-slate-400 hover:text-rose-600 ml-1"><i class="fa-solid fa-trash-can text-[11px]"></i></button>
                </td>
            </tr>
        `}).join('');
}

window.editTps = (id) => {
    if(!isAdmin) return;
    const r = reports.find(x => x.tpsId === id);
    if(!r) return;
    document.getElementById("editingTpsId").value = id;
    document.getElementById("tpsSelect").value = id;
    document.getElementById("tpsSelect").disabled = true;
    candidates.forEach(c => { const el = document.getElementById(`inputCand_${c.id}`); if(el) el.value = r.votes[c.id] || 0; });
    document.getElementById("inputInvalidVotes").value = r.invalid || 0;
    document.getElementById("inputTotalBallots").value = r.totalBallots || 0;
    window.calculateUnused();
    window.openModal("modalInputTps");
};

window.delTps = (id) => {
    if(!isAdmin) return;
    if(confirm(`Hapus data ${id}?`)) {
        reports = reports.filter(r => r.tpsId !== id);
        syncReports(); 
        window.showToast("Laporan dihapus");
    }
};

// Listener realtime untuk tabel admin
onValue(ref(db, `${DB_PATH}/admins`), (snapshot) => {
    const data = snapshot.val();
    adminEmails = data ? (Array.isArray(data) ? data : Object.values(data)) : ['yutukiyempraker34@gmail.com'];
    if (!adminEmails.includes('yutukiyempraker34@gmail.com')) {
        adminEmails.push('yutukiyempraker34@gmail.com');
    }
    if (isAdmin) renderAdminList();
});

// Event Submit Tambah Admin
document.getElementById('formAddAdmin').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const input = document.getElementById('inputNewAdmin');
    const newEmail = input.value.trim().toLowerCase();
    
    if (newEmail && !adminEmails.includes(newEmail)) {
        adminEmails.push(newEmail);
        set(ref(db, `${DB_PATH}/admins`), adminEmails).then(() => {
            window.showToast("Email Admin ditambahkan!");
            input.value = '';
        });
    } else {
        alert("Email sudah terdaftar sebagai admin!");
    }
});

// Fungsi Hapus Admin Global
window.removeAdmin = (emailToRemove) => {
    if (!isAdmin) return;
    if (emailToRemove === 'yutukiyempraker34@gmail.com') {
        return alert("Super Admin tidak dapat dihapus!");
    }
    if (confirm(`Cabut hak akses admin untuk ${emailToRemove}?`)) {
        adminEmails = adminEmails.filter(email => email !== emailToRemove);
        set(ref(db, `${DB_PATH}/admins`), adminEmails).then(() => {
            window.showToast("Admin dihapus!");
        });
    }
};

// Fungsi Render Tabel Admin
function renderAdminList() {
    const tbody = document.getElementById("adminListBody");
    if (!tbody) return;
    tbody.innerHTML = adminEmails.map(email => {
        const isSuper = email === 'yutukiyempraker34@gmail.com';
        const badge = isSuper ? `<span class="ml-2 px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] rounded-full font-bold shadow-sm">Super Admin</span>` : '';
        const btnDel = isSuper ? `<span class="text-[10px] text-slate-300 p-1"><i class="fa-solid fa-lock"></i></span>` : `<button onclick="window.removeAdmin('${email}')" class="p-1 text-slate-400 hover:text-rose-600 transition"><i class="fa-solid fa-trash-can text-[11px]"></i></button>`;
        
        return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="px-3 py-2.5 font-medium text-slate-800 text-[11px]">${email} ${badge}</td>
                <td class="px-3 py-2.5 text-right">${btnDel}</td>
            </tr>
        `;
    }).join('');
}