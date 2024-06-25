// Documentation
import React, { useState, useRef, createRef } from "react";
import Paper from "@mui/material/Paper";
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
                            This page is under construction! Please check back later.
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
                                <b>As a user</b>, ...
                            </li>
                            <li>
                                <b>As a developer</b>, ...
                            </li>
                            <li>
                                <b>As a researcher</b>, ...
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

