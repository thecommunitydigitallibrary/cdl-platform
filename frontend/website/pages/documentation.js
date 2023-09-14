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
        category: "Getting Started",
        items: [
            {
                title: "Using the Community Digital Library",
                link: "home",
                content: (
                    <>
                        <p>
                            The Community Digital Library (CDL) is a website and Chrome extension
                            with the goal of helping the scaling and efficiency of online learning.
                        </p>
                        <p>
                            CDL provides various features and functionalities to enhance your online learning experience.
                            In this section, we will explore the core features of the CDL platform.
                        </p>
                        {/* Add content for this section */}
                    </>
                ),
            },
            {
                title: "Creating a Submission",
                link: "how-to-submit",
                content: (
                    <>
                        <p>
                            You can create a submission by using the Chrome extension's "Submit"
                            tab. A submission consists of the current URL (i.e., the page that you
                            opened the extension on), the highlighted text present in the field,
                            and a short user explanation of why this page is interesting or
                            useful. Upon clicking "Submit," all of this will be saved to the
                            selected community.
                        </p>
                        <p>
                            In this section, we will guide you through the process of creating and submitting content to the CDL.
                        </p>
                        {/* Add content for this section */}
                    </>
                ),
            },
        ],
    },
    {
        category: "Searching",

        items: [{
            title: "Searching the CDL",
            link: "how-to-search",
            content: (
                <>
                    <p>
                        Searching within the Community Digital Library (CDL) is a straightforward process.
                        Whether you are looking for specific content or exploring new resources,
                        our search functionality can assist you in finding what you need.
                    </p>
                    <p>
                        In this section, we will show you how to effectively search for content within the CDL.
                    </p>
                    {/* Add content for this section */}
                </>
            ),
        },],
    },
    {
        category: "Taking Notes",
        items: [
            {
                title: "Taking Notes",
                link: "how-to-notes",
                content: (
                    <>
                        <p>
                            Note-taking is an essential part of the learning process, and the CDL provides a dedicated
                            feature to help you organize and manage your notes efficiently.
                        </p>
                        <p>
                            In this section, we will explain how to create, edit, and utilize notes within the CDL.
                        </p>
                        {/* Add content for this section */}
                    </>
                ),
            },],
    },
    {
        category: "More",
        items: [
            {
                title: "More about Submissions",
                link: "how-to-discover",
                content: (
                    <>
                        <p>
                            Beyond the core features, the CDL offers additional functionality to enhance your user experience.
                            These features include submission management, community interactions, and more.
                        </p>
                        <p>
                            In this section, we will explore the various options and capabilities provided by the CDL.
                        </p>
                        {/* Add content for this section */}
                    </>
                ),
            },
            {
                title: "Joining, Creating, and Viewing Communities",
                link: "how-to-community",
                content: (
                    <>
                        <p>
                            Beyond the core features, the CDL offers additional functionality to enhance your user experience.
                            These features include submission management, community interactions, and more.
                        </p>
                        <p>
                            In this section, we will explore the various options and capabilities provided by the CDL.
                        </p>
                        {/* Add content for this section */}
                    </>
                ),
            },

        ],
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
    // Inside your Documentation component
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
                <title>How To Use</title>
                <meta
                    name="description"
                    content="CDL"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header />
            <div className="allResults flex">
                <div className="w-1/5 bg-gray-200 p-4">
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
                            <div key={index} ref={topicRefs.current[index]}>
                                <h2 className="text-lg font-semibold mb-2">{category.category}</h2>
                                {category.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="mb-4">
                                        <h3 className="text-md font-semibold mb-2">{item.title}</h3>
                                        <Paper elevation={0}>
                                            <ContentSection content={item.content} link={item.link} />
                                            {testGIF}
                                            {/* <img src={gifExample} alt="loading..." /> */}

                                        </Paper>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </Paper>
                </div>
            </div>
            <Footer />
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
        <>
            <List component="nav" dense>
                {topics.map((category, index) => (
                    <div key={index}>
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
                                            variant="h6"
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
                                                <Typography variant="body1" color="primary">
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
        </>
    );
}

