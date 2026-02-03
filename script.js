import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://synhvvaolrjxdcbyozld.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bmh2dmFvbHJqeGRjYnlvemxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Njg4NzEsImV4cCI6MjA4NTU0NDg3MX0.GSEfz8HVd49uEWXd70taR6FUv243VrFJKn6KlsZW-aQ'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ADMIN_EMAIL = "admin@order-sparepart.com"; 
let currentEmail = "";
let localData = [];

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    
    currentEmail = session.user.email;
    document.getElementById('user-display').innerText = `User: ${currentEmail}`;
    
    const isAdmin = currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isAdmin) {
        document.getElementById('admin-tools')?.classList.remove('hidden');
        document.getElementById('form-container')?.classList.add('hidden');
    }
    fetchOrders();
}

async function fetchOrders() {
    const { data, error } = await supabase.from('Order-sparepart').select('*').order('created_at', { ascending: false });
    if (!error) { localData = data; renderTable(data); }
}

const orderForm = document.getElementById('order-form');
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit');
        btn.innerText = "MENGIRIM..."; btn.disabled = true;

        const payload = {
            'Nama Barang': document.getElementById('nama_barang').value,
            'Spesifikasi': document.getElementById('spesifikasi').value,
            'Quantity Order': parseInt(document.getElementById('qty').value),
            'Satuan': document.getElementById('satuan').value,
            'Nama Mesin': document.getElementById('nama_mesin').value,
            'Nama Line': document.getElementById('nama_line').value,
            'PIC Order': document.getElementById('pic_order').value,
            'Status': 'Pending'
        };

        const { error } = await supabase.from('Order-sparepart').insert([payload]);
        if (error) alert(error.message); else { orderForm.reset(); fetchOrders(); }
        btn.innerText = "KIRIM PERMINTAAN"; btn.disabled = false;
    });
}

function renderTable(data) {
    const body = document.getElementById('data-body');
    if (!body) return;
    const isAdmin = currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    body.innerHTML = data.map(i => {
        const isDone = i.Status === 'Selesai';
        const isProcess = i.Status === 'On Process';
        
        // Memastikan 8 cell (<td>) sama dengan header
        return `
            <tr class="hover:bg-slate-50 transition-all border-b border-slate-50">
                <td class="px-6 py-5 text-[10px] text-slate-400 font-mono text-center">${new Date(i.created_at).toLocaleDateString('id-ID')}</td>
                <td class="px-6 py-5">
                    <div class="text-slate-800 font-bold text-sm uppercase">${i['Nama Barang']}</div>
                    <div class="text-[10px] text-slate-400 italic">${i.Spesifikasi || '-'}</div>
                </td>
                <td class="px-6 py-5 text-center font-black text-indigo-600 text-sm">${i['Quantity Order']}</td>
                <td class="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">${i.Satuan || 'PCS'}</td>
                <td class="px-6 py-5">
                    <div class="text-[10px] text-slate-500 font-bold uppercase">${i['Nama Line']}</div>
                    <div class="text-[9px] text-slate-400 italic uppercase">${i['Nama Mesin']}</div>
                </td>
                <td class="px-6 py-5 text-[10px] text-slate-500 font-mono">PR: ${i.PR || '-'}<br>PO: ${i.PO || '-'}</td>
                <td class="px-6 py-5 text-center">
                    <span class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest 
                    ${isDone ? 'bg-emerald-100 text-emerald-700' : isProcess ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}">
                        ${i.Status || 'Pending'}
                    </span>
                </td>
                <td class="px-6 py-5 text-center">
                    ${isAdmin ? `<button onclick="window.openModal('${i.id}','${i.PR || ''}','${i.PO || ''}','${i.Status}')" class="text-indigo-600 hover:scale-110 transition-transform font-black text-[10px] uppercase">Edit</button>` : '<span class="text-[8px] text-slate-300">No Access</span>'}
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
    if (!error) { window.closeModal(); fetchOrders(); }
};
window.logout = async () => { await supabase.auth.signOut(); window.location.href = 'login.html'; };
window.exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(localData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Sparepart_Report.xlsx");
};
document.getElementById('search-input')?.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = localData.filter(i => (i['Nama Barang']?.toLowerCase().includes(val)) || (i['Nama Mesin']?.toLowerCase().includes(val)) || (i.Status?.toLowerCase().includes(val)));
    renderTable(filtered);
});

checkSession();
