import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import Head from "next/head";


export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - TextData</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>
      {/* <Header /> */}
      <div style={{ padding: "0px 25px" }}>
        <br />
        <br />
        <br />
        <br />
        <p>
          In this privacy policy, we want to help you understand how the
          TextData. ("we" or "us") collects, uses, and
          shares information about you when you use our website and browser
          extension (collectively, the “Services”).{" "}
        </p>
        <h3>What Information Do We Collect?</h3>
        <h4>Information You Provide to Us</h4>
        <p style={{ margin: "0px" }}>
          We collect information that you provide to us while using our
          services.
        </p>
        <ul>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              Account information.
            </p>{" "}
            This includes your email, username, hashed password, and any account
            settings or information provided when you create or update an
            account.
          </li>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              Content that you submit.
            </p>{" "}
            This includes submissions (URL, title, description),
            communities (name, description, membership status), feedback and
            relevance judgments, queries, and recommendation requests.
          </li>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              Actions that you take.
            </p>{" "}
            This includes opening the extension on a specific webpage (webpage
            URL, webpage title, webpage description, and meta-tags), clicking
            search or recommendation results, and viewing a submission.
          </li>
        </ul>
        <h4>Information Collected Automatically</h4>
        <ul>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              Server logs and IP address.
            </p>{" "}
            For security purposes, we record the IP address of each request set
            to our server.
          </li>
        </ul>
        <h3>How Do We Use Information?</h3>
        <ul>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              Provide, maintain, debug, and improve the services.
            </p>{" "}
            This includes keeping you logged in into the extension and website,
            measuring the performance of our search and recommendation models,
            and gathering insights to improve your user experience.
          </li>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              Personalize search and recommendation results.
            </p> {" "}
            Our backend algorithms use the data that you save to TextData to provide you with relevant information tailored to your interests.
          </li>
        </ul>
        <h3>How Do We Share Information?</h3>
        <ul>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              With researchers (de-identified).
            </p>{" "}
            The long-term goal of TextData is to research the information needs
            of individuals in specific contexts so that we can better resolve
            these needs. Thus, a significant component of TextData is researching
            the usage patterns of users. If we perform research (beyond the use
            of improving the platform), then we will de-identify the data before analysis.
          </li>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              No information is shared with third parties or advertisers.
            </p>{" "}
          </li>
        </ul>
        <h3>How We Protect Information</h3>
        <ul>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              All requests are sent over HTTPS.
            </p>{" "}
            Any time you send data to the TextData or receive data from the TextData, it
            is secured using HTTPS.
          </li>
          <li>
            <p style={{ fontWeight: "bold", display: "inline" }}>
              The production databases are under access control.
            </p>{" "}
            We restrict internal access to production data to minimize the
            likelihood of your data being accidentally accessed or released from
            our databases.
          </li>
        </ul>
      </div>
      {/* <Footer alt={true} /> */}
    </>
  );
}
