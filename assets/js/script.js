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
    "Woven Laundry Basket": 19.99,
    "Herbal Shampoo": 8.50,
    "Liquid Detergent": 6.75,
    "Soft Bath Mat": 10.99,

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
function orderNow(itemName, price) {
    addToCart(itemName, price);
    alert(`Thank you for ordering ${itemName}! It has been added to your cart.`);
    console.log(`Order placed for: ${itemName}`);
}




async function addToCart(itemName, price) {
    const username = localStorage.getItem("username");
    if (!username) {
        alert("Please log in to add items to the cart.");
        return;
    }

    const itemIndex = cart.findIndex((item) => item.name === itemName);

    if (itemIndex === -1) {
        cart.push({ name: itemName, quantity: 1, price });
    } else {
        cart[itemIndex].quantity++;
    }

    updateCartCount();

    try {
        await fetch("https://mart-kcs9.vercel.app/save-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, cart }),
        });
    } catch (error) {
        console.error("Error saving cart:", error);
    }
}


// Function to update the cart count displayed on the cart icon
function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;
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
        // showCart(); // Refresh the cart display
        displayCart();
        updateCartCount();
    }
}

// Function to remove an item from the cart with confirmation
function removeFromCart(index) {
    const confirmation = confirm(`Are you sure you want to remove ${cart[index].name} from the cart?`);
    if (confirmation) {
        cart.splice(index, 1); // Remove the item from the cart array
        localStorage.setItem('cart', JSON.stringify(cart)); // Update localStorage
        // showCart(); // Refresh the cart display
        displayCart();
        updateCartCount();
    }
}


function displayCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = ''; // Clear previous content

    let totalAmount = 0;

    cart?.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
    <span>${item.name} (x${item.quantity})</span>
    <span class="price">$${(item.price * item.quantity).toFixed(2)}</span>

    <div>
        <button onclick="removeFromCart(${index})">Delete</button>
    <button onclick="adjustQuantity(${index}, 1)">+</button>
    <button onclick="adjustQuantity(${index}, -1)">-</button>
    
    </div>

`;

        cartItemsContainer.appendChild(itemElement);
        totalAmount += item.price * item.quantity;
    });

    document.getElementById('total-amount').innerText = totalAmount.toFixed(2);
}






async function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const username = localStorage.getItem("username");
    if (!username) {
        alert("Please log in to place an order.");
        return;
    }

    const orderMethod = globalDeliveryAddress ? "Delivery" : "Pickup";
    const driverId = null;

    try {
        const response = await fetch("https://mart-kcs9.vercel.app/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, orderMethod, driverId }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(`Order placed successfully! Order ID: ${data.orderId}`);
            cart = [];
            localStorage.removeItem("cart");
            updateCartCount();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
    }
}



async function loadCart() {
    const username = localStorage.getItem("username");
    if (!username) return;

    try {
        const response = await fetch(`https://mart-kcs9.vercel.app/get-cart/${username}`);
        const data = await response.json();


        console.log(data, "data")


        if (response.ok) {
            cart = data.cart;
            updateCartCount();
        }
    } catch (error) {
        console.error("Error loading cart:", error);
    }
}


window.onload = loadCart;


