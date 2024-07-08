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
            <p className="py-5 text-xl leading-normal text-gray-500 lg:text-xl xl:text-xl dark:text-gray-300">
              TextData provides a website and Chrome browser extension that help you discover the right information at the right place.

              <br /><br />

              The browser extension predicts the questions that you'll have on any webpage. You can guide this prediction process by highlighting text and by typing a single word, phrase, or full question.
              
              <br /><br />

              The browser extension also shows you questions that other TextData users have asked while viewing the webpage.

              <br /><br />
              Answers are provided from both the general web and user-created submissions to TextData communities, which you can manage via the TextData website. To get started, click one of the buttons below.
            </p>

            <div className="flex flex-col m-3 items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center sm:flex-row">


              <a href="https://textdata.org/submissions/661057246eff65a5d6228aa9" className="px-8 py-3 text-lg font-medium text-center text-white bg-blue-500 rounded-md no-underline">
                Start the Onboarding
              </a>

              <a
                href="https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0"
                target="_blank"
                rel="noopener"
                className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 px-8 py-3 text-white bg-green-500 text-lg font-medium text-center rounded-md  no-underline">
                <span> Download the Extension</span>
              </a>
              <a
                href="https://github.com/thecommunitydigitallibrary/cdl-platform"
                target="_blank"
                rel="noopener"
                className="px-8 py-3 text-lg font-medium text-center text-white bg-blue-500 rounded-md no-underline">
                <span> View on Github</span>
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center w-full lg:w-2/4">
          <video muted controls autoPlay loop>
            <source src="/images/ext_find.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Container>

    </>
  );
}

export default Hero;