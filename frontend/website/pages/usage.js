import * as React from "react";
import Paper from "@mui/material/Paper";

export default function Usage() {
  return (
    <Paper
      elevation={0}
      sx={{
        padding: "10px 20px 5px 20px",
        width: "1200px",
        display: "flex",
        flexDirection: "column",
        margin: "auto",
      }}
    >
      <h1 style={{ margin: "10px 0px 0px 0px" }}>
        Using the Community Digital Library
      </h1>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        The Community Digital Library (CDL) is a website and Chrome extension
        with the goal of helping the scaling and efficiency of online learning.
      </p>
      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        Creating a Submission
      </h2>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        You can create a submission by using the Chrome extension's "Submit" tab. A submission consists of 
        the current URL (i.e., the page that you opened the extension on), the highlighted text
        present in the field, and a short user explanation of why this page is interesting or useful. Upon clicking 
        "Submit", all of this will be saved to the selected community. 
      </p>

      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        Note that the extension does not send the webpage directly from your
        browser, rather it sends the URL, highlighted text, and the explanation
        that you provide. This means that you are able to submit snippets of
        pages that are only available to members of the community (e.g., for a
        class, you can submit a Campuswire or Coursera page) and that the CDL does not save
        private information which you do not want to submit. 
      </p>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        For some webpages, highlighting the text will not work. If you try to highlight text
        and see "Please paste highlighted text here", then the highlight did not work.
        In this case, you can manually copy the text from the webpage and paste it in the box. Then,
        you can submit as described above.
      </p>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        You can also add hashtags to your submission for more precise search. A hashtag should be added in the Description field, should begin with a "#", and should not contain any spaces. Note that the CDL considers a hashtag to include every character from the "#" to the next whitespace character or end of description. This means that "#L1.1", "#L1.1.", and "#L1.1," are all different hashtags. 
      </p>

      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        Searching the CDL
      </h2>
      <h3 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        By the Extension
      </h3>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        For traditional, query-based search, entering a query in the box under the "Search" tab of the extension and clicking the search button
        will return search results from all of your communities.
      </p>

      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        For Auto-Search, highlighting text and opening the extension will automatically display search result from all of your communities, 
        as the extension open defaults to the "Auto-Search" tab. Similarly to the submission process, some websites (e.g., PDFs) may not register
        highlighted text. In this case, we use the URL as a query. 
      </p>

      <h3 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        By the Website
      </h3>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Entering a query in the box on the website homepage or in the search header and clicking the search button
        will return search results from all of your communities. Additionally, you have the option to select a specific
        community to only see results from the selected community.
      </p>
      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        Taking Notes
      </h2>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        After clicking your avatar in the header and selecting My Notes, you will be brought to a page where you can create, save, and edit markdown note pages.
        All of the notes created here are private in the sense that they are not shared with your communities. In the future, we plan on integrating
        your notes into search and recommendation, helping you both re-discover old notes when needed and improving the relevance of returned submissions.
        As you edit your notes, your communities will periodically queried using your most recent changes and the search results will automatically appear
        at the bottom of the note page. This is to help you find relevant information without needing to leave the notes page!
      </p>
      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        Additional Functionality
      </h2>
      <h3 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        More about Submissions
      </h3>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Each submission, displayed after a search, contains the user-added description as the hyperlink, the URL of the webpage 
        below that, and the highlighted text (if any) below that. In addition to clicking a submission link (to go to the linked webpage), 
        you can also do the following:
      </p>
      <h4 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        Submit Relevance Judgments
      </h4>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Each search result (itself, a submission) will have two buttons at the bottom labeled "Relevant" and "Not Relevant". 
        If you feel like a submission is very helpful given your search query, then you can click "Relevant". If you think
        it is completely not helpful, then you can click "Not Relevant". Over time, we aim to use this feedback for improving your search. 
      </p>
      <h4 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        Submission Menu Options
      </h4>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Each submission will have a three-dot menu at the top-right corner.  
      </p>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        View Submission
      </h5>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Clicking "View Submission" will bring you to a webpage dedicated to the submission. Here, you can find statistics related to the submission
        (views, clicks, and community shares), add or remove the submission from your communities, delete the submission, and connect another submission.
      </p>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        Feedback
      </h5>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Clicking "Feedback" will let you send a message to us about the submission. Please use this field if the submission link is broken, its content is
        inappropriate, or if you have anything that you would like to share. 
      </p>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        Share URL
      </h5>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Clicking "Share URL" will let you copy the submission's URL for its aforementioned webpage. If you send it to someone who is 
        in one of the submission's communities, then they will be able to access the submission page, too. 
      </p>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        Get Connection ID
      </h5>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Clicking "Get Connection ID" will let you copy the submission's unique ID for making a connection. Then, you can navigate to another submission's page,
        click "Connect", and enter this unique ID to make a connection. 
      </p>

      <h3 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        Joining, Creating, and Viewing Communities
      </h3>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        Clicking the "My Communities" link under the person icon in the header will bring you to a
        page that displays a list of your current communities. To join another
        community, click "Join Community" and enter the community join key. To
        create a new community, click "Create Community" and enter the desired community name. 
        Currently, a community creator cannot leave a community, and communities cannot be deleted. To view
        all submissions in a community, click the community name. 
      </p>
      <h4 style={{ margin: "10px 0px 0px 0px" }}>
        {" "}
        List of Useful Communities with Join Keys
      </h4>
      <p style={{ fontSize: "18px", margin: "10px 0px 0px 0px" }}>
        CDL-Web : f92490bd-4934-4127-a195-75bfbbc11371
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      ></div>
    </Paper>
  );
}
