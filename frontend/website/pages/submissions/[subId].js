
import jsCookie from "js-cookie";
import { Grid, Paper, Skeleton, Stack, Breadcrumbs } from '@mui/material';
import { React, useState, useEffect } from 'react';
import Head from "next/head";
import { APP_NAME, BASE_URL_CLIENT, BASE_URL_SERVER, GET_SUBMISSION_ENDPOINT } from '../../static/constants';
import Header from '../../components/header';
import { Box } from '@mui/system';
import SubmissionDetails from '../../components/submissions/submissionDetails';
import Error from 'next/error';
import NoteEditor from '../../components/submissions/noteEditor';
import Hashtags from '../../components/submissions/hashtags';
import Footer from '../../components/footer';
import useSubmissionStore from "../../store/submissionStore";
import SubmissionExtensions from "../../components/submissions/submissionExtensions";


export default function SubmissionPage({ errorCode, data, id, target }) {

  const {
    submissionTitle,
    submissionDescription,
    submissionCommunities,
    submissionSourceUrl,
    submissionIsAnonymous,
    submissionCommunity,
    submissionMode,
    submissionId,
    submissionIncomingConnections,
    submissionRedirectUrl,
    submissionUsername,
    submissionLastModified,
    submissionDate,
    setSubmissionProps
  } = useSubmissionStore();

  useEffect(() => {

    const handleBeforeUnload = (event) => {
      const shouldPreventClosing = submissionTitle === 'Untitled';

      if (shouldPreventClosing) {
        const message = "Title cannot be 'Untitled'. Please change the title before exiting.";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [submissionDescription, submissionIsAnonymous, submissionTitle])

  useEffect(() => {
    console.log(data)

    setSubmissionProps({ submissionTitle: data.submission.explanation });
    setSubmissionProps({submissionType: data.submission.type})
    setSubmissionProps({ submissionDescription: data.submission.highlighted_text });
    setSubmissionProps({ submissionCommunities: data.submission.communities });
    setSubmissionProps({ submissionSourceUrl: data.submission.source_url });
    setSubmissionProps({ submissionDisplayUrl: data.submission.display_url });
    setSubmissionProps({ submissionRedirectUrl: data.submission.redirect_url });
    setSubmissionProps({ submissionIsAnonymous: data.submission.username == undefined });
    setSubmissionProps({ submissionMode: "view" });
    setSubmissionProps({ submissionId: data.submission.submission_id });
    setSubmissionProps({ submissionUsername: data.submission.username });
    setSubmissionProps({ submissionLastModified: new Date(parseInt(data.submission.time)).toLocaleDateString("en-us") });
    setSubmissionProps({ submissionDate: new Date(parseInt(data.submission.time)).toLocaleDateString("en-us") });
    setSubmissionProps({ submissionHashtags: data.submission.hashtags })
    setSubmissionProps({ submissionStats: data.submission.stats });
    setSubmissionProps({ submissionIncomingConnections: data.submission.connections });

  }, [data]);

  // must always pass (make empty if creating)
  const [source_url, setSource_url] = useState(data.submission.raw_source_url)
  const [title, setTitle] = useState(data.submission.explanation)
  const [description, setDescription] = useState(data.submission.highlighted_text)
  const [community, setCommunity] = useState("")
  const [isAnonymous, setAnonymous] = useState(data.submission.username == undefined)

  const [connection, setConnection] = useState("")
  const [currentQuery, setCurrentQuery] = useState("")

  const handleAnonymous = async (event) => {
    if (isAnonymous) {
      setAnonymous(false)
    } else {
      setAnonymous(true)
    }
  }

  const [mode, setMode] = useState("view");

  const changemode = () => {
    setMode(mode === "view" ? "edit" : "view");
    if (mode === "edit") {
      handleSubmit(mode);
    }
  };

  const handleDelete = () => {
    // handle delete logic here
  };

  const handleSubmit = async (method) => {
    const now = new Date().getTime();
    var DATA = {

      community: submissionCommunity,
      source_url: submissionSourceUrl,
      title: submissionTitle,
      description: submissionDescription,
      anonymous: submissionIsAnonymous,
      time: now,
    }

    var URL = BASE_URL_CLIENT
    var METH = "POST"

    if (mode == "create") {
      URL = URL + "submission/"

    } else if (mode == "edit") {
      URL = URL + GET_SUBMISSION_ENDPOINT + id
      METH = "PATCH"
      console.log('patch')
    }

    const res = await fetch(URL, {
      method: METH,
      body: JSON.stringify(DATA),
      headers: new Headers({
        Authorization: jsCookie
          .get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status == 200) {
      console.log('+ response')
      if (method == "edit" || method == "reply") {
        console.log('need reload now!')
        window.location.reload();
      }
    }
  };

  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }
  return (<>

    <Head>
      <title>{APP_NAME}</title>
      <link rel="icon" href="/images/tree32.png" />
    </Head>

    <Header />

    <div className="allResults">
      {
        data ? (
          <Stack spacing={1} alignItems={'center'}>
            <SubmissionDetails
              data={data}
              changeMode={changemode}
              handleDelete={handleDelete}
            />
            <NoteEditor
            />
            <SubmissionExtensions data={data} id={id} target={target} />
            <Footer />
          </Stack>

        ) : (
          <>
            <Box>
              <Breadcrumbs aria-label="breadcrumb">
                <Skeleton variant="text" width={100} height={24} />
                <Skeleton variant="text" width={50} height={24} />
                <Skeleton variant="text" width={150} height={24} />
              </Breadcrumbs>
              <Skeleton variant="rectangular" width={100} height={56} style={{ marginLeft: 16 }} />

              <Skeleton variant="rectangular" width={60} height={36} style={{ marginRight: 8 }} />
              <Skeleton variant="rectangular" width={60} height={36} style={{ marginRight: 8 }} />
              <Skeleton variant="rectangular" width={60} height={36} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper elevation={1} style={{ padding: 16 }}>
                    <Skeleton variant="rectangular" width={80} height={36} />
                    <Skeleton variant="text" width="100%" height={118} />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </>
        )
      }
    </div>

  </>
  )
}

// This gets called on every request
export async function getServerSideProps(context) {
  // Fetch data from external API
  if (
    context.req.cookies.token === "" ||
    context.req.cookies.token === undefined
  ) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  } else {
    const id = context.query.subId;
    var target = null
    if (context.query.hasOwnProperty("target")) {
      target = context.query.target
    }
    //const target = context.query.target;
    let URL = BASE_URL_SERVER + GET_SUBMISSION_ENDPOINT + ((target == null) ? id : target);
    const res = await fetch(URL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });
    const data = await res.json();
    const errorCode = res.ok ? false : res.status;

    return {
      props: { errorCode, data, id, target },
    };
  }
}