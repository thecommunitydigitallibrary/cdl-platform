import * as React from "react";
import Paper from "@mui/material/Paper";
import Header from "../components/header";
import Footer from "../components/footer";
import Head from "next/head";


export default function ReleaseLog() {
  return (
    <>
    <Head>
      <title>Release Log - TextData</title>
      <meta
        name="description"
        content="TextData"
      />
      <link rel="icon" href="/favicon.ico" />
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
        marginTop: "65px"
      }}
    >
      <h1 className="text-5xl mb-6" style={{ margin: "10px 0px 0px 0px" }}>
        Release Log
      </h1>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        June 25th, 2024
      </h2>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Questions added to submission visualization</li>
            <li className="list-item">Web results and submission results in extension</li>
        </ul>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Simplified extension UI</li>
            <li className="list-item">Removal of various features not central to platform</li>
            <li className="list-item">Refactoring of backend API</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        May 9th, 2024
      </h2>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Sort results by popularity, relevance, and recency</li>
        </ul>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Community name on visualization is properly pulled instead of "All"</li>
            <li className="list-item">Extension default behavior and source now saved on tab changes</li>
            <li className="list-item">Search summarization not persisted across searches</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Submission default is now non-anonymous</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        May 1st, 2024
      </h2>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Homepage recommended public communities</li>
            <li className="list-item">Number of followers and joined members for communities</li>
            <li className="list-item">Summarize search results</li>
            <li className="list-item">Public community submissions can be viewed without an account</li>
        </ul>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">More mobile-friendly</li>
            <li className="list-item">Community page ten results, then show more on search</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        April 16th, 2024
      </h2>

      
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Community page cache hard fix</li>
            <li className="list-item">Double footer render</li>
            <li className="list-item">Community links</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        April 14th, 2024
      </h2>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">"Are you sure you want to leave?" on submission editing</li>
            <li className="list-item">Ability to follow and unfollow public communities</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Paging was returning 403 because of public community update</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Batch DB calls for speeding up export and visualization</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        April 9th, 2024
      </h2>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Private and public communities</li>
            <li className="list-item">Likes and dislikes for submissions</li>
            <li className="list-item">Scoring search results by popularity</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Visualization refresh now does not revert</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        March 29th, 2024
      </h2>

      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Extension caching for taking notes on webpage</li>
            <li className="list-item">Homepage recently accessed submissions</li>
            <li className="list-item">Friendlier user onboarding</li>
            <li className="list-item">Log in with username or email in extension</li>
            <li className="list-item">Clicking autocomplete redirects to submission page</li>
            <li className="list-item">Increased submission description length to 5,000 words / 50,000 characters</li>
            <li className="list-item">Export JSON of search results</li>
            <li className="list-item">Restrict search to only your submissions</li>
            <li className="list-item">Connection-based visualizations on the homepage, search, and community</li>
            <li className="list-item">Character counter (max 50,000) on submission description</li>
            <li className="list-item">Sidebar drawer for a user's most recently made submissions per community</li>
        </ul>
      
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">State updates for submission page</li>
            <li className="list-item">Accidental edit when creating new submission from existing page</li>
            <li className="list-item">Extension save/find page toggle no longer stuck on find</li>
            <li className="list-item">Original visualization filter change now doesn't throw application error</li>
            <li className="list-item">Save and error on submission does not discard changes</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Refactored search bar in extension</li>
            <li className="list-item">Fixed markdown in extension to be only light mode</li>
            <li className="list-item">Homepage recommendation default is now most recent</li>
            <li className="list-item">Remove join key for non-admins</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        February 19th, 2024
      </h2>
      
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Removed toolbar from submission preview</li>
            <li className="list-item">Better state management for real-time updating of submission</li>
            <li className="list-item">Removed edit button when not own submission</li>
            <li className="list-item">Added back spellcheck to submission</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Return display URL on submission PATCH</li>
            <li className="list-item">Improved question generation experience in extension</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        February 10, 2024
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Submission page redesign</li>
        </ul>
      
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Login button(s) on small screen now not cut off</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Reorganized buttons in the extension</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        January 28, 2024
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">New faster LLM for extension question generation</li>
            <li className="list-item">More extension question generation options</li>
            <li className="list-item">Logging and extension QA formatting, open to web</li>
            <li className="list-item">Own submission toggle in search graph visualization</li>
        </ul>
      
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Query encoding error on visualization</li>
            <li className="list-item">Markdown quote and sanitize</li>

        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Removed webpages from extension open to decrease lag</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        December 16th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Compare functionality in extension</li>
            <li className="list-item">Visualize on search</li>
            <li className="list-item">Titles and legend in submission visualization</li>
            <li className="list-item">Non-anonymous submissions</li>
            <li className="list-item">Generative LLM in extension</li>
        </ul>
      
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Removed empty username login</li>
            <li className="list-item">Properly handle duplicate recommendations on homepage</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Renamed "The Community Digital Library" and "CDL" to "TextData"</li>
            <li className="list-item">Sharpened message on About page</li>
            <li className="list-item">Video and new images on About page</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        November 21st, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Larger default submission description</li>
            <li className="list-item">Timestamps now fixed instead of relative</li>
        </ul>




      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        November 19th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Auto-suggest on website search bar header</li>
            <li className="list-item">Auto-suggest on website submission create and edit</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Clicking whitespace around search result no longer redirects</li>
            <li className="list-item">Clicking relevance judgment on search result no longer redirects</li>
            <li className="list-item">Refactored submission form for more consistent look</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">"About" page updated to reflect recent changes</li>
            <li className="list-item">Added release log to footer</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        November 14th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Nested headers are no longer counted as hashtags in submissions</li>
            <li className="list-item">Limit size of scrape to 50,000 characters</li>
            <li className="list-item">Limit submission graph visualization to 10 websites and 10 submissions, and to only use title as query</li>
            <li className="list-item">Fixed note box to be light mode always</li>
            <li className="list-item">Drawer navigation on collapsed window now includes documentation</li>
            <li className="list-item">Community visualization now contains more than just the first page of the search</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        November 13th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Submission descriptions are now markdown</li>
            <li className="list-item">Reply functionality for connecting submissions</li>
            <li className="list-item">Submission source URLs are no longer required (support for text-only submissions)</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Source target visualization edit state fixes</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        November 5th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Community meta-descriptor visualization</li>
            <li className="list-item">Similar submission visualization</li>
            <li className="list-item">Complete documentation</li>
            <li className="list-item">Core content recommendation</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Batch upload field name fix</li>
            <li className="list-item">Ordered and unordered bullet now render properly</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
      Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Search result whitespace click now navigates to submission's TextData page</li>
            <li className="list-item">Submission time on search result made smaller</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        August 9th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Webpage auto-index and search, recommendation incorporation</li>
            <li className="list-item">Improved recommendation via recent extension opens</li>
            <li className="list-item">Clearer landing page and footer</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Result display word wrap and spacing</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        May 8th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Password auto-check on account creation</li>
            <li className="list-item">Minor UI response improvements</li>
            <li className="list-item">Larger search results</li>
            <li className="list-item">Batch upload for submissions</li>
            <li className="list-item">Extension Alt+S auto-open, better-organized hashtags (v. 0.0.0.2)</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Submission result overflow</li>
        </ul>

      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        April 11th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Wider search bar in header</li>
            <li className="list-item">Auto-email for password reset</li>
            <li className="list-item">Clickable hashtag display in search results</li>
            <li className="list-item">Chrome extension added to web store (v. 0.0.0.1)</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Note title duplicate preview removed</li>
            <li className="list-item">Search bar length fix to avoid preview cutoff</li>
            <li className="list-item">Username in header on account creation</li>
        </ul>

      
      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        April 4th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Privacy Policy</li>
            <li className="list-item">Footer on each page for easy navigation</li>
            <li className="list-item">Extended search bar in header</li>
            <li className="list-item">Infinity scroll in search results</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Extension failure on certain arXiv pages</li>
        </ul>



      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        March 23rd, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Ability to submit directly from the website</li>
            <li className="list-item">Ability to edit submission</li>
            <li className="list-item">Header reorganization</li>
            <li className="list-item">Extension page simplification</li>
            <li className="list-item">Community name is presented when searching</li>
            <li className="list-item">More accurate extension open search via title and description of webpage</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Header rendering now doesn't briefly switch to login on page reload</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">More detailed error messages in extension and website</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        March 3rd, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Search result reformat</li>
            <li className="list-item">Submission times, hyperlinked communities added to submission page</li>
            <li className="list-item">Neural ranking on certain search queries</li>
            <li className="list-item">Note page sidebar auto-open when child is selected</li>
            <li className="list-item">Basic "Most Recent" recommendation feed</li>
            <li className="list-item">Basic deduplication in search results</li>
            <li className="list-item">Community names and descriptions are editable</li>
            <li className="list-item">Community leave history is displayed with the ability to rejoin left communities</li>
            <li className="list-item">Admins can leave communities</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Feedback redirect URL now redirects to external submission page</li>
            <li className="list-item">Extension copy share URL now includes missing "s"</li>
            <li className="list-item">Deleted submissions are no longer visible on submission page</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Old server API is depreciated.</li>
        </ul>


      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        February 20th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Favicons added to submissions when they appear in search results</li>
            <li className="list-item">Community names in search results are hyperlinks</li>
            <li className="list-item">Relevance judgments are removed when viewing own submissions or browsing communities</li>
            <li className="list-item">Submission page delete button toggled based on user permissions</li>
            <li className="list-item">Community page redesign</li>
            <li className="list-item">Page titles for proper tab titles</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Better error handing on website and extension</li>
            <li className="list-item">Users can now leave a community without error</li>
            <li className="list-item">Removed sometimes dangling arrow in search result URL preview</li>
            <li className="list-item">Permission to view submission removed from all communities if user is original creator</li>
            <li className="list-item">Submissions with no communities display "None" in search results</li>
        </ul>



      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        February 10th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">HTTPS</li>
            <li className="list-item">Move to textdata.org</li>
            <li className="list-item">Search result caching</li>
            <li className="list-item">Updated extension to use new domain API</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Redirect when submission is undefined</li>
            <li className="list-item">Better error message display on website and extension</li>
        </ul>




      <h2 className="text-3xl mb-4"  style={{ margin: "20px 0px 0px 0px" }}>
        February 5th, 2023
      </h2>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Features
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">A release log</li>
            <li className="list-item">Basic password reset functionality on website</li>
            <li className="list-item">Hierarchical note pages</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Bug Fixes
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Opening a submission page without being logged in redirects to login page</li>
            <li className="list-item">Better error message display on website and extension</li>
        </ul>
      <h5 className="text-2xl font-bold mb-3" style={{ margin: "10px 0px 0px 0px" }}>
        Miscellaneous
      </h5>
        <ul className="list-disc pl-6">
            <li className="list-item">Passwords must be longer than 5 characters</li>
            <li className="list-item">Usernames must be longer than 1 character</li>
            <li className="list-item">Emails must have valid form</li>
            <li className="list-item">Pages start at 1</li>
        </ul>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      ></div>
    </Paper>
    <Footer/>
    </>
  );
}