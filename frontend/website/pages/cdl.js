import Head from "next/head";
import Hero from "../components/homepage/hero";
import SectionTitle from "../components/homepage/sectionTitle";
import { benefitOne, benefitTwo, benefitThree, benefitFour } from "../components/data/landingpage";
import Benefits from "../components/homepage/benefits";
import FrequentlyAskedQuestions from "./faq";
import Testimonials from "../components/homepage/testimonials";
import Cta from "../components/homepage/cta";
import Footer from "../components/footer";
import Header from "../components/header";


const CDL = () => {
    return (<>
    <Head>
        <title>The Community Digital Library</title>
        <meta
          name="description"
          content="CDL"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header/>
      <div className="allResults">
     <Hero /> 
     <SectionTitle
        pretitle="Why CDL?"
        title=" What we offer">
        The CDL is an online and open-sourced social bookmarking platform where users can save, search for, and discover webpages.
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
      <Cta/>
      <Footer/>

     </div>
    </>);
}

export default CDL;