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

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    
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
    console.log("info:" + JSON.stringify(info));
    
    
    
    let CheckProjectExistence = (projectName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE projectName=?", [projectName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let launchProject = (projectName) => {
        return new Promise((resolve, reject) => {
            pool.query("UPDATE Project SET isLaunched = 1 WHERE projectName = ?", [projectName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    
    let CheckProjectLaunched = (projectName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE projectName=?", [projectName], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1))
                {
                    return resolve(rows[0].isLaunched)
                }
                else
                {
                    return resolve(false)
                }
            });
        });
    }
    
    
    
    try {
        // const ret = await axios(url);
        const exists = await CheckProjectExistence(info.projectName);
        
        
        if (exists) {
            
            const isLaunched = await CheckProjectLaunched(info.projectName);
            if (isLaunched == 1) {
                response.statusCode = 400;
                response.error = "Project already launched";
            } else {
                const launched = await launchProject(info.projectName);
                if (launched)
                {
                    response.statusCose = 200;
                }
                else
                {
                    response.statusCode = 400;
                    response.error = "Launch Project error"
                }
            }
        } else {
            response.statusCode = 400;
            response.error = "Project doesn't exsits. Project cannot be launcehd";
        }
        
    } catch (error) {
        console.log("ERROR: " + error);
        response.statusCode = 400;
        response.error = error;
    }

    return response
};
