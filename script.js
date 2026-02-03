import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// --- KONFIGURASI SUPABASE ---
const SUPABASE_URL = 'https://synhvvaolrjxdcbyozld.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bmh2dmFvbHJqeGRjYnlvemxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Njg4NzEsImV4cCI6MjA4NTU0NDg3MX0.GSEfz8HVd49uEWXd70taR6FUv243VrFJKn6KlsZW-aQ'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ADMIN_EMAIL = "admin@order-sparepart.com"; 
let currentEmail = "";
let localData = [];

// --- SESSION CHECK ---
async function checkSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
        } else {
            currentEmail = session.user.email;
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) userDisplay.innerText = `User: ${currentEmail}`;
            
            if (currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                document.getElementById('admin-tools')?.classList.remove('hidden');
            }
            fetchOrders();
        }
    } catch (err) {
        console.error("Session error:", err);
    }
}

// --- DATA ACTIONS ---
async function fetchOrders() {
    const { data, error } = await supabase
        .from('Order-sparepart')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (!error) {
        localData = data;
        renderTable(data);
    }
}

// --- EVENT SUBMIT (FORM) ---
const orderForm = document.getElementById('order-form');
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit');
        
        // Ambil elemen dengan ID huruf kecil (standar HTML)
        const elNama = document.getElementById('nama_barang');
        const elSpec = document.getElementById('spesifikasi');
        const elQty = document.getElementById('qty');
        const elSatuan = document.getElementById('satuan'); // Pastikan di HTML id="satuan"
        const elMesin = document.getElementById('nama_mesin');
        const elLine = document.getElementById('nama_line');
        const elPic = document.getElementById('pic_order');

        // Validasi Null: Mencegah error "properties of null (reading value)"
        if (!elNama || !elQty || !elSatuan) {
            alert("Error: Elemen form tidak ditemukan. Periksa ID 'nama_barang', 'qty', dan 'satuan' di HTML Anda.");
            return;
        }

        btn.innerText = "MENGIRIM...";
        btn.disabled = true;

        const payload = {
            'Nama Barang': elNama.value,
            'Spesifikasi': elSpec ? elSpec.value : '',
            'Quantity Order': parseInt(elQty.value),
            'Satuan': elSatuan.value, // Mengirim ke kolom "Satuan" di Supabase
            'Nama Mesin': elMesin ? elMesin.value : '',
            'Nama Line': elLine ? elLine.value : '',
            'PIC Order': elPic ? elPic.value : '',
            'Status': 'Pending'
        };

        const { error } = await supabase.from('Order-sparepart').insert([payload]);
        
        if (error) {
            alert("Error: " + error.message);
        } else {
            orderForm.reset();
            fetchOrders();
            alert("Berhasil mengirim permintaan!");
        }
        
        btn.innerText = "KIRIM PERMINTAAN";
        btn.disabled = false;
    });
}

// --- RENDER TABLE ---
function renderTable(data) {
    const body = document.getElementById('data-body');
    if (!body) return;

    const isAdmin = currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    body.innerHTML = data.map(i => {
        const isDone = i.Status === 'Selesai';
        const isProcess = i.Status === 'On Process';
        
        return `
            <tr class="hover:bg-slate-50 transition-all border-b border-slate-50">
                <td class="px-6 py-5 text-[10px] text-slate-400 font-mono text-center">
                    ${new Date(i.created_at).toLocaleDateString('id-ID')}
                </td>
                <td class="px-6 py-5">
                    <div class="text-slate-800 font-bold text-sm uppercase">${i['Nama Barang']}</div>
                    <div class="text-[10px] text-slate-400 italic">${i.Spesifikasi || '-'}</div>
                </td>
                <td class="px-6 py-5 text-center">
                    <div class="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        ${i['Nama Line']} | ${i['Nama Mesin']}
                    </div>
                    <div class="text-indigo-600 font-black text-xs uppercase">
                        ${i['Quantity Order']} ${i.Satuan || 'PCS'}
                    </div>
                </td>
                <td class="px-6 py-5 text-[10px] text-slate-500 font-mono">
                    PR: ${i.PR || '-'}<br>PO: ${i.PO || '-'}
                </td>
                <td class="px-6 py-5 text-center">
                    <span class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest 
                    ${isDone ? 'bg-emerald-100 text-emerald-700' : isProcess ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}">
                        ${i.Status || 'Pending'}
                    </span>
                </td>
                <td class="px-6 py-5 text-center">
                    ${isAdmin ? `
                        <button onclick="window.openModal('${i.id}','${i.PR || ''}','${i.PO || ''}','${i.Status}')" 
                        class="text-indigo-600 hover:scale-110 transition-transform font-bold text-xs uppercase">Edit</button>
                    ` : '<span class="text-[8px] text-slate-300">No Access</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

// --- UTILITIES (Global Scope) ---
window.openModal = (id, pr, po, status) => {
    const elId = document.getElementById('edit-id');
    const elPr = document.getElementById('edit-pr');
    const elPo = document.getElementById('edit-po');
    const elStatus = document.getElementById('edit-status');
    
    if(elId) elId.value = id;
    if(elPr) elPr.value = pr;
    if(elPo) elPo.value = po;
    if(elStatus) elStatus.value = status;
    
    document.getElementById('modal-admin')?.classList.remove('hidden');
};

window.closeModal = () => document.getElementById('modal-admin')?.classList.add('hidden');

window.saveAdminUpdate = async () => {
    const id = document.getElementById('edit-id').value;
    const { error } = await supabase.from('Order-sparepart').update({
        'PR': document.getElementById('edit-pr').value,
        'PO': document.getElementById('edit-po').value,
        'Status': document.getElementById('edit-status').value
    }).eq('id', id);

    if (!error) {
        window.closeModal();
        fetchOrders();
    } else {
        alert("Gagal update: " + error.message);
    }
};

window.logout = async () => { 
    await supabase.auth.signOut(); 
    window.location.href = 'login.html'; 
};

window.exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(localData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Sparepart_Report.xlsx");
};

// --- SEARCH ---
document.getElementById('search-input')?.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = localData.filter(i => 
        (i['Nama Barang'] && i['Nama Barang'].toLowerCase().includes(val)) || 
        (i['Nama Mesin'] && i['Nama Mesin'].toLowerCase().includes(val)) ||
        (i.Status && i.Status.toLowerCase().includes(val))
    );
    renderTable(filtered);
});

// Mulai Aplikasi
checkSession();
