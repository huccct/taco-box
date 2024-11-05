// Select necessary elements
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
const cartElement = document.querySelector('.cart');
const checkoutButton = document.querySelector('.checkout-button');
const extraTotalElement = document.querySelector('#extraTotal');
const discountSection = document.querySelector('.discount-section');
const cartTotalElement = document.querySelector('.cart-total');

// Define initial variables
let discountPercentage = 0;
let cart = [];
let currentItem = null; // Track the current item for adding extras
let favorites = [];
const discountCodes = {
  TACO10: 10,
  TACO20: 20,
};

const toggleMobileCart = () => {
  cartElement.classList.toggle('open');
};

// Scroll to menu when scroll-down button is clicked
document.querySelector('.scroll-down').addEventListener('click', () => {
  menuElement.scrollIntoView({ behavior: 'smooth' });
});

// Render menu items
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

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
      showConfirmationPopup(item);
    });
  });
};

// Render favorites list
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

  favoriteItemsList.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const item = menuItems.find(menuItem => menuItem.name === button.dataset.item);
      addToCart(item);
    });
  });
};

// Toggle favorite status
const toggleFavorite = item => {
  const index = favorites.findIndex(favItem => favItem.name === item.name);
  if (index === -1) {
    favorites.push(item);
  } else {
    favorites.splice(index, 1);
  }
  renderFavorites();
};

// Sort and filter menu items
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

// Filter menu items based on search input
const filterMenuItems = () => {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredItems = menuItems.filter(
    item => item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm)
  );

  const sortedFilteredItems = getSortedItems(filteredItems);
  renderMenuItems(sortedFilteredItems);
};

searchInput.addEventListener('input', filterMenuItems);

// Sort menu items when sorting option changes
const sortMenu = () => {
  const sortedItems = getSortedItems(menuItems);
  renderMenuItems(sortedItems);
};

// Show confirmation popup
const showConfirmationPopup = item => {
  currentItem = item;
  confirmationPopup.style.display = 'block';
};

// Show extras popup for selected item
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

// Get selected extras and calculate total
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

// Add item to cart and update quantities
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

// Apply discount code and update cart
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
  renderCart();
});

// Update cart visibility based on items
const updateCartVisibility = () => {
  const isCartEmpty = cart.length === 0;

  // Hide or show cart sidebar on web view
  if (window.innerWidth > 768) {
    cartElement.style.display = isCartEmpty ? 'none' : 'block';
  } else {
    // Mobile: Show mobile cart button and open cart overlay if not empty
    document.querySelector('.mobile-cart-button').style.display = isCartEmpty ? 'none' : 'block';

    if (!isCartEmpty) {
      cartElement.classList.add('open'); // Open cart on mobile when items are added
    } else {
      cartElement.classList.remove('open'); // Hide cart on mobile if empty
    }
  }

  // Adjust visibility of checkout and discount sections
  checkoutButton.style.display = isCartEmpty ? 'none' : 'block';
  extraTotalElement.closest('.cart-summary-item').style.display = isCartEmpty ? 'none' : 'flex';
  cartTotalElement.style.display = isCartEmpty ? 'none' : 'block';
  discountSection.style.display = isCartEmpty ? 'none' : 'flex';
};

// Render cart items and calculate totals
const renderCart = () => {
  // Update cart item list in the sidebar cart
  cartItems.innerHTML = cart
    .map(
      item => `
      <li class="cart-item">
        <div class="cart-item-row">
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
  const formattedTotal = `£ ${(discountedTotal / 100).toFixed(2)}`;

  cartTotal.textContent = formattedTotal;
  extraTotalElement.textContent = `£ ${(extraTotal / 100).toFixed(2)}`;

  // Update mobile cart total
  document.querySelector('.mobile-cart-total').textContent = formattedTotal;

  document.querySelectorAll('.minus-btn').forEach(button => {
    button.addEventListener('click', () => removeFromCart(button.dataset.item));
  });

  document.querySelectorAll('.plus-btn').forEach(button => {
    button.addEventListener('click', () =>
      addToCart(menuItems.find(menuItem => menuItem.name === button.dataset.item))
    );
  });

  updateCartVisibility();
};

// Remove item from cart and update quantities
const removeFromCart = itemName => {
  const existingItem = cart.find(item => item.name === itemName);
  if (existingItem) {
    if (existingItem.quantity > 1) {
      existingItem.quantity--;
    } else {
      cart = cart.filter(item => item.name !== itemName);
    }
  }

  renderCart();
  updateEmptyStatus();
};

// Update visibility of empty cart message
const updateEmptyStatus = () => {
  document.querySelector('.cart-empty').style.display = cart.length === 0 ? 'block' : 'none';
};

// Event listeners for Yes/No buttons in confirmation popup
yesExtrasButton.addEventListener('click', () => {
  confirmationPopup.style.display = 'none';
  showExtrasPopup(currentItem);
});

noExtrasButton.addEventListener('click', () => {
  confirmationPopup.style.display = 'none';
  addToCart(currentItem);
});

// Initialize the menu
document.addEventListener('DOMContentLoaded', () => {
  sortMenu();
});
