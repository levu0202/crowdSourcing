import React from 'react';
import { layout } from './layout.js';
import Modal from "./Component/Modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faSearch } from '@fortawesome/free-solid-svg-icons';
// import axios from "axios";
import { createPledge, createProject, deleteProjectAsDesigner, launchProject, listProjectAsDesigner, registerDesigner, viewProjectAsDesigner, deletePledge, reviewProjectActivity } from './Lambda/Designer';
import { addFund, claimPledge, registerSupporter, reviewSupporterActivity, searchProject, viewPledge, viewProjectAsSupporter, directSupport, viewBudget, searchProjectKeyword } from './Lambda/Supporter.js';
import { deleteProjectAsAdmin, listProjectAsAdmin, reapProject, userLogin } from './Lambda/Admin.js';

function App() {
  const [dbData, setdbData] = React.useState([]);

  // 0: Register designer, 1: Register Supporter, 2: Create Project, 3: Create Pledge, 4: Admin LogIn
  const [modalScreen, setModalScreen] = React.useState(0);
  const [showModal, setModal] = React.useState(false);  // true: show modal, false: hide modal

  const [role, setRole] = React.useState('visitor');  // designer, supporter, admin, visitor

  // designer states
  const [designerView, setDesignerView] = React.useState(0);    // 0 : no project, 1: brief project, 2: project view 
  const [currAcctName, setCurrAcctName] = React.useState(''); // TODO: Identify designer 
  const [currAcctEmail, setCurrAcctEmail] = React.useState(''); // TODO: Identify designer 
  const [pj, setPj] = React.useState('');
  const [pjRaised, setPjRaised] = React.useState('');
  const [pjGoal, setPjGoal] = React.useState('');
  const [pjPledge, setPjPledge] = React.useState([]);
  const [pjLaunched, setPjLaunched] = React.useState(1);
  const [pjClaimActivity, setClaimActivity] = React.useState([]);
  const [pjDSList, setDSList] = React.useState([]);

  // supporter states 
  const [supportView, setSupporterView] = React.useState(0); // 0: no project, 1: search results, 2: project view
  const [supporterBudget, setBudget] = React.useState(0);
  const [pastSusPledges, setPastSuccessfulPledges] = React.useState([]);
  const [pastDS, setPastDS] = React.useState([]);
  const [currPledge, setCurrPledge] = React.useState([]);
  const [pjSuccess, setPjSuccess] = React.useState(0);
  const [pledgeinfo, setPledgeInfo] = React.useState([]);

  // admin states
  const [adminView, setAdminView] = React.useState(0);    // 0 : no project, 1: all project

  // Register Window
  const showRegModal = id => {
    setModalScreen(id);       // Tell Modal which screen to display
    setModal(!showModal);     // Show Modal
  };

  // Use Case: Register Stuff into Database
  const handleRegister = id => {
    // Register Designer: id = 0
    if (id === 0) {
      let name = document.getElementById("regUsername").value;
      let email = document.getElementById("regEmail").value;
      registerDesigner(name, email)
        .then(function (response) {
          console.log("Designer has been registered");
          setRole('designer');
          setCurrAcctName(name);
          setCurrAcctEmail(email);
          setModal(!showModal);
        })
        .catch(function (error) {
          console.log("Cannot register designer: ", error);
        })

    }
    // Register Supporter: id = 1
    else if (id === 1) {
      let name = document.getElementById("regUsername").value;
      let email = document.getElementById("regEmail").value;
      registerSupporter(name, email)
        .then(function (response) {
          console.log("Supporter has been registered");
          setRole('supporter');
          setCurrAcctName(name);  //TODO: might be better to turn this into current account name
          setCurrAcctEmail(email);
          setModal(!showModal);
        })
        .catch(function (error) {
          console.log("Cannot register supporter: ", error);
        })
      // TODO: handle response, e.g. error handling

    }
    // Create Project: id = 2 
    else if (id === 2) {
      let projectName = document.getElementById("newProjName").value;
      let projectStory = document.getElementById("newProjStory").value;
      let projectType = document.getElementById("newProjGenre").value;
      let projectGoal = document.getElementById("newProjGoal").value;
      let projectDeadline = document.getElementById("newProjDeadline").value;
      createProject(projectName, projectStory, projectType, projectGoal, projectDeadline, currAcctName)
        .then(function (response) {
          console.log("Successfully created project")
          setModal(!showModal);
          handleListProject(0);
        })
        .catch(function (error) {
          console.log("Error creating project: ", error)
          // TODO: handle response, e.g. error handling
        })


    }
    // Create Pledge: id = 3 
    else if (id === 3) {
      let reward = document.getElementById("newPledgeReward").value;
      let amount = document.getElementById("newPledgeAmt").value;
      let numMaxSupport = document.getElementById("newPledgeMaxSupport").value;
      let projectName = document.getElementById("pjName").value;
      createPledge(reward, amount, numMaxSupport, projectName)
        .then(function (response) {
          console.log("Successfully created pledge");
          setModal(!showModal);
        })
        .catch(function (error) {
          console.log("Cannot create pledge: ", error)
        })

    }
    // Log In: id = 4
    else if (id === 4) {
      let name = document.getElementById("loginName").value;
      let email = document.getElementById("loginEmail").value;
      let loginRole;
      userLogin(name, email)
        .then(function (response) {
          loginRole = response.data.result;
          console.log("Successfully log in as a ", loginRole, " , name:", name);
          if(loginRole === 'supporter'){
            handleViewBudget(name, email);
          }
          setRole(loginRole);
          setCurrAcctName(name);
          setCurrAcctEmail(email);
          setModal(!showModal);
        })
        .catch(function (error) {
          console.log("Cannot log in ", error)
        })
    }
    // Add Fund: id = 5
    else if (id === 5) {
      let name = document.getElementById("loginName").value;
      let fund = document.getElementById('fund').value;
      if (fund === '') {
        console.log('Add fund: Amount is empty')
        document.getElementById('addFundError').value = "Amount cannot be empty!";
      }
      else {
        document.getElementById('addFundError').value = "";
        // TODO: LAMBDA FUNCTION: ADD FUND
        addFund(name, fund)
          .then(function (response) {
            console.log("Successfully added fund");
            handleViewBudget(currAcctName, currAcctEmail);
            setModal(!showModal);
          })
          .catch(function (error) {
            console.log("Cannot add fund ", error)
          })
        setModal(!showModal);
      }


    }
    // Direct Support from Supporter: id = 6
    else if (id === 6) {
      let name = document.getElementById("loginName").value;
      let projectName = document.getElementById('pjName').value;
      let ds = document.getElementById('directsupport').value;
      if (ds === '') {
        console.log('Direct Support: Amount is empty')
        document.getElementById('directsupportError').value = "Amount cannot be empty!";
      }
      else {
        document.getElementById('directsupportError').value = "";
        // TODO: LAMBDA FUNCTION: DIRECT SUPPORT
        directSupport(name, ds, projectName)
          .then(function (response) {
            console.log("Status code ", response.data.statusCode)
            if (response.data.statusCode === 200) {
              console.log("Successfully given a direct support ", response);
              setModal(!showModal);
              handleViewProjectSupporter(projectName);
              handleViewBudget(currAcctName, currAcctEmail);
            } else if (response.data.statusCode === 400) {
              document.getElementById('directsupportError').value = response.data.error;
            }

          })
          .catch(function (error) {
            console.log("Cannot give direct support ", error)
          })
      }
    }

  };

  //-----------Designer-------------
  // Create Project: Designer
  const handleCreateProject = e => {
    setModalScreen(2);
    setModal(!showModal);
  }

  // List Project: Designer, Admin
  const handleListProject = id => {
    // id = 0 = designer
    if (id === 0) {
      setDesignerView(1);
      listProjectAsDesigner(currAcctName)
        .then(function (response) {
          console.log("Designer - Listing project: ", response)
          let output_list = response.data.result;
          setdbData(output_list);
        })
        .catch(function (error) {
          console.log("Cannot list project as desginer: ", error)
        })
    }
    // id = 2 = admin
    else if (id === 2) {
      setAdminView(1);
      listProjectAsAdmin()
        .then(function (response) {
          console.log("Admin - Listing project:", response)
          let output_list = response.data.result;
          setdbData(output_list);
        })
        .catch(function (error) {
          console.log("Cannot list project as admin: ", error)
        })
    }
  }

  const calculateSupporter = pledgeList => {
    let currentAmt = 0;
    pledgeList.forEach(function (pledge) {
      currentAmt += pledge.numOfSupport;
    });
    return currentAmt;
  }

  const calculateCurrent = pledgeList => {
    let currentAmt = 0;
    pledgeList.forEach(function (pledge) {
      let amtPerEntry = pledge.amount * pledge.numOfSupport;
      currentAmt += amtPerEntry;
    });
    return currentAmt;
  }

  const calculateDS = dsList => {
    let currentAmt = 0;
    dsList.forEach(function (ds) {
      let amtPerEntry = ds.amount;
      currentAmt += amtPerEntry;
    });
    return currentAmt;
  }

  // View Project: Designer
  const handleViewProject = name => {
    setDesignerView(2);
    viewProjectAsDesigner(name)
      .then(function (response) {
        let output = response.data.result;
        console.log("Viewing Project now", output)
        document.getElementById("pjName").value = output.project.projectName;
        document.getElementById("pjType").value = output.project.type;
        document.getElementById("pjStory").value = output.project.story;
        document.getElementById("pjDesigner").value = output.project.designerName;
        // document.getElementById("pjCurrAmt").value = calculateCurrent(output.pledges) + calculateDS(output["Direct Support"]);
        document.getElementById("pjCurrAmt").value = output.project.currentAmount;
        document.getElementById("pjGoalAmt").value = output.project.goal;
        document.getElementById("pjNumSupporter").value = calculateSupporter(output.pledges);
        document.getElementById("pjDeadline").value = output.project.deadline.substring(0, 10);
        if (output.project.isLaunched === 1) {
          document.getElementById("pjLaunch").value = "Launched";
          setPjLaunched(1);
        } else {
          document.getElementById("pjLaunch").value = "Not yet launch";
          setPjLaunched(0);
        }
        setPjPledge(output.pledges);
      })
      .catch(function (error) {
        console.log("Cannot view project: ", error)
      })

  }

  // Delete Project: Designer
  const handleDeleteProject = name => {
    deleteProjectAsDesigner(name)
      .then(function (response) {
        console.log("Project has been deleted")
        handleListProject(0);   // go back to project list
      })
      .catch(function (error) {
        console.log("Cannot delete project: ", error)
      })
  }

  // Launch Project: Designer
  const handleLaunchProject = name => {
    launchProject(name)
      .then(function (response) {
        console.log("Project has been launch")
        handleViewProject(name);   // refresh project view
      })
      .catch(function (error) {
        console.log("Cannot launch project: ", error)
      })
  }

  // Create Pledge: Designer
  const handleCreatePledge = name => {
    console.log("handleCreatePledge: ", name);
    setModalScreen(3);
    setModal(!showModal);
  }

  // Delete Pledge: Designer
  const handleDeletePledge = id => {
    console.log("Deleting Pledge with ID: ", id);
    deletePledge(id)
      .then(function (response) {
        console.log("Pledge has been deleted")
      })
      .catch(function (error) {
        console.log("Cannot delete pledge: ", error)
      })

  }

  // Show Pledge Detail: Designer
  const showPledgeDetail = (pledge, projectName) => {
    showRegModal(7)
    viewPledge(pledge.pledgeID, projectName)
      .then(function (response) {
        console.log("Viewing Pledge now, response: ", response)
        let output = response.data.result;
        let activity = output.activity;
        document.getElementById("pledgeID").value = output.pledge.pledgeID;
        document.getElementById("pledgeReward").value = output.pledge.reward;
        document.getElementById("pledgeAmt").value = '$' + output.pledge.amount;
        document.getElementById("pledgeCurrSupport").value = output.pledge.numOfSupport;
        if(output.pledge.numMaxSupport === 1000000){
          document.getElementById("pledgeMaxSupport").value = 'unlimited';
        } else { document.getElementById("pledgeMaxSupport").value = output.pledge.numMaxSupport; } 
        document.getElementById("pledgeSupporter").value = compileSupporterList(activity);
      })
      .catch(function (error) {
        console.log("Cannot view pledge: ", error)
      })

  }

  // TODO: Review Project Activity: Designer
  const handleReviewProject = name => {
    // 1. Fetch POST request to get project activity
    // 2. Change Designer View to 3

    let projectName = name;
    setPj(name);
    reviewProjectActivity(projectName)
      .then(function (response) {
        let claimActivity = response.data.result["pledges"];
        let directSupportList = response.data.result["Direct Support"];
        let raised = response.data.result.project.currentAmount;
        let goal = response.data.result.project.goal;
        setClaimActivity(claimActivity);
        setDSList(directSupportList);
        setPjRaised(raised);
        setPjGoal(goal);
        console.log(response)

        setDesignerView(3);
        console.log("projectName = ", projectName)
        // DISPLAY INFORMATION
      })
      .catch(function (error) {
        console.log("Cannot review project: ", error)
      })
  }

  //-----------Supporter-------------
  // Search Project: Supporter
  const handleSearchProject = type => {
    console.log("Searching Project with this type: ", type);
    searchProject(type)
      .then(function (response) {
        console.log("Supporter - Searching project with keyword: ", response)
        let output_list = response.data.result;
        console.log(output_list)
        setdbData(output_list);
        setSupporterView(1)
      })
      .catch(function (error) {
        console.log("Cannot search project: ", error)
      })
  }

  // Search Project with Keyword: Supporter
  const handleSearchKeyword = type => {
    console.log("Searching Project with these keywords: ", type);
    searchProjectKeyword(type)
      .then(function (response) {
        console.log("Supporter - Searching project with keyword: ", response)
        let output_list = response.data.result;
        console.log(output_list)
        setdbData(output_list);
        setSupporterView(1)
      })
      .catch(function (error) {
        console.log("Cannot search project: ", error)
      })
  }

  // View Project: Supporter
  const handleViewProjectSupporter = name => {
    setSupporterView(2);  // #1: Change view
    viewProjectAsSupporter(name)  // #2: Get project detail via POST request
      .then(function (response) {
        console.log("Viewing Project now as Supporter", response)
        let output = response.data.result;  // #3: Display project details from POST request
        document.getElementById("pjName").value = output.project.projectName;
        document.getElementById("pjType").value = output.project.type;
        document.getElementById("pjStory").value = output.project.story;
        document.getElementById("pjDesigner").value = output.project.designerName;
        // document.getElementById("pjCurrAmt").value = calculateCurrent(output.pledges) + calculateDS(output["Direct Support"]);
        document.getElementById("pjCurrAmt").value = output.project.currentAmount;
        document.getElementById("pjGoalAmt").value = output.project.goal;
        document.getElementById("pjNumSupporter").value = calculateSupporter(output.pledges);
        document.getElementById("pjDeadline").value = output.project.deadline.substring(0, 10);
        setPjPledge(output.pledges);  // #4: Set pledge details from POST request
        setPjSuccess(output.project.isSuccessful);
      })
      .catch(function (error) {
        console.log("Cannot view project: ", error)
      })
  }

  // Compile the list of supporter
  const compileSupporterList = activity => {
    let supporterNameList = "";
    let toomuch = false;
    let count = 0;
    activity.forEach(function (entry) {
      if (!toomuch) {
        supporterNameList = supporterNameList.concat(entry.supporterEmail, ", ");
        count++;
      }
      if (count === 4) {
        toomuch = true;
        supporterNameList = supporterNameList.concat("Et al.... ");
      }
    });
    return supporterNameList;
  }

  // View Pledge: Supporter
  const handleViewPledge = (pledgeid, projectName) => {
    showRegModal(5)
    viewPledge(pledgeid, projectName)
      .then(function (response) {
        console.log("Viewing Pledge now, response: ", response)
        let output = response.data.result;
        let activity = output.activity;
        document.getElementById("pledgeID").value = output.pledge.pledgeID;
        document.getElementById("pledgeReward").value = output.pledge.reward;
        document.getElementById("pledgeAmt").value = '$' + output.pledge.amount;
        document.getElementById("pledgeCurrSupport").value = output.pledge.numOfSupport;
        if(output.pledge.numMaxSupport === 1000000){
          document.getElementById("pledgeMaxSupport").value = 'unlimited';
        } else { document.getElementById("pledgeMaxSupport").value = output.pledge.numMaxSupport; } 
        document.getElementById("pledgeSupporter").value = compileSupporterList(activity);
      })
      .catch(function (error) {
        console.log("Cannot view pledge: ", error)
      })

  }

  // Claim Pledge: Supporter
  const handleClaimPledge = (pledgeid, projectName) => {
    claimPledge(pledgeid, currAcctName, currAcctEmail, projectName)
      .then(function (response) {
        if (response.data.statusCode === 200) {
          console.log("Successfully claimed pledge", response);
          setModalScreen(6);
          handleViewBudget(currAcctName, currAcctEmail);
        } else if (response.data.statusCode === 400) {
          document.getElementById('claimError').value = response.data.error;
        }
      })
      .catch(function (error) {
        console.log("Cannot claim pledge: ", error)
      })
  }

  // Review Supporter Activity: Supporter
  const handleReviewSupporter = (name, email) => {

    reviewSupporterActivity(name, email)
      .then(function (response) {
        console.log(response)
        let pastSuccessfulPledges = response.data.result["past successful pledges"];
        setPastSuccessfulPledges(pastSuccessfulPledges);
        let currentPledges = response.data.result["current pledges"];
        setCurrPledge(currentPledges);
        let pastDirectSupport = response.data.result["direct support"];
        setPastDS(pastDirectSupport);
        setSupporterView(3);
        // DISPLAY INFORMATION
      })
      .catch(function (error) {
        console.log("Cannot view supporter activity: ", error)
      })
  }

  // View Budget

  const handleViewBudget = (name, email) => {
    viewBudget(name, email)
      .then(function (response) {
        console.log(response)
        console.log("Budget = ",response.data.result[0].budget)
        setBudget(response.data.result[0].budget)
        // DISPLAY INFORMATION
      })
      .catch(function (error) {
        console.log("Cannot view supporter fund: ", error)
      })
  }

  //------------Admin--------------

  // Delete Project: Admin
  const handleDeleteProjectAdmin = (projectName) => {
    // TODO: Switch back to Admin
    deleteProjectAsAdmin(projectName)
      .then(function (response) {
        console.log("Project has been deleted")
        handleListProject(2);   // go back to project list
      })
      .catch(function (error) {
        console.log("Cannot delete project: ", error)
      })
  }

  // Reap Project: Admin
  const reapProjectAsAdmin = () => {
    reapProject()
      .then(function (response) {
        console.log("Daily Reaping Done")
        handleListProject(2);   // go back to project list
      })
      .catch(function (error) {
        console.log("Cannot delete project: ", error)
      })
  }


  return (
    <div>
      <div>
        <h2 style={layout.title}>Ua Mau ke Ea o ka 'Āina i ka Pono Crowdsourcing </h2>
      </div>
      <div style={layout.sidebar}>
        {/* VISITOR VIEW */}
        {role === 'visitor' && (
          <>
            {/* Project Window */}
            <div style={layout.projectWindow} />
            <div>
              {/* Sidebar */}
              <button type="button" style={layout.button0} onClick={() => showRegModal(0)}> Register as Designer </button>
              <button type="button" style={layout.button1} onClick={() => showRegModal(1)}> Register as Supporter </button>
              <button type="button" style={layout.button2} onClick={() => showRegModal(4)}> Log In</button>
            </div>
          </>
        )
        }
        {/* SUPPORTER VIEW */}
        {role === 'supporter' && (
          <>
            <div>
              {/* Default View : No Project */}
              {supportView === 0 && (
                <>
                  <div style={layout.projectWindow} />
                </>
              )
              }
              {/* Project List View, triggered after search project*/}
              {supportView === 1 && (
                <>
                  <div style={layout.projectWindow}>
                    {dbData.filter(project => project.isFail === 0).map(item => (
                      <div key={item.projectName} style={layout.indivProject}>
                        <div style={layout.projectDetails}>{" Project Name: " + item.projectName}</div>
                        <div style={layout.projectDetails}>{" Story: " + item.story}</div><p></p>
                        <button type="button" style={layout.viewProjectButton} onClick={() => handleViewProjectSupporter(item.projectName)}>View Project</button>
                      </div>
                    ))}
                  </div>
                </>
              )
              }
              {/* Project View, triggered after view project */}
              {supportView === 2 && (
                <>
                  <div style={layout.projectView}>
                    <p></p>
                    Name: <input id="pjName" style={layout.displayDetails} readOnly /><p></p>
                    Type: <input id="pjType" style={layout.displayDetails} readOnly /><p></p>
                    Story: <input id="pjStory" style={layout.displayLongDetails} readOnly /><p></p>
                    Designer username: <input id="pjDesigner" style={layout.displayDetails} readOnly /><p></p>
                    Current/Goal Amount: <input id="pjCurrAmt" style={layout.currentAmt} readOnly /> out of <input id="pjGoalAmt" style={layout.displayDetails} readOnly /><p></p>
                    Number of Supporter:<input id="pjNumSupporter" style={layout.displayDetails} readOnly /><p></p>
                    Deadline: <input id="pjDeadline" style={layout.displayDetails} readOnly /><p></p>
                    Pledge: (Click to view pledge and claim!)
                    <p></p>
                    {pjPledge.map(pledge => (
                      <ul>
                        {pjSuccess === 1 ?
                          <div><label style={layout.flatPledgeDetails}>{"$" + pledge.amount + " - " + pledge.reward}</label></div>
                          :
                          <div><button type="button" style={layout.pledgeDetails} onClick={(e) => handleViewPledge(pledge.pledgeID, document.getElementById("pjName").value)}>{"$" + pledge.amount + " - " + pledge.reward}</button></div>
                        }
                      </ul>
                    ))}

                    <p></p>
                    <button type="button" style={{ position: "absolute", bottom: '10%', width: '100px', height: '50px', fontFamily: "Monaco, monospace", }} onClick={(e) => handleViewProjectSupporter(document.getElementById("pjName").value)}>Refresh</button><p></p>
                    <button style={{ position: "absolute", bottom: '10%', right: '30%', width: '100px', height: '50px', fontFamily: "Monaco, monospace" }} type="button" onClick={() => handleSearchProject('')}>Back</button>
                    {pjSuccess === 1 ? <button style={{ position: "absolute", top: '10%', right: '30%', width: '200px', height: '50px', fontFamily: "Monaco, monospace" }}>Goal Achieved!</button>
                      : <button style={{ position: "absolute", top: '10%', right: '30%', width: '200px', height: '50px', fontFamily: "Monaco, monospace" }} type="button" onClick={() => showRegModal(9)}>Direct Support</button>
                    }
                  </div>
                </>
              )
              }
              {/* Supporter Activity View */}
              {supportView === 3 && (
                <>
                  <div style={layout.projectView}>
                    Direct Support: <p></p>
                    {pastDS.map(ds => (
                      <ul>
                        <div>
                          {"-$" + ds.amount + " - " + ds.projectName}
                        </div>
                      </ul>
                    ))}
                    Past Successful Pledges: <p></p>
                    {pastSusPledges.map(ds => (
                      <ul>
                        <div>
                          {"-$" + ds.amount + " - " + ds.projectName + " - " + ds.reward}
                        </div>
                      </ul>
                    ))}
                    Current Pledges: <p></p>
                    {currPledge.map(ds => (
                      <ul>
                        <div>
                          {"-$" + ds.amount + " - " + ds.projectName + " - " + ds.reward}
                        </div>
                      </ul>
                    ))}
                  </div>
                </>
              )
              }
            </div>
            <div>
              {/* Sidebar */}
              <input type="text" style={layout.searchBar} placeholder=" Search by Genre.." id="searchbar" />
              <button type="submit" style={layout.searchButton} onClick={(e) => handleSearchProject(document.getElementById("searchbar").value)}><FontAwesomeIcon icon={faSearch} size={'1x'} /></button>
              <input type="text" style={layout.searchBar2} placeholder=" Search by Description.." id="searchbar2" />
              <button type="submit" style={layout.searchButton2} onClick={(e) => handleSearchKeyword(document.getElementById("searchbar2").value)}><FontAwesomeIcon icon={faSearch} size={'1x'} /></button>
              <button type="button" style={layout.display2}> {"Welcome Back! " + currAcctName}</button>
              <button type="button" style={layout.display3} onClick={(e) => handleViewBudget(currAcctName, currAcctEmail)}> {"Budget: " + supporterBudget}</button>
              <button type="button" style={layout.button4} onClick={(e) => showRegModal(8)}> Add Fund</button>
              <button type="button" style={layout.button5} onClick={(e) => handleReviewSupporter(currAcctName, currAcctEmail)}> Account Activity</button>
            </div>
          </>
        )
        }
        {/* DESIGNER VIEW */}
        {role === 'designer' && (
          <>
            <div>
              {/* Default View : No Project */}
              {designerView === 0 && (
                <>
                  <div style={layout.projectWindow} />
                </>
              )
              }
              {/* Project List View */}
              {designerView === 1 && (
                <>
                  <div style={layout.projectWindow}>
                    {dbData.filter(project => project.designerName === currAcctName).map(item => (
                      <div key={item.projectName} style={layout.indivProject}>
                        <div style={layout.projectDetails}>{" Project Name: " + item.projectName}</div>
                        <div style={layout.projectDetails}>{" Story: " + item.story}</div><p></p>
                        <button type="button" style={layout.viewProjectButton} onClick={() => handleViewProject(item.projectName)}>View Project</button>
                      </div>
                    ))}
                  </div>
                </>
              )
              }
              {/* Project View */}
              {designerView === 2 && (
                <>
                  <div style={layout.projectView}>
                    <p></p>
                    Name: <input id="pjName" style={layout.displayDetails} readOnly /><p></p>
                    Type: <input id="pjType" style={layout.displayDetails} readOnly /><p></p>
                    Story: <input id="pjStory" style={layout.displayLongDetails} readOnly /><p></p>
                    Designer username: <input id="pjDesigner" style={layout.displayDetails} readOnly /><p></p>
                    Current/Goal Amount: <input id="pjCurrAmt" style={layout.currentAmt} readOnly /> out of <input id="pjGoalAmt" style={layout.displayDetails} readOnly /><p></p>
                    Number of Supporter:<input id="pjNumSupporter" style={layout.displayDetails} readOnly /><p></p>
                    Deadline: <input id="pjDeadline" style={layout.displayDetails} readOnly /><p></p>
                    Launch Status: <input id="pjLaunch" style={layout.displayDetails} readOnly /><p></p>
                    Pledge: (Refresh to reflect changes)
                    {pjLaunched === 1 ? <p></p> : <button type="button" style={layout.smallControlButton} onClick={(e) => handleCreatePledge(document.getElementById("pjName").value)}>+</button>}
                    <p></p>
                    {pjPledge.map(pledge => (
                      <ul>
                        <div key={pledge.pledgeID}>
                          {pjLaunched === 1 ? <p></p> : <button type="button" style={layout.smallControlButton} onClick={(e) => handleDeletePledge(pledge.pledgeID)}>-</button>}
                          <button type="button" style={layout.pledgeDetails} onClick={(e) => showPledgeDetail(pledge, document.getElementById("pjName").value)}>{" ID: " + pledge.pledgeID + ", Amount: $" + pledge.amount + ", # of Support: " + pledge.numOfSupport  + ", " + pledge.reward}</button>
                        </div>
                      </ul>
                    ))}
                    <p></p>
                    <button type="button" style={{ position: "absolute", top: '8%', right: '30%', width: '200px', height: '50px', fontFamily: "Monaco, monospace", }} onClick={(e) => handleReviewProject(document.getElementById("pjName").value)}>Review Activity</button><p></p>
                    <button type="button" style={{ position: "absolute", bottom: '10%', width: '100px', height: '50px', fontFamily: "Monaco, monospace", }} onClick={(e) => handleViewProject(document.getElementById("pjName").value)}>Refresh</button><p></p>
                    {pjLaunched === 1 ? <p></p> : <button style={{ position: "absolute", bottom: '10%', right: '50%', width: '100px', height: '50px', fontFamily: "Monaco, monospace", }} type="button" onClick={() => handleLaunchProject(document.getElementById("pjName").value)}>Launch</button>}
                    {pjLaunched === 1 ? <p></p> : <button style={{ position: "absolute", bottom: '10%', right: '40%', width: '100px', height: '50px', fontFamily: "Monaco, monospace", }} type="button" onClick={() => handleDeleteProject(document.getElementById("pjName").value)}>Delete</button>}
                    <button style={{ position: "absolute", bottom: '10%', right: '30%', width: '100px', height: '50px', fontFamily: "Monaco, monospace", }} type="button" onClick={() => handleListProject(0)}>Back</button>
                  </div>
                </>
              )
              }
              {/* Project Activity View */}
              {designerView === 3 && (
                <>
                  <div style={layout.projectView}>
                    Current/Goal Amount: <input id="pjCurrAmt" style={layout.currentAmt} value={pjRaised} readOnly /> out of <input id="pjGoalAmt" style={layout.displayDetails} value={pjGoal}readOnly /><p></p>
                    Activity of <input id="pjName" style={layout.displayDetails} value={pj} readOnly /><p></p>
                    Pledge Activity: <p></p>
                    {pjClaimActivity.map(activity => (
                      <ul>
                        <div key={activity.supportID}>
                          {"+$" + activity.amount + " by " + activity.supporterName + " - pledgeID: " + activity.pledgeID}
                        </div>
                      </ul>
                    ))}
                    Direct Support: <p></p>
                    {pjDSList.map(ds => (
                      <ul>
                        <div key={ds.historyID}>
                          {"+$" + ds.amount + " by " + ds.supporterName}
                        </div>
                      </ul>
                    ))}
                    <button type="button" style={{ position: "absolute", bottom: '10%', width: '100px', height: '50px', fontFamily: "Monaco, monospace", }} onClick={(e) => handleViewProject(document.getElementById("pjName").value)}>Back</button><p></p>
                  </div>
                </>
              )
              }
            </div>
            <div>
              {/* Sidebar */}
              <button type="button" style={layout.display0}> {"Welcome Back! " + currAcctName} </button>
              <button type="button" style={layout.button1} onClick={() => handleCreateProject()}> Create Project </button>
              <button type="button" style={layout.button2} onClick={() => handleListProject(0)}> List Project </button>
            </div>
          </>
        )
        }
        {/* ADMIN VIEW */}
        {role === 'admin' && (
          <>
            {/* Project List View */}
            <div>
              {adminView === 1 && (
                <>

                  <div style={layout.projectWindow}>
                    {dbData.map(item => (
                      <div key={item.projectName} style={layout.indivProject}>
                        <div style={layout.projectDetails}>{" Project Name: " + item.projectName}</div>
                        <div style={layout.projectDetails}>{" Story: " + item.story}</div>
                        {item.isFail? <div style={layout.projectDetails}>{"FAiLED"}</div> : <></>}
                        {item.isSuccessful? <div style={layout.projectDetails}>{"GOAL ACHIEVED"}</div> : <></>}
                        <button type="button" style={layout.viewProjectButton} onClick={() => handleDeleteProjectAdmin(item.projectName)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </>
              )
              }
              {/* Default View : No Project */}
              {adminView === 0 && (
                <>
                  <li style={{ height: '750px', width: '800px', border: '1px solid black', backgroundColor: '	#f4cccc' }}></li>
                </>
              )
              }
            </div>
            <div>
              {/* Sidebar */}
              <button type="button" style={layout.display0}> {"Welcome Back! " + role} </button>
              <button type="button" style={layout.button1} onClick={() => handleListProject(2)}> List Project </button>
              {/* <button type="button" style={layout.button2}> Delete Project </button> */}
              <button type="button" style={layout.button2} onClick={() => reapProjectAsAdmin()}> Reap Project </button>
            </div>
          </>
        )
        }

        <Modal onClose={showRegModal} show={showModal}>
          {modalScreen === 0 && (
            <>
              {/* Register Designer */}
              <h2 style={layout.modalHeading}>Register Designer</h2>
              <p style={{ fontFamily: "Monaco, monospace", textAlign: 'center', padding: '30px' }}>Enter your username & email to register for a register account</p>
              <form>
                <ul style={layout.register}>
                  <li> <label>Name: <input type="text" id='regUsername' />        </label></li>
                  <li> <label>Email: <input type="text" id='regEmail' />        </label></li>
                </ul>
                <input style={layout.submitButton} type="button" value="Register" onClick={() => handleRegister(0)} />
              </form>
            </>
          )}
          {modalScreen === 1 && (
            <>
              {/* Register Supporter */}
              <h2 style={layout.modalHeading}>Register Supporter</h2>
              <p style={{ fontFamily: "Monaco, monospace", textAlign: 'center', padding: '30px' }}>Enter your username & email to register for a supporter account</p>
              <form>
                <ul style={layout.register}>
                  <li> <label>Name: <input type="text" id='regUsername' />        </label></li>
                  <li> <label>Email: <input type="text" id='regEmail' />        </label></li>
                </ul>
                <input style={layout.submitButton} type="button" value="Register" onClick={() => handleRegister(1)} />
              </form>
            </>
          )}
          {modalScreen === 2 && (
            <>
              {/* Create Project */}
              <h2 style={layout.modalHeading}>Create Project</h2>
              <form>
                <ul style={layout.spacedList}>
                  <li> <label>Project Name: <input type="text" id='newProjName' />            </label></li>
                  <li> <label>Story:  <input type="text" id='newProjStory' />            </label></li>
                  <li> <label>Designer Name:  <input type="text" id='newProjDesigner' />            </label></li>
                  <li> <label>Genre:  <input type="text" id='newProjGenre' />            </label></li>
                  <li> <label>Goal: <input type="number" id='newProjGoal' />            </label></li>
                  <li> <label>Deadline YYYY-MM-DD:  <input type="text" id='newProjDeadline' />            </label></li>
                </ul>
                <input style={layout.submitButton} type="button" value="Create" onClick={() => handleRegister(2)} />
              </form>
            </>
          )}
          {modalScreen === 3 && (
            <>
              {/* Create Pledge */}
              <h2 style={layout.modalHeading}>Create Pledge</h2>
              <form>
                <ul style={layout.spacedList}>
                  <li> <label>Amount: $<input type="text" id='newPledgeAmt' />            </label></li>
                  <li> <label>Description: <input type="text" id='newPledgeReward' />            </label></li>
                  <li> <label>Maximum # of Support: <input type="text" id='newPledgeMaxSupport' placeholder='Leave blank if unlimited' />            </label></li>
                </ul>
                <input style={layout.submitButton} type="button" value="Create" onClick={() => handleRegister(3)} />
              </form>
            </>
          )}
          {modalScreen === 4 && (
            <>
              {/* Log In */}
              <h2 style={layout.modalHeading}>Log In</h2>
              <p style={{ fontFamily: "Monaco, monospace", textAlign: 'center', padding: '30px' }}>Enter your credentials to log in; <br />Admin: enter admin, admin to log in</p>
              <form>
                <ul style={layout.register}>
                  <li> <label>Name: <input type="text" id='loginName' />        </label></li>
                  <li> <label>Email: <input type="text" id='loginEmail' />        </label></li>
                </ul>
                <input style={layout.submitButton} type="button" value="Log in" onClick={() => handleRegister(4)} />
              </form>
            </>
          )}
          {modalScreen === 5 && (
            <>
              {/* View Pledge as Supporter */}
              <h2 style={{ textAlign: "center", fontSize: "180%", fontWeight: "700", fontFamily: "Monaco, monospace", color: "#85200c", }}><input id="pledgeReward" style={layout.displayPledgeID} readOnly /></h2>
              <div>
                <ul style={layout.spacedList}>
                  <li> ID: <input style={layout.displayPledgeDetails} id='pledgeID' readOnly />            </li>
                  <li> Amount: <input style={layout.displayPledgeNumberDetails} id='pledgeAmt' readOnly />         </li>
                  <li> Number of Support (Current/Max): <input style={layout.displayPledgeNumberDetailsRight} id='pledgeCurrSupport' readOnly />{"/"}<input style={layout.displayPledgeNumberDetails} id='pledgeMaxSupport' readOnly /></li>
                  <li> Supporters: </li>
                  <textarea id='pledgeSupporter' style={layout.supporterTextarea} rows="3" cols="35" readOnly />
                </ul>
                <input style={layout.claimPledgeButton} type="button" value="Claim" onClick={() => handleClaimPledge(document.getElementById('pledgeID').value, document.getElementById('pjName').value)} />
                <input style={layout.errorFund} id='claimError' readOnly></input>
              </div>
            </>
          )}
          {modalScreen === 6 && (
            <>
              {/* Claim Pledge Success Screen */}
              <h2 style={{ textAlign: "center", fontSize: "180%", fontWeight: "700", fontFamily: "Monaco, monospace", color: "#85200c", }}><input id="pledgeReward" style={layout.displayPledgeID} readOnly /></h2>
              <form>
                <ul style={layout.spacedList}>
                  <li>You just claimed a pledge!</li>
                </ul>
              </form>
            </>
          )}
          {modalScreen === 7 && (
            <>
              {/* View Pledge as Designer */}
              <h2 style={{ textAlign: "center", fontSize: "180%", fontWeight: "700", fontFamily: "Monaco, monospace", color: "#85200c", }}><input id='pledgeReward' style={layout.displayPledgeID} readOnly /></h2>
              <div>
                <ul style={layout.spacedList}>
                  <li> ID: <input style={layout.displayPledgeDetails} id='pledgeID' readOnly />            </li>
                  <li> Amount: <input style={layout.displayPledgeNumberDetails} id='pledgeAmt' readOnly />         </li>
                  <li> Number of Support (Current/Max): <input style={layout.displayPledgeNumberDetailsRight} id='pledgeCurrSupport' readOnly />{"/"}<input style={layout.displayPledgeNumberDetails} id='pledgeMaxSupport' readOnly /></li>
                  <li> Supporters: </li>
                  <textarea id='pledgeSupporter' style={layout.supporterTextarea} rows="3" cols="35" readOnly />
                </ul>
              </div>
            </>
          )}
          {modalScreen === 8 && (
            <>
              {/* Add Fund to Supporter Account */}
              <h2 style={layout.modalHeading}>Add Fund</h2>
              <div>
                <ul style={layout.spacedList}>
                  <li> Account Name: <input style={layout.displayPledgeDetails} id='loginName' value={currAcctName} readOnly />            </li>
                  <li> Account Email: <input style={layout.displayPledgeNumberDetails} id='loginEmail' value={currAcctEmail} readOnly />         </li>
                  <li> Amount: <input style={layout.fund} id='fund' placeholder='How much would you like to add?' /></li>
                </ul>
                <input style={layout.claimPledgeButton} type="button" value="Add" onClick={() => handleRegister(5)} />
                <input style={layout.errorFund} id='addFundError' readOnly></input>
              </div>
            </>
          )}
          {modalScreen === 9 && (
            <>
              {/* Direct Support from Supporter */}
              <h2 style={layout.modalHeading}>Direct support</h2>
              <div>
                <ul style={layout.spacedList}>
                  <li> Project Name: <input style={layout.displayPledgeDetails} id='pjName' value={document.getElementById('pjName').value} readOnly />            </li>
                  <li> Account Name: <input style={layout.displayPledgeDetails} id='loginName' value={currAcctName} readOnly />            </li>
                  <li> Account Email: <input style={layout.displayPledgeDetails} id='loginEmail' value={currAcctEmail} readOnly />         </li>
                  <li> Amount: $ <input style={layout.fund} id='directsupport' placeholder='Help us reach our goal!' /></li>
                </ul>
                <input style={layout.claimPledgeButton} type="button" value="Support!" onClick={() => handleRegister(6)} />
                <input style={layout.errorFund} id='directsupportError' readOnly></input>
              </div>
            </>
          )}


        </Modal>

      </div>
    </div>

  );
}


export default App;