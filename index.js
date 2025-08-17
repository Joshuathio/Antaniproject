// Global Variables
let inventory = [];
let transactions = [];
let warehouses = [];

// =====================================
// DATA MANAGEMENT FUNCTIONS
// =====================================

// Fungsi untuk menyimpan data ke localStorage
function saveData() {
    try {
        const data = {
            inventory: inventory,
            transactions: transactions,
            warehouses: warehouses,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('tokoPerananianData', JSON.stringify(data));
        console.log('Data berhasil disimpan');
    } catch (error) {
        console.error('Gagal menyimpan data:', error);
        alert('Gagal menyimpan data. Pastikan browser mendukung penyimpanan lokal.');
    }
}

// Fungsi untuk memuat data dari localStorage
function loadData() {
    try {
        const savedData = localStorage.getItem('tokoPerananianData');
        if (savedData) {
            const data = JSON.parse(savedData);
            inventory = data.inventory || [];
            transactions = data.transactions || [];
            warehouses = data.warehouses || [];
            
            // Check if we need to update units to Mililiter (one-time update)
    
            
            console.log('Data berhasil dimuat:', inventory.length + ' item, ' + 
                       transactions.length + ' transaksi, ' + warehouses.length + ' gudang');
            return true;
        }
    } catch (error) {
        console.error('Gagal memuat data:', error);
        alert('Gagal memuat data tersimpan. Memulai dengan data kosong.');
    }
    return false;
}

// Fungsi untuk ekspor data ke file JSON
function exportData() {
    try {
        const dataStr = JSON.stringify({
            inventory: inventory,
            transactions: transactions,
            warehouses: warehouses,
            exportDate: new Date().toISOString(),
            totalItems: inventory.length,
            totalTransactions: transactions.length,
            totalWarehouses: warehouses.length
        }, null, 2);
        
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `stok-toko-pertanian-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Data berhasil diekspor!');
    } catch (error) {
        console.error('Gagal mengekspor data:', error);
        alert('Gagal mengekspor data.');
    }
}

// Fungsi untuk impor data dari file JSON
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.inventory && Array.isArray(data.inventory)) {
                const itemCount = data.inventory.length;
                const transactionCount = data.transactions ? data.transactions.length : 0;
                const warehouseCount = data.warehouses ? data.warehouses.length : 0;
                
                if (confirm(`Impor ${itemCount} item, ${transactionCount} transaksi, dan ${warehouseCount} gudang? Data saat ini akan ditimpa.`)) {
                    inventory = data.inventory;
                    transactions = data.transactions || [];
                    warehouses = data.warehouses || [];
                    saveData();
                    updateDisplay();
                    alert('Data berhasil diimpor!');
                }
            } else {
                alert('Format file tidak valid.');
            }
        } catch (error) {
            console.error('Gagal mengimpor data:', error);
            alert('Gagal membaca file. Pastikan file adalah JSON yang valid.');
        }
    };
    reader.readAsText(file);
}

// Fungsi untuk hapus semua data
function clearAllData() {
    if (confirm('PERINGATAN: Semua data akan dihapus permanen! Yakin ingin melanjutkan?')) {
        if (confirm('Konfirmasi sekali lagi: Hapus SEMUA data stok, transaksi, dan gudang?')) {
            inventory = [];
            transactions = [];
            warehouses = [];
            localStorage.removeItem('tokoPerananianData');
            localStorage.removeItem('unitUpdateToMililiter'); // Clear update flag
            updateDisplay();
            alert('Semua data berhasil dihapus!');
        }
    }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

// Fungsi untuk format rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Fungsi clear forms
function clearWarehouseForm() {
    document.getElementById('warehouseName').value = '';
    document.getElementById('warehouseLocation').value = '';
    document.getElementById('warehouseCapacity').value = '';
}

function clearForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemUnit').selectedIndex = 0; // Reset to first option
    document.getElementById('itemStock').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('minStock').value = '';
    document.getElementById('itemWarehouse').value = '';
}

function clearTransactionForm() {
    document.getElementById('updateQuantity').value = '';
    document.getElementById('transactionNote').value = '';
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
}

function clearMoveForm() {
    document.getElementById('moveItemSelect').value = '';
    document.getElementById('moveToWarehouse').value = '';
    document.getElementById('moveQuantity').value = '';
}

// =====================================
// WAREHOUSE MANAGEMENT FUNCTIONS
// =====================================

// Fungsi tambah gudang
function addWarehouse() {
    const name = document.getElementById('warehouseName').value;
    const location = document.getElementById('warehouseLocation').value;
    const capacity = parseInt(document.getElementById('warehouseCapacity').value) || 0;

    if (!name || !location) {
        alert('Nama gudang dan lokasi harus diisi!');
        return;
    }

    const warehouse = {
        id: Date.now(),
        name: name,
        location: location,
        capacity: capacity,
        createdDate: new Date().toISOString()
    };

    warehouses.push(warehouse);
    saveData();
    updateDisplay();
    clearWarehouseForm();
    alert('Gudang berhasil ditambahkan!');
}

// Fungsi hapus gudang
function deleteWarehouse(id) {
    // Cek apakah ada barang di gudang ini
    const itemsInWarehouse = inventory.filter(item => item.warehouseId === id);
    
    if (itemsInWarehouse.length > 0) {
        alert('Tidak dapat menghapus gudang karena masih ada barang di dalamnya!');
        return;
    }
    
    if (confirm('Yakin ingin menghapus gudang ini?')) {
        warehouses = warehouses.filter(warehouse => warehouse.id !== id);
        saveData();
        updateDisplay();
        alert('Gudang berhasil dihapus!');
    }
}

// =====================================
// INVENTORY MANAGEMENT FUNCTIONS
// =====================================

// Fungsi tambah barang
function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const unit = document.getElementById('itemUnit').value;
    const stock = parseInt(document.getElementById('itemStock').value) || 0;
    const price = parseInt(document.getElementById('itemPrice').value) || 0;
    const minStock = parseInt(document.getElementById('minStock').value) || 10;
    const warehouseId = document.getElementById('itemWarehouse').value;

    if (!name || !unit || !warehouseId) {
        alert('Nama barang, satuan, dan gudang harus diisi!');
        return;
    }

    // Cek apakah barang dengan nama yang sama sudah ada di gudang yang sama (case insensitive)
    const existingItem = inventory.find(item => 
        item.name.toLowerCase() === name.toLowerCase() && 
        item.warehouseId == warehouseId
    );
    
    if (existingItem) {
        alert(`Barang "${name}" sudah ada di gudang ini! Gunakan fitur update stok untuk menambah stok.`);
        return;
    }

    const warehouse = warehouses.find(w => w.id == warehouseId);
    const item = {
        id: Date.now(),
        name: name,
        unit: unit,
        stock: stock,
        price: price,
        minStock: minStock,
        warehouseId: parseInt(warehouseId),
        warehouseName: warehouse.name,
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    inventory.push(item);
    saveData();
    updateDisplay();
    clearForm();
    alert('Barang berhasil ditambahkan!');
}

// Fungsi update stok
function updateStock() {
    const itemId = document.getElementById('updateItemSelect').value;
    const type = document.getElementById('transactionType').value;
    const quantity = parseInt(document.getElementById('updateQuantity').value) || 0;
    const transactionDate = document.getElementById('transactionDate').value;
    const note = document.getElementById('transactionNote').value;

    if (!itemId || quantity <= 0) {
        alert('Pilih barang dan masukkan jumlah yang valid!');
        return;
    }

    if (!transactionDate) {
        alert('Tanggal transaksi harus diisi!');
        return;
    }

    const item = inventory.find(item => item.id == itemId);
    if (item) {
        const oldStock = item.stock;
        
        if (type === 'masuk') {
            item.stock += quantity;
        } else {
            if (item.stock >= quantity) {
                item.stock -= quantity;
            } else {
                alert('Stok tidak mencukupi!');
                return;
            }
        }
        
        item.lastUpdated = transactionDate;
        
        // Catat transaksi
        const transaction = {
            id: Date.now(),
            itemId: item.id,
            itemName: item.name,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName,
            type: type,
            quantity: quantity,
            date: transactionDate,
            note: note || '',
            oldStock: oldStock,
            newStock: item.stock,
            unit: item.unit,
            timestamp: new Date().toISOString()
        };
        
        transactions.push(transaction);
        
        saveData();
        updateDisplay();
        clearTransactionForm();
        alert(`Stok berhasil diupdate!\n${item.name}: ${oldStock} → ${item.stock} ${item.unit}`);
    }
}

// Fungsi pindah gudang
function moveToWarehouse() {
    const itemId = document.getElementById('moveItemSelect').value;
    const newWarehouseId = document.getElementById('moveToWarehouse').value;
    const quantity = parseInt(document.getElementById('moveQuantity').value) || 0;

    if (!itemId || !newWarehouseId || quantity <= 0) {
        alert('Pilih barang, gudang tujuan, dan masukkan jumlah yang valid!');
        return;
    }

    const item = inventory.find(item => item.id == itemId);
    const newWarehouse = warehouses.find(w => w.id == newWarehouseId);

    if (!item || !newWarehouse) {
        alert('Barang atau gudang tidak ditemukan!');
        return;
    }

    if (item.warehouseId == newWarehouseId) {
        alert('Barang sudah berada di gudang tersebut!');
        return;
    }

    if (quantity > item.stock) {
        alert('Jumlah yang dipindah melebihi stok yang tersedia!');
        return;
    }

    const oldWarehouseName = item.warehouseName;

    // Cari apakah barang dengan nama yang sama sudah ada di gudang tujuan (case insensitive)
    const existingItem = inventory.find(i => 
        i.name.toLowerCase() === item.name.toLowerCase() && 
        i.warehouseId == newWarehouseId
    );

    if (existingItem) {
        // Jika sudah ada, tambahkan stoknya
        existingItem.stock += quantity;
        existingItem.lastUpdated = new Date().toISOString().split('T')[0];
        
        // Kurangi stok di gudang asal
        item.stock -= quantity;
        
        // Jika stok di gudang asal habis, hapus item
        if (item.stock === 0) {
            inventory = inventory.filter(i => i.id !== item.id);
        }
    } else {
        // Jika memindahkan semua stok
        if (quantity === item.stock) {
            item.warehouseId = parseInt(newWarehouseId);
            item.warehouseName = newWarehouse.name;
        } else {
            // Buat item baru di gudang tujuan
            const newItem = {
                ...item,
                id: Date.now(),
                stock: quantity,
                warehouseId: parseInt(newWarehouseId),
                warehouseName: newWarehouse.name
            };
            inventory.push(newItem);
            
            // Kurangi stok di gudang asal
            item.stock -= quantity;
        }
    }

    // Catat transaksi pindah gudang
    const transaction = {
        id: Date.now(),
        itemId: item.id,
        itemName: item.name,
        type: 'pindah',
        quantity: quantity,
        fromWarehouse: oldWarehouseName,
        toWarehouse: newWarehouse.name,
        date: new Date().toISOString().split('T')[0],
        note: `Pindah dari ${oldWarehouseName} ke ${newWarehouse.name}`,
        timestamp: new Date().toISOString()
    };

    transactions.push(transaction);
    
    saveData();
    updateDisplay();
    clearMoveForm();
    alert(`${quantity} ${item.unit} ${item.name} berhasil dipindah dari ${oldWarehouseName} ke ${newWarehouse.name}!`);
}

// Fungsi hapus barang
function deleteItem(id) {
    if (confirm('Yakin ingin menghapus barang ini?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveData();
        updateDisplay();
        alert('Barang berhasil dihapus!');
    }
}

// =====================================
// EDIT ITEM FUNCTIONS
// =====================================

// Fungsi buka modal edit
function editItem(id) {
    const item = inventory.find(item => item.id === id);
    if (!item) return;
    
    document.getElementById('editItemId').value = id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemUnit').value = item.unit;
    document.getElementById('editItemPrice').value = item.price;
    document.getElementById('editMinStock').value = item.minStock;
    
    document.getElementById('editModal').style.display = 'block';
}

// Fungsi tutup modal edit
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Fungsi simpan perubahan edit
function saveEditItem() {
    const id = parseInt(document.getElementById('editItemId').value);
    const newName = document.getElementById('editItemName').value.trim();
    const newUnit = document.getElementById('editItemUnit').value;
    const newPrice = parseInt(document.getElementById('editItemPrice').value) || 0;
    const newMinStock = parseInt(document.getElementById('editMinStock').value) || 10;
    
    if (!newName || !newUnit) {
        alert('Nama barang dan satuan harus diisi!');
        return;
    }
    
    const item = inventory.find(item => item.id === id);
    if (!item) return;
    
    // Cek apakah nama baru sudah ada di gudang yang sama (kecuali item yang sedang diedit)
    const duplicateItem = inventory.find(i => 
        i.id !== id &&
        i.name.toLowerCase() === newName.toLowerCase() && 
        i.warehouseId === item.warehouseId
    );
    
    if (duplicateItem) {
        alert(`Barang dengan nama "${newName}" sudah ada di gudang ini!`);
        return;
    }
    
    // Update item
    item.name = newName;
    item.unit = newUnit;
    item.price = newPrice;
    item.minStock = newMinStock;
    item.lastUpdated = new Date().toISOString().split('T')[0];
    
    saveData();
    updateDisplay();
    closeEditModal();
    alert('Barang berhasil diperbarui!');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}

// =====================================
// DISPLAY UPDATE FUNCTIONS
// =====================================

// Fungsi update tampilan
function updateDisplay() {
    updateSummaryCards();
    updateWarehouseList();
    updateWarehouseSelects();
    updateStockTable();
    updateItemSelects();
    updateMoveItemSelect();
}

// Update summary cards
function updateSummaryCards() {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.stock <= item.minStock).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);
    const totalWarehouses = warehouses.length;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('totalValue').textContent = formatRupiah(totalValue);
    document.getElementById('totalWarehouses').textContent = totalWarehouses;
}

// Update warehouse list
function updateWarehouseList() {
    const warehouseList = document.getElementById('warehouseList');
    
    if (warehouses.length === 0) {
        warehouseList.innerHTML = '<p class="no-data">Belum ada gudang. Silakan tambah gudang terlebih dahulu.</p>';
        return;
    }

    warehouseList.innerHTML = warehouses.map(warehouse => {
        const itemCount = inventory.filter(item => item.warehouseId === warehouse.id).length;
        const totalValue = inventory
            .filter(item => item.warehouseId === warehouse.id)
            .reduce((sum, item) => sum + (item.stock * item.price), 0);
        
        return `
            <div class="warehouse-item">
                <div class="warehouse-info">
                    <h4>🏭 ${warehouse.name}</h4>
                    <p>📍 ${warehouse.location}</p>
                    <p>📦 ${itemCount} jenis barang | 💰 ${formatRupiah(totalValue)}</p>
                    <p>📐 Kapasitas: ${warehouse.capacity} m²</p>
                </div>
                <button class="btn btn-danger btn-sm" onclick="deleteWarehouse(${warehouse.id})">🗑️ Hapus</button>
            </div>
        `;
    }).join('');
}

// Update warehouse selects
function updateWarehouseSelects() {
    const selects = ['itemWarehouse', 'moveToWarehouse', 'filterWarehouse'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = selectId === 'filterWarehouse' ? 
            '<option value="">Semua Gudang</option>' : 
            '<option value="">-- Pilih Gudang --</option>';
        
        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = warehouse.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

// Update tabel stok
function updateStockTable() {
    const tbody = document.getElementById('stockTableBody');
    const filterWarehouseId = document.getElementById('filterWarehouse').value;
    
    let filteredInventory = inventory;
    if (filterWarehouseId) {
        filteredInventory = inventory.filter(item => item.warehouseId == filterWarehouseId);
    }
    
    // Sort berdasarkan nama barang (A-Z)
    filteredInventory.sort((a, b) => a.name.localeCompare(b.name));
    
    tbody.innerHTML = '';

    filteredInventory.forEach(item => {
        const row = document.createElement('tr');
        const isLowStock = item.stock <= item.minStock;
        const status = isLowStock ? 'Stok Menipis' : 'Stok Aman';
        const statusClass = isLowStock ? 'stock-low' : 'stock-good';
        
        const lastUpdate = item.lastUpdated ? 
            new Date(item.lastUpdated).toLocaleDateString('id-ID') : 
            'Belum ada update';

        row.innerHTML = `
            <td title="${item.name}">${item.name}</td>
            <td title="${item.warehouseName}">🏭 ${item.warehouseName}</td>
            <td>${item.stock}</td>
            <td>${item.unit}</td>
            <td title="${formatRupiah(item.price)}">${formatRupiah(item.price)}</td>
            <td title="${formatRupiah(item.stock * item.price)}">${formatRupiah(item.stock * item.price)}</td>
            <td title="${lastUpdate}">${lastUpdate}</td>
            <td class="${statusClass}" title="${status}">${status}</td>
            <td class="stock-actions">
                <button class="btn btn-info btn-sm" onclick="editItem(${item.id})" title="Edit">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})" title="Hapus">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update item selects (untuk update stok)
function updateItemSelects() {
    const select = document.getElementById('updateItemSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Pilih Barang --</option>';

    // Sort inventory berdasarkan nama barang (A-Z)
    const sortedInventory = [...inventory].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedInventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (${item.stock} ${item.unit}) - ${item.warehouseName}`;
        select.appendChild(option);
    });
}

// Update dropdown pilihan barang untuk pindah gudang
function updateMoveItemSelect() {
    const select = document.getElementById('moveItemSelect');
    const moveToWarehouseSelect = document.getElementById('moveToWarehouse');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Pilih Barang --</option>';
    
    // Group items by name untuk memudahkan identifikasi barang yang sama
    const itemGroups = {};
    inventory.forEach(item => {
        const key = item.name.toLowerCase();
        if (!itemGroups[key]) {
            itemGroups[key] = [];
        }
        itemGroups[key].push(item);
    });
    
    // Sort dan tampilkan items
    const sortedInventory = [...inventory].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedInventory.forEach(item => {
        if (item.stock > 0) { // Hanya tampilkan yang ada stoknya
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.stock} ${item.unit}) - ${item.warehouseName}`;
            select.appendChild(option);
        }
    });
    
    // Update warehouse select saat item dipilih
    select.onchange = function() {
        if (!this.value) return;
        
        const selectedItem = inventory.find(item => item.id == this.value);
        if (!selectedItem) return;
        
        // Update move to warehouse options
        moveToWarehouseSelect.innerHTML = '<option value="">-- Pilih Gudang Tujuan --</option>';
        
        warehouses.forEach(warehouse => {
            if (warehouse.id != selectedItem.warehouseId) { // Exclude current warehouse
                const option = document.createElement('option');
                option.value = warehouse.id;
                
                // Check if same item exists in target warehouse
                const existingInTarget = inventory.find(i => 
                    i.name.toLowerCase() === selectedItem.name.toLowerCase() && 
                    i.warehouseId == warehouse.id
                );
                
                if (existingInTarget) {
                    option.textContent = `${warehouse.name} (Ada ${existingInTarget.stock} ${existingInTarget.unit})`;
                } else {
                    option.textContent = warehouse.name;
                }
                
                moveToWarehouseSelect.appendChild(option);
            }
        });
    };
}

// =====================================
// SEARCH AND FILTER FUNCTIONS
// =====================================

// Fungsi pencarian
function searchItems() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const rows = document.querySelectorAll('#stockTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Filter by warehouse
function filterByWarehouse() {
    updateStockTable();
    searchItems(); // Apply search filter after warehouse filter
}

// =====================================
// INITIALIZATION FUNCTIONS
// =====================================

// Inisialisasi aplikasi
function initApp() {
    console.log('Memulai aplikasi...');
    
    // Load data
    if (loadData()) {
        console.log('Data berhasil dimuat dari penyimpanan');
    } else {
        console.log('Memulai dengan data kosong');
        
        // Tambah gudang default jika belum ada
        if (warehouses.length === 0) {
            warehouses.push({
                id: Date.now(),
                name: 'Gudang Utama',
                location: 'Lokasi Default',
                capacity: 100,
                createdDate: new Date().toISOString()
            });
            saveData();
        }
    }
    
    // Set tanggal hari ini sebagai default
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    updateDisplay();
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Auto-save setiap 30 detik
setInterval(function() {
    if (inventory.length > 0 || transactions.length > 0 || warehouses.length > 0) {
        saveData();
        console.log('Auto-save completed');
    }
}, 30000);