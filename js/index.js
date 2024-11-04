const menuElement = document.querySelector('.menu');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total span');
const extrasList = document.querySelector('.extras-list');
const confirmationPopup = document.getElementById('confirmationPopup');
const yesExtrasButton = document.getElementById('yesExtras');
const noExtrasButton = document.getElementById('noExtras');
const applyDiscount = document.getElementById('applyDiscount');

const discountMessage = document.getElementById('discountMessage');
const sortOptions = document.getElementById('sortOptions');
const searchInput = document.getElementById('searchInput');
const favoriteItemsList = document.querySelector('.favorite-items');
const favoritesEmptyMessage = document.querySelector('.favorites-empty');

let discountPercentage = 0;
let cart = [];
let currentItem = null; // Track the current item for adding extras
let favorites = [];
const discountCodes = {
  TACO10: 10,
  TACO20: 20,
};

// Scroll to menu when scroll-down button is clicked
document.querySelector('.scroll-down').addEventListener('click', () => {
  menuElement.scrollIntoView({ behavior: 'smooth' });
});

// render menu items
const renderMenuItems = sortedItems => {
  const menuItemsByCategory = sortedItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const menuItemsHTML = Object.entries(menuItemsByCategory)
    .map(
      ([category, items]) => `
      <div class="menu-category"> 
        <h2>${category}</h2>
        ${items
          .map(
            item => `
          <div class="menu-item">
            <img src=${item.img} alt="${item.name}">
            <div class="menu-item-content">
              <h3>${item.name}</h3>
              <p class="price">£${(item.price / 100).toFixed(2)}</p>
              <p class="description">${item.description}</p>
              <ul class="extras">
                <b>Extras:</b>
                ${item.extras
                  .map(
                    extra => `
                  <li>
                    <span class="extra-name">${extra.name}</span>
                    <span class="extra-price">£${(extra.price / 100).toFixed(2)}</span>
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>
            <div class="menu-item-actions">
              <button class="favorite-btn" data-item="${item.name}">
                ${favorites.some(favItem => favItem.name === item.name) ? 'Unfavorite' : 'Favorite'}
              </button>
              <button class="add-to-cart" data-item="${item.name}">Add to Cart</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `
    )
    .join('');

  menuElement.innerHTML = menuItemsHTML;

  document.querySelectorAll('.favorite-btn').forEach(button => {
    const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
    if (favorites.some(favItem => favItem.name === item.name)) {
      button.classList.add('favorited');
      button.textContent = 'Unfavorite';
    } else {
      button.classList.remove('favorited');
      button.textContent = 'Favorite';
    }

    button.addEventListener('click', () => {
      toggleFavorite(item);
      button.classList.toggle('favorited');
      button.textContent = favorites.some(favItem => favItem.name === item.name) ? 'Unfavorite' : 'Favorite';
    });
  });

  // 重新为 add-to-cart 按钮绑定事件监听器
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
      showConfirmationPopup(item);
    });
  });
};

const renderFavorites = () => {
  if (favorites.length === 0) {
    favoritesEmptyMessage.style.display = 'block';
    favoriteItemsList.innerHTML = '';
  } else {
    favoritesEmptyMessage.style.display = 'none';
    favoriteItemsList.innerHTML = favorites
      .map(
        item => `
      <li class="favorite-item">
        <span>${item.name}</span>
        <button class="add-to-cart" data-item="${item.name}">Add to Cart</button>
      </li>
    `
      )
      .join('');
  }

  // 收藏项中的“加入购物车”按钮事件
  favoriteItemsList.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
      addToCart(item);
    });
  });
};

const toggleFavorite = item => {
  const index = favorites.findIndex(favItem => favItem.name === item.name);
  if (index === -1) {
    favorites.push(item);
  } else {
    favorites.splice(index, 1); // 如果已经存在，则取消收藏
  }
  renderFavorites();
};

const getSortedItems = items => {
  const sortOption = sortOptions.value;
  let sortedItems = [...items];

  if (sortOption === 'priceAsc') {
    sortedItems.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'priceDesc') {
    sortedItems.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'category') {
    sortedItems.sort((a, b) => a.category.localeCompare(b.category));
  }

  return sortedItems;
};

const filterMenuItems = () => {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredItems = menuItems.filter(
    item => item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm)
  );

  // 使用当前排序选项对过滤后的项目进行排序
  const sortedFilteredItems = getSortedItems(filteredItems);
  renderMenuItems(sortedFilteredItems);
};

searchInput.addEventListener('input', filterMenuItems);

// 根据选择排序菜单
const sortMenu = () => {
  const sortedItems = getSortedItems(menuItems); // 基于当前的排序选项排序原始菜单项
  renderMenuItems(sortedItems);
};

// Show confirmation popup
const showConfirmationPopup = item => {
  currentItem = item;
  confirmationPopup.style.display = 'block';
};

// Show extras popup
const showExtrasPopup = item => {
  currentItem = item;
  extrasList.innerHTML = item.extras
    .map(
      extra => `
      <div class="extra-option">
        <input type="checkbox" data-extra-price="${extra.price}" data-extra-name="${extra.name}">
        ${extra.name} (£${(extra.price / 100).toFixed(2)})
      </div>
    `
    )
    .join('');
  document.getElementById('extrasPopup').style.display = 'block';
};

// Capture selected extras and calculate the total extras cost
const getSelectedExtras = () => {
  const selectedExtras = [];
  const extraCheckboxes = document.querySelectorAll('.extra-option input[type="checkbox"]');

  extraCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedExtras.push({
        name: checkbox.getAttribute('data-extra-name'),
        price: parseInt(checkbox.getAttribute('data-extra-price')),
      });
    }
  });
  return selectedExtras;
};

// Add item with selected extras to cart
document.getElementById('addToCartWithExtras').addEventListener('click', () => {
  const selectedExtras = getSelectedExtras();
  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  addToCart(currentItem, selectedExtras);
  document.getElementById('extrasPopup').style.display = 'none';
});

// Add item to cart with selected extras
// Updated addToCart function to handle extras
const addToCart = (item, extras = []) => {
  let extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const existingItem = cart.find(cartItem => cartItem.name === item.name);

  if (existingItem) {
    existingItem.quantity++;
    existingItem.extrasTotal += extrasTotal;
  } else {
    cart.push({ name: item.name, price: item.price, quantity: 1, extrasTotal });
  }

  renderCart();
  updateEmptyStatus();
};

// Apply discount code
applyDiscount.addEventListener('click', () => {
  const discountInput = document.getElementById('discountCode').value.trim();
  if (discountCodes[discountInput] !== undefined) {
    discountPercentage = discountCodes[discountInput];
    discountMessage.style.color = 'green';
    discountMessage.textContent = `Discount applied: ${discountPercentage}% off`;
  } else {
    discountPercentage = 0;
    discountMessage.style.color = 'red';
    discountMessage.textContent = 'Invalid discount code.';
  }

  // Update the total amount with the discount
  renderCart();
});

// Render cart with items and extras total
const renderCart = () => {
  cartItems.innerHTML = cart
    .map(
      item => `
    <li class="cart-item">
      <div class="cart-item-details">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">£${(((item.price + item.extrasTotal) * item.quantity) / 100).toFixed(
          2
        )}</span>
      </div>
      <div class="cart-item-quantity">
        <button class="quantity-btn minus-btn" data-item="${item.name}">-</button>
        <span>x${item.quantity}</span>
        <button class="quantity-btn plus-btn" data-item="${item.name}">+</button>
      </div>
    </li>
  `
    )
    .join('');

  const totalWithoutDiscount = cart.reduce(
    (acc, item) => acc + (item.price + item.extrasTotal) * item.quantity,
    0
  );
  const discountedTotal = totalWithoutDiscount * (1 - discountPercentage / 100);
  cartTotal.textContent = (discountedTotal / 100).toFixed(2);

  document.querySelectorAll('.minus-btn').forEach(button => {
    button.addEventListener('click', () => removeFromCart(button.dataset.item));
  });

  document.querySelectorAll('.plus-btn').forEach(button => {
    button.addEventListener('click', () => addToCart(currentItem));
  });
};

// Function to remove an item from the cart
const removeFromCart = itemName => {
  const existingItem = cart.find(item => item.name === itemName);
  if (existingItem) {
    if (existingItem.quantity > 1) {
      existingItem.quantity--;
      // existingItem.extrasTotal -= existingItem.extrasTotal / existingItem.quantity;
    } else {
      cart = cart.filter(item => item.name !== itemName);
    }
  }

  renderCart();
  updateEmptyStatus();
};

// Update cart empty message visibility
const updateEmptyStatus = () => {
  if (cart.length === 0) {
    document.querySelector('.cart-empty').style.display = 'block';
  } else {
    document.querySelector('.cart-empty').style.display = 'none';
  }
};

// Event listeners for Yes/No buttons in confirmation popup
yesExtrasButton.addEventListener('click', () => {
  confirmationPopup.style.display = 'none';
  showExtrasPopup(currentItem);
});

noExtrasButton.addEventListener('click', () => {
  confirmationPopup.style.display = 'none'; // Hide the confirmation popup
  addToCart(currentItem); // Add to cart without extras
});
// Event listener for "Add to Cart" buttons
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', () => {
    const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
    showConfirmationPopup(item);
  });
});

sortOptions.addEventListener('change', sortMenu);

// 初始渲染菜单
document.addEventListener('DOMContentLoaded', () => {
  sortMenu(); // Initial render
});
