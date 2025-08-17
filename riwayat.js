let transactions = [];
        let inventory = [];
        
        function loadData() {
            try {
                const savedData = localStorage.getItem('tokoPerananianData');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    transactions = data.transactions || [];
                    inventory = data.inventory || [];
                    console.log('Data loaded:', transactions.length + ' transactions');
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        }
        
        // Format currency
        function formatRupiah(amount) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        }
        
        // Update statistics
        function updateStatistics() {
            const totalTransactions = transactions.length;
            const totalMasuk = transactions.filter(t => t.type === 'masuk').length;
            const totalKeluar = transactions.filter(t => t.type === 'keluar').length;
            
            // Today's transactions
            const today = new Date().toISOString().split('T')[0];
            const todayTransactions = transactions.filter(t => t.date === today).length;
            
            document.getElementById('totalTransactions').textContent = totalTransactions;
            document.getElementById('totalTransactions').setAttribute('data-value', totalTransactions);
            document.getElementById('totalMasuk').textContent = totalMasuk;
            document.getElementById('totalMasuk').setAttribute('data-value', totalMasuk);
            document.getElementById('totalKeluar').textContent = totalKeluar;
            document.getElementById('totalKeluar').setAttribute('data-value', totalKeluar);
            document.getElementById('todayTransactions').textContent = todayTransactions;
            document.getElementById('todayTransactions').setAttribute('data-value', todayTransactions);
        }
        
        // Display transactions
        function displayTransactions(transactionsToShow = transactions) {
            const container = document.getElementById('transactionsContainer');
            
            // Remove loading animation if exists
            const loadingContainer = container.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.remove();
            }
            
            if (transactionsToShow.length === 0) {
                container.innerHTML = `
                    <div class="no-transactions">
                        <i>📦</i>
                        <h3>Tidak ada transaksi</h3>
                        <p>Belum ada transaksi yang sesuai dengan filter</p>
                    </div>
                `;
                return;
            }
            
            // Sort by date (newest first)
            const sortedTransactions = [...transactionsToShow].sort((a, b) => {
                const dateCompare = new Date(b.date) - new Date(a.date);
                if (dateCompare === 0) {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                }
                return dateCompare;
            });
            
            container.innerHTML = sortedTransactions.map(transaction => {
                const date = new Date(transaction.date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                const time = new Date(transaction.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const typeText = transaction.type === 'masuk' ? 'Masuk' : 'Keluar';
                const typeClass = transaction.type;
                
                // Find item details
                const item = inventory.find(i => i.id === transaction.itemId);
                const unitPrice = item ? item.price : 0;
                const totalValue = unitPrice * transaction.quantity;
                
                return `
                    <div class="transaction-item ${typeClass}">
                        <div class="transaction-header">
                            <div class="transaction-title">${typeText}: ${transaction.itemName}</div>
                            <div class="transaction-date">${date} • ${time}</div>
                        </div>
                        <div class="transaction-details">
                            <div><strong>Jumlah:</strong> ${transaction.quantity} ${item ? item.unit : ''}</div>
                            <div><strong>Stok:</strong> ${transaction.oldStock} → ${transaction.newStock}</div>
                            <div><strong>Harga Satuan:</strong> ${formatRupiah(unitPrice)}</div>
                            <div><strong>Total Nilai:</strong> ${formatRupiah(totalValue)}</div>
                        </div>
                        ${transaction.note ? `<div class="transaction-note">📝 ${transaction.note}</div>` : ''}
                    </div>
                `;
            }).join('');
        }
        
        // Filter transactions
        function filterTransactions() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase();
            const filterType = document.getElementById('filterType').value;
            const filterDate = document.getElementById('filterDate').value;
            
            let filtered = transactions;
            
            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(t => 
                    t.itemName.toLowerCase().includes(searchTerm) ||
                    (t.note && t.note.toLowerCase().includes(searchTerm))
                );
            }
            
            // Filter by type
            if (filterType) {
                filtered = filtered.filter(t => t.type === filterType);
            }
            
            // Filter by date
            if (filterDate) {
                filtered = filtered.filter(t => t.date === filterDate);
            }
            
            displayTransactions(filtered);
        }
        
        // Clear filters
        function clearFilters() {
            document.getElementById('searchBox').value = '';
            document.getElementById('filterType').value = '';
            document.getElementById('filterDate').value = '';
            displayTransactions();
        }
        
        // Export transactions
        function exportTransactions() {
            try {
                const exportData = {
                    transactions: transactions,
                    exportDate: new Date().toISOString(),
                    totalTransactions: transactions.length,
                    summary: {
                        totalMasuk: transactions.filter(t => t.type === 'masuk').length,
                        totalKeluar: transactions.filter(t => t.type === 'keluar').length
                    }
                };
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `riwayat-transaksi-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                alert('Riwayat transaksi berhasil diekspor!');
            } catch (error) {
                console.error('Failed to export:', error);
                alert('Gagal mengekspor riwayat transaksi.');
            }
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
            updateStatistics();
            displayTransactions();
        });
        
        // Auto refresh every 5 seconds
        setInterval(function() {
            loadData();
            updateStatistics();
            filterTransactions();
        }, 5000);