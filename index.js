// Variable
const mysql = require('mysql');
const config = require('./config.json');
const connection = mysql.createConnection({
    host : config.mysql.host,
    user : config.mysql.user,
    database : config.mysql.database
});

// Utils Function
const sendLog = message => console.log(`[Account-Migrations] ${message}`);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const objectSize = (obj) => {
    let size = 0;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }

    return size;
};

const userAccounts = [];

// First, We fetch black money from user_account.
// Next, We keep black money amount in to account object and set default money, bank to 0.
// Next, We for loop account object and fetch name, money, bank by identifier.
// Next, We keep the result in account object.
// Next, We insert the account object in to user accounts by identifier.
// Done :)

// Connecting to mysql on node running
connection.connect(async (err) => {
    if (err) { return sendLog(err); }

    sendLog(`connecting to mysql done`);
    await delay(1000);

    sendLog(`fetching black money...`);
    await delay(1000);

    // Fetching Accounts (Black Money)
    connection.query('SELECT identifier, name, money FROM user_accounts', async (err, result) => {
        if (err) { return sendLog(err); }
        if (result.length <= 0) { return sendLog(`Cannot fetching accounts (result 0 length)`); }

        // Setting-up user account object and insert black money in to obj
        for (const data of result) {
            userAccounts[data.identifier] = {
                ['money']: 0,
                ['bank']: 0,
                ['black_money']: data.money
            };
        }

        sendLog(`fetching user accounts...`);
        await delay(1000);

        for (const identifier in userAccounts) {
            // Fetching Accounts (Money, Bank)
            connection.query(`SELECT name, money, bank FROM users WHERE identifier = '${identifier}'`, async (err, result) => {
                if (err) { return sendLog(err); }
                if (result.length <= 0) { return sendLog(`Cannot fetching accounts (0 length) [${identifier}]`); }
                
                for (const data of result) {
                    userAccounts[identifier]['money'] = data.money;
                    userAccounts[identifier]['bank'] = data.bank;                            
                }
            });
        }

        await delay(1000);
        sendLog(`All accounts has been keep in object (${objectSize(userAccounts)} accounts)`);
        
        await delay(1000);
        sendLog(`Insert user accounts...`);

        for (const identifier in userAccounts) {
            // Update accounts
            connection.query(`UPDATE users SET accounts = '${JSON.stringify(userAccounts[identifier])}' WHERE identifier = '${identifier}'`, async (err, result) => {
                if (err) { return sendLog(err); }
                
                sendLog(`Account "${identifier}" has been migration: ${JSON.stringify(userAccounts[identifier])}`);                
            });
        }
    });
});