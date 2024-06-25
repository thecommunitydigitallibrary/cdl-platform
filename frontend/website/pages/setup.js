import Paper from "@mui/material/Paper";

import * as React from "react";
import VerticalLinearStepper from "../components/verticalstepper";
import Footer from "../components/footer";
import Header from "../components/header";
import Head from "next/head";


const steps = [
  {
    label: "Create an Account",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        An account can be created <a target="_blank" and rel="noopener noreferrer" href="/auth">here</a>. 
        Once you create an account, navigate back to this step and continue the setup.
      </p>
    ),
  },
  {
    label: "Install and Log In to the Chrome Extension",
    description: (
      <div>
      <p style={{ margin: "10px 0px 0px 0px" }}>
        The Chrome extension can be downloaded from <a target="_blank" and rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0">the Chrome Web Store</a>. After installing, don't forget to pin the newly-added extension to your browser.
        After opening the extension, you should see a login screen. Please log
        in to the extension with the same credentials that you used for the
        website account you created in Step 1.
      </p>
      </div>
    ),
  },
  {
    label: "Create your First Community",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        Much like a group chat, a subreddit, or a folder, a community is place for you and your peers to save and organize notes. 
        You can create, join, or leave communities, and any member of a community can search for or browse all content present in the community.
        Click <a target="_blank" and rel="noopener noreferrer" href="/community">here</a> to join or create a community.
      </p>
    ),
  },
  {
    label: "Create your First Submission",
    description: (
      <div>
      <p style={{ margin: "10px 0px 0px 0px" }}>
        You can think of a submission like a bookmark or note page. Submissions are saved to a particular community and are accessible by any member of the community. Each submission consists of a title, an optional source URL, and a markdown-based description. You can create a submission by clicking the "+" button in the header or by the Chrome extension's "Save" tab.
      </p>
      <p>
        Once you create your first submission, you can refresh this page to view the full TextData homepage. But don't worry, you can still revisit these setup instructions by clicking "Setup Instruction" in the footer. Enjoy TextData!
      </p>
      </div>
    ),
  },
  {
    label: "Start using TextData!",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        That's all for the onboarding, you are ready to go! More details about submission, recommendations, and communities
        can be found on the <a target="_blank" and rel="noopener noreferrer" href="/about">About</a> page and the <a target="_blank" and rel="noopener noreferrer" href="/documentation">Documentation</a> page.
      </p>
    ),
  },
];

export default function Setup(props) {

  const handleSetupFinish = (data) => {
    if(props.setupFinish){
      props.setupFinish();
    }  
  };
  return (
   <>
    <Head>
        {!(props.head) ? <title>Setup - TextData</title> : <title>{props.head} - TextData</title>}
        <link rel="icon" href="/images/tree32.png" />
    </Head>
    <Header/>
    <Paper
      elevation={0}
      sx={{
        padding: "10px 20px 5px 20px",
        width: "1200px",
        display: "flex",
        flexDirection: "column",
        margin: "auto",
        marginTop:"65px"
      }}
    >
      <h1 style={{ margin: "10px 0px 10px 0px" }}>
        {" "}
        Welcome to TextData{" "}
      </h1>
      The following instructions will walk you through account creation, Chrome extension setup, and creating your first community and submission.
      <VerticalLinearStepper steps={steps} updateStepper={props.updateStep ? props.updateStep : 0} extensionFinish={handleSetupFinish} />
    </Paper>
   </>
  );
}
