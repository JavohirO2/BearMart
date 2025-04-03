document.addEventListener("DOMContentLoaded", () => {
    // Check if user is admin, redirect if not
    const username = localStorage.getItem("username");
    if (username !== "admin") {
        return window.location.href = "/";
    }

    // Fetch orders when the page loads
    fetchOrders();

    // Global function for updating order status
    window.updateOrderStatus = function(orderId, newStatus) {
        fetch(`http://localhost:5000/orders/${orderId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => response.json())
        .then(data => {
            if (data) {
                // Update the UI
                const statusTracker = document.getElementById('status-tracker-' + orderId);
                if (statusTracker) {
                    // Replace the entire tracker with updated version
                    const order = {
                        OrderID: orderId,
                        status: newStatus,
                        isAdmin: true
                    };
                    const newTracker = createOrderStatusTracker(order);
                    statusTracker.replaceWith(newTracker);
                }
                
                // Refresh the orders to update sidebar if needed
                fetchOrders();
            } else {
                alert('Failed to update status: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error updating order status:', error);
            alert('Failed to update status. Please try again.');
        });
    };

    function fetchOrders() {
        // Fetch the orders data from the API
        fetch('http://localhost:5000/orders')
            .then(response => response.json())
            .then(data => {
                // Clear the loading message
                document.getElementById('orders-container').innerHTML = '';
                document.getElementById('needs-action-container').innerHTML = '';

                if (data.length === 0) {
                    document.getElementById('orders-container').innerHTML = '<div class="empty-message">No orders found</div>';
                    document.getElementById('needs-action-container').innerHTML = '<div class="empty-message">No new orders</div>';
                    return;
                }

                // Display each order dynamically
                data.forEach(order => {
                    // Add isAdmin flag for status controls
                    order.isAdmin = true;
                    
                    // Create order in main content
                    const orderElement = createOrderElement(order);
                    document.getElementById('orders-container').appendChild(orderElement);

                    // Create entry in sidebar for new orders
                    if (!order.status || order.status === "" || order.status === "Ordered") {
                        const sidebarElement = createSidebarElement(order);
                        document.getElementById('needs-action-container').appendChild(sidebarElement);
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                document.getElementById('orders-container').innerHTML = '<div class="error-message">Error loading orders</div>';
            });
    }

    // Main function to create order elements
    function createOrderElement(order) {
        const orderBox = document.createElement('div');
        orderBox.classList.add('order-box');
        orderBox.id = `order-${order.OrderID}`;

        // Calculate total items
        const totalItems = order.cart_data ? order.cart_data.reduce((sum, item) => sum + item.quantity, 0) : 0;

        let orderHeaderHTML = `
            <div class="order-header">
                <h2>Order #${order.OrderID}</h2>
                <p>${totalItems} item${totalItems !== 1 ? 's' : ''}</p>
            </div>
        `;

        // Create items list
        let itemsHTML = '<div class="items-list">';
        let subtotal = 0;

        if (order.cart_data && order.cart_data.length > 0) {
            order.cart_data.forEach(item => {
                const itemTotal = parseFloat(item.price) * item.quantity;
                subtotal += itemTotal;

                itemsHTML += `
                    <div class="item">
                        <p><strong>${item.quantity}x ${item.name}</strong> <span style="float: right;">$${itemTotal.toFixed(2)}</span></p>
                    </div>
                `;
            });
        } else {
            itemsHTML += '<p>No items found</p>';
        }

        itemsHTML += '</div>';

        // Calculate tax (assuming 5% for this example)
        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        // Address information
        let addressInfo = '';
        if (order.Address) {
            addressInfo = `<p><strong>Delivery Address:</strong> ${order.Address}`;
            if (order.City) addressInfo += `, ${order.City}`;
            if (order.State) addressInfo += `, ${order.State}`;
            if (order.ZipCode) addressInfo += `, ${order.ZipCode}`;
            addressInfo += '</p>';
        }

        // Customer information
        let customerInfo = '';
        if (order.username) {
            customerInfo = `<p><strong>Customer:</strong> ${order.username}`;
            if (order.email) customerInfo += ` (${order.email})`;
            customerInfo += '</p>';
        }

        // Order totals
        let orderDetailsHTML = `
            <div class="order-details">
                ${customerInfo}
                <p><strong>Order Method:</strong> ${order.OrderMethod || 'Not specified'}</p>
                ${addressInfo}
                ${itemsHTML}
                <hr>
                <p><strong>Subtotal:</strong> <span style="float: right;">$${subtotal.toFixed(2)}</span></p>
                <p><strong>Tax:</strong> <span style="float: right;">$${tax.toFixed(2)}</span></p>
                <p><strong>Total:</strong> <span style="float: right; font-weight: bold;">$${total.toFixed(2)}</span></p>
            </div>
        `;

        // Add the status tracker
        const statusTracker = createOrderStatusTracker(order);

        // Assemble everything
        orderBox.innerHTML = orderHeaderHTML + orderDetailsHTML;
        orderBox.appendChild(statusTracker);

        return orderBox;
    }

    function createOrderStatusTracker(order) {
        // Define the possible statuses in order
        const statuses = ['Ordered', 'Preparing', 'Shipped', 'Out for Delivery', 'Delivered'];
        
        // Find current status index (default to Ordered if not set)
        const currentStatus = order.status || 'Ordered';
        const currentStatusIndex = statuses.indexOf(currentStatus);
        
        // Create the status tracker container
        const statusTracker = document.createElement('div');
        statusTracker.classList.add('status-tracker');
        statusTracker.id = `status-tracker-${order.OrderID}`;
        
        // Create status labels
        let statusLabelsHTML = '<div class="status-labels">';
        statuses.forEach(status => {
            statusLabelsHTML += `<div class="status-label">${status}</div>`;
        });
        statusLabelsHTML += '</div>';
        
        // Create progress bar
        let progressBarHTML = '<div class="progress-container">';
        progressBarHTML += '<div class="progress-bar-background"></div>';
        progressBarHTML += `<div class="progress-bar-fill" style="width: ${calculateProgressWidth(currentStatusIndex)}%"></div>`;
        
        // Create status dots
        progressBarHTML += '<div class="">';
        statuses.forEach((status, index) => {
            const completed = index <= currentStatusIndex ? 'completed' : '';
            progressBarHTML += `<div class="status-dot ${completed}"></div>`;
        });
        progressBarHTML += '</div></div>';
        
        // Add update controls for admin
        let updateControlsHTML = '';
        // if (order.isAdmin) {
            updateControlsHTML = '<div class="admin-controls">';
            updateControlsHTML += '<select id="status-select-' + order.OrderID + '" class="status-select">';
            statuses.forEach(status => {
                const selected = currentStatus === status ? 'selected' : '';
                updateControlsHTML += `<option value="${status}" ${selected}>${status}</option>`;
            });
            updateControlsHTML += '</select>';
            updateControlsHTML += `<button onclick="updateOrderStatus(${order.OrderID}, document.getElementById('status-select-${order.OrderID}').value)">Update Status</button>`;
            updateControlsHTML += '</div>';
        // }
        
        // Assemble the full tracker
        statusTracker.innerHTML = statusLabelsHTML + progressBarHTML + updateControlsHTML;
        
        return statusTracker;
    }
    
    // Helper function to calculate progress bar width based on current status
    function calculateProgressWidth(currentIndex) {
        if (currentIndex < 0) return 0;
        
        // We have 4 segments (5 statuses - 1)
        const totalSegments = 4;
        const progressPercentage = (currentIndex / totalSegments) * 100;
        
        return progressPercentage;
    }
    
    // Create sidebar element for new orders
    function createSidebarElement(order) {
        const orderBox = document.createElement('div');
        orderBox.classList.add('order-box', 'sidebar-order');
    
        orderBox.innerHTML = `
            <p><strong>${order.username || 'Customer'}</strong></p>
            <p>Order #${order.OrderID} <span class="order-badge">NEW</span></p>
            <button class="action-button" onclick="document.getElementById('order-${order.OrderID}').scrollIntoView({behavior: 'smooth'})">
                VIEW ORDER DETAILS
            </button>
        `;
    
        return orderBox;
    }
    
  
    
    // Add styles when page loads
});