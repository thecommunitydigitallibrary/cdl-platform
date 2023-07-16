
import benefitOneImg from "../../public/images/benefit-one.png";
import benefitTwoImg from "../../public/images/benefit-two.png";
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const benefitOne = {
  title: "What we do",
  desc: "You can use this to..",
  image: benefitOneImg,
  bullets: [
    {
      title: "Organize Your Bookmarks",
      desc: "Save and categorize webpages to access later.",
      icon: <CollectionsBookmarkIcon />,
    },
    {
      title: "Take Notes",
      desc: "Capture and organize your notes with ease.",
      icon: <DocumentScannerIcon />,
    },
    {
      title: "Explore topics",
      desc: "Capture and organize your notes with ease.",
      icon: <TravelExploreIcon />,
    },
  ],
};

const benefitTwo = {
  title: "Add more benefits here-",
  desc: "Highlight your rest of the benefits of cdl. .",
  image: benefitTwoImg,
  bullets: [
    {
      title: "Mobile Responsive",
      desc: "CDL is ...",
      // icon: < />,
    },
    {
      title: "Brought to you by..",
      desc: "This service..",
      // icon: < />,
    },
    {
      title: "Dark & Light Mode",
      desc: "CDL will come with a zero-config light & dark mode. ",
      // icon: <SunIcon />,
    },
  ],
};


export { benefitOne, benefitTwo };
