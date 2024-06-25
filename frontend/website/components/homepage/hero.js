import Container from "./container";
import jsCookie from "js-cookie";

import React, { useState, useEffect } from "react";
import useUserDataStore from "../../store/userData";

const Hero = () => {

  const { isLoggedOut, setLoggedOut } = useUserDataStore();

  useEffect(() => {
    setLoggedOut(
      jsCookie.get("token") == "" || jsCookie.get("token") == undefined
    );
  }, [])

  return (
    <>
      <Container className="flex flex-wrap">
        <div className="flex items-center w-full h-full lg:w-2/4 px-2">
          <div className="max-w-2xl ml-6 mt-30">
            <h1 className="text-4xl font-bold leading-snug tracking-tight text-gray-800 lg:text-3xl lg:leading-tight xl:text-5xl xl:leading-tight dark:text-white">
              TextData
            </h1>
            <h3>
              Save what you know. Find what you don't.
            </h3>
            <p className="py-5 text-xl leading-normal text-gray-500 lg:text-xl xl:text-xl dark:text-gray-300">
              TextData is an online platform for communities of users to discover the right information at the right place. We provide a website and a browser extension where users can effortlessly ask and answer questions in any online context. We also provide question recommendations based on what other users have asked in similar prior contexts.
              <br /><br />
              Answers are provided from both the general web and user-created submissions to TextData communities. The recommended questions and provided answers help users efficiently discover high-quality information while mitigating many of the challenges in knowing what to ask and where it should be asked.
            </p>

            <div className="flex flex-col m-3 items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center sm:flex-row">

              {!isLoggedOut ? <a href="/" className="px-8 py-3 text-lg font-medium text-center text-white bg-blue-500 rounded-md no-underline">
                Home
              </a> : <a href="/auth" className="px-8 py-3 text-lg font-medium text-center text-white bg-blue-500 rounded-md no-underline">
                Get Started
              </a>}

              <a
                href="https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0"
                target="_blank"
                rel="noopener"
                className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 px-8 py-3 text-white bg-green-500 text-lg font-medium text-center rounded-md  no-underline">
                <svg role="img"
                  width="24"
                  height="24"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="white" >
                  <title>Google Chrome</title>
                  <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" fill="white"></path>
                </svg>

                <span> Download Extension</span>
              </a>
              <a
                href="https://github.com/thecommunitydigitallibrary/cdl-platform"
                target="_blank"
                rel="noopener"
                className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
                <svg
                  role="img"
                  width="24"
                  height="24"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor">
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span> View on Github</span>
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center w-full lg:w-2/4">
          <video muted controls autoPlay loop>
            <source src="/images/full_intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Container>

    </>
  );
}

export default Hero;