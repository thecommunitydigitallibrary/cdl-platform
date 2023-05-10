import * as React from "react";
import Paper from "@mui/material/Paper";

export default function ReleaseLog() {
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
        CDL Release Log
      </h1>

      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        May 8th, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>Password auto-check on account creation</li>
            <li>Minor UI response improvements</li>
            <li>Larger search results</li>
            <li>Batch upload for submissions</li>
            <li>Extension Alt+S auto-open, better-organized hashtags (v. 0.0.0.2)</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Submission result overflow</li>
        </ul>

      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        April 11th, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>Wider search bar in header</li>
            <li>Auto-email for password reset</li>
            <li>Clickable hashtag display in search results</li>
            <li>Chrome extension added to web store (v. 0.0.0.1)</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Note title duplicate preview removed</li>
            <li>Search bar length fix to avoid preview cutoff</li>
            <li>Username in header on account creation</li>
        </ul>

      
      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        April 4th, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>Privacy Policy</li>
            <li>Footer on each page for easy navigation</li>
            <li>Extended search bar in header</li>
            <li>Infinity scroll in search results</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Extension failure on certain arXiv pages</li>
        </ul>



      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        March 23rd, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>Ability to submit directly from the website</li>
            <li>Ability to edit submission</li>
            <li>Header reorganization</li>
            <li>Extension page simplification</li>
            <li>Community name is presented when searching</li>
            <li>More accurate extension open search via title and description of webpage</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Header rendering now doesn't briefly switch to login on page reload</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul>
            <li>More detailed error messages in extension and website</li>
        </ul>


      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        March 3rd, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>Search result reformat</li>
            <li>Submission times, hyperlinked communities added to submission page</li>
            <li>Neural ranking on certain search queries</li>
            <li>Note page sidebar auto-open when child is selected</li>
            <li>Basic "Most Recent" recommendation feed</li>
            <li>Basic deduplication in search results</li>
            <li>Community names and descriptions are editable</li>
            <li>Community leave history is displayed with the ability to rejoin left communities</li>
            <li>Admins can leave communities</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Feedback redirect URL now redirects to external submission page</li>
            <li>Extension copy share URL now includes missing "s"</li>
            <li>Deleted submissions are no longer visible on submission page</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul>
            <li>Old server API is depreciated.</li>
        </ul>


      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        February 20th, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>Favicons added to submissions when they appear in search results</li>
            <li>Community names in search results are hyperlinks</li>
            <li>Relevance judgments are removed when viewing own submissions or browsing communities</li>
            <li>Submission page delete button toggled based on user permissions</li>
            <li>Community page redesign</li>
            <li>Page titles for proper tab titles</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Better error handing on website and extension</li>
            <li>Users can now leave a community without error</li>
            <li>Removed sometimes dangling arrow in search result URL preview</li>
            <li>Permission to view submission removed from all communities if user is original creator</li>
            <li>Submissions with no communities display "None" in search results</li>
        </ul>



      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        February 10th, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>HTTPS</li>
            <li>Move to textdata.org</li>
            <li>Search result caching</li>
            <li>Updated extension to use new domain API</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Redirect when submission is undefined</li>
            <li>Better error message display on website and extension</li>
        </ul>




      <h2 style={{ margin: "30px 0px 0px 0px" }}>
        February 5th, 2023
      </h2>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul>
            <li>A release log</li>
            <li>Basic password reset functionality on website</li>
            <li>Hierarchical note pages</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul>
            <li>Opening a submission page without being logged in redirects to login page</li>
            <li>Better error message display on website and extension</li>
        </ul>
      <h5 style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul>
            <li>Passwords must be longer than 5 characters</li>
            <li>Usernames must be longer than 1 character</li>
            <li>Emails must have valid form</li>
            <li>Pages start at 1</li>
        </ul>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      ></div>
    </Paper>
  );
}
