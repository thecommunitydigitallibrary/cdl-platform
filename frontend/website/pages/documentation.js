// Documentation
import React, { useState, useRef, createRef } from "react";
import Paper from "@mui/material/Paper";
import Header from "../components/header";
import Footer from "../components/footer";
import Head from "next/head";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
// import gifExample from "../../public/images/gif-eg.png";

import { IconButton, List, ListItem, ListItemText, Typography } from "@mui/material"

const topics = [

    {
        category: "Overview",
        items: [
            {
                title: "What is TextData?",
                link: "what-is",
                content: (
                    <>
                        <p>
                            TextData is an <a target="_blank" rel="noopener noreferrer" href="/">online</a> and <a target="_blank" rel="noopener noreferrer" href="https://github.com/thecommunitydigitallibrary/cdl-platform">open-source</a> platform that helps you save what you know and find what you don't. You can take markdown-style notes independently or with respect to a webpage, share them across communities, and search or discover submitted and indexed content related to your interests. We offer a website and a Chrome extension, all for free.
                        </p>
                        <p>
                            TextData provides various features and functionalities to enhance your online learning experience.
                            On this page, we outline everything you need to know about TextData, and how to best use TextData to achieve your goals.
                        </p>
                    </>
                )
            },
            {
                title: "Background and Motivation",
                link: "background",
                content: (
                    <>
                        <p>
                            The TextData project (formally SeekNet, The Community Digital Library) began in the fall of 2022, and its original purpose was to support an information retrieval and ranking course assignment at the University of Illinois Urbana-Champaign. The original development was done by <a target="_blank" rel="noopener noreferrer" href="https://kevinros.github.io/">Kevin Ros</a>, the TA at the time, who created a basic version of TextData to be used in the course. As the semester progressed, Kevin and his PhD advisor/course instructor, <a target="_blank" rel="noopener noreferrer" href="https://czhai.cs.illinois.edu/">Dr. ChengXiang Zhai</a>, realized that TextData could be generalized to a much more powerful online platform that could support numerous features, act as a sandbox for researching retrieval and recommendation, and allow the collection of various data sets to study user interactions. Since the fall of 2022, Kevin had led a team of developers, from the University of Illinois, under the supervision of Dr. Zhai, to build TextData into what you see here today. And TextData has become a central component in Kevin's PhD thesis.
                        </p>
                    </>
                )
            },
            {
                title: "Purpose",
                link: "purpose",
                content: (
                    <>
                        <p>
                            The purpose of TextData depends on you and your goals:
                        </p>
                        <ul>
                            <li>
                                <b>As a user</b>, TextData offers numerous features to help save, organize, and find online information. We provide more details in the following sections outlining these features and how best to use them.
                            </li>
                            <li>
                                <b>As a developer</b>, TextData is <a target="_blank" rel="noopener noreferrer" href="https://github.com/thecommunitydigitallibrary/cdl-platform">open-source</a>, and we encourage you to suggest or implement any feature that you think would be helpful for your experience while using the platform. If you aren't sure where to begin, then reach out to Kevin Ros at <a href="mailto:kjros2@illinois.edu">kjros2@illinois.edu</a>.
                            </li>
                            <li>
                                <b>As a researcher</b>, TextData can be used to perform studies on user interactions over webpages, searches, ranking formula, and recommendation. And due to TextData being open-source and runnable fully locally, you have the flexibility to modify TextData to fit your study's needs.
                            </li>
                        </ul>
                    </>
                )
            },
            {
                title: "Research",
                link: "r-ltv",
                content: (
                    <>
                        <p>
                            TextData has been built on and has led to numerous publications and posters:
                        </p>
                        <ul>
                            <li>
                                Ros, Kevin, Maxwell Jong, Chak Ho Chan, and ChengXiang Zhai. "<a target="_blank" rel="noopener noreferrer" href="../../papers/student_question_generation.pdf">Generation of Student Questions for Inquiry-based Learning.</a>" In Proceedings of the 15th International Conference on Natural Language Generation, pp. 186-195. 2022.
                            </li>
                            <li>
                                Ros, Kevin, Matthew Jin, Jacob Levine, and ChengXiang Zhai. "<a target="_blank" rel="noopener noreferrer" href="../../papers/retrieving_webpages.pdf">Retrieving Webpages Using Online Discussions.</a>" In Proceedings of the 2023 ACM SIGIR International Conference on Theory of Information Retrieval, pp. 159-168. 2023.
                            </li>
                            <li>
                                Ros, Kevin, and ChengXiang Zhai. "<a target="_blank" rel="noopener noreferrer" href="../../papers/demo_cscw.pdf">The CDL: An Online Platform for Creating Community-based Digital Libraries.</a>" In Computer Supported Cooperative Work and Social Computing, pp. 372-375. 2023.
                            </li>
                            <li>
                                Ros, Kevin, and ChengXiang Zhai. "<a target="_blank" rel="noopener noreferrer" href="../../papers/cdl_poster_09282023.pdf">A Task-Focused View of the Community Digital Library.</a>" Presented at Task Focused IR in the Era of Generative AI, Microsoft Research, Redmond, Washington, September 28-29, 2023.
                            </li>
                        </ul>
                        <p>
                            Our current and future research projects include many exciting directions, including contextual search, automatic content organization, content visualization, chatbot integration, and user studies. We are always looking for collaborators; if you would like to get involved, then please reach out to Kevin Ros at <a href="mailto:kjros2@illinois.edu">kjros2@illinois.edu</a>.
                        </p>
                    </>
                )
            }

        ]

    },
    {
        category: "Setup",
        items: [
            {
                title: "Creating an Account",
                link: "create-account",
                content: (
                    <>
                        <p>
                            You must make an account before you can begin using TextData. An account can be created <a target="_blank" rel="noopener noreferrer" href="/auth">here</a>. Note that accounts made on the website will not work when running the the service locally through localhost, so you will need to create separate accounts.
                        </p>
                    </>
                ),
            },
            {
                title: "Installing the Extension",
                link: "install-extension",
                content: (
                    <>
                        <p>
                            The Chrome extension is available in the Chrome web store and can be installed from <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0">here</a>. After installing, you will be able to log into your account that you created using the TextData website. The extension defaults to logging in users via the hosted version of TextData, so if you wish to use the extension with your local instance, then you will need to change the extension "Backend Source" setting.
                        </p>
                    </>
                ),
            }
        ]
    },
    {
        category: "Communities",
        items: [
            {
                title: "Community Overview",
                link: "community-overview",
                content: (
                    <>
                        <p>
                            Much like a group chat, a subreddit, or a folder, a community is place for you and your peers to save organize content. You can create, join, or leave communities, and any member of a community can search for or browse all content present in the community. Moreover, any user not in a community will not be able to view its content.
                            A community can have any number of members, ranging from just yourself (e.g., a private community to save your personal notes) to hundreds of members (e.g., a large class all taking notes together on lectures and textbooks).
                        </p>
                    </>
                ),
            },
            {
                title: "Creating a Community",
                link: "community-creation",
                content: (
                    <>
                        <p>
                            You can create a community by selecting the "Communities" tab in the navigation header bar at the top of the TextData website, and then clicking the "+" in the "Create" box. You will need to provide a name, which should describe the purpose of the community (e.g., "Papers", "CS410 Fall 2023", or "Cool News Articles"). After creating a community, your page should refresh and you should see the newly-created community's card on your screen. If you would like to change the name or add a description, you can click the pen "edit" button on the card and edit the desired details.
                        </p>
                    </>
                ),
            },
            {
                title: "Inviting, Joining, and Leaving Communities",
                link: "community-invite-join-leave",
                content: (
                    <>
                        <p>
                            To invite a user to one of your communities, you can click the "key" icon of the community's card. Clicking this will copy a join key, which you can then send to other user(s).
                        </p>
                        <p>
                            To join a community, you can click the join card's arrow and paste the respective community's join key. Then after clicking "join", your communities page should refresh and you should see your newly-joined community's card.
                        </p>
                        <p>
                            To leave a community, you can click the exit button on a community's card. In the case that you'd like to rejoin the community, you can either re-enter the join key or navigate to the "History" tab on the Communities page and select the respective community's rejoin button.
                        </p>
                    </>
                ),
            },
            {
                title: "Visualization",
                link: "community-visualization",
                content: (
                    <>
                        <p>
                            TextData supports the basic visualization of any community's content. To view a community's visualization, you can click the "Visualize Community" on the community's card. This will bring you to an interactive graph where the community's submissions are organized around hashtags, topics, and meta-descriptors.
                        </p>
                    </>
                ),
            }
        ]
    },
    {
        category: "Submissions",
        items: [
            {
                title: "Submission Overview",
                link: "submission-overview",
                content: (
                    <>
                        <p>
                            A submission is the fundamental building block of TextData. Submissions are user-created, and consist of an optional source URL, a title, and a description. Submissions can be added to or removed from communities, and if you are are a member of a community, then you can search over, browse, and view all submissions currently added to a community.
                        </p>
                        <p>
                            The source URL of a submission is to provide you with a way to link external content (e.g., a video, a news article, a published paper, etc.). This field is optional, and if not included, the field will default to the submission's webpage on TextData. The title of a submission is meant to give you and other users a brief overview of the submission. And the description is meant to provide you with the ability to create markdown-style notes for whatever you're submitting.
                        </p>
                    </>
                ),
            },
            {
                title: "Creating a Submission",
                link: "submission-creation",
                content: (
                    <>
                        <p>
                            You can create a submission by using either Chrome extension's "Submit" tab or by clicking the "+" on the TextData website header. The source URL is optional when using the TextData website header, but while using the Chrome extension, it will be the page that you open the extension on. Next, you can add a title, a description, and decide whether or not the submission should be anonymous (i.e., if it displays your username to other community members).Then, after selecting a community, you can click "Submit" to save the submission to the selected community.
                        </p>
                        <p>
                            To check your submission(s), you can click the "Submissions" tab in the header at the top of the TextData website. This will bring you to a page that displays, in reverse chronological order, all of your submissions that you have made to all of your communities.
                        </p>
                        <p>
                            If you included a source URL and the webpage is publicly available, then TextData's server will try to index the webpage. This is why you may sometimes see search results and recommendations with the community listed as "Webpage".
                        </p>
                        <p>
                            While typing the description, TextData provides a quick way to connect notes together. By typing "[[search terms]]" followed by a space, TextData will suggest submissions in your communities related to these search terms. Then, clicking any one of these suggestions will replace the brackets with a hyperlink to that submission. For example, typing "[[textdata demos]] " will return suggestions related to "textdata demos".
                        </p>
                    </>
                ),
            },
            {
                title: "Submission Card and Features",
                link: "submission-features",
                content: (
                    <>
                        <p>
                            The submission card provides you with numerous ways to view and interact with the submission. Clicking the hyperlinked title at the top of the submission card will open the submitted URL in another tab. If no source URL was included, then this will take you to TextData's submission page. Below the hyperlinked title is the shortened submitted URL and submission time. Below this is the submission's description. And at the bottom left of the submission are the names of the communities that the submission is a part of, and the list of hashtags (if any). Hashtags are automatically extracted from the title and description, and are meant to provide you with a way to easily search for and filter submissions. More information about hashtags can be found in the Search section below. Following searches or recommendations, each submission card will contain relevance judgment buttons at the bottom left. These buttons are meant to provide you with a way to rate the submissions with respect to your query or recommendation context.
                        </p>
                        <p>
                            Each submission card also contains three dots at the top right corner. Clicking these three dots will open a small menu with multiple options. Clicking the first option, "View Submission", will bring you to TextData's submission page. On this page, you will be able to view the submission's full title and description, see the submissions views/clicks/shares, add or remove the submission from a community, and edit or delete the submission (if you are the submission's creator). The submission page also displays a basic visualization of the submission with respect to other submissions and webpages. Clicking the "Feedback" button will open a small pop-up window where you can send feedback about the submission to TextData (e.g., if the submission is inappropriate or the link is broken). And clicking the "Share URL" will copy the URL of the page to your clipboard. This "Feedback" and "Share URL" functionality is also available as the second and third option in the three dot menu. Finally, clicking "Get Connection ID" will copy the submission ID to your clipboard, which is used to reply (described below)
                        </p>
                        <p>
                            The submission page also supports the ability to reply to the submission. To reply, you have two options: you can connect an existing submission or create a new submission. To connect an existing submission, you only need to post the submission's connection ID in the field and click submit. And to create a new submission, you need to fill out the information in the presented form after clicking "Reply". In either case, the connected/created submission will be displayed on the source submission's page below its description.
                        </p>
                    </>
                ),
            },
        ]
    },
    {
        category: "Searches",
        items: [
            {
                title: "Search Overview",
                link: "search-overview",
                content: (
                    <>
                        <p>
                            Searching on TextData is a straightforward process. Whether you are looking for specific content or exploring new resources, our search functionality can assist you in finding what you need. You are able to search over all submissions that have been added to your communities, and you can perform searches using either the TextData website or the Chrome extension.
                        </p>
                    </>
                )
            },
            {
                title: "Searching via the Website",
                link: "search-website",
                content: (
                    <>
                        <p>
                            To search submissions via the TextData website, you can leverage the search bar in the website header. In this search bar, you can enter keyword-based queries (e.g., "bm25") or natural language questions (e.g., "what is the intuition behind bm25?"). Moreover, you can add hashtags to your query (e.g., "bm25 #Lecture1") to restrict your results to those that match the hashtag. And you can filter searches by community using the dropdown menu to the right of the search bar. By default, the search occurs over all of your joined communities. Following the search, you should see a ranked list of submissions corresponding to your query. You also have the ability to judge the relevance of each result via the submission judgment buttons, thus helping us improve the ranking formula.
                        </p>
                    </>
                )
            },
            {
                title: "Searching via the Chrome Extension",
                link: "search-extension",
                content: (
                    <>
                        <p>
                            You can perform searches via the Chrome extension underneath the Chrome extension's "Search" tab. The extension supports the exact same search functionality as the TextData website described above. However, opening the "Search" tab will automatically present recommendations according to your current context (e.g., your current webpage and highlighted text, if any). More information about this feature is presented in the Recommendations section below.
                        </p>
                    </>
                )
            }
        ],
    },
    {
        category: "Recommendations",
        items: [
            {
                title: "Recommendation Overview",
                link: "recommendation-overview",
                content: (
                    <>
                        <p>
                            TextData provides various ways to help you discover submissions made to your communities. The overarching goal of the recommendation functionalities is to provide you with submissions according to your context: your current webpage, previously-clicked submissions, previously-submitted webpages, other members of your community, etc.
                        </p>
                    </>
                )
            },
            {
                title: "Front Page Recommendations",
                link: "recommendation-frontpage",
                content: (
                    <>
                        <p>
                            The homepage of TextData, accessible by clicking the logo at the top left of the webpage header, provides you with two methods of general recommendations: "Explore" and "Most Recent". You can select one or the other via the dropdown menu towards the top of the homepage. The "Explore" method recommends submissions most similar to your most recent submissions. And the "Most Recent" method displays all submissions made to all of your communities in reverse chronological order.
                        </p>
                    </>
                )
            },
            {
                title: "Extension Recommendations",
                link: "recommendation-extension",
                content: (
                    <>
                        <p>
                            The Chrome extension provides contextual recommendations to you when you open the "Find" tab of the extension. Here, the extension pulls the current webpage's URL, webpage title, webpage description, and any highlighted text to use for finding submissions related to the webpage. The submissions will automatically appear beneath the search bar. The recommendation results are grouped by (1) what you've submitted, (2) what your community members have submitted, and (3) what has been indexed by TextData.
                        </p>
                    </>
                )
            }
        ]
    },
    {
        category: "Additional Features and Functionality",
        items: [
            {
                title: "Core Community Content",
                link: "core-community-content",
                content: (
                    <>
                        <p>
                            Certain communities often have what we call core content - content that members of a community tend to visit very frequently. For example, a community that was created for a university course could consider all of the lecture videos as core content.
                        </p>
                        <p>
                            Any member of a community can make a core submission to a community, which indicates that the submitted webpage and notes are a part of that community's core content. To do so, you should include the hashtag "#core" in either the title or the description of the submission.
                        </p>
                        <p>
                            Including this "#core" hashtag allows all members of a community to explicitly connect submissions to the core content. For example, suppose the core submission included the hashtags "#core #lecture1", indicating that the submission linked to the first lecture of an online course. Then, any future submission to the community that includes "#lecture1" will be connected to the core submission containing "lecture1". These connections can be seen on the core submission's webpage - when the extension is opened, the automatic recommendations will first present the linked submissions (if any).
                        </p>
                    </>
                )
            },
            {
                title: "The Webpage Community",
                link: "webpage-community",
                content: (
                    <>
                        <p>
                            In some search or recommendation results, you may notice submissions that are from a community called "Webpage". These submissions are public webpages that have been automatically scraped by TextData. The title and description of the submission are the title and description of the webpage, respectively. TextData attempts to scrape and index all submitted webpages that are publicly available, so that all users can benefit from a submission.
                        </p>
                    </>
                ),
                title: "The Local Version",
                link: "local-version",
                content: (
                    <>
                        <p>
                            If you would prefer to use the platform locally (e.g., run the server and databases on your computer), then you can follow the directions listed on  <a target="_blank" rel="noopener noreferrer" href="https://github.com/thecommunitydigitallibrary/cdl-platform">GitHub</a>. The extension is also locally compatible by changing the Backend Source under the settings icon tab.
                        </p>
                    </>
                )
            }
        ]
    },
    {
        category: "Use Cases",
        items: [
            {
                title: "Personal Bookmarking",
                link: "personal-bookmarking",
                content: (
                    <>
                        <p>
                            One of the primary use cases of TextData is personal bookmarking and archiving. This is best supported by creating a community (or communities) according to the type of content that you would like to save. For example, a community where you save interesting news articles could be called "News Articles", or a community where you save academic publications could be called "Papers and Demos". And, as you save notes to your personal community, you can add hashtags according to whatever taxonomy you would like to have (e.g., "#empirical" or "#politics"). And after creating the community, you will be its only member, meaning that all bookmarks saved by you are accessible and viewable by only you.
                        </p>
                    </>
                )
            },
            {
                title: "Collaborative Note-taking",
                link: "collaborative-note-taking",
                content: (
                    <>
                        <p>
                            Any meeting note, lecture note, or thought can be made into a submission and saved to any of your communities. You can collaborate with any sized group - from just yourself in a private community for personal thoughts to a class-wide community taking notes on lecture content. With replies, hyperlinks, searches, and recommendations, you will be able to easily organize and discover notes and external webpages related to your interests and goals.
                        </p>
                    </>
                )
            },
            {
                title: "Lecture Content Expansion",
                link: "lecture-content-expansion",
                content: (
                    <>
                        <p>
                            TextData can also be used for adding and organizing online content relating to course lectures. One pain point of courses prevalent today, especially in online courses, is that students often seek course-related online information independently. For example, while watching a lecture, a student may have a question about something mentioned in the lecture. Then, the student may turn to an online search engine to find webpages helpful for resolving their information need. This is done independently of other students or the instructor. As a result, neither other students nor the instructor can benefit from the student's work of finding helpful course-related information. TextData aims to mitigate this problem by providing a way to organize online content with respect to the course content and a way to search and discover the online content when in specific course-related contexts.
                        </p>
                        <p>
                            Instructors who wish to leverage this functionality in their course should first create a course community named accordingly (e.g., "Spring 2023 CS101"). Then, to optionally leverage the core community content feature, they can add each lecture webpage to define a coupling between webpage URL and hashtag. Each submission for the core community content should contain at least two hashtags: "#core" and the hashtag(s) that define this web resource (e.g., "#lecture1", "quiz1", etc.). Once the community is created and the core content is added, the instructor should have each student create an account and send the community join key to all of the students.
                        </p>
                        <p>
                            Once the students are in the community and begin to consume the core community content (i.e., the course content), they can begin making submissions. For example, suppose a student watches the first lecture ("#lecture1"), and finds that they needed to seek out an additional web resource to understand the concepts mentioned in the lecture. They can then create a submission of that web resource to the course community with the hashtag "#lecture1", and a title/description explaining why the webpage is helpful. Then, the next time that a student opens the Chrome extension on the first lecture's web page, the extension should provide the student's submission as a recommendation.
                        </p>
                        <p>
                            Over time, as the community content grows, it can be difficult to understand the breadth of the submitted content. TextData provides a simple visualization of all community submissions with respect to the hashtags. To see this, you can navigate to the Communities tab in the header of the TextData website, and for any community's card, you can click the Visualization icon. This will bring you to a top-down view of the community's submitted content with respect to the hashtags, organized by topics.
                        </p>
                    </>
                )
            }
        ]
    },
    {
        category: "Collaborations",
        items: [
            {
                title: "Development",
                link: "development",
                content: (
                    <>
                        <p>
                            The source code for TextData is available on <a target="_blank" rel="noopener noreferrer" href="https://github.com/thecommunitydigitallibrary/cdl-platform">GitHub</a>. If you notice a bug or would like to add a feature, then we welcome pull requests. If you have an idea for a larger feature or structural change, then please reach out to Kevin Ros at <a href="mailto:kjros2@illinois.edu">kjros2@illinois.edu</a>.
                        </p>
                    </>
                )
            },
            {
                title: "Research",
                link: "research",
                content: (
                    <>
                        <p>
                            We are always looking for collaborators across research disciplines. Whether it be information retrieval, recommendation, user studies, HCI, or any other area, please reach out to Kevin Ros at <a href="mailto:kjros2@illinois.edu">kjros2@illinois.edu</a>.
                        </p>
                    </>
                )
            }
        ]
    },
];

function ContentSection({ title, content, link }) {
    return (
        <section id={link}>
            <Paper elevation={0} sx={{ padding: "10px 20px 5px 20px" }}>
                <Typography variant="h4" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body1">{content}</Typography>
            </Paper>
        </section>
    );
}

export default function Documentation() {
    const [openDropdown, setOpenDropdown] = useState(null);

    const topicRefs = useRef(topics.map(() => createRef()));


    const testGIF = (
        <iframe
            src="https://giphy.com/embed/UrEQirmnMPxBwToULv"
            width="480"
            height="270"
            frameBorder="0"
            className="giphy-embed"
            allowFullScreen
        ></iframe>
    );

    return (
        <>
            <Head>
                <title>Documentation</title>
                <meta
                    name="description"
                    content="TextData"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="flex flex-col space-y-14">
                {/* <Header /> */}
                <div className="flex">
                    <div className="w-1/5 bg-gray-100 p-4 sidebar-container">
                        <h3 className="text-xl font-semibold mb-2">Quick Links</h3>
                        <Sidebar
                            topics={topics}
                            openDropdown={openDropdown}
                            setOpenDropdown={setOpenDropdown}
                            topicRefs={topicRefs}
                        />
                    </div>

                    <div className="w-4/5 p-4 h-full">
                        <Paper elevation={0}>

                            {topics.map((category, index) => (
                                <div key={index} ref={topicRefs.current[index]} className="category-container">
                                    <h2 className="category-title">{category.category}</h2>
                                    {category.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="item-container">
                                            <h3 className="item-title">{item.title}</h3>
                                            <Paper elevation={0} className="paper-container">
                                                <ContentSection content={item.content} link={item.link} />
                                            </Paper>
                                        </div>
                                    ))}
                                </div>
                            ))}


                        </Paper>
                    </div>
                </div>

            </div>
        </>
    );

}



function Sidebar({ topics, openDropdown, setOpenDropdown, topicRefs }) {
    const scrollToTopic = (index) => {
        if (topicRefs.current[index].current) {
            topicRefs.current[index].current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };
    return (
        <div >
            <List component="nav" dense >
                {topics.map((category, index) => (
                    <div key={index} >
                        <ListItem
                            onClick={() => {
                                scrollToTopic(index);
                            }}
                        >
                            <ListItemText
                                primary={
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            color="primary"
                                            className={`${index === 0 ? "font-bold" : ""}`}
                                        >
                                            {category.category}
                                        </Typography>
                                        <IconButton onClick={(e) => {

                                            e.stopPropagation();
                                            setOpenDropdown(index === openDropdown ? null : index)
                                        }}>
                                            {index === openDropdown ? (
                                                <ArrowDropUpIcon />
                                            ) : (
                                                <ArrowDropDownIcon />
                                            )}
                                        </IconButton>
                                    </div>
                                }
                            />
                        </ListItem>
                        {index === openDropdown && (
                            <List component="div" disablePadding>
                                {category.items.map((item, itemIndex) => (
                                    <ListItem
                                        key={itemIndex}
                                        onClick={() => {

                                            scrollToTopic(index);
                                        }}
                                        sx={{ paddingLeft: 4, cursor: 'pointer' }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" color="primary">
                                                    {item.title}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </div>
                ))}
            </List>
        </div>
    );
}

