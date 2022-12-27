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
    let getProjects = (type) => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Project WHERE type=? AND isLaunched=?", [type, 1], (error, rows) => {
                    if (error) { return reject(error); }
                    if ((rows)) {
                        return resolve(rows);
                                                                
                    } else {
                        return resolve('');      //if none are launched return an empty list
                    }
                });
            });
            
    }
    //it is possible that true needs to be changed to 1;
    
    //if type is empty, return all projects in list
    let getAllProj = () => {
            return new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Project WHERE isLaunched=?", [1], (error, rows) => {
                    if (error) { return reject(error); }
                    if ((rows)) {
                        return resolve(rows);
                                                                
                    } else {
                        return resolve('');
                    }
                });
            });
            
    }
    
    
    try {
        
        // 1. Query RDS for the first constant value
        
        
        if(info.type == ''){
            const allProj = await getAllProj();
            response.statusCode = 200;
            response.result = allProj;
        }else{
            // ----> These have to be done asynchronously in series, and you wait for earlier 
        // ----> request to complete before beginning the next one
        const projects = await getProjects(info.type);
        
        response.statusCode = 200;
	    response.result = projects;
        }
	    
    } catch (error) {
        console.log("ERROR: " + error);
        response.statusCode = 400;
        response.error = error;
    }
    
    // full response is the final thing to send back
    return response;
}
