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
                            The Community Digital Library (CDL) is an online and open-source social bookmarking platform that allows you to collaboratively describe and save, search for, and discover webpages related to your interests. We offer a stand-alone website and a Chrome extension, all for free.
                        </p>
                        <p>
                            The CDL provides various features and functionalities to enhance your online learning experience.
                            On this page, we outline the main features of the CDL, and how to best use these features to achieve your goals.
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
                            tab, or by clicking the "+" on the CDL website header.                           
                            A submission consists of the current URL (i.e., the page that you
                            opened the extension on), a title, and a description.
                            After clicking "Submit," all of this will be saved to the
                            selected community.
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
                        our search functionality can assist you in finding what you need. You can enter a search
                        query into the search bar in either the website or the extension.
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
                            feature to help you organize and manage your notes efficiently. You can create, edit, and delete
                            markdown-style notes by clicking the "Notes" in the website header. These notes are private to you.
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
                            Coming soon!
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
            <div className="flex flex-col space-y-14">
                <Header />
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
                <Footer />
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

