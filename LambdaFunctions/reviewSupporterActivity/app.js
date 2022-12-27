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
            }
            else {
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
    let checkSuppExists = (suppName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Supporter WHERE supporterName=?", [suppName], (error, rows) => {
                if (error) { return reject(error); }
                console.log(rows);
                if ((rows) && (rows.length == 1)) {
                    return resolve(rows[0]);
                }
                else {
                    return reject(suppName + " does not exist as a supporter");
                }
            });
        });

    }
    
    // SELECT * FROM ClaimPledgeActivity WHERE supporterName=? AND isSuccessful=?
    //"SELECT ClaimPledgeActivity.projectName, ClaimPledgeActivity.amount, Pledge.reward FROM ClaimPledgeActivity INNER JOINS Pledge ON ClaimPledgeActivity.pledgeID=Pledge.pledgeID WHERE supporterName=? AND isSuccessful=?"
    let getPastSuccessPledges = (suppName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT ClaimPledgeActivity.projectName, ClaimPledgeActivity.amount, Pledge.reward FROM ClaimPledgeActivity INNER JOIN Pledge ON ClaimPledgeActivity.pledgeID=Pledge.pledgeID AND ClaimPledgeActivity.supporterName=? AND isSuccessful=?", [suppName, 1], (error, rows) => {
                if (error) { return reject(error); }
                return resolve(rows);
            });
        });

    }

    let getCurrPledges = (suppName) => {
        return new Promise((resolve, reject) => { //maybe dont need isSuccessful bc if its only made successful after the project is no longer current
            pool.query("SELECT ClaimPledgeActivity.projectName, ClaimPledgeActivity.amount, Pledge.reward FROM ClaimPledgeActivity INNER JOIN Pledge ON ClaimPledgeActivity.pledgeID=Pledge.pledgeID AND ClaimPledgeActivity.supporterName=? AND isSuccessful=?", [suppName, 0], (error, rows) => {
                if (error) { return reject(error); }
                return resolve(rows);
            });
        });

    }

    let getdirectSupportForSupporter = (suppName) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM directSupport WHERE supporterName=?", [suppName], (error, rows) => {
                if (error) { return reject(error); }
                return resolve(rows);
            });
        });

    }

    let getPledgesInfo = () => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Pledge", (error, rows) => {
                if (error) { return reject(error); }
                return resolve(rows);
            });
        });
    }

    try {

        // 1. Query RDS for the first constant value

        // ----> These have to be done asynchronously in series, and you wait for earlier 
        // ----> request to complete before beginning the next one
        const supporter = await checkSuppExists(info.supporterName);
        const pastSuccessPledges = await getPastSuccessPledges(info.supporterName);
        const currPledges = await getCurrPledges(info.supporterName);
        const ds = await getdirectSupportForSupporter(info.supporterName);
        const pledgesInfo = await getPledgesInfo();
        console.log(supporter);


        //it is possible that true needs to be changed to 1;

        // otherwise SUCCESS!
        response.statusCode = 200;
        var resultDict = {};
        resultDict["past successful pledges"] = pastSuccessPledges;
        resultDict["current pledges"] = currPledges;
        resultDict["direct support"] = ds;
        resultDict["supporter"] = supporter;
        resultDict["pledgesInfo"] = pledgesInfo;

        response.result = resultDict;
        //response.result = result.toString();

    }
    catch (error) {
        console.log("ERROR: " + error);
        response.statusCode = 400;
        response.error = error;
    }
    // full response is the final thing to send back
    return response;
}
