function searchProducts() {
    let query = document.getElementById("search-input").value.trim();
    if (query) {
        window.location.href = `search.html?q=${query}`;
    }
}

function handleEnter(event) {
    if (event.key === "Enter") {
        searchProducts();
    }
}