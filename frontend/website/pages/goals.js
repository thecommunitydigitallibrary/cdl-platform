import React, { useContext, useEffect, useState } from "react";
import Head from "next/head";
import jsCookie from "js-cookie";
import Button from "@mui/material/Button";

import ChatWindow from "../components/chatwindow";


// Snackbar related imports
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";

export default function Goals({ allGoals }) {
  const [goals, setGoals] = useState(allGoals);
  const [selectedGoal, setSelectedGoal] = useState({"questions": []})


  const [showNewGoalModel, setNewGoalModelOpen] = React.useState(false);
  const handleOpenNewGoalModel = () => {
    setNewGoalModelOpen(true);
  };
  const handleCloseNewGoalModel = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNewGoalModelOpen(false);
  };

  const handleGoalCreation = async () => {
    var URL = baseURL_client + "goals"
    var goal_description = document.getElementById("goalInput").value;
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        goal_description: goal_description
      }),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status == 200) {
      setSeverity("success");
      setMessage("Successfully created new goal.")
      setSelectedGoal(response.new_goal.scaffold)
      goals.push({"id": response.new_goal.id, "goal_description": response.new_goal.goal_description})
    } else {
      setSeverity("error");
      setMessage("Something went wrong. Please try again later.")

    }
    handleClickSnackbar();
    handleCloseNewGoalModel();
  };

  
  // Necessary States for Alert Message
  const [showSnackbar, setSnackbarState] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("error");

  const handleClickSnackbar = () => {
    setSnackbarState(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarState(false);
  };




  const handleSelectGoal = async (event, id, description) => {
    var URL = baseURL_client + "goals/" + id + "?g=" + description;
    const res = await fetch(URL, {
      method: "GET",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status == 200) {
        setSelectedGoal(response.goal)
    } else {
        return
    }
  }
  

  return (
    <>
      <Head>
          <title>Goals - TextData</title>
          <link rel="icon" href="/images/tree32.png" />
      </Head>



      <div style=  {{width: "48%", float: "left"}}>
        <ul>

        {goals.map((d, idx) => (
          <li>
            <div key={idx} style={{paddingTop: "5px"}}>
                 <button id={d.id} onClick={(event) => handleSelectGoal(event, d.id, d.goal_description)} className="btn btn-outline btn-sm mx-1" style={{ backgroundColor: '#d3d3d3', color: 'black' }}>
                    <span className="hidden lg:inline ml-1">{d.goal_description}</span>
                </button>
            </div>
          </li>
        ))}
        </ul>

      </div>
      <hr />
      <div style=  {{width: "48%", float: "right", paddingRight: "5px"}}>
        {
          <div>
            <h3>{selectedGoal.selected_goal}</h3>
            <p>{selectedGoal.answer}</p>
            {selectedGoal.questions.map((q, idx) => (
                <div key={idx} style={{paddingTop: "5px"}}>
                    <a href={"https://www.google.com/search?q=" + q} target="_blank">{q}</a>
                    <br/>
                    <br/>
                </div>
            ))}
          </div>        
        }
      </div>
      <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={severity}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        </Snackbar>

    </>);
}

 export async function getServerSideProps(context) {
   // Fetch data from external API
   if (
     context.req.cookies.token === "" ||
     context.req.cookies.token === undefined
   ) {
     return {
       redirect: {
         destination: "/about",
         permanent: false,
       },
     };
   }
   else {
    // get all goal ids and queries
    var URL = baseURL_server + "goals";
    const res = await fetch(URL, {
      method: "GET",
      headers: new Headers({
        Authorization: context.req.cookies.token,
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status == 200) {
        return { props: {allGoals: response.all_goals }}
    } else {
        return { props: {allGoals: [] }}}
    }
 }
