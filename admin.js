document.addEventListener('DOMContentLoaded', () => {
    // Referensi Elemen Form
    const form = document.getElementById('add-product-form');
    const feedbackDiv = document.getElementById('form-feedback');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const formTitle = document.getElementById('form-title');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const hiddenProductId = document.getElementById('product_id');

    // Referensi Elemen Tabel
    const productTableBody = document.getElementById('product-table-body');
    const productListFeedback = document.getElementById('product-list-feedback');

    // URL API
    const API_GET_ALL = 'api/api.php?action=get_products';
    const API_GET_ONE = 'api/api.php?action=get_product';
    const API_ADD = 'api/api.php?action=add_product';
    const API_UPDATE = 'api/api.php?action=update_product';
    const API_DELETE = 'api/api.php?action=delete_product';
    
    let isEditMode = false;

    // 1. FUNGSI MEMUAT DAN MENAMPILKAN PRODUK
    async function fetchAndDisplayProducts() {
        try {
            const response = await fetch(API_GET_ALL);
            if (!response.ok) throw new Error('Gagal mengambil data produk.');
            
            const products = await response.json();
            
            productTableBody.innerHTML = ''; // Kosongkan tabel
            
            if (products.length === 0) {
                productTableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Belum ada produk.</td></tr>';
                return;
            }

            const CURRENCY_FORMATTER_ADMIN = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

            products.forEach(product => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-white/40';
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">${product.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${product.title.substring(0, 30)}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${CURRENCY_FORMATTER_ADMIN.format(product.price)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="edit-btn text-indigo-600 hover:text-indigo-900 mr-4" data-id="${product.id}">Edit</button>
                        <button class="delete-btn text-red-600 hover:text-red-900" data-id="${product.id}">Hapus</button>
                    </td>
                `;
                productTableBody.appendChild(tr);
            });

        } catch (error) {
            productListFeedback.className = 'text-red-600';
            productListFeedback.textContent = `Error: ${error.message}`;
        }
    }

    // 2. FUNGSI UNTUK RESET FORM
    function resetForm() {
        form.reset();
        hiddenProductId.value = '';
        isEditMode = false;
        
        formTitle.textContent = 'Tambah Produk Baru';
        submitText.textContent = 'Tambah Produk';
        
        cancelEditBtn.classList.add('hidden');
        
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'text-sm';
    }

    // 3. EVENT LISTENER UNTUK SUBMIT FORM (CREATE & UPDATE)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitText.textContent = 'Menyimpan...';
        
        submitSpinner.classList.remove('hidden');
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'text-sm';

        const formData = new FormData(form);
        const productData = Object.fromEntries(formData.entries());
        productData.price = parseFloat(productData.price);

        let apiUrl = isEditMode ? API_UPDATE : API_ADD;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            const result = await response.json();

            if (response.ok) {
                feedbackDiv.textContent = result.success || (isEditMode ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
                feedbackDiv.classList.add('text-green-600');
                
                resetForm();
                fetchAndDisplayProducts(); // Muat ulang daftar produk
                
            } else {
                throw new Error(result.error || 'Terjadi kesalahan.');
            }
        } catch (error) {
            feedbackDiv.textContent = `Error: ${error.message}`;
            feedbackDiv.classList.add('text-red-600');
        } finally {
            submitBtn.disabled = false;
            submitText.textContent = isEditMode ? 'Simpan Perubahan' : 'Tambah Produk';
            submitSpinner.classList.add('hidden');
        }
    });

    // 4. EVENT LISTENER UNTUK TOMBOL DI TABEL (EDIT & DELETE)
    productTableBody.addEventListener('click', (e) => {
        const target = e.target;
        
        // --- Tombol EDIT ---
        if (target.classList.contains('edit-btn')) {
            const id = target.dataset.id;
            
            fetch(`${API_GET_ONE}&id=${id}`)
                .then(res => res.json())
                .then(product => {
                    if (product.error) {
                        throw new Error(product.error);
                    }
                    // Isi form dengan data produk
                    hiddenProductId.value = product.id;
                    document.getElementById('title').value = product.title;
                    document.getElementById('price').value = product.price;
                    document.getElementById('category').value = product.category;
                    document.getElementById('image').value = product.image;
                    document.getElementById('description').value = product.description;

                    // Ubah state ke mode edit
                    isEditMode = true;
                    formTitle.textContent = `Edit Produk (ID: ${product.id})`;
                    submitText.textContent = 'Simpan Perubahan';
                    cancelEditBtn.classList.remove('hidden');
                    
                    form.scrollIntoView({ behavior: 'smooth' });
                })
                .catch(error => {
                     productListFeedback.className = 'text-red-600';
                     productListFeedback.textContent = `Error: ${error.message}`;
                });
        }

        // --- Tombol DELETE ---
        if (target.classList.contains('delete-btn')) {
            const id = target.dataset.id;
            const title = target.closest('tr').children[1].textContent; 
            
            if (confirm(`Apakah Anda yakin ingin menghapus produk "${title}" (ID: ${id})?`)) {
                
                fetch(API_DELETE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: parseInt(id) })
                })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        productListFeedback.className = 'text-green-600';
                        productListFeedback.textContent = result.success;
                        fetchAndDisplayProducts(); // Muat ulang daftar produk
                    } else {
                        throw new Error(result.error || 'Gagal menghapus produk.');
                    }
                })
                .catch(error => {
                     productListFeedback.className = 'text-red-600';
                     productListFeedback.textContent = `Error: ${error.message}`;
                });
            }
        }
    });

    // 5. EVENT LISTENER UNTUK TOMBOL BATAL EDIT
    cancelEditBtn.addEventListener('click', () => {
        resetForm();
    });

    // 6. INISIALISASI: MUAT PRODUK SAAT HALAMAN DIBUKA
    fetchAndDisplayProducts();
});