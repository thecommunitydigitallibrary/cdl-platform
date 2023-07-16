import Head from "next/head";
import Navbar from "../components/navbar";
import Hero from "../components/hero";
import SectionTitle from "../components/sectionTitle";
import { benefitOne, benefitTwo } from "../components/data/landingpage";
import Benefits from "../components/benefits";
import FrequentlyAskedQuestions from "./faq";
import Testimonials from "../components/testimonials";
import Cta from "../components/cta";
import Footer from "../components/footer";


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
      <Navbar/>
      <div>
     <Hero /> 
     <SectionTitle
        pretitle="Why CDL?"
        title=" What we offer">
        The CDL is a platform for bookmarking webpages, taking notes, and discovering online content. Our vision is to anticipate the questions that you may have while viewing online content and proactively provide you with answers without requiring any effort.
      </SectionTitle>
      
      <Benefits data={benefitOne} />
      <SectionTitle
        pretitle="Testimonials"
        title="Here's what our users said">
        Here's what professors and students using our platform have said!
      </SectionTitle>
      <Testimonials />
      <SectionTitle pretitle="FAQ" title="Frequently Asked Questions">  
        
      </SectionTitle>
      <FrequentlyAskedQuestions />
      <Cta/>
      <Footer/>

     </div>
    </>);
}

export default CDL;