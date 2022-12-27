import axios from "axios";

const instancep1 = axios.create({
    // baseURL: 'https://sakv15k9hl.execute-api.us-east-1.amazonaws.com/Prod/'
    baseURL: 'https://0um29suci6.execute-api.us-east-1.amazonaws.com/Prod'
});

const instancep2 = axios.create({
    baseURL: ' https://nxs9op302e.execute-api.us-east-1.amazonaws.com/Prod'
});

export function registerDesigner(name, email) {
    console.log("Registering designer... Name: ", name, ", Email:", email);
    let msg = {}
    msg["name"] = name;
    msg["email"] = email;
    let value = JSON.stringify(msg)
    let data = { 'body': value }
    return instancep1.post("/registerDesigner", data);
}

export function createProject(name, story, genre, goal, deadline, designer) {
    console.log("Creating Project... With ", name, ", ", story, ", ", genre, ", ", goal, ", ", deadline, ", ", designer);
    let msg = {}
    msg["projectName"] = name;
    msg["story"] = story;
    msg["designerName"] = designer;
    msg["type"] = genre;
    msg["goal"] = goal;
    msg["deadline"] = deadline;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

    return instancep1.post("/createProject", data);
}

export function createPledge(reward, amount, numMaxSupport, projectName) {
    console.log("Creating Pledge... Reward: ", reward, ", Amount: ", amount, ", numMaxSupport: ", numMaxSupport, ", project: ", projectName);
    let msg = {}
    msg["reward"] = reward;
    msg["amount"] = amount;
    if(numMaxSupport===''){
        msg["numMaxSupport"] = 1000000;
    } else {
        msg["numMaxSupport"] = numMaxSupport;
    }
    msg["projectName"] = projectName;
    let value = JSON.stringify(msg)
    let data = { 'body': value }
    return instancep2.post("/createPledge", data)
}

export function listProjectAsDesigner(name) {
    console.log("Listing Project as a Designer");
    let msg = {}
    msg["designerName"] = name;
    let value = JSON.stringify(msg)
    let data = { 'body': value }
    return instancep1.post("/listProject", data)
}

export function viewProjectAsDesigner(name) {
    console.log("Viewinging Project as a Designer, Project Name: ", name);
    let msg = {}
    msg["projectName"] = name;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

   return instancep2.post("/viewProject", data)
}

export function deleteProjectAsDesigner(name){
    console.log("Deleting Project as a Designer, Project Name: ", name);
    let msg = {}
    msg["projectName"] = name;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

   return instancep1.post("/deleteProject", data)
}

export function deletePledge(id){
    console.log("Deleting Pledge as a Designer, Pledge: ", id);
    let msg = {}
    msg["pledgeID"] = id;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

   return instancep1.post("/deletePledge", data)
}

export function launchProject(name){
    console.log("Launching Project as a Designer, Project Name: ", name);
    let msg = {}
    msg["projectName"] = name;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

   return instancep1.post("/launchProject", data)
}

export function reviewProjectActivity(name){
    console.log("Reviewing Project as a Designer, Project Name: ", name);
    let msg = {}
    msg["projectName"] = name;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

   return instancep2.post("/reviewProjectActivity", data)
}