import React, { useContext, useEffect, useState } from "react";
import FrequentlyAskedQuestions from "./faq";
import Head from "next/head";
import Hero from "../components/homepage/hero";
import SectionTitle from "../components/homepage/sectionTitle";
import { benefitOne, benefitTwo, benefitThree, benefitFour } from "../components/data/landingpage";
import Benefits from "../components/homepage/benefits";
import Testimonials from "../components/homepage/testimonials";
import Cta from "../components/homepage/cta";

export default function About({ loggedOut }) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Head>
        <title>TextData</title>
        <meta
          name="description"
          content="TextData"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="allResults">
        <Hero />
        <SectionTitle
          pretitle="Why TextData?"
          title=" What does TextData Provide?">
          Below, we describe how TextData helps you create, save, and find online information.
        </SectionTitle>

        <Benefits data={benefitOne} />
        <Benefits data={benefitTwo} imgPos="right" />
        <Benefits data={benefitThree} />
        <Benefits data={benefitFour} imgPos="right" />


        {/* commenting out testimonials temporarily */}

        {/* <SectionTitle
        pretitle="Testimonials"
        title="Here's what our users said">
        Here's what professors and students using our platform have said!
      </SectionTitle>
      <Testimonials /> */}

        <SectionTitle pretitle="FAQ" title="Frequently Asked Questions">

        </SectionTitle>
        <FrequentlyAskedQuestions />
        <Cta />


      </div>
    </>);
}

// export async function getServerSideProps(context) {
//   // Fetch data from external API
//   if (
//     context.req.cookies.token === "" ||
//     context.req.cookies.token === undefined
//   ) {
//     return {
//       redirect: {
//         destination: "/about",
//         permanent: false,
//       },
//     };
//   }
//   else return { props: { loggedOut: false } };
// }
