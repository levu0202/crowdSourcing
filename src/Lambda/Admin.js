import axios from "axios";

const instancep1 = axios.create({
    // baseURL: 'https://sakv15k9hl.execute-api.us-east-1.amazonaws.com/Prod/'
    baseURL: 'https://0um29suci6.execute-api.us-east-1.amazonaws.com/Prod'
});

const instancep2 = axios.create({
    baseURL: ' https://nxs9op302e.execute-api.us-east-1.amazonaws.com/Prod'
});

const instancep3 = axios.create({
    baseURL: 'https://73b6wm9hzf.execute-api.us-east-1.amazonaws.com/Prod'
});

export function listProjectAsAdmin() {
    console.log("Listing Project as an Admin");
    let msg = {}
    let value = JSON.stringify(msg)
    let data = { 'body': value }

    return instancep2.post("/listProjects", data)
}

export function userLogin(name, email) {
    console.log("Logging in with credential, Name: ", name, ", Email: ", email)
    let msg = {}
    msg["name"] = name;
    msg["email"] = email;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

    return instancep1.post("/checkLogInUser", data);
}

export function deleteProjectAsAdmin(projectName){
    console.log("Deleting Project as Admin, Project Name: ", projectName)
    let msg = {}
    msg["projectName"] = projectName;
    let value = JSON.stringify(msg)
    let data = { 'body': value }

    return instancep3.post("/deleteProjectAdmin", data);
}

export function reapProject() {
    console.log("Reaping Project as an Admin");
    let msg = {}
    let value = JSON.stringify(msg)
    let data = { 'body': value }

    return instancep3.post("/reapProject", data)
}