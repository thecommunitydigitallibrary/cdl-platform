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
        An account can be created <a href="/auth">here</a>. 
        Please create an account using a valid email address. Please write
        down your password! Once you create an account, 
        navigate back to this step and continue the setup.
      </p>
    ),
  },
  {
    label: "Install the Chrome Extension",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        The Chrome extension can be downloaded from <a href="https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0">the Chrome Web Store</a>. After installing, don't forget to pin the newly-added extension to your browser.
      </p>
    ),
  },
  {
    label: "Log in to the Chrome Extension",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        After opening the extension, you should see a login screen. Please log
        in to the extension with the same credentials as you used for the
        website account that you created in Step 2.
      </p>
    ),
  },
  {
    label: "Create a Community",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        Much like a group chat, a subreddit, or a folder, a community is place for you and your peers to save organize content. 
        You can create, join, or leave communities, and any member of a community can search for or browse all content present in the community.
        Click <a variant="outline" href={"/communities"}>{"here"}</a>  to join or create a community!
      </p>
    ),
  },
  {
    label: "Create a Submission",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        A submission is the fundamental building block of TextData. Submissions are user-created, and consist of an optional source URL, a title, and a description which can be added to or removed from communities.
        You can create a submission by using either Chrome extension's "Save" tab or by clicking the "+" on the TextData website header.
      </p>
    ),
  },
  {
    label: "Search and Browse Communities",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        Searching on TextData is a straightforward process. Whether you are looking for specific content or exploring new resources, our search functionality can assist you in finding what you need. 
        You are able to search over all submissions that have been added to your communities, and you can perform searches using either the TextData website header or the Chrome extension.
      </p>
    ),
  },
  {
    label: "Get Recommendations",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
       View your recommendation feed on the homepage or open the extension on a webpage to see contextual recommendations. Open the extension with highlighted text to see submissions tailored to your selected context.
      </p>
    ),
  },
  {
    label: "Interact in Context",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        Use the extension to ask questions in context, summarize selected text, and drive curiosity with automatically generated questions.
      </p>
    ),
  },
  {
    label: "Interact with Submissions",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        Visit a submission's TextData-specific page to read, mention, visualize, share.You can edit a submission, add or remove it from a community, delete it entirely, or provide feedback.
        Make submission with mention will create another submission tagging the current submission and display it beneath the description. See how similar submissions are related by interacting with the graph.
      </p>
    ),
  },
  {
    label: "Visualize Data",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        TextData supports the basic visualization of any community's content. To view a community's visualization, you can click the "Visualize Community" on the community's card. This will bring you to an interactive graph where the community's submissions are organized around hashtags, topics, and meta-descriptors.
        Search query also support visualization, search for a query in the search bar and click on "Visualize" button to see it.
      </p>
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
        Setting up TextData{" "}
      </h1>
      The following instructions will walk you through account creation and Chrome extension setup.
      <VerticalLinearStepper steps={steps} updateStepper={props.updateStep} />
    </Paper>
    <Footer/>
   </>
  );
}
