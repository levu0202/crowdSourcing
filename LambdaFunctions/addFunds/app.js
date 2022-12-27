// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const mysql = require('mysql');

var config = require('./config.json');
var pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

// https://www.freecodecamp.org/news/javascript-promise-tutorial-how-to-resolve-or-reject-promises-in-js/#:~:text=Here%20is%20an%20example%20of,message%20Something%20is%20not%20right!%20.
function query(conx, sql, params) {
    return new Promise((resolve, reject) => {
        conx.query(sql, params, function(err, rows) {
            if (err) {
                // reject because there was an error
                reject(err);
            } else {
                // resolve because we have result(s) from the query. it may be an empty rowset or contain multiple values
                resolve(rows);
            }
        });
    });
}


// Take in as input a payload.
//
// {  body: '{    "arg1" : "project1"}'
//
// }
//
// ===>  { "result" : "12" }
//
exports.lambdaHandler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

   // ready to go for CORS. To make this a completed HTTP response, you only need to add a statusCode and a body.
    let response = {
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*", // Allow from anywhere
            "Access-Control-Allow-Methods": "POST" // Allow POST request
        }
    }; // response


    let actual_event = event.body;
    let info = JSON.parse(actual_event);
    console.log("info:" + JSON.stringify(info)); //  info.arg1 and info.arg2

    //var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    // get raw value or, if a string, then get from database if exists.
    let checkSupporterExistence = (suppName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Supporter WHERE supporterName=?", [suppName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    //maybe need to add funds a different way
    let addTheFunds = (amount, suppName) => {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE Supporter SET budget=? WHERE supporterName=?", [amount,suppName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows)) {
                    return resolve(true);   // TRUE if supporter in rows
                } else { 
                    return resolve(false);   // FALSE if supporter not in rows
                }
            });
        });
    }
    
    let getSupporter = (supporterName) => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Supporter WHERE supporterName=?", [supporterName], (error, rows) => {
                    if (error) { return reject(error); }
                    console.log(rows);
                    if ((rows) && (rows.length == 1)) {
                        return resolve(rows[0]);
                    } else {
                        return reject(supporterName + "' is not a supporter");
                    }
                });
            });
    }
    
    let getBudget = (supporterName) => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT budget FROM Supporter WHERE supporterName=?", [supporterName], (error, rows) => {
                    if (error) { return reject(error); }
                    console.log(rows);
                    if ((rows) && (rows.length == 1)) {
                        return resolve(rows[0].budget);
                    } else {
                        return reject("could not get budget");
                    }
                });
            });
    }

    try {
        
        // 1. Query RDS for the first constant value
        
        // ----> These have to be done asynchronously in series, and you wait for earlier 
        // ----> request to complete before beginning the next one
        const doesSupporterExist = await checkSupporterExistence(info.supporterName);
        if (!doesSupporterExist) {
            response.statusCode = 400;
            response.error = "Supporter does not exist";
        }else{
            console.log(doesSupporterExist);
            const thebudget = await getBudget(info.supporterName);
            console.log(thebudget);
            let budget = parseFloat(thebudget);
            let amountToAdd = parseFloat(info.fundToAdd);
        
            //it is possible that true needs to be changed to 1;
            if(isNaN(budget)){
                response.statusCode = 400;
                response.error = "Budget is not a number";
            }else if(isNaN(amountToAdd)){
                response.statusCode = 400;
                response.error = "Amount to add is not a number";
            }else if(info.fundToAdd< 0){
                response.statusCode = 400;
                response.error = "Invalid transaction: Fund amount cannot be negative";
            }
            else {
                let added = (budget + amountToAdd);
                console.log(added);
                console.log(info.fundToAdd);
                const addfunds = await addTheFunds(added, info.supporterName);
                
                // otherwise SUCCESS!
                if(addfunds){
                    const supp = await getSupporter(info.supporterName);
                    response.statusCode = 200;
                    response.result = supp;
                }
                else{
                    response.statusCode = 400;
                    response.error = "Funds could not be added";
                }
            }
        }
        
    } catch (error) {
        console.log("ERROR: " + error);
        response.statusCode = 400;
        response.error = error;
    }
    // full response is the final thing to send back
    return response;
}
