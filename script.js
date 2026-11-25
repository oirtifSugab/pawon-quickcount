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
    const btnSaksi = document.getElementById('btnTabSaksi');

    const viewReview = document.getElementById('tabReview');
    const viewStatTps = document.getElementById('tabStatTps');
    const viewInput = document.getElementById('tabInput');
    const viewSaksi = document.getElementById('tabSaksi');

    btnReview.className = "sidebar-inactive flex items-center px-5 py-3 text-sm transition text-left font-semibold";
    btnStatTps.className = "sidebar-inactive flex items-center px-5 py-3 text-sm transition text-left font-semibold";

    if (!btnInput.classList.contains('hidden')) {
        btnInput.className = "sidebar-inactive flex items-center px-5 py-3 text-sm transition text-left font-semibold admin-only";
    }
    if (btnSaksi && !btnSaksi.classList.contains('hidden')) {
        btnSaksi.className = "sidebar-inactive flex items-center px-5 py-3 text-sm transition text-left font-semibold saksi-only";
    }

    viewReview.classList.add('hidden');
    viewStatTps.classList.add('hidden');
    viewInput.classList.add('hidden');
    if (viewSaksi) viewSaksi.classList.add('hidden');

    if (tab === 'review') {
        btnReview.className = "sidebar-active flex items-center px-5 py-3 text-sm transition text-left font-semibold";
        viewReview.classList.remove('hidden');
    } else if (tab === 'statTps') {
        btnStatTps.className = "sidebar-active flex items-center px-5 py-3 text-sm transition text-left font-semibold";
        viewStatTps.classList.remove('hidden');
    } else if (tab === 'saksi') {
        if (btnSaksi) btnSaksi.className = "sidebar-active flex items-center px-5 py-3 text-sm transition text-left font-semibold saksi-only";
        if (viewSaksi) viewSaksi.classList.remove('hidden');
        renderSaksiView();
    } else {
        btnInput.className = "sidebar-active flex items-center px-5 py-3 text-sm transition text-left font-semibold admin-only";
        viewInput.classList.remove('hidden');
    }
    if (window.innerWidth < 768) window.toggleSidebar();
}

window.triggerSplash = function() {
    const tabSaksi = document.getElementById('tabSaksi');
    const isSaksiTabOpen = tabSaksi && !tabSaksi.classList.contains('hidden');

    // Jangan tampilkan splash screen jika login sebagai saksi atau sedang membuka tab Saksi
    if (witnessTpsId || isSaksiTabOpen) return;

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
        document.getElementById("modalFormTitle").innerText = "Input Laporan Perolehan";
        const infoBox = document.getElementById("tpsAccumulateInfo");
        if (infoBox) infoBox.classList.add("hidden");
        window.dispatchEvent(new Event('calculateUnused'));
    }
}

window.showToast = function(msg) {
    const t = document.getElementById("toast");
    document.getElementById("toastMessage").innerText = msg;
    t.classList.remove("translate-y-20", "opacity-0");
    setTimeout(() => t.classList.add("translate-y-20", "opacity-0"), 3000);
}

// ==== CUSTOM MODAL DIALOG (PENGGANTI ALERT & CONFIRM) ====
function openCustomDialog({ title, message, confirmText = "Ya", cancelText = "Batal", type = "brand", showCancel = true }) {
    return new Promise((resolve) => {
        const modal = document.getElementById("customDialogModal");
        const box = document.getElementById("customDialogBox");
        const iconWrap = document.getElementById("customDialogIconWrap");
        const icon = document.getElementById("customDialogIcon");
        const titleEl = document.getElementById("customDialogTitle");
        const msgEl = document.getElementById("customDialogMessage");
        const btnCancel = document.getElementById("btnDialogCancel");
        const btnConfirm = document.getElementById("btnDialogConfirm");

        // Konfigurasi tema warna (danger / warning / brand)
        const themes = {
            danger: {
                border: "border-rose-200",
                iconWrap: "bg-rose-100 text-rose-600",
                icon: "fa-solid fa-triangle-exclamation",
                btn: "bg-rose-600 hover:bg-rose-700"
            },
            warning: {
                border: "border-amber-200",
                iconWrap: "bg-amber-100 text-amber-600",
                icon: "fa-solid fa-circle-exclamation",
                btn: "bg-amber-600 hover:bg-amber-700"
            },
            brand: {
                border: "border-brand-200",
                iconWrap: "bg-brand-100 text-brand-600",
                icon: "fa-solid fa-circle-info",
                btn: "bg-brand-600 hover:bg-brand-700"
            }
        };
        const t = themes[type] || themes.brand;

        box.className = `bg-white rounded-2xl border-2 ${t.border} max-w-xs w-full p-5 shadow-2xl transform transition-all duration-200 scale-95 opacity-0`;
        iconWrap.className = `w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-xl shadow-sm ${t.iconWrap}`;
        icon.className = t.icon;
        btnConfirm.className = `flex-1 px-3 py-2 text-xs font-bold text-white rounded-xl transition shadow-sm ${t.btn}`;

        titleEl.innerText = title;
        msgEl.innerText = message;
        btnConfirm.innerText = confirmText;
        btnCancel.innerText = cancelText;
        btnCancel.classList.toggle("hidden", !showCancel);

        modal.classList.remove("hidden");
        requestAnimationFrame(() => {
            box.classList.remove("scale-95", "opacity-0");
            box.classList.add("scale-100", "opacity-100");
        });

        const cleanup = (result) => {
            box.classList.remove("scale-100", "opacity-100");
            box.classList.add("scale-95", "opacity-0");
            setTimeout(() => modal.classList.add("hidden"), 180);
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            modal.onclick = null;
            resolve(result);
        };

        btnConfirm.onclick = () => cleanup(true);
        btnCancel.onclick = () => cleanup(false);
        modal.onclick = (e) => {
            if (e.target === modal) cleanup(false);
        };
    });
}

window.showConfirm = (opts) => openCustomDialog({ ...opts, showCancel: true });
window.showAlert = (opts) => openCustomDialog({ confirmText: "Mengerti", ...opts, showCancel: false });

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
let witnessTpsId = null; // Menyimpan kode TPS jika user adalah saksi (misal: "TPS-01")
let witnesses = [];      // Daftar saksi: [{ email: "...", tpsId: "TPS-01" }] 

// ==== LOGIKA AUTHENTICATION ====
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const adminProfile = document.getElementById('adminProfile');

btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => {
        window.showAlert({
            title: "Login Gagal",
            message: error.message,
            type: "danger"
        });
    });
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
    const saksiElements = document.querySelectorAll('.saksi-only');
    const logoOverlay = document.getElementById('logoUploadOverlay');

    if (user) {
        const userEmail = user.email.toLowerCase();

        // 1. Cek daftar Admin
        const adminSnap = await get(ref(db, `${DB_PATH}/admins`));
        const adminData = adminSnap.val();
        let currentAdmins = adminData ? (Array.isArray(adminData) ? adminData : Object.values(adminData)) : ['yutukiyempraker34@gmail.com'];
        currentAdmins = currentAdmins.map(e => e.toLowerCase());
        if (!currentAdmins.includes('yutukiyempraker34@gmail.com')) {
            currentAdmins.push('yutukiyempraker34@gmail.com');
        }

        // 2. Cek daftar Saksi TPS
        const saksiSnap = await get(ref(db, `${DB_PATH}/witnesses`));
        const saksiData = saksiSnap.val();
        const currentWitnesses = saksiData ? (Array.isArray(saksiData) ? saksiData : Object.values(saksiData)) : [];
        const matchedWitness = currentWitnesses.find(w => w.email && w.email.toLowerCase() === userEmail);

        const userIsAdmin = currentAdmins.includes(userEmail);
        const userIsSaksi = Boolean(matchedWitness);

        if (userIsAdmin || userIsSaksi) {
            isAdmin = userIsAdmin;
            witnessTpsId = matchedWitness ? matchedWitness.tpsId : null;

            btnLogin.classList.add('hidden');
            adminProfile.classList.remove('hidden');
            document.getElementById('adminName').innerText = user.displayName;
            document.getElementById('adminAvatar').src = user.photoURL;

            // Tampilkan menu sesuai role
            adminElements.forEach(el => el.classList.toggle('hidden', !isAdmin));
            saksiElements.forEach(el => el.classList.toggle('hidden', !witnessTpsId));
            logoOverlay.classList.toggle('hidden', !isAdmin);

            const panelKelola = document.getElementById('panelKelolaAdmin');
            if (panelKelola) {
                panelKelola.classList.toggle('hidden', userEmail !== 'yutukiyempraker34@gmail.com');
            }

            renderAll();

            // Jika login murni sebagai Saksi, langsung arahkan ke tab Hitung Cepat Saksi
            if (!isAdmin && witnessTpsId) {
                document.getElementById('splashScreen')?.classList.remove('show');
                window.switchTab('saksi');
            }
        } else {
            await window.showAlert({
                title: "Akses Ditolak",
                message: `Akun ${user.email} tidak terdaftar sebagai Admin maupun Saksi TPS.`,
                type: "danger"
            });
            signOut(auth);
        }
    } else {
        isAdmin = false;
        witnessTpsId = null;
        btnLogin.classList.remove('hidden');
        adminProfile.classList.add('hidden');
        adminElements.forEach(el => el.classList.add('hidden'));
        saksiElements.forEach(el => el.classList.add('hidden'));
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
    if (!data) {
        reports = [];
    } else {
        const rawList = Array.isArray(data) ? data : Object.values(data);
        const uniqueMap = {};
        rawList.forEach(r => {
            if (r && r.tpsId) uniqueMap[r.tpsId] = r;
        });
        reports = Object.values(uniqueMap);
    }
    renderAll();
});

// Listener realtime daftar saksi
onValue(ref(db, `${DB_PATH}/witnesses`), (snapshot) => {
    const data = snapshot.val();
    witnesses = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
    if (isAdmin) renderSaksiList();
});

function syncCandidates() { if (isAdmin) set(ref(db, `${DB_PATH}/candidates`), candidates); }

// Simpan laporan dengan key TPS-ID agar tidak bentrok antar saksi
function syncReports() {
    if (!isAdmin) return;
    const mapped = {};
    reports.forEach(r => {
        if (r && r.tpsId) mapped[r.tpsId] = r;
    });
    set(ref(db, `${DB_PATH}/reports`), mapped);
}

// Khusus saksi: hanya update node TPS miliknya sendiri di Firebase
function syncSingleTpsReport(reportData) {
    if (!witnessTpsId || reportData.tpsId !== witnessTpsId) return;
    set(ref(db, `${DB_PATH}/reports/${reportData.tpsId}`), reportData);
}

// ==== INISIALISASI DOM ====
document.addEventListener("DOMContentLoaded", () => {
    initFormSelects();
    document.getElementById('appLogoUpload').addEventListener('change', handleLogoUpload);
    document.getElementById('btnAddCandidate').addEventListener('click', addCandidate);
    document.getElementById('btnResetMaster').addEventListener('click', () => resetData('candidates'));
    document.getElementById('btnResetReports').addEventListener('click', () => resetData('reports'));
    document.getElementById('tpsForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('tpsSelect').addEventListener('change', handleTpsSelectChange);
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
            window.showAlert({
                title: "Ukuran File Terlalu Besar",
                message: "Ukuran file logo maksimal 500KB.",
                type: "warning"
            });
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

async function resetData(type) {
    if (!isAdmin) return;
    if (type === 'candidates') {
        const ok = await window.showConfirm({
            title: "Reset Master Calon?",
            message: "Daftar calon akan dikembalikan ke 4 calon bawaan.",
            confirmText: "Ya, Reset",
            type: "danger"
        });
        if (ok) {
            candidates = JSON.parse(JSON.stringify(DEFAULT_CANDIDATES));
            syncCandidates();
            window.showToast("Master Calon direset.");
        }
    } else if (type === 'reports') {
        const ok = await window.showConfirm({
            title: "Hapus Semua Laporan TPS?",
            message: "SELURUH data perolehan suara di semua TPS akan dihapus permanen.",
            confirmText: "Ya, Hapus Semua",
            type: "danger"
        });
        if (ok) {
            reports = [];
            syncReports();
            window.showToast("Data TPS dikosongkan.");
        }
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

window.deleteCandidate = async (id) => {
    if (!isAdmin) return;
    if (candidates.length <= 1) {
        return window.showAlert({
            title: "Tidak Dapat Dihapus",
            message: "Minimal harus ada 1 calon tersisa.",
            type: "warning"
        });
    }
    const ok = await window.showConfirm({
        title: "Hapus Calon?",
        message: "Data calon ini akan dihapus dari daftar.",
        confirmText: "Hapus",
        type: "danger"
    });
    if (ok) {
        candidates = candidates.filter(c => c.id !== id);
        candidates.forEach((c, i) => c.number = String(i + 1).padStart(2, '0'));
        syncCandidates();
    }
};

window.updateCandName = (id, name) => { if(!isAdmin) return; const c = candidates.find(x => x.id === id); if (c) { c.name = name; syncCandidates(); } };
window.updateCandColor = (id, color) => { if(!isAdmin) return; const c = candidates.find(x => x.id === id); if (c) { c.color = color; syncCandidates(); } };

function getExistingReportForAddMode() {
    const tpsId = document.getElementById("tpsSelect").value;
    const editingId = document.getElementById("editingTpsId").value;
    if (!tpsId || editingId) return null;
    return reports.find(r => r.tpsId === tpsId) || null;
}

function handleTpsSelectChange() {
    const existing = getExistingReportForAddMode();
    const infoBox = document.getElementById("tpsAccumulateInfo");
    const infoText = document.getElementById("tpsAccumulateText");

    if (existing && infoBox && infoText) {
        infoText.innerHTML = `<strong>Mode Tambah Suara:</strong> TPS ini sudah memiliki data (Surat Diterima: <b>${existing.totalBallots || 0}</b>). Inputan baru akan <b>DIJUMLAHKAN</b> ke data sebelumnya. Biarkan <i>Total Surat Diterima</i> bernilai <b>0</b> jika tidak ada tambahan surat suara.`;
        infoBox.classList.remove("hidden");
    } else if (infoBox) {
        infoBox.classList.add("hidden");
    }
    window.calculateUnused();
}

window.resetSelectedTps = async () => {
    if (!isAdmin) return;
    const tpsId = document.getElementById("tpsSelect").value;
    if (!tpsId) return;

    const tpsObj = TPS_LIST.find(x => x.id === tpsId);
    const tpsName = tpsObj ? tpsObj.name : tpsId;

    const ok = await window.showConfirm({
        title: `Reset Data ${tpsName}?`,
        message: "Data perolehan lama akan dihapus agar Anda bisa menginput data akhir yang baru.",
        confirmText: "Ya, Reset TPS",
        type: "danger"
    });

    if (ok) {
        reports = reports.filter(r => r.tpsId !== tpsId);
        syncReports();

        document.getElementById("inputInvalidVotes").value = 0;
        document.getElementById("inputTotalBallots").value = 0;
        candidates.forEach(c => {
            const el = document.getElementById(`inputCand_${c.id}`);
            if (el) el.value = 0;
        });

        handleTpsSelectChange();
        window.showToast(`Data ${tpsName} direset! Silakan input data baru.`);
    }
};

window.calculateUnused = () => {
    let inputSah = 0;
    candidates.forEach(c => {
        const el = document.getElementById(`inputCand_${c.id}`);
        if (el) inputSah += Number(el.value) || 0;
    });
    const inputInvalid = Number(document.getElementById("inputInvalidVotes").value) || 0;
    const inputBallots = Number(document.getElementById("inputTotalBallots").value) || 0;

    const existing = getExistingReportForAddMode();
    let totalSah = inputSah;
    let totalInvalid = inputInvalid;
    let totalDiterima = inputBallots;

    if (existing) {
        candidates.forEach(c => {
            totalSah += Number(existing.votes?.[c.id] || 0);
        });
        totalInvalid += Number(existing.invalid || 0);
        totalDiterima += Number(existing.totalBallots || 0);
    }

    const unused = totalDiterima - (totalSah + totalInvalid);
    const unusedInput = document.getElementById("inputUnusedBallots");

    unusedInput.value = unused;
    if (unused < 0) {
        unusedInput.classList.remove("text-slate-500", "bg-slate-200", "border-slate-200");
        unusedInput.classList.add("text-rose-600", "bg-rose-100", "border-rose-300");
    } else {
        unusedInput.classList.remove("text-rose-600", "bg-rose-100", "border-rose-300");
        unusedInput.classList.add("text-slate-500", "bg-slate-200", "border-slate-200");
    }
};

function renderAll() {
    if (isAdmin) {
        renderCandidateEditor();
        renderSaksiList();

        const panelKelola = document.getElementById('panelKelolaAdmin');
        if (panelKelola && !panelKelola.classList.contains('hidden')) {
            renderAdminList();
        }
    }

    renderFormInputs();
    const metrics = calculateMetrics();
    updateGlobalStats(metrics);
    renderCandidateCards(metrics);
    renderPieChart(metrics);
    renderDistributionTable(metrics);
    if (isAdmin) renderTpsTable();
    renderStatTpsTable();
    if (witnessTpsId) renderSaksiView();
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
    const selectSaksi = document.getElementById("selectSaksiTps");

    select.innerHTML = '<option value="">-- Pilih Nomor TPS --</option>';
    if (selectSaksi) selectSaksi.innerHTML = '<option value="">-- Pilih TPS --</option>';

    TPS_LIST.forEach(tps => {
        const opt = document.createElement("option");
        opt.value = tps.id; opt.textContent = tps.name;
        select.appendChild(opt);

        if (selectSaksi) {
            const opt2 = document.createElement("option");
            opt2.value = tps.id; opt2.textContent = tps.name;
            selectSaksi.appendChild(opt2);
        }
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
    if (!isAdmin) return;

    const tpsId = document.getElementById("tpsSelect").value;
    const editingId = document.getElementById("editingTpsId").value;
    if (!tpsId) return;

    const idx = reports.findIndex(r => r.tpsId === tpsId);
    const isAddingToExisting = (!editingId && idx !== -1);
    const existing = isAddingToExisting ? reports[idx] : null;

    let totalSah = 0;
    const votes = {};
    candidates.forEach(c => {
        const inputVal = Number(document.getElementById(`inputCand_${c.id}`).value) || 0;
        const prevVal = existing ? Number(existing.votes?.[c.id] || 0) : 0;
        votes[c.id] = prevVal + inputVal;
        totalSah += votes[c.id];
    });

    const inputInvalid = Number(document.getElementById("inputInvalidVotes").value) || 0;
    const inputBallots = Number(document.getElementById("inputTotalBallots").value) || 0;

    const invalidVotes = (existing ? Number(existing.invalid || 0) : 0) + inputInvalid;
    const totalBallots = (existing ? Number(existing.totalBallots || 0) : 0) + inputBallots;

    if (totalBallots < (totalSah + invalidVotes)) {
        window.showAlert({
            title: "Gagal Menyimpan",
            message: "Total Surat Diterima harus lebih besar atau sama dengan (Total Suara Sah + Total Suara Tidak Sah).",
            type: "warning"
        });
        return;
    }

    const unusedBallots = totalBallots - (totalSah + invalidVotes);
    const reportData = { tpsId, votes, invalid: invalidVotes, totalBallots, unusedBallots };

    if (editingId && idx !== -1) {
        reports[idx] = reportData;
        syncReports();
        window.showToast("Data TPS diperbarui!");
    } else if (isAddingToExisting) {
        reports[idx] = reportData;
        syncReports();
        window.showToast(`Suara berhasil dijumlahkan ke ${tpsId}!`);
    } else {
        reports.push(reportData);
        syncReports();
        window.showToast("Laporan TPS baru disimpan!");
    }
    window.closeModal("modalInputTps");
}

function renderTpsTable() {
    const tbody = document.getElementById("tpsTableBody");
    const badge = document.getElementById("tpsProgressBadge");
    if (!tbody) return;

    if (badge) {
        badge.innerText = `${reports.length} / ${TPS_LIST.length} TPS Masuk`;
    }

    if (reports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center">
                    <div class="flex flex-col items-center justify-center text-slate-400">
                        <i class="fa-solid fa-inbox text-3xl mb-2 text-slate-300"></i>
                        <p class="text-xs font-semibold text-slate-500">Belum ada laporan TPS yang masuk</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">Klik tombol "+ Input Data TPS" di kanan atas untuk mulai menginput.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    // Urutkan otomatis berdasarkan nomor TPS (TPS-01, TPS-02, dst.)
    const sortedReports = [...reports].sort((a, b) => (a.tpsId || "").localeCompare(b.tpsId || ""));

    tbody.innerHTML = sortedReports.map(r => {
        const t = TPS_LIST.find(x => x.id === r.tpsId) || { name: r.tpsId };

        let totalSah = 0;
        const candBadges = candidates.map(c => {
            const v = Number(r.votes?.[c.id] || 0);
            totalSah += v;
            return `
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white shadow-sm" style="border: 1.5px solid ${c.color}; color: ${c.color};" title="${c.name}">
                    <span class="opacity-75 mr-1">${c.number}:</span>${v.toLocaleString('id-ID')}
                </span>`;
        }).join('');

        return `
            <tr class="hover:bg-indigo-50/30 transition">
                <td class="px-4 py-3">
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span class="font-extrabold text-slate-800 text-xs">${t.name}</span>
                    </div>
                </td>
                <td class="px-3 py-3">
                    <div class="flex flex-wrap items-center gap-1.5">
                        ${candBadges}
                    </div>
                </td>
                <td class="px-3 py-3 text-center">
                    <span class="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200">
                        ${totalSah.toLocaleString('id-ID')}
                    </span>
                </td>
                <td class="px-3 py-3 text-center">
                    <span class="inline-block px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold text-[11px] border border-rose-200">
                        ${Number(r.invalid || 0).toLocaleString('id-ID')}
                    </span>
                </td>
                <td class="px-3 py-3 text-center font-bold text-slate-700 text-xs">
                    ${Number(r.totalBallots || 0).toLocaleString('id-ID')}
                </td>
                <td class="px-3 py-3 text-center">
                    <span class="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200">
                        ${Number(r.unusedBallots || 0).toLocaleString('id-ID')}
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="inline-flex items-center space-x-1.5">
                        <button onclick="window.editTps('${r.tpsId}')" class="px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition font-bold text-[11px]" title="Edit Data ${t.name}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="window.delTps('${r.tpsId}')" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition font-bold text-[11px]" title="Hapus Data ${t.name}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.editTps = (id) => {
    if (!isAdmin) return;
    const r = reports.find(x => x.tpsId === id);
    if (!r) return;
    document.getElementById("editingTpsId").value = id;
    document.getElementById("tpsSelect").value = id;
    document.getElementById("tpsSelect").disabled = true;
    document.getElementById("modalFormTitle").innerText = "Edit Laporan Perolehan";
    const infoBox = document.getElementById("tpsAccumulateInfo");
    if (infoBox) infoBox.classList.add("hidden");

    candidates.forEach(c => {
        const el = document.getElementById(`inputCand_${c.id}`);
        if (el) el.value = r.votes?.[c.id] || 0;
    });
    document.getElementById("inputInvalidVotes").value = r.invalid || 0;
    document.getElementById("inputTotalBallots").value = r.totalBallots || 0;
    window.calculateUnused();
    window.openModal("modalInputTps");
};

window.delTps = async (id) => {
    if (!isAdmin) return;
    const ok = await window.showConfirm({
        title: `Hapus Data ${id}?`,
        message: "Laporan perolehan suara pada TPS ini akan dihapus.",
        confirmText: "Hapus",
        type: "danger"
    });
    if (ok) {
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
        window.showAlert({
            title: "Email Sudah Terdaftar",
            message: "Alamat email tersebut sudah memiliki akses admin.",
            type: "warning"
        });
    }
});

// Ganti fungsi removeAdmin:
window.removeAdmin = async (emailToRemove) => {
    if (!isAdmin) return;
    if (emailToRemove === 'yutukiyempraker34@gmail.com') {
        return window.showAlert({
            title: "Aksi Ditolak",
            message: "Super Admin tidak dapat dihapus!",
            type: "warning"
        });
    }
    const ok = await window.showConfirm({
        title: "Cabut Akses Admin?",
        message: `Hapus hak akses admin untuk ${emailToRemove}?`,
        confirmText: "Cabut Akses",
        type: "danger"
    });
    if (ok) {
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

// ==========================================
// 3. KELOLA SAKSI TPS (ADMIN)
// ==========================================
document.getElementById('formAddSaksi')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const emailInput = document.getElementById('inputSaksiEmail');
    const tpsSelect = document.getElementById('selectSaksiTps');
    const email = emailInput.value.trim().toLowerCase();
    const tpsId = tpsSelect.value;

    if (!email || !tpsId) return;

    const existingIdx = witnesses.findIndex(w => w.email.toLowerCase() === email);
    if (existingIdx !== -1) {
        witnesses[existingIdx].tpsId = tpsId;
    } else {
        witnesses.push({ email, tpsId });
    }

    set(ref(db, `${DB_PATH}/witnesses`), witnesses).then(() => {
        window.showToast(`Saksi ${email} ditugaskan ke ${tpsId}`);
        emailInput.value = '';
        tpsSelect.value = '';
    });
});

window.removeSaksi = async (emailToRemove) => {
    if (!isAdmin) return;
    const ok = await window.showConfirm({
        title: "Hapus Akun Saksi?",
        message: `Cabut akses saksi TPS untuk ${emailToRemove}?`,
        confirmText: "Hapus",
        type: "danger"
    });
    if (ok) {
        witnesses = witnesses.filter(w => w.email.toLowerCase() !== emailToRemove.toLowerCase());
        set(ref(db, `${DB_PATH}/witnesses`), witnesses).then(() => {
            window.showToast("Akun saksi dihapus!");
        });
    }
};

function renderSaksiList() {
    const tbody = document.getElementById("saksiListBody");
    if (!tbody) return;
    if (witnesses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-[11px] text-slate-400">Belum ada akun saksi TPS terdaftar.</td></tr>`;
        return;
    }
    tbody.innerHTML = witnesses.map(w => {
        const tpsObj = TPS_LIST.find(t => t.id === w.tpsId);
        const tpsLabel = tpsObj ? tpsObj.name : w.tpsId;
        return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="px-3 py-2.5 font-medium text-slate-800 text-[11px]">${w.email}</td>
                <td class="px-3 py-2.5 text-center">
                    <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">${tpsLabel}</span>
                </td>
                <td class="px-3 py-2.5 text-right">
                    <button onclick="window.removeSaksi('${w.email}')" class="p-1 text-slate-400 hover:text-rose-600 transition">
                        <i class="fa-solid fa-trash-can text-[11px]"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// 4. FITUR TASBIH DIGITAL SAKSI TPS
// ==========================================
function getOrCreateSaksiReport() {
    const existing = reports.find(r => r.tpsId === witnessTpsId);
    if (existing) {
        return {
            tpsId: witnessTpsId,
            votes: { ...(existing.votes || {}) },
            invalid: Number(existing.invalid || 0),
            totalBallots: Number(existing.totalBallots || 0),
            unusedBallots: Number(existing.unusedBallots || 0)
        };
    }
    const votes = {};
    candidates.forEach(c => votes[c.id] = 0);
    return { tpsId: witnessTpsId, votes, invalid: 0, totalBallots: 0, unusedBallots: 0 };
}

function recalcAndSaveSaksiReport(rep) {
    let totalSah = 0;
    candidates.forEach(c => {
        rep.votes[c.id] = Math.max(0, Number(rep.votes[c.id] || 0));
        totalSah += rep.votes[c.id];
    });
    rep.invalid = Math.max(0, Number(rep.invalid || 0));
    rep.totalBallots = Math.max(0, Number(rep.totalBallots || 0));
    rep.unusedBallots = rep.totalBallots > 0 ? (rep.totalBallots - (totalSah + rep.invalid)) : 0;

    // Update state lokal seketika (respon instan) lalu sinkronkan ke Firebase
    const idx = reports.findIndex(r => r.tpsId === rep.tpsId);
    if (idx !== -1) reports[idx] = rep;
    else reports.push(rep);

    syncSingleTpsReport(rep);
    renderSaksiView();
}

window.tapSaksiCandidate = (candId, delta) => {
    if (!witnessTpsId) return;
    const rep = getOrCreateSaksiReport();
    const current = Number(rep.votes[candId] || 0);
    if (current + delta < 0) return; // Jangan sampai minus
    rep.votes[candId] = current + delta;
    recalcAndSaveSaksiReport(rep);
};

window.setSaksiCandidateDirect = (candId) => {
    if (!witnessTpsId) return;
    const input = document.getElementById(`saksiDirect_${candId}`);
    if (!input || input.value === '') return;
    const newVal = Math.max(0, parseInt(input.value, 10) || 0);
    const rep = getOrCreateSaksiReport();
    rep.votes[candId] = newVal;
    input.value = '';
    recalcAndSaveSaksiReport(rep);
    window.showToast("Jumlah suara calon diperbarui!");
};

window.tapSaksiInvalid = (delta) => {
    if (!witnessTpsId) return;
    const rep = getOrCreateSaksiReport();
    if (rep.invalid + delta < 0) return;
    rep.invalid += delta;
    recalcAndSaveSaksiReport(rep);
};

window.setSaksiInvalidDirect = () => {
    if (!witnessTpsId) return;
    const input = document.getElementById('saksiInvalidDirectInput');
    if (!input || input.value === '') return;
    const rep = getOrCreateSaksiReport();
    rep.invalid = Math.max(0, parseInt(input.value, 10) || 0);
    input.value = '';
    recalcAndSaveSaksiReport(rep);
    window.showToast("Suara tidak sah diperbarui!");
};

window.setSaksiTotalBallots = () => {
    if (!witnessTpsId) return;
    const input = document.getElementById('saksiBallotsDirectInput');
    if (!input || input.value === '') return;
    const rep = getOrCreateSaksiReport();
    rep.totalBallots = Math.max(0, parseInt(input.value, 10) || 0);
    input.value = '';
    recalcAndSaveSaksiReport(rep);
    window.showToast("Total surat suara diterima disimpan!");
};

function renderSaksiView() {
    if (!witnessTpsId) return;
    const rep = getOrCreateSaksiReport();
    const tpsObj = TPS_LIST.find(t => t.id === witnessTpsId);
    const tpsLabel = tpsObj ? tpsObj.name : witnessTpsId;

    let totalSah = 0;
    candidates.forEach(c => totalSah += Number(rep.votes[c.id] || 0));

    document.getElementById('saksiTpsTitle').innerText = `HITUNG CEPAT — ${tpsLabel}`;
    document.getElementById('saksiTotalValid').innerText = totalSah.toLocaleString('id-ID');
    document.getElementById('saksiTotalInvalid').innerText = rep.invalid.toLocaleString('id-ID');
    document.getElementById('saksiTotalAll').innerText = (totalSah + rep.invalid).toLocaleString('id-ID');

    document.getElementById('saksiInvalidCountDisplay').innerText = rep.invalid.toLocaleString('id-ID');
    document.getElementById('saksiBallotsDisplay').innerText = rep.totalBallots.toLocaleString('id-ID');
    document.getElementById('saksiUnusedDisplay').innerText = rep.unusedBallots.toLocaleString('id-ID');

    const grid = document.getElementById('saksiCandidateGrid');
    if (!grid) return;

    grid.innerHTML = candidates.map(c => {
        const count = Number(rep.votes[c.id] || 0);
        const photoSrc = c.photo ? c.photo : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(c.color)}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        return `
            <div class="bg-white rounded-2xl p-4 shadow-sm flex flex-col space-y-3" style="border: 2px solid ${c.color}">
                <!-- Identitas Calon -->
                <div class="flex items-center space-x-3">
                    <div class="relative flex-shrink-0">
                        <img src="${photoSrc}" class="w-11 h-11 rounded-full object-cover border-2 shadow-sm bg-white" style="border-color: ${c.color}">
                        <span class="absolute -bottom-1 -right-1 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white shadow" style="background-color: ${c.color}">${c.number}</span>
                    </div>
                    <div class="overflow-hidden">
                        <span class="text-[10px] font-bold uppercase tracking-wider" style="color: ${c.color}">Calon Nomor ${c.number}</span>
                        <h4 class="font-extrabold text-slate-900 text-sm truncate">${c.name}</h4>
                    </div>
                </div>

                <!-- Perolehan Suara TPS Ini + Input Ketik Langsung di Sampingnya -->
                <div class="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div>
                        <span class="text-[10px] font-semibold text-slate-500 block">Suara ${tpsLabel}</span>
                        <span class="text-3xl font-black leading-none" style="color: ${c.color}">${count.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="flex items-center space-x-1.5">
                        <input type="number" id="saksiDirect_${c.id}" min="0" placeholder="Set total..."
                               onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.setSaksiCandidateDirect(${c.id}); }"
                               class="w-20 text-xs p-2 border border-slate-300 rounded-lg text-center font-bold bg-white focus:ring-1 focus:ring-brand-500 outline-none">
                        <button type="button" onclick="window.setSaksiCandidateDirect(${c.id})" class="px-2.5 py-2 text-white rounded-lg text-xs font-bold transition active:scale-95 shadow-sm" style="background-color: ${c.color}" title="Terapkan Total Suara">
                            <i class="fa-solid fa-check"></i>
                        </button>
                    </div>
                </div>

                <!-- Tombol Tasbih Digital (-1 dan +1 Besar) -->
                <div class="flex gap-2">
                    <button type="button" onclick="window.tapSaksiCandidate(${c.id}, -1)" class="w-1/4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-lg transition border border-slate-200 select-none">
                        -1
                    </button>
                    <button type="button" onclick="window.tapSaksiCandidate(${c.id}, 1)" class="w-3/4 py-3.5 rounded-xl text-white font-black text-base transition active:scale-95 shadow-md flex items-center justify-center space-x-2 select-none" style="background-color: ${c.color}">
                        <span class="bg-white/20 px-2 py-0.5 rounded-md text-xs font-extrabold">NO. ${c.number}</span>
                        <span>+1 SUARA</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
