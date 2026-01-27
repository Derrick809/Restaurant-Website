// Admin Dashboard JavaScript

let adminMenuItems = [];
let adminOrders = [];
let adminReservations = [];
let adminSettings = {};
let editingItemId = null;

// Days of week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (typeof allMenuItems !== 'undefined') {
    adminMenuItems = [...allMenuItems];
  }

  loadOrders();
  loadReservations();
  loadSettings();

  updateDashboardStats();
  renderFoodsList('all');
  setupSidebarNavigation();
  setupFormHandlers();
  setupFilters();
  setupSearch();
  setupSettingsUI();
  setupClearHistoryButton();

  setInterval(() => {
    loadOrders();
    loadReservations();
    updateDashboardStats();
    renderTodayOrders();
    renderAlerts();
  }, 2000);
});

function setupSidebarNavigation() {
  const sidebarLinks = document.querySelectorAll('.admin-sidebar .nav-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.admin-content');
  sections.forEach(section => section.classList.remove('active'));
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    
    if (sectionId === 'dashboard') {
      updateDashboardStats();
      renderTodayOrders();
      renderPopularItems();
      renderAlerts();
    } else if (sectionId === 'orders') {
      renderOrdersTable();
    } else if (sectionId === 'reservations') {
      renderReservationsTable();
    }
  }
}

function updateDashboardStats() {
  const today = new Date().toDateString();
  
  // Today's stats
  const todayOrders = adminOrders.filter(o => new Date(o.date).toDateString() === today);
  const todayReservations = adminReservations.filter(r => new Date(r.dateTime).toDateString() === today);
  
  // Sales calculations
  const dailySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const weeklySales = getWeeklySales();
  const monthlySales = getMonthlySales();

  document.getElementById('todayOrdersCount').textContent = todayOrders.length;
  document.getElementById('todayReservationsCount').textContent = todayReservations.length;
  document.getElementById('totalDailySales').textContent = '₵' + dailySales.toFixed(2);
  document.getElementById('totalWeeklySales').textContent = '₵' + weeklySales.toFixed(2);
  document.getElementById('totalMonthlySales').textContent = '₵' + monthlySales.toFixed(2);
  document.getElementById('totalFoodsCount').textContent = adminMenuItems.length;
}

function getWeeklySales() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return adminOrders
    .filter(o => new Date(o.date) >= weekAgo)
    .reduce((sum, o) => sum + o.total, 0);
}

function getMonthlySales() {
  const today = new Date();
  const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
  return adminOrders
    .filter(o => new Date(o.date) >= monthAgo)
    .reduce((sum, o) => sum + o.total, 0);
}

function renderTodayOrders() {
  const today = new Date().toDateString();
  const todayOrders = adminOrders.filter(o => new Date(o.date).toDateString() === today);
  const container = document.getElementById('todayOrdersContainer');

  if (todayOrders.length === 0) {
    container.innerHTML = '<p class="text-muted">No orders today.</p>';
    return;
  }

  container.innerHTML = todayOrders.map(order => `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="card-title mb-2">#${order.id}</h6>
            <p class="card-text mb-2">
              <strong>Items:</strong> ${order.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
            </p>
            <p class="card-text mb-0">
              <strong>Total:</strong> ₵${order.total.toFixed(2)} | 
              <strong>Type:</strong> ${order.type || 'Delivery'}
            </p>
          </div>
          <span class="order-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPopularItems() {
  const itemCounts = {};
  adminOrders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });

  const popular = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('popularItemsContainer');
  if (popular.length === 0) {
    container.innerHTML = '<p class="text-muted">No data available.</p>';
    return;
  }

  container.innerHTML = '<ol>' + popular.map(([name, count]) => 
    `<li>${name} - ${count} orders</li>`
  ).join('') + '</ol>';
}

function renderAlerts() {
  const container = document.getElementById('alertsContainer');
  const alerts = [];

  // Check for low stock (manually managed items)
  const unavailableItems = adminMenuItems.filter(i => i.available === false);
  if (unavailableItems.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${unavailableItems.length} item(s) marked as unavailable`
    });
  }

  // Check for pending orders
  const pendingOrders = adminOrders.filter(o => o.status === 'new' || o.status === 'preparing');
  if (pendingOrders.length > 0) {
    alerts.push({
      type: 'info',
      message: `${pendingOrders.length} order(s) waiting attention`
    });
  }

  if (alerts.length === 0) {
    container.innerHTML = '<p class="text-muted">No alerts.</p>';
    return;
  }

  container.innerHTML = alerts.map(alert => `
    <div class="alert alert-${alert.type === 'warning' ? 'warning' : 'info'} alert-dismissible fade show" role="alert">
      ${alert.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `).join('');
}

function renderFoodsList(filter = 'all') {
  const container = document.getElementById('foodsListContainer');
  let itemsToDisplay = adminMenuItems;

  if (filter !== 'all') {
    itemsToDisplay = adminMenuItems.filter(item => item.category === filter);
  }

  if (itemsToDisplay.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No foods found.</p></div>';
    return;
  }

  container.innerHTML = itemsToDisplay.map(item => `
    <div class="col-md-6 col-lg-4">
      <div class="food-item-card">
        <img src="${item.path}" alt="${item.name}" class="food-item-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23e9eef5%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2214%22 fill=%22%239aa3b2%22>Image not found</text></svg>'">
        <div class="food-item-info">
          <h5 class="mb-1">${item.name}</h5>
          <p class="text-muted small mb-2">
            <span class="badge bg-info">${item.category}</span>
            <span class="badge ${item.available !== false ? 'bg-success' : 'bg-danger'} ms-2">${item.available !== false ? 'Available' : 'Unavailable'}</span>
          </p>
          <p class="h5 text-success mb-3">₵${item.price.toFixed(2)}</p>
          <div class="d-grid gap-2">
            <button class="btn btn-sm btn-outline-primary edit-food-btn" data-id="${item.id}">Edit</button>
            <button class="btn btn-sm ${item.available !== false ? 'btn-warning' : 'btn-success'} toggle-availability-btn" data-id="${item.id}">
              ${item.available !== false ? 'Mark Unavailable' : 'Mark Available'}
            </button>
            <button class="btn btn-sm btn-danger delete-food-btn" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.edit-food-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
  });

  document.querySelectorAll('.delete-food-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (confirm('Delete this item?')) deleteFood(e.target.dataset.id);
    });
  });

  document.querySelectorAll('.toggle-availability-btn').forEach(btn => {
    btn.addEventListener('click', (e) => toggleAvailability(e.target.dataset.id));
  });
}

function toggleAvailability(itemId) {
  const item = adminMenuItems.find(i => i.id === itemId);
  if (item) {
    item.available = item.available === false ? true : false;
    saveMenuItems();
    renderFoodsList(getCurrentFilter());
  }
}

function openEditModal(itemId) {
  const item = adminMenuItems.find(i => i.id === itemId);
  if (!item) return;

  editingItemId = itemId;
  document.getElementById('editFoodId').value = itemId;
  document.getElementById('editFoodName').value = item.name;
  document.getElementById('editFoodCategory').value = item.category;
  document.getElementById('editFoodPrice').value = item.price.toFixed(2);
  document.getElementById('editFoodImage').value = item.path;
  document.getElementById('editFoodDescription').value = item.description || '';

  const editImagePreview = document.getElementById('editImagePreview');
  editImagePreview.src = item.path;
  editImagePreview.classList.remove('d-none');

  const modal = new bootstrap.Modal(document.getElementById('editFoodModal'));
  modal.show();
}

function deleteFood(itemId) {
  adminMenuItems = adminMenuItems.filter(item => item.id !== itemId);
  saveMenuItems();
  renderFoodsList(getCurrentFilter());
  alert('Food item deleted!');
}

function saveFood(foodData) {
  const existingIndex = adminMenuItems.findIndex(item => 
    item.name.toLowerCase() === foodData.name.toLowerCase()
  );

  if (existingIndex > -1) {
    adminMenuItems[existingIndex] = { ...adminMenuItems[existingIndex], ...foodData };
  } else {
    foodData.id = btoa(foodData.path).slice(0, 12);
    foodData.available = true;
    adminMenuItems.push(foodData);
  }

  saveMenuItems();
}

function saveMenuItems() {
  localStorage.setItem('derry_menu_items', JSON.stringify(adminMenuItems));
}

function loadOrders() {
  try {
    adminOrders = JSON.parse(localStorage.getItem('derry_orders')) || [];
  } catch (e) {
    adminOrders = [];
  }
}

function saveOrders() {
  localStorage.setItem('derry_orders', JSON.stringify(adminOrders));
}

function loadReservations() {
  try {
    adminReservations = JSON.parse(localStorage.getItem('derry_reservations')) || [];
  } catch (e) {
    adminReservations = [];
  }
}

function saveReservations() {
  localStorage.setItem('derry_reservations', JSON.stringify(adminReservations));
}

function loadSettings() {
  try {
    adminSettings = JSON.parse(localStorage.getItem('derry_settings')) || {
      restaurantName: "Derry's Restaurant",
      restaurantPhone: '0596120924',
      restaurantEmail: 'antwid809@gmail.com',
      restaurantPhone2: '0534271481',
      restaurantAddress: 'Ghana',
      hours: DAYS.reduce((obj, day) => ({ ...obj, [day]: { open: '09:00', close: '22:00' } }), {}),
      deliveryZones: []
    };
  } catch (e) {
    adminSettings = {};
  }
}

function saveSettings() {
  localStorage.setItem('derry_settings', JSON.stringify(adminSettings));
}

function renderOrdersTable() {
  const statusFilter = document.getElementById('orderStatusFilter').value;
  const typeFilter = document.getElementById('orderTypeFilter').value;

  let filtered = adminOrders;
  if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);
  if (typeFilter) filtered = filtered.filter(o => o.type === typeFilter);

  const tbody = document.getElementById('ordersTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No orders.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(order => `
    <tr>
      <td><strong>#${order.id}</strong></td>
      <td><small>${order.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</small></td>
      <td>₵${order.total.toFixed(2)}</td>
      <td>
        <select class="form-select form-select-sm status-update" data-id="${order.id}" style="width: 100px;">
          <option value="new" ${order.status === 'new' ? 'selected' : ''}>New</option>
          <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
          <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
          <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Canceled</option>
        </select>
      </td>
      <td>
        <select class="form-select form-select-sm type-update" data-id="${order.id}" style="width: 80px;">
          <option value="delivery" ${order.type === 'delivery' ? 'selected' : ''}>Delivery</option>
          <option value="pickup" ${order.type === 'pickup' ? 'selected' : ''}>Pickup</option>
        </select>
      </td>
      <td>
        <select class="form-select form-select-sm payment-update" data-id="${order.id}" style="width: 80px;">
          <option value="unpaid" ${order.paymentStatus === 'unpaid' ? 'selected' : ''}>Unpaid</option>
          <option value="paid" ${order.paymentStatus === 'paid' ? 'selected' : ''}>Paid</option>
          <option value="refunded" ${order.paymentStatus === 'refunded' ? 'selected' : ''}>Refunded</option>
        </select>
      </td>
      <td><small>${new Date(order.date).toLocaleString()}</small></td>
      <td>
        <button class="btn btn-xs btn-danger delete-order-btn" data-id="${order.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.status-update').forEach(select => {
    select.addEventListener('change', (e) => updateOrderField(e.target.dataset.id, 'status', e.target.value));
  });
  document.querySelectorAll('.type-update').forEach(select => {
    select.addEventListener('change', (e) => updateOrderField(e.target.dataset.id, 'type', e.target.value));
  });
  document.querySelectorAll('.payment-update').forEach(select => {
    select.addEventListener('change', (e) => updateOrderField(e.target.dataset.id, 'paymentStatus', e.target.value));
  });
  document.querySelectorAll('.delete-order-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (confirm('Delete this order?')) {
        adminOrders = adminOrders.filter(o => o.id !== e.target.dataset.id);
        saveOrders();
        renderOrdersTable();
      }
    });
  });
}

function updateOrderField(orderId, field, value) {
  const order = adminOrders.find(o => o.id === orderId);
  if (order) {
    order[field] = value;
    saveOrders();
  }
}

function renderReservationsTable() {
  const tbody = document.getElementById('reservationsTableBody');
  if (adminReservations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No reservations.</td></tr>';
    return;
  }

  tbody.innerHTML = adminReservations.map(res => `
    <tr>
      <td>${res.guestName}</td>
      <td>${res.guestPhone}</td>
      <td>${new Date(res.dateTime).toLocaleString()}</td>
      <td>${res.guestCount}</td>
      <td>
        <select class="form-select form-select-sm" data-id="${res.id}" onchange="updateReservationStatus(this.value, '${res.id}')">
          <option value="confirmed" ${res.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="completed" ${res.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="canceled" ${res.status === 'canceled' ? 'selected' : ''}>Canceled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteReservation('${res.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.updateReservationStatus = function(status, id) {
  const res = adminReservations.find(r => r.id === id);
  if (res) {
    res.status = status;
    saveReservations();
    renderReservationsTable();
  }
};

window.deleteReservation = function(id) {
  if (confirm('Delete this reservation?')) {
    adminReservations = adminReservations.filter(r => r.id !== id);
    saveReservations();
    renderReservationsTable();
  }
};

function setupFormHandlers() {
  const addFoodForm = document.getElementById('addFoodForm');
  if (addFoodForm) {
    addFoodForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveFood({
        name: document.getElementById('foodName').value,
        category: document.getElementById('foodCategory').value,
        price: parseFloat(document.getElementById('foodPrice').value),
        path: document.getElementById('foodImage').value,
        description: document.getElementById('foodDescription').value,
        available: true
      });
      addFoodForm.reset();
      document.getElementById('imagePreview').classList.add('d-none');
      alert('Food item added!');
      document.querySelector('[data-section="foods"]').click();
    });
  }

  const saveEditBtn = document.getElementById('saveEditFoodBtn');
  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', () => {
      const itemIndex = adminMenuItems.findIndex(item => item.id === editingItemId);
      if (itemIndex > -1) {
        adminMenuItems[itemIndex] = {
          ...adminMenuItems[itemIndex],
          name: document.getElementById('editFoodName').value,
          category: document.getElementById('editFoodCategory').value,
          price: parseFloat(document.getElementById('editFoodPrice').value),
          path: document.getElementById('editFoodImage').value,
          description: document.getElementById('editFoodDescription').value
        };
        saveMenuItems();
        alert('Food item updated!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('editFoodModal'));
        modal.hide();
        renderFoodsList(getCurrentFilter());
      }
    });
  }

  document.getElementById('foodImage').addEventListener('change', function() {
    const preview = document.getElementById('imagePreview');
    if (this.value) {
      preview.src = this.value;
      preview.classList.remove('d-none');
    }
  });

  document.getElementById('editFoodImage').addEventListener('change', function() {
    const preview = document.getElementById('editImagePreview');
    if (this.value) {
      preview.src = this.value;
      preview.classList.remove('d-none');
    }
  });

  const saveReservationBtn = document.getElementById('saveReservationBtn');
  if (saveReservationBtn) {
    saveReservationBtn.addEventListener('click', () => {
      const reservation = {
        id: 'RES-' + Date.now(),
        guestName: document.getElementById('guestName').value,
        guestPhone: document.getElementById('guestPhone').value,
        dateTime: document.getElementById('reservationDateTime').value,
        guestCount: parseInt(document.getElementById('guestCount').value),
        specialRequests: document.getElementById('specialRequests').value,
        status: 'confirmed',
        date: new Date().toISOString()
      };
      adminReservations.push(reservation);
      saveReservations();
      const modal = bootstrap.Modal.getInstance(document.getElementById('addReservationModal'));
      modal.hide();
      document.getElementById('addReservationForm').reset();
      renderReservationsTable();
      alert('Reservation added!');
    });
  }

  const generalSettingsForm = document.getElementById('generalSettingsForm');
  if (generalSettingsForm) {
    generalSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      adminSettings.restaurantName = document.getElementById('restaurantName').value;
      adminSettings.restaurantPhone = document.getElementById('restaurantPhone').value;
      adminSettings.restaurantEmail = document.getElementById('restaurantEmail').value;
      adminSettings.restaurantPhone2 = document.getElementById('restaurantPhone2').value;
      adminSettings.restaurantAddress = document.getElementById('restaurantAddress').value;
      saveSettings();
      alert('Settings saved!');
    });
  }

  const saveZoneBtn = document.getElementById('saveZoneBtn');
  if (saveZoneBtn) {
    saveZoneBtn.addEventListener('click', () => {
      const zone = {
        name: document.getElementById('zoneName').value,
        fee: parseFloat(document.getElementById('deliveryFee').value),
        description: document.getElementById('zoneDescription').value
      };
      if (!adminSettings.deliveryZones) adminSettings.deliveryZones = [];
      adminSettings.deliveryZones.push(zone);
      saveSettings();
      const modal = bootstrap.Modal.getInstance(document.getElementById('addZoneModal'));
      modal.hide();
      document.getElementById('addZoneForm').reset();
      setupDeliveryZonesDisplay();
      alert('Delivery zone added!');
    });
  }
}

function setupSettingsUI() {
  loadSettings();

  document.getElementById('restaurantName').value = adminSettings.restaurantName || '';
  document.getElementById('restaurantPhone').value = adminSettings.restaurantPhone || '';
  document.getElementById('restaurantEmail').value = adminSettings.restaurantEmail || '';
  document.getElementById('restaurantPhone2').value = adminSettings.restaurantPhone2 || '';
  document.getElementById('restaurantAddress').value = adminSettings.restaurantAddress || '';

  const hoursContainer = document.getElementById('hoursContainer');
  if (hoursContainer && !hoursContainer.innerHTML) {
    const hoursHTML = DAYS.map(day => `
      <div class="row mb-3">
        <div class="col-md-4">
          <label class="form-label">${day}</label>
        </div>
        <div class="col-md-4">
          <input type="time" class="form-control" id="open-${day}" value="${adminSettings.hours?.[day]?.open || '09:00'}">
        </div>
        <div class="col-md-4">
          <input type="time" class="form-control" id="close-${day}" value="${adminSettings.hours?.[day]?.close || '22:00'}">
        </div>
      </div>
    `).join('');
    hoursContainer.innerHTML = hoursHTML;

    document.getElementById('hoursSettingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      adminSettings.hours = {};
      DAYS.forEach(day => {
        adminSettings.hours[day] = {
          open: document.getElementById(`open-${day}`).value,
          close: document.getElementById(`close-${day}`).value
        };
      });
      saveSettings();
      alert('Hours saved!');
    });
  }

  setupDeliveryZonesDisplay();
}

function setupDeliveryZonesDisplay() {
  const container = document.getElementById('deliveryZonesContainer');
  if (!adminSettings.deliveryZones || adminSettings.deliveryZones.length === 0) {
    container.innerHTML = '<p class="text-muted">No delivery zones yet.</p>';
    return;
  }

  container.innerHTML = '<div class="list-group">' + adminSettings.deliveryZones.map((zone, idx) => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6>${zone.name}</h6>
          <p class="mb-1">Fee: $${zone.fee.toFixed(2)}</p>
          <small class="text-muted">${zone.description}</small>
        </div>
        <button class="btn btn-sm btn-danger" onclick="deleteZone(${idx})">Delete</button>
      </div>
    </div>
  `).join('') + '</div>';
}

window.deleteZone = function(idx) {
  if (confirm('Delete this zone?')) {
    adminSettings.deliveryZones.splice(idx, 1);
    saveSettings();
    setupDeliveryZonesDisplay();
  }
};

function setupFilters() {
  document.querySelectorAll('.filter-admin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-admin-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderFoodsList(e.target.dataset.filter);
    });
  });

  document.getElementById('orderStatusFilter')?.addEventListener('change', () => renderOrdersTable());
  document.getElementById('orderTypeFilter')?.addEventListener('change', () => renderOrdersTable());
}

function setupSearch() {
  const searchInput = document.getElementById('searchFoods');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const container = document.getElementById('foodsListContainer');

      if (searchTerm === '') {
        renderFoodsList(getCurrentFilter());
        return;
      }

      let itemsToDisplay = adminMenuItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
      );

      if (itemsToDisplay.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No foods found.</p></div>';
        return;
      }

      container.innerHTML = itemsToDisplay.map(item => `
        <div class="col-md-6 col-lg-4">
          <div class="food-item-card">
            <img src="${item.path}" alt="${item.name}" class="food-item-img">
            <div class="food-item-info">
              <h5 class="mb-1">${item.name}</h5>
              <p class="text-success mb-3">$${item.price.toFixed(2)}</p>
              <div class="d-grid gap-2">
                <button class="btn btn-sm btn-outline-primary edit-food-btn" data-id="${item.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-food-btn" data-id="${item.id}">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.edit-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
      });
      document.querySelectorAll('.delete-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm('Delete?')) deleteFood(e.target.dataset.id);
        });
      });
    });
  }
}

function getCurrentFilter() {
  const activeBtn = document.querySelector('.filter-admin-btn.active');
  return activeBtn ? activeBtn.dataset.filter : 'all';
}

function setupClearHistoryButton() {
  const clearBtn = document.getElementById('clearHistoryBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear ALL orders and reservations history? This cannot be undone!')) {
        adminOrders = [];
        adminReservations = [];
        saveOrders();
        saveReservations();
        updateDashboardStats();
        renderTodayOrders();
        alert('History cleared!');
      }
    });
  }
}

// Admin logout functionality
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
if(adminLogoutBtn){
  adminLogoutBtn.addEventListener('click', ()=>{
    if(confirm('Are you sure you want to logout?')){
      localStorage.removeItem('derry_admin_verified');
      window.location.href = 'index.html';
    }
  });
}
