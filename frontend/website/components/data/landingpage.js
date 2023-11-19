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
import searchRecImg from "../../public/images/search_rec.png";

const benefitOne = {
  title: "Form Communities",
  desc: "A community is where submissions are saved. A community consists of any number of CDL users, all generally interested in a similar topic.",
  image: communityImg,
  link: "community-overview",
  bullets: [
    {
      title: "Create a Community",
      desc: "Make one for private personal archives, for working on a class project, or for remembering interesting articles.",
      icon: <AddCircleOutlineIcon />,
    },
    {
      title: "Join a Community",
      desc: "You can join a community by copy-pasting the community join key (accessible from clicking the 'Key' icon!).",
      icon: <ArrowForwardIcon />,
    },
    {
      title: "Explore with Other Members",
      desc: "All submissions to a community are accessible by any member of the community.",
      icon: <PeopleIcon />,
    },
  ],
};

const benefitTwo = {
  title: "Make Submissions",
  desc: "Create markdown-style notes and submit them to any of your communities",
  image: submitImg,
  link: "how-to-bookmark",
  bullets: [
    {
      title: "Optionally Add a Webpage",
      desc: "Adding a Submission URL will link your notes to an external webpage.",
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
  desc: "Visit a submission's CDL-specific webpage to read, reply, visualize, share.",
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
  title: "Discover Information",
  desc: "Search and view recommendations from the content submitted to your communities.",
  image: searchRecImg,
  link: "search-overview",
  bullets: [
    {
      title: "Search Your Communities",
      desc: "The submissions to your joined communities are searchable using the website or the extension.",
      icon: <SearchIcon />,
    },
    {
      title: "Get Recommendations",
      desc: "View your recommendation feed on the homepage or open the extension on a webpage to see contextual recommendations. Open the extension with highlighted text to see submissions tailored to your selected context.",
      icon: <FeedIcon />,
    },
    {
      title: "Automatic Suggestions",
      desc: "See recommendations for your queries and while typing submission descriptions in real time.",
      icon: <ChangeCircleIcon />,
    },
  ],
};


export { benefitOne, benefitTwo, benefitThree, benefitFour };
