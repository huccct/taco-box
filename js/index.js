'use strict';
const menuElement = document.querySelector('.menu');
const cartElement = document.querySelector('.cart');
const cartEmpty = document.querySelector('.cart-empty');
const cartTotal = document.querySelector('.cart-total');
const cartTotalArr = document.querySelectorAll('.summaryTotal');
const extraTotalElement = document.querySelector('#extraTotal');
const cartItems = document.querySelector('.cart-items');
const cartItemCount = document.querySelector('.cart-item-count');
const checkoutBtn = document.querySelector('.checkout-button');
const discountSection = document.querySelector('.discount-section');
const cartSum = document.querySelector('.cart-summary-item');
const favoritesEmptyMsg = document.querySelector('.favorites-empty');
const favoriteItemsList = document.querySelector('.favorite-items');
const searchInput = document.querySelector('#searchInput');
const applyDiscount = document.querySelector('#applyDiscount');
const discountCode = document.querySelector('#discountCode');
const allPopup = document.querySelectorAll('.popup');
const confirmationPopup = document.querySelector('#confirmationPopup');
const extrasPopup = document.querySelector('#extrasPopup');
const extrasList = document.querySelector('.extras-list');
const yesExtrasButton = document.querySelector('#yesExtras');
const noExtrasButton = document.querySelector('#noExtras');
const sortOptions = document.querySelector('#sortOptions');
const scrollDownBtn = document.querySelector('.scroll-down');

const cart = [];
const favorites = [];
const discountCodes = {
  TACO10: 10,
  TACO20: 20,
};
let currentItem = null;
let discountPercentage = 0;

// smooth scroll to menu
scrollDownBtn.addEventListener('click', () => {
  menuElement.scrollIntoView({ behavior: 'smooth' });
});

/**
 * Render menu item.
 * @param {Array} sortedItems - sorted items
 */
const renderMenuItems = sortedItems => {
  const menuItemsByCategory = sortedItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
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
              <b>Extras:</b>
              <ul class="extras">
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
              <button class="add-to-cart" data-item="${item.name}">&#43;</button>
              <button class="favorite-btn" data-item="${item.name}">
                &#9734;
              </button>
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
      button.innerHTML = '&#9733;';
    } else {
      button.classList.remove('favorited');
      button.innerHTML = '&#9734;';
    }

    button.addEventListener('click', () => {
      toggleFavorite(item);
      button.classList.toggle('favorited');
      button.innerHTML = favorites.some(favItem => favItem.name === item.name) ? '&#9733;' : '&#9734;';
    });
  });

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
      showConfirmationPopup(item);
    });
  });
};

/**
 * Render cart item.
 * @param {Object} item - cart item
 * @param {number} index - index of the item
 */
const renderCartItem = (item, index) => `
  <li class="cart-item">
    <div class="cart-item-row">
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-price">£${(
        ((item.price + item.extras.reduce((sum, extra) => sum + extra.price, 0)) * item.quantity) / 100
      ).toFixed(2)}</span>
      <button class="remove-btn" data-item-id="${index}">&#128465;</button>
    </div>
    <div class="cart-item-extras">
      ${item.extras.map(extra => `<span class="cart-item-extra">- ${extra.name} (£${(extra.price / 100).toFixed(2)})</span>`).join(', ')}
    </div>
    <div class="cart-item-quantity">
      <button class="quantity-btn minus-btn" data-item-id="${index}">-</button>
      <span>x${item.quantity}</span>
      <button class="quantity-btn plus-btn" data-item-id="${index}">+</button>
    </div>
  </li>
`;

/**
 * Render cart.
 */
const renderCart = () => {
 cartItems.innerHTML = cart.map((item, index) => renderCartItem(item, index)).join('');
  const totalWithoutDiscount = cart.reduce(
    (acc, item) =>
      acc + (item.price + item.extras.reduce((sum, extra) => sum + extra.price, 0)) * item.quantity,
    0
  );

  // render total items
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartItemCount.textContent = totalItems;

  const discountedTotal = totalWithoutDiscount * (1 - discountPercentage / 100);

  // handle cart is empty status
  if (cart.length === 0) {
    cartSum.style.display = 'none';
    checkoutBtn.style.display = 'none';
    discountSection.style.display = 'none';
    cartTotal.style.display = 'none';
    cartEmpty.style.display = 'block';
    discountMessage.textContent = '';
    discountCode.value = '';
  } else {
    cartSum.style.display = 'flex';
    checkoutBtn.style.display = 'block';
    discountSection.style.display = 'flex';
    cartTotal.style.display = 'flex';
    cartEmpty.style.display = 'none';
    cartTotalArr.forEach(cartTotal => {
      cartTotal.textContent = `£ ${(discountedTotal / 100).toFixed(2)}`;
    });
  }

  document.querySelectorAll('.minus-btn').forEach(button => {
    button.addEventListener('click', () => removeFromCart(parseInt(button.dataset.itemId)));
  });

  document.querySelectorAll('.plus-btn').forEach(button => {
    const item = cart[parseInt(button.dataset.itemId)];
    button.addEventListener('click', () => addToCart(item, item.extras));
  });

  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', () => {
      const itemId = parseInt(button.dataset.itemId);
      cart.splice(itemId, 1);
      const cartExtrasTotal = cart.reduce((sum, item) => sum + item.extrasTotal, 0);
      extraTotalElement.textContent = `£ ${(cartExtrasTotal / 100).toFixed(2)}`;
      renderCart();
    });
  });
};

/**
 * Adds an item to the cart and updates the cart display.
 *
 * @param {Object} item - The item to be added to the cart.
 * @param {Array} [extras=[]] - An optional array of extra items to be added with the main item.
 */
const addToCart = (item, extras = []) => {
  const extraTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const existingItem = cart.find(
    cartItem => cartItem.name === item.name && JSON.stringify(cartItem.extras) === JSON.stringify(extras)
  );

  if (existingItem) {
    existingItem.quantity++;
    existingItem.extrasTotal += extraTotal;
    extraTotalElement.textContent = `£ ${(existingItem.extrasTotal / 100).toFixed(2)} `;
  } else {
    const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
    cart.push({ name: item.name, price: item.price, quantity: 1, extras, extrasTotal });
  }

  const cartExtrasTotal = cart.reduce((sum, item) => sum + item.extrasTotal, 0);
  extraTotalElement.textContent = `£ ${(cartExtrasTotal / 100).toFixed(2)}`;
  renderCart();
};

/**
 * Removes an item from the cart and updates the cart display.
 * @param {number} itemId - The index of the item to be removed from the cart.
 */
const removeFromCart = itemId => {
  const existingItem = cart[itemId];

  if (existingItem.quantity === 1) {
    cart.splice(itemId, 1);
  } else {
    existingItem.quantity--;
    existingItem.extrasTotal -= existingItem.extras.reduce((sum, extra) => sum + extra.price, 0);
    extraTotalElement.textContent = `£ ${(existingItem.extrasTotal / 100).toFixed(2)} `;
  }

  const cartExtrasTotal = cart.reduce((sum, item) => sum + item.extrasTotal, 0);
  extraTotalElement.textContent = `£ ${(cartExtrasTotal / 100).toFixed(2)}`;
  renderCart();
};

/**
 * Get sorted items.
 * @param {Array} items - menu items
 * @returns {Array} sorted items
 */
const getSortedItems = items => {
  const sortOption = sortOptions.value;
  let sortedItems = [...items];

  if (sortOption === 'priceAsc') {
    sortedItems.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'priceDesc') {
    sortedItems.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'nameAsc') {
    sortedItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sortedItems;
};

/**
 * Sort menu items.
 *
 */
const sortMenu = () => {
  const sortedItems = getSortedItems(menuItems);
  renderMenuItems(sortedItems);
};

/**
 * Render favorites list.
 */
const renderFavorites = () => {
  if (favorites.length === 0) {
    favoritesEmptyMsg.style.display = 'block';
    favoriteItemsList.innerHTML = '';
  } else {
    favoritesEmptyMsg.style.display = 'none';
    favoriteItemsList.innerHTML = favorites
      .map(
        item => `
      <li class="favorite-item">
        <span>${item.name} - <span class="price">£ ${(item.price / 100).toFixed(2)}</span></span>
        <button class="add-to-cart" data-item="${item.name}">&#43;</button>
      </li>
    `
      )
      .join('');
  }

  favoriteItemsList.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
      showConfirmationPopup(item);
    });
  });
};

/**
 * Toggle favorite item.
 * @param {Object} item - menu item
 */
const toggleFavorite = item => {
  const index = favorites.findIndex(favItem => favItem.name === item.name);
  if (index === -1) {
    favorites.push(item);
  } else {
    favorites.splice(index, 1);
  }
  renderFavorites();
};

/**
 * Filter menu items.
 *
 */
const filterMenuItems = () => {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredItems = menuItems.filter(
    item => item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm)
  );

  const sortedFilteredItems = getSortedItems(filteredItems);
  renderMenuItems(sortedFilteredItems);
};

searchInput.addEventListener('input', filterMenuItems);

/**
 * Show confirmation popup.
 * @param {Object} item - menu item
 */
const showConfirmationPopup = item => {
  currentItem = item;
  confirmationPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

/**
 * Show extras popup.
 * @param {Object} item - menu item
 */
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
  extrasPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

/**
 * Get selected extras.
 * @returns {Array} selected extras
 */
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

// apply discount code
applyDiscount.addEventListener('click', () => {
  const discountInput = discountCode.value.trim();
  if (discountCodes[discountInput] !== undefined) {
    discountPercentage = discountCodes[discountInput];
    discountMessage.style.color = 'green';
    discountMessage.textContent = `Discount applied: ${discountPercentage}% off`;
  } else {
    discountPercentage = 0;
    discountMessage.style.color = 'red';
    discountMessage.textContent = 'Invalid discount code.';
  }
  renderCart();
});

// add extras to cart
document.querySelector('#addToCartWithExtras').addEventListener('click', () => {
  const selectedExtras = getSelectedExtras();
  addToCart(currentItem, selectedExtras);
  extrasPopup.style.display = 'none';
  document.body.style.overflow = 'auto';
});

/**
 * When user click yes, show extras popup.
 */
yesExtrasButton.addEventListener('click', () => {
  confirmationPopup.style.display = 'none';
  document.body.style.overflow = 'auto';
  showExtrasPopup(currentItem);
});

/**
 * When user click no, add item to cart.
 */
noExtrasButton.addEventListener('click', () => {
  confirmationPopup.style.display = 'none';
  document.body.style.overflow = 'auto';
  addToCart(currentItem);
});

// Exit popup when clicking outside of it
allPopup.forEach(popup => {
  popup.addEventListener('click', event => {
    if (event.target === popup) {
      popup.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
});

// toggle cart to show or hide
const toggleCart = () => {
  renderCart();
  if (cartElement.classList.contains('open')) {
    cartElement.classList.remove('open');
  } else {
    cartElement.classList.add('open');
  }
};

// Add event listener to reset discount when discount code is cleared or changed
discountCode.addEventListener('input', () => {
  if (discountCode.value.trim() === '') {
    discountPercentage = 0;
    discountMessage.textContent = '';
    renderCart();
  }
});

sortOptions.addEventListener('change', sortMenu);

document.addEventListener('DOMContentLoaded', sortMenu);
