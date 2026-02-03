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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        currentEmail = session.user.email;
        document.getElementById('user-display').innerText = `User: ${currentEmail}`;
        if(currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            document.getElementById('admin-tools')?.classList.remove('hidden');
        }
        fetchOrders();
    }
}

// --- DATA ACTIONS ---
async function fetchOrders() {
    const { data, error } = await supabase.from('Order-sparepart').select('*').order('created_at', { ascending: false });
    if (!error) {
        localData = data;
        renderTable(data);
    }
}

document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    btn.innerText = "MENGIRIM...";
    btn.disabled = true;

    const payload = {
        'Nama Barang': document.getElementById('nama_barang').value,
        'Spesifikasi': document.getElementById('spesifikasi').value,
        'Quantity Order': parseInt(document.getElementById('qty').value),
        'Satuan': document.getElementById('Satuan').value,
        'Nama Mesin': document.getElementById('nama_mesin').value,
        'Nama Line': document.getElementById('nama_line').value,
        'PIC Order': document.getElementById('pic_order').value,
        'Status': 'Pending'
    };

    const { error } = await supabase.from('Order-sparepart').insert([payload]);
    if (error) alert(error.message);
    else {
        document.getElementById('order-form').reset();
        fetchOrders();
    }
    btn.innerText = "KIRIM PERMINTAAN";
    btn.disabled = false;
});

// --- RENDER TABLE ---
function renderTable(data) {
    const body = document.getElementById('data-body');
    const isAdmin = currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    body.innerHTML = data.map(i => {
        const isDone = i.Status === 'Selesai';
        return `
            <tr class="hover:bg-slate-50 transition-all border-b border-slate-50">
                <td class="px-6 py-5 text-[10px] text-slate-400 font-mono text-center">${new Date(i.created_at).toLocaleDateString('id-ID')}</td>
                <td class="px-6 py-5">
                    <div class="text-slate-800 font-bold text-sm uppercase">${i['Nama Barang']}</div>
                    <div class="text-[10px] text-slate-400 italic">${i.Spesifikasi || '-'}</div>
                </td>
                <td class="px-6 py-5">
                    <div class="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">${i['Nama Line']} | ${i['Nama Mesin']}</div>
                    <div class="text-indigo-600 font-black text-xs uppercase">${i['Quantity Order']} ${i.Satuan || 'PCS'}</div>
                </td>
                <td class="px-6 py-5 text-[10px] text-slate-500 font-mono">
                    PR: ${i.PR || '-'}<br>PO: ${i.PO || '-'}
                </td>
                <td class="px-6 py-5 text-center">
                    <span class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest 
                    ${isDone ? 'bg-emerald-100 text-emerald-700' : i.Status === 'On Process' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}">
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

// --- UTILITIES ---
window.openModal = (id, pr, po, status) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-pr').value = pr;
    document.getElementById('edit-po').value = po;
    document.getElementById('edit-status').value = status;
    document.getElementById('modal-admin').classList.remove('hidden');
};

window.closeModal = () => document.getElementById('modal-admin').classList.add('hidden');

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
    }
};

window.logout = async () => { await supabase.auth.signOut(); window.location.href = 'login.html'; };

window.exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(localData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Sparepart_Report.xlsx");
};

// --- SEARCH & SORT ---
document.getElementById('search-input').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = localData.filter(i => 
        i['Nama Barang'].toLowerCase().includes(val) || 
        i['Nama Mesin'].toLowerCase().includes(val) ||
        i.Status.toLowerCase().includes(val)
    );
    renderTable(filtered);
});

checkSession();
