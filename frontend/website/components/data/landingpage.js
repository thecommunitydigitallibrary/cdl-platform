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


import visualizeImg from "../../public/images/visualize.png";


import extFindImg from "../../public/images/extension_find.png";

const benefitOne = {
  title: "Form Communities",
  desc: "A community is where members can save and organize information. A community can consist of any number of users.",
  image: communityImg,
  link: "community-overview",
  bullets: [
    {
      title: "Create Communities",
      desc: "Make one for a class, an enterprise team, a research group, or for private personal notes.",
      icon: <AddCircleOutlineIcon />,
    },
    {
      title: "Join Communities",
      desc: "Joining a community lets you view everything in the community and make submissions to that community.",
      icon: <ArrowForwardIcon />,
    },
    {
      title: "Share and Follow Communities",
      desc: "Making a community public lets others follow it, search the content, and provide feedback.",
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
      title: "Optionally Add a Source URL",
      desc: "Adding a Source URL will link your notes to an external webpage. Use this to reference something online (e.g., a lecture video).",
      icon: <CreateIcon />,
    },
    {
      title: "Add a Title and Description",
      desc: "The title should briefly describe the note's purpose, and the description can be whatever you like. In the description, you can also link other submissions to create wiki-style connections among submissions in a community.",
      icon: <SaveIcon />,
    },
    {
      title: "Submit from Anywhere",
      desc: "You can create submission from the TextData website and from the Chrome browser extension.",
      icon: <CollectionsBookmarkIcon />,
    },
  ],
};

const benefitThree = {
  title: "Ask and Answer Questions",
  desc: "Search the web and submissions from your joined and followed communities using in-context search and recommended questions.",
  image: extFindImg,
  link: "search-overview",
  bullets: [
    {
      title: "In-Context Search",
      desc: "Highlight some text and type a word or phrase to let TextData predict your question. Add a '?' at the end of your query to ask the typed question.",
      icon: <SearchIcon />,
    },
    {
      title: "People Also Asked...",
      desc: "See what other community members and TextData users have asked in your given context.",
      icon: <FeedIcon />,
    },
    {
      title: "Search Everything",
      desc: "Search results come from both the general web and submissions made to your joined and followed communities.",
      icon: <ChangeCircleIcon />,
    },
  ],
};

const benefitFour = {
  title: "Interact with and Visualize Submissions",
  desc: "Use the TextData website to read, reply, visualize, share submissions.",
  image: visualizeImg,
  link: "submission-overview",

  bullets: [
    {
      title: "Edit, Delete, Share",
      desc: "You can edit a submission, add or remove it from a community, delete it entirely, or provide feedback.",
      icon: <CreateIcon />,
    },
    {
      title: "Make Connections",
      desc: "Explicitly mentioning a submission URL in another submission will create a directed edge between the two submissions.",
      icon: <ReplyIcon />,
    },
    {
      title: "Visualize Submissions, Questions, and Answers",
      desc: "For any community or search, see all submissions' connections, asked questions, and answers (if any).",
      icon: <TimelineIcon />,
    },
  ],
};






export { benefitOne, benefitTwo, benefitThree, benefitFour };
