import benefitOneImg from "../../public/images/benefit-one.png";
import benefitTwoImg from "../../public/images/benefit-two.png";
import benefitThreeImg from "../../public/images/benefit-three.png";
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const benefitOne = {
  title: "Take Notes",
  desc: "Aadd a comment here",
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
  title: "Organize Your Bookmarks",
  desc: "Save and categorize webpages to access later.",
  image: benefitTwoImg,
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

const benefitThree = {
  title: "Explore topics",
  desc: "Best of the features of cdl. .",
  image: benefitThreeImg,
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


export { benefitOne, benefitTwo, benefitThree };
