// ===========================================
// KONFIGURASI
// ===========================================
const SELLER_WHATSAPP_NUMBER = '6281335235999';
const API_URL = 'api/api.php?action=get_products';
const CURRENCY_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

// ===========================================
// STATE APLIKASI
// ===========================================
let allProducts = []; // Menyimpan data master produk dari API
let cart = JSON.parse(localStorage.getItem('cart')) || []; // Menyimpan keranjang

// ===========================================
// ELEMEN DOM
// ===========================================
const productGrid = document.getElementById('product-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const cartEmptyMsg = document.getElementById('cart-empty-msg');

// ===========================================
// FUNGSI UTAMA
// ===========================================

/**
 * 1. Mengambil dan Menampilkan Produk
 */
async function fetchAndDisplayProducts() {
  if (!productGrid || !loadingSpinner) return;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    allProducts = await response.json();
    
    productGrid.innerHTML = ''; // Kosongkan grid
    
    if (allProducts.length === 0) {
      productGrid.innerHTML = `<p class="col-span-full text-center text-gray-600">Tidak ada produk untuk ditampilkan.</p>`;
      return;
    }

    allProducts.forEach(product => {
      // Template card glassmorphism
      const productCardHTML = `
        <div class="product-card flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/30 shadow-lg backdrop-blur-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div class="h-64 w-full overflow-hidden bg-white/50">
            <img src="${product.image}" alt="${product.title}" class="h-full w-full object-contain object-center p-4">
          </div>
          <div class="flex flex-col flex-grow p-5">
            <span class="text-xs font-semibold uppercase tracking-wider text-orange-800">${product.category}</span>
            <h3 class="mt-2 flex-grow text-lg font-bold text-gray-900">${product.title.substring(0, 50)}...</h3>
            <div class="mt-4 flex items-center justify-between">
              <p class="text-2xl font-bold text-gray-800">${CURRENCY_FORMATTER.format(product.price)}</p>
              <button class="add-to-cart-btn rounded-full bg-orange-600 text-white w-10 h-10 flex items-center justify-center transition-all duration-300 hover:bg-orange-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2" 
                      data-product-id="${product.id}" 
                      aria-label="Tambah ${product.title} ke keranjang">
                <i class="fas fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      productGrid.innerHTML += productCardHTML;
    });

  } catch (error) {
    console.error("Gagal mengambil produk:", error);
    productGrid.innerHTML = `<p class="col-span-full text-center text-red-100 bg-red-700/50 p-4 rounded-lg">Gagal memuat produk. Pastikan XAMPP (Apache & MySQL) berjalan dan API lokal benar.</p>`;
  } finally {
    if(loadingSpinner) loadingSpinner.style.display = 'none';
  }
}

/**
 * 2. Menampilkan Keranjang (Modal)
 */
function displayCart() {
  cartItemsContainer.innerHTML = ''; // Kosongkan item
  
  if (cart.length === 0) {
    cartItemsContainer.appendChild(cartEmptyMsg);
    cartEmptyMsg.classList.remove('hidden');
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    cartEmptyMsg.classList.add('hidden');
    cart.forEach(item => {
      const product = allProducts.find(p => p.id === item.id);
      if (!product) return; 

      const itemHTML = `
        <div class="flex items-center space-x-4 mb-4" data-cart-item-id="${item.id}">
          <img src="${product.image}" alt="${product.title}" class="w-16 h-16 object-contain rounded-md bg-white/50 p-1">
          <div class="flex-grow">
            <h4 class="text-sm font-bold text-gray-800">${product.title.substring(0, 25)}...</h4>
            <p class="text-xs text-gray-600">${CURRENCY_FORMATTER.format(product.price)}</p>
          </div>
          <div class="flex items-center space-x-2">
            <button class="cart-quantity-btn bg-gray-200/50 rounded-full w-6 h-6" data-action="decrease" data-id="${item.id}">-</button>
            <span class="font-bold w-5 text-center">${item.quantity}</span>
            <button class="cart-quantity-btn bg-gray-200/50 rounded-full w-6 h-6" data-action="increase" data-id="${item.id}">+</button>
          </div>
          <button class="cart-remove-btn text-red-500 hover:text-red-700" data-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      cartItemsContainer.innerHTML += itemHTML;
    });
    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  
  updateCartInfo();
  cartModal.classList.remove('hidden'); // Tampilkan modal
}

/**
 * 3. Menutup Modal Keranjang
 */
function closeCart() {
  cartModal.classList.add('hidden');
}

/**
 * 4. Logika Keranjang (Tambah, Update, Hapus)
 */
function addToCart(productId) {
  const id = parseInt(productId);
  const existingItem = cart.find(item => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: id, quantity: 1 });
  }
  
  saveCart();
  updateCartInfo();
}

function updateCartQuantity(productId, action) {
  const id = parseInt(productId);
  const item = cart.find(item => item.id === id);

  if (!item) return;

  if (action === 'increase') {
    item.quantity += 1;
  } else if (action === 'decrease') {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      removeFromCart(id); 
      return; 
    }
  }
  
  saveCart();
  displayCart(); 
}

function removeFromCart(productId) {
  const id = parseInt(productId);
  cart = cart.filter(item => item.id !== id);
  
  saveCart();
  displayCart(); 
}

/**
 * 5. Update Info (Total Harga & Ikon Count)
 */
function updateCartInfo() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.classList.toggle('hidden', totalItems === 0);
  
  const totalPrice = cart.reduce((sum, item) => {
    const product = allProducts.find(p => p.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  
  cartTotalPrice.textContent = CURRENCY_FORMATTER.format(totalPrice);
}

/**
 * 6. Simpan Keranjang ke LocalStorage
 */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

/**
 * 7. Checkout via WhatsApp
 */
function checkoutToWhatsApp() {
  if (cart.length === 0) return;

  let message = "Halo, saya ingin memesan barang berikut:\n\n";
  let total = 0;

  cart.forEach(item => {
    const product = allProducts.find(p => p.id === item.id);
    if (product) {
      const subtotal = product.price * item.quantity;
      message += `*${product.title}*\n`;
      message += `Jumlah: ${item.quantity}\n`;
      message += `Harga: ${CURRENCY_FORMATTER.format(product.price)}\n`;
      message += `Subtotal: ${CURRENCY_FORMATTER.format(subtotal)}\n\n`;
      total += subtotal;
    }
  });

  message += `*TOTAL PESANAN: ${CURRENCY_FORMATTER.format(total)}*\n\n`;
  message += "Mohon konfirmasi ketersediaan dan total pembayarannya. Terima kasih.";

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${SELLER_WHATSAPP_NUMBER}?text=${encodedMessage}`;

  window.open(whatsappURL, '_blank');

  cart = [];
  saveCart();
  displayCart(); 
  updateCartInfo(); 
}

// ===========================================
// EVENT LISTENERS
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-grid')) {
    fetchAndDisplayProducts();
  }
  updateCartInfo();
});

document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.add-to-cart-btn');
  if (addBtn) {
    const id = addBtn.dataset.productId;
    addToCart(id);
    addBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      addBtn.innerHTML = '<i class="fas fa-cart-plus"></i>';
    }, 1000);
    return;
  }
});

cartBtn.addEventListener('click', displayCart);
closeCartBtn.addEventListener('click', closeCart);
cartModal.addEventListener('click', (e) => {
  if (e.target === cartModal) {
    closeCart();
  }
});

cartItemsContainer.addEventListener('click', (e) => {
  const quantityBtn = e.target.closest('.cart-quantity-btn');
  if (quantityBtn) {
    const id = quantityBtn.dataset.id;
    const action = quantityBtn.dataset.action;
    updateCartQuantity(id, action);
    return;
  }

  const removeBtn = e.target.closest('.cart-remove-btn');
  if (removeBtn) {
    const id = removeBtn.dataset.id;
    if (confirm('Hapus item ini dari keranjang?')) {
      removeFromCart(id);
    }
    return;
  }
});

checkoutBtn.addEventListener('click', checkoutToWhatsApp);