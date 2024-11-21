/*********************************************************************************

WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: ُSeyed Hossein Sajedi
Student ID: 134977222 
Date: 21/11/2024
Replit/Render Web App URL: https://replit.com/@shosseinsajedi/web322a2?v=1
GitHub Repository URL: https://github.com/ssajedi-code/ssajediWeb322

********************************************************************************/ 

const express = require('express');
const path = require("path");
const exphbs = require('express-handlebars');
const storeService = require("./store-service")

const multer = require("multer");             // Middleware to handle file uploads
const cloudinary = require("cloudinary").v2;  // Allows integration with the Cloudinary API for image hosting
const streamifier = require("streamifier");   // Converts the uploaded file data into a readable stream that can be directly sent to Cloudinary
const { title } = require('process');

// Cloudinary config
cloudinary.config({
    cloud_name: 'dvj6cwr7k', 
    api_key: '373952693868718',       
    api_secret: '1WHbxpmhwk6IZauEkmQPHyxTARg', 
    secure: true
});

const upload = multer();
const app = express();
const HTTP_PORT = process.env.PORT || 8080; //http://localhost:8080

// Use the static middleware to serve static files from the "public" folder
app.use(express.static('public'));

// Middleware to set active routes
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function(url, options) {
            return '<li class="nav-item">' +
                '<a href="' + url + '" class="nav-link' +
                ((url === app.locals.activeRoute) ? ' active' : '') +
                '">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper 'equal' needs 2 parameters");
            return (lvalue !== rvalue) ? options.inverse(this) : options.fn(this);
        }
    }
});

// Use handlebar as view engine 
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// Route "/" redirects to "/shop" as oppose to "/about" in the past
app.get('/', (req, res) => {
    res.redirect('/shop');
});

// Route "/about" returns the about.html file from the views folder
app.get('/about', (req, res) => {
    res.render('about', {title: 'About'})
});

// Route "/shop" returns all the items that are published
app.get('/shop', (req, res) => {
    const category = req.query.category;
    if (category) {
        storeService.getItemsByCategory(category)
            .then((items) => {
                storeService.getCategories()
                    .then((categories) => {
                        res.render('shop', { items, categories, title: 'Shop' });
                    })
                    .catch(() => {
                        res.render('shop', { items, message: "No categories found.", title: 'Shop' });
                    });
            })
            .catch(() => {
                storeService.getCategories()
                    .then((categories) => {
                        res.render('shop', { categories, message: "No items found.", title: 'Shop' });
                    })
                    .catch(() => {
                        res.render('shop', { message: "No items or categories found.", title: 'Shop' });
                    });
            });
    } else {
        storeService.getAllItems()
            .then((items) => {
                storeService.getCategories()
                    .then((categories) => {
                        res.render('shop', { items, categories, title: 'Shop' });
                    })
                    .catch(() => {
                        res.render('shop', { items, message: "No categories found.", title: 'Shop' });
                    });
            })
            .catch(() => {
                storeService.getCategories()
                    .then((categories) => {
                        res.render('shop', { categories, message: "No items found.", title: 'Shop' });
                    })
                    .catch(() => {
                        res.render('shop', { message: "No items or categories found.", title: 'Shop' });
                    });
            });
    }
});

// Route for shop items, filtering by ID 
app.get('/shop/:id', (req, res) => {
    const itemId = req.params.id;

    storeService.getItemById(itemId)
        .then((item) => {
            storeService.getCategories()
                .then((categories) => {
                    res.render('shop', { 
                        items: [item], 
                        categories, 
                        title: `Shop - ${item.title}` 
                    });
                })
                .catch(() => {
                    res.render('shop', { 
                        items: [item], 
                        message: "No categories found.", 
                        title: `Shop - ${item.title}` 
                    });
                });
        })
        .catch(() => {
            res.render('shop', { 
                message: "Item not found.", 
                title: 'Shop' 
            });
        });
});



// Route "/items" returns all the items
app.get('/items', (req, res) => {
    // For category query parameter
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then((items) => res.render('items', { items, title: 'Items' }))
            .catch((err) => res.status(500).json({ message: err}));
    }
    // For minDate query parameter
    else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then((items) => res.render('items', { items, title: 'Items' }))
            .catch((err) => res.status(500).json({ message: err}));
    }
    // No query params, return all (default)
    else {
        storeService.getAllItems()
            .then((items) => res.render('items', { items, title: 'Items' }))
            .catch((err) => res.status(500).json({ message: err}));
    }
});

// Route GET "/items/add"
app.get('/items/add', (req, res) => {
    res.render('addItem', {title: "Add Item"});
});

// Route POST "/items/add" to handle adding a new item
app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
        // Upload image to Cloudinary
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((error) => {
            console.error("Image upload failed:", error);
            res.status(500).send("Error uploading image");
        });
    } else {
        // No image provided; process the item without an image URL
        processItem("");
    }

    // Helper function to process the item data
    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

         // Save the item with storeService.addItem
        storeService.addItem(req.body)
            .then(() => {
                res.redirect('/items'); // Redirect to /items after saving
            })
            .catch((err) => {
                console.error("Error adding item:", err);
                res.status(500).send("Error saving item");
            });            
    }
});

// Route for query by ID
app.get('/items/:id', (req,res) => {
    storeService.getItemById(req.params.id)
        .then((item) => res.json(item))
        .catch((err) => res.status(500).json({ message: err}));
})

// Route "/categories" returns all the categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
    .then((categories) => {
        res.render('categories', { categories, title: 'Categories' });
    })
    .catch((err) => {
        res.render('categories', { message: "No categories found." });
    })
});

// Route 404 returns page not found
app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Not Found'})
})

// Start the server and listen on the specified port
storeService.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on port: ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to start the server:", err);
    })
