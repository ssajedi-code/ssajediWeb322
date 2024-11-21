let items = []; // Array to store items
let categories = [];

const fs = require('fs');
const path = require('path');

// Function for initializing the data
const initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
            if (err) {
                reject("Unable to read file items.json");
            } else {
                items = JSON.parse(data);
                fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, data) => {
                    if (err) {
                        reject("Unable to read file categories.json");
                    } else {
                        categories = JSON.parse(data);
                        resolve();
                    }
                });
            }
        });
    });
};

// Add Item Method (Updated)
function addItem(itemData) {
    return new Promise((resolve, reject) => {
        if (!itemData.title || !itemData.category || !itemData.price) {
            reject("Missing required fields");
            return;
        }

        itemData.published = itemData.published ? true : false;
        itemData.id = items.length + 1; // Assign a new ID
        itemData.postDate = new Date().toISOString().split('T')[0]; // Set current date as postDate
        items.push(itemData);
        resolve(itemData); 
    });
}

// Get Published Items by Category (New)
const getPublishedItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.published && item.category == category);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned");
        }
    });
};

// Get All Items
const getAllItems = () => {
    return new Promise((resolve, reject) => {
        if (items.length == 0) {
            reject("No items returned");
        } else {
            resolve(items);
        }
    });
};

// Get Published Items
const getPublishedItems = () => {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published == true);
        if (publishedItems.length == 0) {
            reject("No published items returned");
        } else {
            resolve(publishedItems);
        }
    });
};

// Get Categories
const getCategories = () => {
    return new Promise((resolve, reject) => {
        if (categories.length == 0) {
            reject("No categories returned");
        } else {
            resolve(categories);
        }
    });
};

// QUERY ITEMS MODULES BELOW

// By Category
function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const itemsByCategory = items.filter(item => item.category == category);
        if (itemsByCategory.length > 0) {
            resolve(itemsByCategory);
        } else {
            reject("No results returned");
        }
    });
}

// By MinDate
function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        const itemsByDate = items.filter(item => new Date(item.postDate) >= minDate);
        if (itemsByDate.length > 0) {
            resolve(itemsByDate);
        } else {
            reject("No results returned");
        }
    });
}

// By ID
function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id == id);
        if (item) {
            resolve(item);
        } else {
            reject("No result returned");
        }
    });
}

// Export the methods
module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    addItem,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    getPublishedItemsByCategory // New method
};
 