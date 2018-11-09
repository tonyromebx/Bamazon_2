//variables

var Table = require('cli-table');
var mysql = require('mysql');
var inquirer = require('inquirer');
var colors = require('colors/safe');

//Mysql

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "",
    database: "bamazon_db"
});

connection.connect(function(err) {
    if(err) console.log(err);
    startPrompt();
});

//Inquier

function startPrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "confirm",
        message: "Would you see to view our store?",
        default: true

    }]).then(function(user) {
        if (user.confirm === true) {
            inventory();
        } else {
            console.log("Thank you!");
        }
    });
}

//inventory

function inventory() {

    // instantiate
    var table = new Table({
        head: ['ID', 'Item', 'Department', 'Price', 'Stock'],
        colWidths: [20, 10, 10, 10, 10]
    });

    listInventory();

    function listInventory() {

        connection.query("SELECT * FROM products", function(err, res) {
            for (var i = 0; i < res.length; i++) {

                var itemId = res[i].item_id,
                    productName = res[i].product_name,
                    departmentName = res[i].department_name,
                    price = res[i].price,
                    stockQuantity = res[i].stock_quantity;

              table.push(
                  [itemId, productName, departmentName, price, stockQuantity]
            );
          }
            console.log(table.toString());
            continuePrompt();
        });
    }
}

function continuePrompt() {
    inquirer.prompt([{
        type: "confirm",
        name: "continue",
        message: "Would you like to purchase an item?",
        default: true
    }]).then(function(user) {
        if (user.continue === true) {
            selectionPrompt();
        } else {
            console.log("Thank you! Come back soon!");
        }
    });
}

//Quantity

function selectionPrompt() {

    inquirer.prompt([{

            type: "input",
            name: "inputId",
            message: "Please enter the ID number of the item you would like to purchase.",
        },
        {
            type: "input",
            name: "inputNumber",
            message: "How many units of this item would you like to purchase?",

        }
    ]).then(function(userPurchase) {

        //connect to database to find stock_quantity in database. If user quantity input is greater than stock, decline purchase.

        connection.query("SELECT * FROM products WHERE item_id=?", userPurchase.inputId, function(err, res) {
            for (var i = 0; i < res.length; i++) {

                if (userPurchase.inputNumber > res[i].stock_quantity) {
                    console.log("Insufficient quantity!");
                    startPrompt();
                } else {

                    console.log("Awesome! We can fulfull your order.");
                    console.log("You've selected:");
                    console.log("=====================");
                    console.log("Item: " + res[i].product_name);
                    console.log("Department: " + res[i].department_name);
                    console.log("Price: " + res[i].price);
                    console.log("Quantity: " + userPurchase.inputNumber);
                    console.log("=====================");
                    console.log("Total: " + res[i].price * userPurchase.inputNumber);
                    console.log("=====================");

                    var userStock = (res[i].stock_quantity - userPurchase.inputNumber);
                    var purchaseId = (userPurchase.inputId);
                    confirmPrompt(userStock, purchaseId);
                }
            }
        });
    });
}

//Confirm Purchase

function confirmPrompt(userStock, purchaseId) {

    inquirer.prompt([{

        type: "confirm",
        name: "confirmPurchase",
        message: "Are you sure you would like to purchase this item and quantity?",
        default: true

    }]).then(function(userConfirm) {
        if (userConfirm.confirmPurchase === true) {

            connection.query("UPDATE products SET ? WHERE ?", [{
                stock_quantity: userStock
            }, {
                item_id: purchaseId
            }], function(err, res) {});

            console.log("=================================");
            console.log("Transaction completed. Thank you.");
            console.log("=================================");
            startPrompt();
        } else {
            console.log("=================================");
            console.log("Thank You!");
            console.log("=================================");
            startPrompt();
        }
    });
}
