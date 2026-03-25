// ==========================================
// DATA STORAGE & DOM ELEMENTS
// ==========================================
// 🧠 CART MEMORY: Now loads from LocalStorage!
let orders = JSON.parse(localStorage.getItem('foodhub_orders')) || [];
let claimedCoupons = JSON.parse(localStorage.getItem('foodhub_wallet')) || {};
let activeDiscount = parseFloat(localStorage.getItem('foodhub_active_discount')) || 0;

const tableBody = document.getElementById('tableBody');
const emptyMessage = document.getElementById('emptyMessage');
const totalOrdersDisplay = document.getElementById('totalOrders');
const totalCostDisplay = document.getElementById('totalCost');

const COUPON_DATA = {
    'lent': { name: 'Mahal na Araw (40% OFF)', value: 40 },
    'student': { name: 'Student Discount (20% OFF)', value: 20 },
    'senior': { name: 'Senior Citizen (20% OFF)', value: 20 },
    'pwd': { name: 'PWD Discount (20% OFF)', value: 20 }
};

// ==========================================
// TOAST NOTIFICATIONS LOGIC
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✅';
    if (type === 'error') icon = '🗑️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    // Remove the toast automatically after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// ADD / DELETE ORDER
// ==========================================
function addOrder(foodName, category, price, quantity, deliveryTime, rating) {
    // 📦 ITEM STACKING: Check if it's already in the cart
    const existingOrder = orders.find(order => order.foodName === foodName);

    if (existingOrder) {
        existingOrder.quantity += parseInt(quantity);
        existingOrder.subtotal = existingOrder.price * existingOrder.quantity;
    } else {
        const order = {
            id: Date.now(),
            foodName,
            category,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            subtotal: parseFloat(price) * parseInt(quantity),
            deliveryTime: parseInt(deliveryTime),
            rating: parseFloat(rating)
        };
        orders.push(order);
    }

    // Save to LocalStorage so the cart doesn't disappear!
    localStorage.setItem('foodhub_orders', JSON.stringify(orders));
    
    renderTable();
    updateStats();
    showToast(`Added ${foodName} to cart!`, 'success');
}

function deleteOrder(orderId) {
    orders = orders.filter(order => order.id !== orderId);
    
    // Update LocalStorage after deleting
    localStorage.setItem('foodhub_orders', JSON.stringify(orders));
    
    renderTable();
    updateStats();
    showToast('Item removed from cart.', 'error');
}

// ==========================================
// UPDATED STATS
// ==========================================
function updateStats() {
    const totalOrders = orders.length; // You could also sum up order.quantity here if you prefer
    const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
    
    const discountAmount = subtotal * (activeDiscount / 100);
    const finalTotal = subtotal - discountAmount;

    if(totalOrdersDisplay) totalOrdersDisplay.textContent = totalOrders;
    
    if(totalCostDisplay) {
        totalCostDisplay.innerHTML = `
            ${activeDiscount > 0 ? `<span style="font-size: 14px; text-decoration: line-through; color: #999; margin-right: 10px;">$${subtotal.toFixed(2)}</span>` : ''}
            $${finalTotal.toFixed(2)}
        `;
    }
}

// ==========================================
// COUPON WALLET LOGIC
// ==========================================
let pendingCouponId = null;
let pendingEventBtn = null;

function claimCoupon(couponId, event) {
    pendingCouponId = couponId;
    pendingEventBtn = event.target;
    
    const coupon = COUPON_DATA[couponId];
    if (!coupon) return;

    document.getElementById('modalCouponTitle').textContent = `Claim ${coupon.name}?`;
    document.getElementById('couponModal').style.display = 'flex';
}

function confirmClaim() {
    if (!pendingCouponId || !pendingEventBtn) return;

    claimedCoupons[pendingCouponId] = true;
    localStorage.setItem('foodhub_wallet', JSON.stringify(claimedCoupons));
    
    pendingEventBtn.innerHTML = '✓ Claimed';
    pendingEventBtn.style.background = '#27AE60';
    pendingEventBtn.style.color = 'white';
    pendingEventBtn.disabled = true;
    
    renderCouponDropdown();
    closeModal();
    
    showToast('Coupon added to your wallet!', 'success');
}

function closeModal() {
    document.getElementById('couponModal').style.display = 'none';
    pendingCouponId = null;
    pendingEventBtn = null;
}

function renderCouponDropdown() {
    const select = document.getElementById('couponSelect');
    const container = document.getElementById('couponContainer');
    if (!select || !container) return;

    select.innerHTML = '<option value="0">No coupon applied</option>';
    let hasCoupons = false;

    for (let id in claimedCoupons) {
        if (claimedCoupons[id] && COUPON_DATA[id]) {
            hasCoupons = true;
            const option = document.createElement('option');
            option.value = COUPON_DATA[id].value;
            option.textContent = COUPON_DATA[id].name;
            if (COUPON_DATA[id].value === activeDiscount) option.selected = true;
            select.appendChild(option);
        }
    }
    container.style.display = hasCoupons ? 'block' : 'none';
}

function applyCoupon(percentageValue) {
    activeDiscount = parseFloat(percentageValue);
    localStorage.setItem('foodhub_active_discount', activeDiscount);
    updateStats();
    
    if (activeDiscount > 0) {
        showToast('Discount applied to cart!', 'info');
    }
}

// ==========================================
// INITIALIZATION & CAROUSEL
// ==========================================
function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = ''; 
    if (orders.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }
    emptyMessage.style.display = 'none';
    orders.forEach(order => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';
        itemDiv.innerHTML = `
            <div class="item-img" style="width: 50px; height: 50px; background: #FFEEE8; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🍱</div>
            <div style="flex: 1;">
                <h4 style="font-size: 14px; margin: 0; color: #2C3E50;">${order.foodName}</h4>
                <p style="font-size: 12px; color: #999; margin: 2px 0;">Qty: ${order.quantity}</p>
                <strong style="color: #FF6B35;">$${order.subtotal.toFixed(2)}</strong>
            </div>
            <button onclick="deleteOrder(${order.id})" style="border: none; background: #FFE0D5; color: #E74C3C; width: 30px; height: 30px; border-radius: 8px; cursor: pointer;">🗑️</button>
        `;
        tableBody.appendChild(itemDiv);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore button states for claimed coupons
    document.querySelectorAll('.claim-btn').forEach(btn => {
        const id = btn.getAttribute('data-id');
        if (claimedCoupons[id]) {
            btn.innerHTML = '✓ Claimed';
            btn.style.background = '#27AE60';
            btn.style.color = 'white';
            btn.disabled = true;
        }
    });

    // Category Filter Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const foodCards = document.querySelectorAll('.food-card');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-filter');
            foodCards.forEach(card => {
                card.style.display = (filterValue === 'all' || card.getAttribute('data-category') === filterValue) ? 'block' : 'none';
            });
        });
    });

    // Initial renders
    renderCouponDropdown();
    renderTable();
    updateStats();
});

// Developers Carousel Logic
let currentSlide = 0;
function moveSlide(direction) {
    const track = document.getElementById('devTrack');
    if (!track) return;
    const cards = document.querySelectorAll('.dev-card');
    currentSlide = (currentSlide + direction + cards.length) % cards.length;
    track.style.transform = `translateX(${currentSlide * -100}%)`;
}

// ==========================================
// CHECKOUT & FORM VALIDATION LOGIC
// ==========================================

function openCheckout() {
    if (orders.length === 0) {
        showToast("Your cart is empty, tol!", "error");
        return;
    }

    const modal = document.getElementById('checkoutModal');
    const tableBody = document.getElementById('checkoutTableBody'); // Target the <tbody>
    
    // Clear previous dynamic table rows
    tableBody.innerHTML = '';

    const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
    const deliveryFee = 2.00;
    const discountAmount = subtotal * (activeDiscount / 100);
    const finalTotal = (subtotal + deliveryFee) - discountAmount;

    // RUBRIC: DYNAMIC TABLE GENERATION
    orders.forEach(item => {
        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid #f9f9f9";
        row.innerHTML = `
            <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #2C3E50;">${item.foodName}</td>
            <td style="padding: 10px 0; font-size: 13px; color: #666;">x${item.quantity}</td>
            <td style="padding: 10px 0; font-size: 13px; font-weight: 600; text-align: right; color: #FF6B35;">$${item.subtotal.toFixed(2)}</td>
        `;
        tableBody.appendChild(row); // Appending dynamic elements
    });

    document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent = `$${finalTotal.toFixed(2)}`;
    
    const discountRow = document.getElementById('summaryDiscountRow');
    if (activeDiscount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('summaryDiscountAmount').textContent = `-$${discountAmount.toFixed(2)}`;
    } else {
        discountRow.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function placeOrder() {
    // RUBRIC: FORM VALIDATION
    const name = document.getElementById('custName').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const phone = document.getElementById('custPhone').value.trim();

    // Check if fields are empty
    if (name === '') {
        showToast("Validation Error: Please enter your name.", "error");
        return; // Stops the function from proceeding
    }
    if (address === '') {
        showToast("Validation Error: Please enter delivery address.", "error");
        return;
    }
    if (phone === '' || phone.length < 10) {
        showToast("Validation Error: Enter a valid phone number.", "error");
        return;
    }

    // If validation passes, process the order
    showToast(`Order placed for ${name}! Preparing your food... 👨‍🍳`, "success");
    
    // Reset Cart
    orders = [];
    localStorage.setItem('foodhub_orders', JSON.stringify(orders)); 
    
    // Update UI
    renderTable();
    updateStats();
    
    // Clear Form Fields
    document.getElementById('custName').value = '';
    document.getElementById('custAddress').value = '';
    document.getElementById('custPhone').value = '';
    
    closeCheckout();
    
    // Reset Discount (Optional)
    activeDiscount = 0;
    localStorage.setItem('foodhub_active_discount', 0);
    renderCouponDropdown();

    // ==========================================
// CHECKOUT & MODAL LOGIC
// ==========================================

function openCheckout() {
    // Check kung may order bago buksan ang modal
    if (orders.length === 0) {
        showToast("Your cart is empty!", "error");
        return;
    }

    const modal = document.getElementById('checkoutModal');
    const tableBody = document.getElementById('checkoutTableBody');
    
    // Linisin ang table
    tableBody.innerHTML = '';
    let subtotal = 0;

    orders.forEach(item => {
        subtotal += item.subtotal;
        const row = `
            <tr>
                <td style="padding: 8px 0;">${item.foodName} (x${item.quantity})</td>
                <td style="text-align: right; padding: 8px 0;">$${item.subtotal.toFixed(2)}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    // Breakdown computation
    const deliveryFee = 2.00;
    const discountAmount = subtotal * (activeDiscount / 100);
    const finalTotal = (subtotal - discountAmount) + deliveryFee;

    // Update Modal UI
    document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
    
    const discountRow = document.getElementById('summaryDiscountRow');
    if (activeDiscount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('summaryDiscountAmount').textContent = `-$${discountAmount.toFixed(2)}`;
    } else {
        discountRow.style.display = 'none';
    }

    document.getElementById('summaryTotal').textContent = `$${finalTotal.toFixed(2)}`;
    modal.style.display = 'flex';
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

// Function para sa Confirm & Place Order button sa loob ng modal
function placeOrder() {
    const name = document.getElementById('custName').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const phone = document.getElementById('custPhone').value.trim();

    if (name === '' || address === '' || phone === '') {
        showToast("Please fill in all delivery details.", "error");
        return;
    }

    showToast(`Order confirmed for ${name}! 🚀`, "success");

    // Reset lahat pagkatapos ng order
    orders = [];
    activeDiscount = 0;
    localStorage.setItem('foodhub_orders', JSON.stringify(orders));
    localStorage.setItem('foodhub_active_discount', 0);
    
    renderTable(); // I-update ang cart view
    updateStats(); // I-update ang total displays
    closeCheckout();
}

}