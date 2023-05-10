import * as React from "react";
import Paper from "@mui/material/Paper";

export default function Summary() {
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
        {" "}
        What is the Community Digital Library?
      </h1>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        The Community Digital Library (CDL) is a website and Chrome extension designed
        with the goal of helping the scaling and efficiency of online learning.
        Put simply, the CDL is a collaborative bookmarking and note-taking service, 
        and the goal is to leverage your saved bookmarks and notes to assist in search, recommendation, and online learning.
      </p>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        The CDL is centered around the concept of a community.
        You can create, join, or leave other communities by clicking your avatar in the header, and navigating to "My Communities".
        A community is simply one or more people who share similar interests or
        information needs. For example, the students in a semester-long class
        may form a community, the members of a research reading group may form a
        community, or one could be in a community by themselves. Regardless of the size of a community, 
        the CDL enables any member of a community to make submissions.
      </p>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        A submission can be created using the Chrome extension when visiting
        a webpage, and can be thought of as a bookmark with a description for why that particular
        webpage is useful or interesting. Each submission is made with respect to a selected community and is available
        to any current member of the community. You can find submissions by searching or by browsing communities.
      </p>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        There are two methods to search submissions. The first is a traditional, query-based search (think Google or Bing).
        This is available both on the CDL website (using the search bar) and on the CDL Chrome extension (under the Search tab).
        The second method is Auto-Search, which is only available in the extension. To use Auto-Search, simply highlight some text
        on a webpage and open the extension. The extension will open to the Auto-Search tab, and the CDL will use your currently
        highlighted text to find related submissions.
      </p>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>
        You can also take notes in markdown using the CDL. You can access your created note pages by clicking your avatar in the header
        and selecting My Notes. More information about this feature is described in the "Usage" tab above.
      </p>
      <p style={{ fontSize: "18px", margin: "15px 0px 0px 0px" }}>  
      For more information regarding account creation and the Chrome extension setup, please navigate to the "Setup" tab above.
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
