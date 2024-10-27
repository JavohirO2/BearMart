// Array to store cart items
let cart = [];

// Prices for items (updated according to your items)
const prices = {
    "Burger": 5.00,
    "Wrap": 4.50,
    "Sandwich": 6.00,
    "Meatballs": 7.00,
    "Biryani": 8.00,
    "Pizza": 9.00,
    "Bread": 2.50,
    "Curry": 10.00,
    "Veg Wrap": 4.50,
    "Fish Platter": 12.00,
    "Paratha": 3.50,
    "Salad": 5.00,
    "Burger Meal": 10.00,
    "Pasta": 7.50,
    "Pizza Slice": 2.50,
    "Dosa": 3.00,
    "Fresh Groceries": 15.00, // Sahaya
    "Ampalaya": 9.00,         // Nirvana
    "Tomato": 5.00,           // Kiryana
    "Vegetables": 5.00,       // Sahaya
    "Potato": 4.00            // Kirwana
};


// Load cart from localStorage when the script runs
window.onload = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart'));
    if (savedCart) {
        cart = savedCart;
        updateCartCount();
    }
};

// Function to show the selected category section
function showCategory(category) {
    document.querySelectorAll('.category-section').forEach(section => {
        section.style.display = 'none';
    });

    const selectedSection = document.getElementById(category);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    } else {
        console.warn(`Category section with id "${category}" not found.`);
    }
}

// Function to handle "Order Now" button clicks
function orderNow(itemName) {
    addToCart(itemName);
    alert(`Thank you for ordering ${itemName}! It has been added to your cart.`);
    console.log(`Order placed for: ${itemName}`);
}

// Function to add item to the cart
function addToCart(itemName) {
    const itemIndex = cart.findIndex(item => item.name === itemName);
    
    if (itemIndex === -1) {
        cart.push({ name: itemName, quantity: 1 });
    } else {
        cart[itemIndex].quantity++;
    }

    localStorage.setItem('cart', JSON.stringify(cart)); // Save cart to localStorage
    updateCartCount();
}

// Function to update the cart count displayed on the cart icon
function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;
}

// Function to show cart items in a modal
function showCart() {
    const cartItemsContainer = document.querySelector('#cart-items');
    cartItemsContainer.innerHTML = ''; // Clear previous items

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        document.querySelector('#checkout').style.display = 'none';
        return;
    }

    let totalAmount = 0; // To calculate the total cost

    cart.forEach((item, index) => {
        const itemPrice = prices[item.name] || 0; // Get the item's price
        totalAmount += itemPrice * item.quantity; // Update total amount
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <span>${item.name} (x${item.quantity}) - $${(itemPrice * item.quantity).toFixed(2)}</span>
            <button onclick="removeFromCart(${index})">Remove</button>
            <button onclick="adjustQuantity(${index}, 1)">+</button>
            <button onclick="adjustQuantity(${index}, -1)">-</button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // Show total amount
    const totalElement = document.createElement('div');
    totalElement.classList.add('cart-total');
    totalElement.innerHTML = `<strong>Total: $${totalAmount.toFixed(2)}</strong>`;
    cartItemsContainer.appendChild(totalElement);

    // Show the checkout button
    document.querySelector('#checkout').style.display = 'block';
}

// Function to adjust quantity of an item in the cart
function adjustQuantity(index, change) {
    if (cart[index].quantity + change <= 0) {
        removeFromCart(index);
    } else {
        cart[index].quantity += change;
        localStorage.setItem('cart', JSON.stringify(cart)); // Update localStorage
        showCart(); // Refresh the cart display
        updateCartCount();
    }
}

// Function to remove an item from the cart
function removeFromCart(index) {
    cart.splice(index, 1); // Remove the item from the cart array
    localStorage.setItem('cart', JSON.stringify(cart)); // Update localStorage
    showCart(); // Refresh the cart display
    updateCartCount();
}

// Function to handle checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    let orderSummary = 'Your Order:\n';
    cart.forEach(item => {
        orderSummary += `${item.name} (x${item.quantity}) - $${(prices[item.name] * item.quantity).toFixed(2)}\n`;
    });

    alert(orderSummary + '\nThank you for your order!');
    cart = []; // Clear the cart after checkout
    localStorage.removeItem('cart'); // Clear saved cart
    showCart(); // Refresh the cart display
    updateCartCount();
}

// Event listener for the cart icon click
document.querySelector('.cart').addEventListener('click', () => {
    document.querySelector('#cart-modal').style.display = 'block';
    showCart();
});

// Close the cart modal
document.querySelector('#close-cart').addEventListener('click', () => {
    document.querySelector('#cart-modal').style.display = 'none';
});
