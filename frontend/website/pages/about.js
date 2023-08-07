import React, { useContext, useEffect, useState } from "react";
import FrequentlyAskedQuestions from "./faq";
import Header from "../components/header";
import Footer from "../components/footer";
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
        <title>The Community Digital Library</title>
        <meta
          name="description"
          content="CDL"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <div className="allResults">
        <Hero />
        <SectionTitle
          pretitle="Why CDL?"
          title=" What we offer">
          The CDL is a platform for bookmarking webpages, taking notes, and discovering online content. Our vision is to anticipate the questions that you may have while viewing online content and proactively provide you with answers without requiring any effort.
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
        <Footer />

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
