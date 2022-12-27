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
    let checkProjectExists = (projectName) => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Project WHERE projectName=?", [projectName], (error, rows) => {
                    if (error) { return reject(error); }
                    console.log(rows);
                    if ((rows) && (rows.length == 1)) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                });
            });
            
    }
    
     let checkSupporterExists = (suppName) => {
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
    
    let getIsLaunched = (projectName) => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Project WHERE projectName=? AND isLaunched=?", [projectName, 1], (error, rows) => {
                    if (error) { return reject(error); }
                    if ((rows) && (rows.length == 1)) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                });
            });
            
    }
    
    let getSuppBudget = (suppName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Supporter WHERE supporterName=?", [suppName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(rows[0].budget);   
                } else { 
                    return reject("Cannot find the supporters budget");
                }
            });
        });
    }
    
    let addDirectSupport = (money, projName, suppName, suppEmail) => {
        return new Promise((resolve, reject) => {
            pool.query("INSERT INTO directSupport (amount, projectName, supporterName, supporterEmail) VALUES(?,?,?,?)", [money, projName, suppName, suppEmail], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if was able to update
                } else { 
                    return resolve(true);   // false if not
                }
            });
        });
    }
    
     let takeSuppMoney = (suppName, newBud) => {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE Supporter SET budget=? WHERE supporterName=?", [newBud,suppName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows)) {
                    return resolve(true);   // TRUE if supporter in rows
                } else { 
                    return reject("could not take money from supporter");   // FALSE if supporter not in rows
                }
            });
        });
    }
    
    let getEmail = (suppName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Supporter WHERE supporterName=?", [suppName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(rows[0].supporterEmail);   
                } else { 
                    return reject("Cannot find the supporters email");
                }
            });
        });
    }
    
        let updateProject = (projectName, amount) => {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE Project SET currentAmount = currentAmount + ? WHERE projectName = ?", [amount, projectName], (error, rows) => {
                if (error) {
                    return reject(error);
                }
                if ((rows) && (rows.length == 1)) {
                    console.log("updateProject: Success")
                    return resolve(true); // TRUE if was able to update
                }
                else {
                    console.log("updateProject: Fail")
                    return resolve(true); // REJECT if couldn't update  WAIT TO CHECK
                }
            });
        });
    }
    
    try {
        
        // 1. Query RDS for the first constant value
        
        // ----> These have to be done asynchronously in series, and you wait for earlier 
        // ----> request to complete before beginning the next one
        const projectExists = await checkProjectExists(info.projectName);
        const supporterExists = await checkSupporterExists(info.supporterName);
        const isLaunched = await getIsLaunched(info.projectName);
        let amount = parseFloat(info.amount);
        
        console.log(projectExists);
      
        //it is possible that true needs to be changed to 1;
        if (!projectExists) {
            response.statusCode = 400;
            response.error = "Project does not exist";
        }else if(!isLaunched){
            response.statusCode = 400;
            response.error = "Project is not launched";
        }else if(!supporterExists){
            response.statusCode = 400;
            response.error = "Supporter does not exist";
        }else if(isNaN(amount)){
            response.statusCode = 400;
            response.error = "Amount for direct support is not a number";
        }else {
            const suppBudget = await getSuppBudget(info.supporterName);
            let suppBud = parseFloat(suppBudget);
            if(isNaN(suppBud)){
                response.statusCode = 400;
                response.error = "supporter budget is not a number";
            }
            else if(amount<=0){
                response.statusCode = 400;
                response.error = "Amount cannot be negative or 0";
            }
            else if(suppBud < amount){
                response.statusCode = 400;
                response.error = "Supporter does not have enough money";
            }
            else{
                let newBud = (suppBud-amount);
                const takeMoney = await takeSuppMoney(info.supporterName, newBud);
                if(takeMoney){
                    const suppEmail = await getEmail(info.supporterName);
                    console.log(suppEmail);
                    const isAdded = await addDirectSupport(info.amount, info.projectName, info.supporterName, suppEmail);
                    const addMoneyToProject = await updateProject(info.projectName, info.amount);
                    
                    if(isAdded){
                        response.statusCode = 200;
                        response.result = amount;
                    }else{
                        response.statusCode = 400;
                        response.error = "Couldn't add direct support to table";
                    }
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
