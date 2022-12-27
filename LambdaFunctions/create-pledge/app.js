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

        // get raw value or, if a string, then get from database if exists.
        let insertPledge = (amount, numMaxSupport, projectName, reward) => {
            return new Promise((resolve, reject) => {
                pool.query("INSERT INTO Pledge (amount, numMaxSupport, projectName, reward) VALUES(?,?,?,?)", [amount, numMaxSupport, projectName, reward], (error, rows) => {
                    if (error) { return reject(error); }
                    if ((rows) && (rows.length == 1)) {
                        return resolve(JSON.stringify(rows));
                    } else {
                        return resolve(true);
                    }
                });
                
            });
         
        }
    
        let checkPledgeExists = (amount, numMaxSupport, projectName) => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Pledge WHERE amount=? AND numMaxSupport=? AND projectName=?", [amount, numMaxSupport, projectName], (error, rows) => {
                    if (error) { return reject(error); }
                    if ((rows) && (rows.length == 1)) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                });
            });
         
        }
    
        let checkProjectLaunched = (projectName) => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Project WHERE projectName=?", [projectName], (error, rows) => {
                    if (error) { return reject(error); }
                    if ((rows) && (rows.length == 1)) {     // How do i access the project so i can check if it is launched
                        return resolve(rows[0].isLaunched);
                    } else {
                        return resolve(false);
                    }
                });
            });
         
        }
        try {
        
        // 1. Query RDS for the first constant value
        // 2. Query RDS for the second constant value
        // ----> These have to be done asynchronously in series, and you wait for earlier 
        // ----> request to complete before beginning the next one
        const exists = await checkPledgeExists(info.amount, info.numMaxSupport, info.projectName);
        const launched = await checkProjectLaunched(info.projectName);
        console.log("LAUNCHED = " + launched);
        
        // If either is NaN then there is an error
        if (exists) {
            response.statusCode = 400;
            response.error = "Pledge already exists";
        } else if(launched==1){
            response.statusCode = 400;
            response.error = "Project has already been launched";
        } else {
            const inserted = await insertPledge(info.amount, info.numMaxSupport, info.projectName, info.reward);
            if(inserted){
                response.statusCode = 200;
            }else{
                response.statusCode = 400;
                response.error = "Couldn't add pledge ";
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
