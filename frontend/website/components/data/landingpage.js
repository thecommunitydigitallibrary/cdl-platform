import communityImg from "../../public/images/communities.png";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PeopleIcon from '@mui/icons-material/People';


import submitImg from "../../public/images/submit.png";
import CreateIcon from '@mui/icons-material/Create';
import SaveIcon from '@mui/icons-material/Save';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';

import SearchIcon from '@mui/icons-material/Search';
import FeedIcon from '@mui/icons-material/Feed';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';

import ReplyIcon from '@mui/icons-material/Reply';
import TimelineIcon from '@mui/icons-material/Timeline';


import submissionImg from "../../public/images/submission_page.png";
import extFindImg from "../../public/images/extension_find_2023-12-15.png";

const benefitOne = {
  title: "Form Communities",
  desc: "A community is where you save information. A community consists of any number of users, all generally interested in a similar topic.",
  image: communityImg,
  link: "community-overview",
  bullets: [
    {
      title: "Create a Community",
      desc: "Make one for private personal archives, for class notes, for working on a class project, or for thoughts on interesting articles.",
      icon: <AddCircleOutlineIcon />,
    },
    {
      title: "Join a Community",
      desc: "You can join a community by copy-pasting the community join key (accessible from clicking the 'Key' icon).",
      icon: <ArrowForwardIcon />,
    },
    {
      title: "Collaborate with Others",
      desc: "All information saved to a community is accessible by any member of the community, and only members of a community can see the content.",
      icon: <PeopleIcon />,
    },
  ],
};

const benefitTwo = {
  title: "Create and Save Information",
  desc: "Create markdown-style notes and save them to any of your communities.",
  image: submitImg,
  link: "how-to-bookmark",
  bullets: [
    {
      title: "Optionally Add an External URL",
      desc: "Adding a Source URL will link your notes to an external webpage. Use this to take notes with respect to something online (e.g., a lecture video).",
      icon: <CreateIcon />,
    },
    {
      title: "Add a Title and Description",
      desc: "The title should briefly describe the note's purpose, and the description can be whatever you like.",
      icon: <SaveIcon />,
    },
    {
      title: "Submit from Anywhere",
      desc: "You can create submission from the website and from the Chrome browser extension.",
      icon: <CollectionsBookmarkIcon />,
    },
  ],
};

const benefitFour = {
  title: "Interact with Submissions",
  desc: "Visit a submission's TextData-specific page to read, reply, visualize, share.",
  image: submissionImg,
  link: "submission-overview",

  bullets: [
    {
      title: "Edit, Delete, Share",
      desc: "You can edit a submission, add or remove it from a community, delete it entirely, or provide feedback.",
      icon: <CreateIcon />,
    },
    {
      title: "Reply",
      desc: "Replying to a submission will create another submission and display it beneath the description. This way, any future user who visits this submission will see your reply",
      icon: <ReplyIcon />,
    },
    {
      title: "Visualize",
      desc: "See how similar submissions are related by interacting with the graph.",
      icon: <TimelineIcon />,
    },
  ],
};

const benefitThree = {
  title: "Find Information",
  desc: "Search, view recommendations, ask questions, and more from the content submitted to your communities.",
  image: extFindImg,
  link: "search-overview",
  bullets: [
    {
      title: "Search and Browse Your Communities",
      desc: "The submissions to your joined communities are searchable using the search bar on the website or in the extension.",
      icon: <SearchIcon />,
    },
    {
      title: "Get Recommendations",
      desc: "View your recommendation feed on the homepage or open the extension on a webpage to see contextual recommendations. Open the extension with highlighted text to see submissions tailored to your selected context.",
      icon: <FeedIcon />,
    },
    {
      title: "Interact in Context",
      desc: "Use the extension to ask questions in context, summarize selected text, and drive curiosity with automatically generated questions.",
      icon: <ChangeCircleIcon />,
    },
  ],
};


export { benefitOne, benefitTwo, benefitThree, benefitFour };
