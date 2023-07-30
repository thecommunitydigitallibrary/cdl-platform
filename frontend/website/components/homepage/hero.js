import Image from "next/image";
import Container from "./container";
// import heroImg from "../../public/images/test.png";
import heroImg from "../../public/images/cdl-ss.png";
import Link from "next/link";
import jsCookie from "js-cookie";

import React, { useState, useEffect } from "react";

const Hero = () => {


  const [loggedOut, setLoggedOut] = useState(true);
  
  useEffect(()=>{
    setLoggedOut(
      jsCookie.get("token") == "" || jsCookie.get("token") == undefined
    );
  },[])

  return (
    <>
      <Container className="flex flex-wrap">
        <div className="flex items-center w-full h-full lg:w-2/3 px-2">
          <div className="max-w-2xl ml-6 mt-30">
          <h1 className="text-4xl font-bold leading-snug tracking-tight text-gray-800 lg:text-3xl lg:leading-tight xl:text-5xl xl:leading-tight dark:text-white">
              The Community Digital Library
            </h1>
            <p className="py-5 text-xl leading-normal text-gray-500 lg:text-xl xl:text-xl dark:text-gray-300">
            The CDL is a platform for bookmarking webpages, taking notes, and discovering online content. Our vision is to anticipate the questions that you may have while viewing online content and proactively provide you with answers without requiring any effort.
            </p>

            <div className="flex flex-col items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center sm:flex-row">
             
              {!loggedOut ? <a href="/" className="px-8 py-4 text-lg font-medium text-center text-white bg-blue-500 rounded-md no-underline">
                      Home
                    </a> : <a href="/auth" className="px-8 py-4 text-lg font-medium text-center text-white bg-blue-500 rounded-md no-underline">
                      Get Started
                    </a>}
              <a
                href="https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0"
                target="_blank"
                rel="noopener"
                className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 no-underline">
                  <svg role="img"
                  width="24"
                  height="24"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor" ><title>Google Chrome</title><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" fill="#595454"></path></svg>

                <span> Download Extension</span>
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center w-full lg:w-1/3">
          <div className="">
            <Image
              src={heroImg}
              width="500"
              height="500"
              className={"object-cover"}
              alt="Hero"
              loading="eager"
              placeholder="blur"
            />
          </div>
        </div>
      </Container>
      
    </>
  );
}

export default Hero;