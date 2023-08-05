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


import noteImg from "../../public/images/notes.png";
import searchRecImg from "../../public/images/search_rec.png";

const benefitOne = {
  title: "Form Communities",
  desc: "A community is where bookmarks are saved. A community consists of any number of CDL users, all generally interested in a similar topic.",
  image: communityImg,
  bullets: [
    {
      title: "Create a Community",
      desc: "Make one for private personal archives, for working on a class project, or for remembering interesting articles.",
      icon: <AddCircleOutlineIcon />,
    },
    {
      title: "Join a Community",
      desc: "You can join a community by copy-pasting the community join key (accessible from clicking the 'Key' icon!)",
      icon: <ArrowForwardIcon />,
    },
    {
      title: "Explore with Other Members",
      desc: "All webpages bookmarked to a community are accessible by any member of the community",
      icon: <PeopleIcon />,
    },
  ],
};

const benefitTwo = {
  title: "Bookmark Webpages",
  desc: "Describe and save webpages to any of your joined communities.",
  image: submitImg,
  bullets: [
    {
      title: "Describe the Webpage",
      desc: "Give the webpage a title and a description for helping you or your community members easily search for the bookmark.",
      icon: <CreateIcon />,
    },
    {
      title: "Save the Webpage to a Community",
      desc: "Select a community to save your bookmark. All members of the community will now be able to search for and access the bookmark.",
      icon: <SaveIcon />,
    },
    {
      title: "Bookmark from Anywhere",
      desc: "You can create a bookmark from the website and the Chrome browser extension.",
      icon: <CollectionsBookmarkIcon />,
    },
  ],
};

const benefitThree = {
  title: "Take Notes",
  desc: "Take markdown-style hierarchical, private notes.",
  image: noteImg,
  bullets: [
    {
      title: "Create a Note Page",
      desc: "Create a note page on any topic",
      icon: <CreateIcon />,
    },
    {
      title: "Save the Note Page",
      desc: "Save the note page to your private collection.",
      icon: <SaveIcon />,
    },
    {
      title: "Live Edit Previews",
      desc: "While editing, see the changes to your page in real-time.",
      icon: <ChangeCircleIcon />,
    },
  ],
};

const benefitFour = {
  title: "Discover Information",
  desc: "Search and view recommendations from the content submitted to your communities.",
  image: searchRecImg,
  bullets: [
    {
      title: "Search Your Communities",
      desc: "The webpages submitted to your communities are searchable using the website or the extension.",
      icon: <SearchIcon />,
    },
    {
      title: "Get General Recommendations",
      desc: "View your recommendation feed on the homepage or open the extension on a webpage to see contextual recommendations. Open the extension with highlighted text to see more specific contextual suggestions.",
      icon: <FeedIcon />,
    },
    {
      title: "Get Note-based Recommendations",
      desc: "See recommendations from your communities while you edit your notes pages in real time.",
      icon: <ChangeCircleIcon />,
    },
  ],
};


export { benefitOne, benefitTwo, benefitThree, benefitFour };
