// Array to store cart items
let cart = [];

// Prices for items
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
    "Fresh Groceries": 15.00,
    "Ampalaya": 9.00,
    "Tomato": 5.00,
    "Vegetables": 5.00,
    "Potato": 4.00,
    // Adding book titles and prices
    "Book Title 1": 19.99,
    "Book Title 2": 15.99,
    "Book Title 3": 22.50,
    "Book Title 4": 18.75,
    "Book Title 5": 14.99,

    "Luxury Bath Towel": 12.99,
     "Woven Laundry Basket" : 19.99,
     "Herbal Shampoo" : 8.50,
     "Liquid Detergent": 6.75,
     "Soft Bath Mat":10.99,

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
        const itemPrice = prices[item.name] || 0;
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

    const deliveryOptionElement = document.createElement('div');
    deliveryOptionElement.classList.add('delivery-options');
    deliveryOptionElement.innerHTML = `
        <h3>Select Delivery Option:</h3>
        <label>
            <input type="radio" name="delivery-option" value="Package" checked>
            Package
        </label>
        <label>
            <input type="radio" name="delivery-option" value="Delivery" onclick="promptForGlobalAddress()">
            Delivery
        </label>
    `;
    cartItemsContainer.appendChild(deliveryOptionElement);

    // Show the checkout button
    document.querySelector('#checkout').style.display = 'block';



    // Show the checkout button
    document.querySelector('#checkout').style.display = 'block';
}

// Function to prompt for address if Delivery is selected
let globalDeliveryAddress = ''; // Store the global delivery address

function promptForGlobalAddress() {
    const address = prompt("Please enter your delivery address:");
    if (address) {
        globalDeliveryAddress = address; // Save the global address
    } else {
        // Revert selection to "Package" if no address is provided
        document.querySelector('input[name="delivery-option"][value="Package"]').checked = true;
        alert("Address required for delivery. Defaulted to Package.");
    }
}

// Function to adjust quantity of an item in the cart
function adjustQuantity(index, change) {
    if (cart[index].quantity + change <= 0) {
        const confirmation = confirm(`Remove ${cart[index].name} from the cart?`);
        if (confirmation) removeFromCart(index);
    } else {
        cart[index].quantity += change;
        localStorage.setItem('cart', JSON.stringify(cart)); // Update localStorage
        showCart(); // Refresh the cart display
        updateCartCount();
    }
}

// Function to remove an item from the cart with confirmation
function removeFromCart(index) {
    const confirmation = confirm(`Are you sure you want to remove ${cart[index].name} from the cart?`);
    if (confirmation) {
        cart.splice(index, 1); // Remove the item from the cart array
        localStorage.setItem('cart', JSON.stringify(cart)); // Update localStorage
        showCart(); // Refresh the cart display
        updateCartCount();
    }
}

// Function to handle checkout and show final bill slip
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    // Determine global delivery option
    const deliveryOption = globalDeliveryAddress ? 'Delivery' : 'Package';

    let orderSummary = `Your Order (${deliveryOption}`;
    if (globalDeliveryAddress) {
        orderSummary += `, Address: ${globalDeliveryAddress}`;
    }
    orderSummary += `):\n`;

    let totalAmount = 0;

    cart.forEach(item => {
        const itemPrice = prices[item.name] || 0;
        const itemTotal = (itemPrice * item.quantity).toFixed(2);
        totalAmount += parseFloat(itemTotal);

        orderSummary += `${item.name} (x${item.quantity}) - $${itemTotal}\n`;
    });

    orderSummary += `\nTotal: $${totalAmount.toFixed(2)}`;

    // Display final bill slip
    alert(orderSummary + '\nThank you for your order!');
    cart = []; // Clear the cart after checkout
    globalDeliveryAddress = ''; // Reset global delivery address
    localStorage.removeItem('cart'); // Clear saved cart
    showCart(); // Refresh the cart display
    updateCartCount();
}

// Open the cart modal and show items in the center of the screen
function openCartModal() {
    document.querySelector('#cart-modal').style.display = 'flex'; // Set display to flex for centering
    showCart();
}

// Close the cart modal
document.querySelector('#close-cart').addEventListener('click', () => {
    document.querySelector('#cart-modal').style.display = 'none';
});

// Event listener for the cart icon click
document.querySelector('.cart').addEventListener('click', openCartModal);
