// Image filename arrays collected from project folders
const continentalFiles = [
  'foodie.jpg',
  'Grilled Chicken.jpg',
  '@foodlandfairy.jpg',
  'A straightforward yet satisfying meal! This image….jpg',
  'Better than your jalebi bai.jpg',
  'Broccoli.jpg',
  'Butter Chicken Pizza - Savory&SweetFood.jpg',
  'Cajun Sausage Pasta is a quick, flavorful, and….jpg',
  'Continental Dishes.jpg',
  'Craving something crispy, juicy, and….jpg',
  'Fried Rice.jpg',
  'Here we have a delicious and full of flavour….jpg',
  'Indulge in the irresistible flavors of Keema….jpg',
  'Make Street-Style.jpg',
  'Potato croquettes with leeks.jpg',
  'shawama.jpg',
  'Tantalize your taste buds with an irresistible….jpg',
  'This indian masala pasta recipe is made with….jpg',
  'This white sauce pasta is an easy weeknight meal….jpg',
  'Vegetable Salad.jpg'
];

const localFiles = [
  'ghanafood.jpg',
  '13 Most Popular Ghanaian Foods You Should Try….jpg',
  'A bowl of rice balls and peanut soup with chicken….jpg',
  'A VIRTUAL TASTE OF GHANAIAN FOODS on Instagram….jpg',
  'Afro Magazine _ Plantain with palava sauce is a….jpg',
  'Best most perfect Egusi Soup Recipe_.jpg',
  'By _gh_foodies.jpg',
  'Waakye.jpg',
  'Jollof Rice.jpg',
  'Kontomire Soup.jpg',
  'Pepper Soup.jpg',
  'Fufu.jpg',
  'Fante Kenkey served with shito and sardines.jpg',
  'Garri.jpg',
  'TUOZAAFI THURSDA.jpg'
];

// Mapping of filenames to proper food names
const foodNameMap = {
  'Rice balls and peanut soup': 'Rice Balls with Peanut Soup',
  'Plantain with palava sauce': 'Plantain with Palava Sauce',
  'Egusi Soup': 'Egusi Soup',
  'Fante Kenkey': 'Fante Kenkey with Shito',
  'Garri': 'Garri and Soup',
  'Tuozaafi': 'Tuozaafi',
  'Butter Chicken Pizza': 'Butter Chicken Pizza',
  'Cajun Sausage Pasta': 'Cajun Sausage Pasta',
  'Keema': 'Keema Curry',
  'Bhelpuri': 'Bhelpuri',
  'Potato croquettes': 'Potato Croquettes',
  'Broccoli': 'Broccoli with Garlic Sauce',
  'White sauce pasta': 'White Sauce Pasta',
  'Masala pasta': 'Masala Pasta',
  'Vegetable Salad': 'Vegetable Salad',
  'Fried Rice': 'Fried Rice',
  'Grilled Chicken': 'Grilled Chicken',
  'Waakye': 'Waakye',
  'Jollof Rice': 'Jollof Rice',
  'Kontomire Soup': 'Kontomire Soup',
  'Pepper Soup': 'Pepper Soup',
  'Fufu': 'Fufu with Light Soup'
};

function safePath(folder, filename){
  // construct a URL-encoded path for the file (encode path segments separately)
  const segFolder = encodeURIComponent(folder);
  const segFile = encodeURIComponent(filename);
  return `asset/Restaurant%20Images/${segFolder}/${segFile}`;
}

// deterministic price from filename/title (gives values between ~4.00 and ~12.00)
function priceFromName(name){
  let s = String(name || '');
  let sum = 0; for(let i=0;i<s.length;i++){ sum += s.charCodeAt(i) * (i+1); }
  const cents = 400 + (sum % 800); // 400..1199 cents
  return +(cents/100).toFixed(2);
}

// build a global menu items array with id, clean name, path, category and deterministic price
const allMenuItems = (()=>{
  const arr = [];
  localFiles.forEach(f=>{
    const path = safePath('local foods', f);
    const clean = cleanTitle(f);
    const id = btoa(path).slice(0,12);
    arr.push({ id, name: clean, path, category:'local', price: priceFromName(clean) });
  });
  continentalFiles.forEach(f=>{
    const path = safePath('continental foods', f);
    const clean = cleanTitle(f);
    const id = btoa(path).slice(0,12);
    arr.push({ id, name: clean, path, category:'continental', price: priceFromName(clean) });
  });
  return arr;
})();

function cleanTitle(filename){
  if(!filename) return '';
  // remove extension
  let s = filename.replace(/\.[^/.]+$/, '');
  // decode common URL encodings
  try{ s = decodeURIComponent(s); }catch(e){}
  // replace underscores, multiple dashes, parentheses and dots with spaces
  s = s.replace(/[_\-\.\(\)]+/g, ' ');
  // remove excessive non-alphanumeric chars but keep & and comma
  s = s.replace(/[^\w\s&,–—'’]/g, ' ');
  // collapse spaces
  s = s.replace(/\s+/g, ' ').trim();
  // basic title case
  s = s.split(' ').map(w=> w.length>2 ? (w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()) : w.toLowerCase()).join(' ');
  if(!s) s = filename;
  // Check if cleaned title matches any known food name
  for(let key in foodNameMap){
    if(s.includes(key)){
      return foodNameMap[key];
    }
  }
  return s;
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

function buildCarousel(){
  const container = document.getElementById('carousel-inner');
  container.innerHTML='';
  // pick up to 5 random local and 5 random continental from allMenuItems
  const locals = allMenuItems.filter(i=>i.category==='local');
  const conts = allMenuItems.filter(i=>i.category==='continental');
  const pickN = (arr,n)=> shuffle([...arr]).slice(0, Math.min(n, arr.length));
  const picks = [...pickN(locals,5), ...pickN(conts,5)];
  shuffle(picks);
  picks.forEach((p, idx)=>{
    const div = document.createElement('div');
    div.className = 'carousel-item' + (idx===0 ? ' active' : '');
    const img = document.createElement('img');
    img.src = p.path;
    img.alt = p.name;
    div.appendChild(img);
    container.appendChild(div);
  });
}

function renderFullMenu(filter='all'){
  const container = document.getElementById('cards');
  container.innerHTML='';
  const items = allMenuItems.filter(i => filter==='all' ? true : i.category===filter);
  items.forEach(it => {
    const price = it.price.toFixed(2);
    const clean = it.name;
    const id = it.id;
    const col = document.createElement('div'); col.className='col-6 col-md-4 col-lg-3';
    col.innerHTML = `
      <div class="card card-food h-100">
        <img src="${it.path}" class="card-img-top" alt="${clean}" data-id="${id}" data-name="${escape(clean)}" data-path="${it.path}" data-price="${price}">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title menu-caption text-truncate">${clean}</h6>
          <p class="text-muted mb-2 small">${it.category}</p>
                  <div class="mt-auto d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-primary details-btn" data-id="${id}" data-name="${escape(clean)}" data-path="${it.path}" data-price="${price}">Details</button>
                      <button class="btn btn-sm btn-primary add-cart-btn" data-id="${id}" data-name="${escape(clean)}" data-path="${it.path}" data-price="${price}">Add</button>
                    </div>
                    <small class=\"text-muted\">₵${price}</small>
                  </div>
        </div>
      </div>`;
    container.appendChild(col);
  });
}
        // CART
        let cart = [];

        function loadCart(){ try{ cart = JSON.parse(localStorage.getItem('derry_cart')) || []; }catch(e){ cart = []; } }
        function saveCart(){ localStorage.setItem('derry_cart', JSON.stringify(cart)); }
        function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
        function updateCartCount(){ const el = document.getElementById('cartCount'); if(el) el.textContent = cartCount(); }

        function updateCartUI(){
          const list = document.getElementById('cartItems');
          const totalEl = document.getElementById('cartTotal');
          if(!list) return;
          list.innerHTML = '';
          if(cart.length===0){ list.innerHTML = '<div class=\"text-muted\">Your cart is empty.</div>'; if(totalEl) totalEl.textContent = '₵0.00'; updateCartCount(); return; }
          let total = 0;
          cart.forEach(item=>{
            total += item.price * item.qty;
            const row = document.createElement('div');
            row.className = 'list-group-item d-flex align-items-center cart-item-row';
            row.innerHTML = `
              <img src="${item.path}" class="cart-item-img me-3">
              <div class="flex-grow-1">
                <div class="fw-semibold">${item.name}</div>
                <div class="text-muted small">₵${item.price.toFixed(2)}</div>
              </div>
              <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-outline-secondary qty-btn me-1" data-id="${item.id}" data-action="dec">−</button>
                <input type="number" min="1" class="form-control form-control-sm qty-input" value="${item.qty}" data-id="${item.id}">
                <button class="btn btn-sm btn-outline-secondary qty-btn ms-1" data-id="${item.id}" data-action="inc">＋</button>
                <button class="btn btn-sm btn-link text-danger ms-3" data-id="${item.id}" data-action="remove">Remove</button>
              </div>
            `;
            const imgEl = row.querySelector('img');
            imgEl.addEventListener('error', ()=>{ imgEl.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23e9eef5" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%239aa3b2">Image not available</text></svg>' });
            list.appendChild(row);
          });
          if(totalEl) totalEl.textContent = `₵${total.toFixed(2)}`;
          updateCartCount();
        }

        function addToCart(item){ const existing = cart.find(i=>i.id===item.id); if(existing){ existing.qty += 1; } else{ cart.push({...item, qty:1}); } saveCart(); updateCartUI(); }

        function changeQty(id, delta){ const it = cart.find(i=>i.id===id); if(!it) return; it.qty += delta; if(it.qty<1) it.qty = 1; saveCart(); updateCartUI(); }
        function removeFromCart(id){ cart = cart.filter(i=>i.id!==id); saveCart(); updateCartUI(); }

        document.addEventListener('DOMContentLoaded', ()=>{
          buildCarousel();
          loadCart();
          renderFullMenu();
          updateCartUI();

          // filter buttons
          document.querySelectorAll('.filter-btn').forEach(btn=>{
            btn.addEventListener('click', e=>{
              document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
              e.currentTarget.classList.add('active');
              renderFullMenu(e.currentTarget.dataset.filter);
            })
          });

          // delegate for add-to-cart and details buttons
          document.getElementById('cards').addEventListener('click', e=>{
            const addBtn = e.target.closest('.add-cart-btn');
            if(addBtn){
              const id = addBtn.dataset.id; const name = unescape(addBtn.dataset.name); const path = addBtn.dataset.path; const price = parseFloat(addBtn.dataset.price);
              addToCart({id, name, path, price}); return;
            }
            const btn = e.target.closest('.details-btn');
            if(btn){
              const id = btn.dataset.id; const item = allMenuItems.find(x=>x.id===id); if(!item) return;
              if(modalImage) modalImage.src = item.path; if(modalTitle) modalTitle.textContent = item.name; if(modalCategory) modalCategory.textContent = item.category||''; if(modalPrice) modalPrice.textContent = '₵'+item.price.toFixed(2);
              // prepare modal for adding
              const modalQtyValBtn = document.getElementById('modalQtyVal'); if(modalQtyValBtn) modalQtyValBtn.textContent = '1';
              const modalAddBtn = document.getElementById('modalAddBtn'); const modalUpdateBtn = document.getElementById('modalUpdateBtn'); if(modalAddBtn) modalAddBtn.classList.remove('d-none'); if(modalUpdateBtn) modalUpdateBtn.classList.add('d-none');
              if(lightboxModal) lightboxModal.show();
              modalItem = {...item};
              return;
            }
            const img = e.target.closest('img'); if(!img || !img.dataset.id) return; const id = img.dataset.id; const item = allMenuItems.find(x=>x.id===id); if(!item) return;
            if(modalImage) modalImage.src = item.path; if(modalTitle) modalTitle.textContent = item.name; if(modalCategory) modalCategory.textContent = item.category||''; if(modalPrice) modalPrice.textContent = '₵'+item.price.toFixed(2);
            const modalQtyValBtn = document.getElementById('modalQtyVal'); if(modalQtyValBtn) modalQtyValBtn.textContent = '1'; const modalAddBtn = document.getElementById('modalAddBtn'); const modalUpdateBtn = document.getElementById('modalUpdateBtn'); if(modalAddBtn) modalAddBtn.classList.remove('d-none'); if(modalUpdateBtn) modalUpdateBtn.classList.add('d-none'); if(lightboxModal) lightboxModal.show(); modalItem = {...item};
          });

          // modal quantity controls
          const modalQtyDecBtn = document.getElementById('modalQtyDec');
          const modalQtyIncBtn = document.getElementById('modalQtyInc');
          const modalQtyValBtn = document.getElementById('modalQtyVal');
          function modalQtyChange(delta){ const cur = parseInt(modalQtyValBtn.textContent||'1',10) + delta; modalQtyValBtn.textContent = Math.max(1, cur); }
          if(modalQtyDecBtn) modalQtyDecBtn.addEventListener('click', ()=> modalQtyChange(-1));
          if(modalQtyIncBtn) modalQtyIncBtn.addEventListener('click', ()=> modalQtyChange(1));

          const modalAddBtn = document.getElementById('modalAddBtn');
          if(modalAddBtn) modalAddBtn.addEventListener('click', ()=>{
            const qty = parseInt(modalQtyValBtn.textContent||'1',10);
            if(!modalItem) return;
            const it = { id: modalItem.id, name: modalItem.name, path: modalItem.path, price: modalItem.price };
            for(let i=0;i<qty;i++) addToCart(it);
            if(lightboxModal) lightboxModal.hide();
          });

          // cart offcanvas interactions
          document.getElementById('cartItems').addEventListener('click', e=>{
            const btn = e.target.closest('[data-action]'); if(!btn) return; const id = btn.dataset.id; const action = btn.dataset.action;
            if(action==='inc') changeQty(id,1); else if(action==='dec') changeQty(id,-1); else if(action==='remove') removeFromCart(id);
          });

          document.getElementById('cartItems').addEventListener('input', e=>{
            const target = e.target; if(!target || !target.classList || !target.classList.contains('qty-input')) return; const id = target.dataset.id; if(!id) return; const val = parseInt(target.value,10) || 1; const it = cart.find(i=>i.id===id); if(!it) return; it.qty = Math.max(1,val); saveCart(); updateCartUI();
          });

          const checkout = document.getElementById('checkoutBtn'); if(checkout) checkout.addEventListener('click', ()=>{ if(cart.length===0){ return; } const orderTotal = cart.reduce((sum, item)=>sum+(item.price*item.qty),0); const orderData = { id: 'ORD-' + Date.now(), items: cart.map(i=>({name:i.name, price:i.price, qty:i.qty})), total: orderTotal, status: 'new', type: 'delivery', paymentStatus: 'unpaid', date: new Date().toISOString(), customerName: 'Customer', customerPhone: '' }; try{ let orders = JSON.parse(localStorage.getItem('derry_orders')) || []; orders.push(orderData); localStorage.setItem('derry_orders', JSON.stringify(orders)); }catch(e){ console.error('Failed to save order:', e); } cart=[]; saveCart(); updateCartUI(); const off = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas')); if(off) off.hide(); });

          // Admin password protection
          const ADMIN_PASSWORD = 'admin123'; // Default password - change this to your desired password
          const adminBtn = document.getElementById('adminBtn');
          const adminPasswordModal = document.getElementById('adminPasswordModal');
          const adminPasswordInput = document.getElementById('adminPasswordInput');
          const adminPasswordSubmit = document.getElementById('adminPasswordSubmit');
          const passwordError = document.getElementById('passwordError');

          if(adminBtn && adminPasswordModal){
            adminBtn.addEventListener('click', (e)=>{
              e.preventDefault();
              adminPasswordInput.value = '';
              passwordError.classList.add('d-none');
              const modal = new bootstrap.Modal(adminPasswordModal);
              modal.show();
              setTimeout(()=>{ adminPasswordInput.focus(); }, 100);
            });

            adminPasswordSubmit.addEventListener('click', ()=>{
              const enteredPassword = adminPasswordInput.value;
              if(enteredPassword === ADMIN_PASSWORD){
                passwordError.classList.add('d-none');
                const modal = bootstrap.Modal.getInstance(adminPasswordModal);
                if(modal) modal.hide();
                localStorage.setItem('derry_admin_verified', 'true');
                window.location.href = 'admin.html';
              } else {
                passwordError.classList.remove('d-none');
                adminPasswordInput.value = '';
                adminPasswordInput.focus();
              }
            });

            adminPasswordInput.addEventListener('keypress', (e)=>{
              if(e.key === 'Enter'){
                adminPasswordSubmit.click();
              }
            });
          }

        });

