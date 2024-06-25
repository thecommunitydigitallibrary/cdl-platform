import "bootstrap/dist/css/bootstrap.min.css";
import jsCookie from "js-cookie";
import Router from "next/router";
import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/header";
import Grid from "@mui/material/Grid";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ActionButton from "../../components/buttons/actionbutton";
import DeleteIcon from "@mui/icons-material/Delete";
import rehypeSanitize from "rehype-sanitize";
import SearchResult from "../../components/searchresult";
import { getCodeString } from "rehype-rewrite";
import katex from "katex";
import "katex/dist/katex.css";
import Head from "next/head";
import Footer from "../../components/footer";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import Notesidebar from "../../components/notesidebar";
import TextField from "@mui/material/TextField";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api";
const notesEndpoint = "/notes/";

function Notes({ data }) {
  // for resizable sidebar
  const sidebarRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState("10%");

  const startResizing = React.useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);
  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);
  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        setSidebarWidth(
          mouseMoveEvent.clientX -
          sidebarRef.current.getBoundingClientRect().left
        );
      }
    },
    [isResizing]
  );

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const [originalTitle, setOriginalTitle] = useState(data.note.title);
  const [title, setTitle] = useState(data.note.title);
  const [content, setContent] = useState(data.note.content);
  const [searchResults, setSearchResults] = useState({
    search_results_page: [],
  });

  let [mode, setMode] = useState("view");
  let [priorText, setPriorText] = useState(data.note.content);

  const [isDisabled, setIsDisabled] = useState(true);

  const handleDelete = async (event) => {
    const res = await fetch(baseURL_client + notesEndpoint + data.note.id, {
      method: "DELETE",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status === 200) {
      alert("Deletion successful!");
    } else {
      alert("Something went wrong. Please try again later");
    }
    Router.push("/notes/");
  };

  const handleAutoSearch = async (joined_difference) => {
    var current_url = window.location.href;
    var request_url =
      baseURL_client +
      "/search?query=&highlighted_text=" +
      encodeURIComponent(joined_difference) +
      "&url=" +
      encodeURIComponent(current_url) +
      "&source=note_automatic&page=0&community=all";

    const res = await fetch(request_url, {
      method: "GET",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status === 200) {
      if (response.search_results_page.length > 0) {
        setSearchResults(response);
      }
    }
  };

  function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

  useInterval(() => {
    let curText = content.split("\n");
    let priText = priorText.split("\n");
    let difference = curText.filter((x) => !priText.includes(x));
    var joined_difference = difference.join(" ");
    if (joined_difference.length > 30) {
      var joined_difference = difference.join(" ");
      handleAutoSearch(joined_difference);
      setPriorText(content);
    }
  }, 30 * 1000);

  const changeMode = async (event) => {
    if (mode == "edit") {
      const res = await fetch(baseURL_client + notesEndpoint + data.note.id, {
        method: "PATCH",
        body: JSON.stringify({
          title: title,
          content: content,
        }),
        headers: new Headers({
          Authorization: jsCookie.get("token"),
          "Content-Type": "application/json",
        }),
      });
      const response = await res.json();
      if (res.status != 200) {
        try {
        } catch (error) {
          alert("Something went wrong. Please try again later");
        }
      }
    }
    setMode(mode === "view" ? "edit" : "view");
    setIsDisabled(mode === "edit");

    // adding this to reflect title change in sidebar
    if (title != originalTitle) {
      window.location.reload();
    }
  };

  return (
    <div className="allResults">
      <Head>
        <title>{originalTitle} - TextData</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>

      <div className="app-container">
        <div style={{ zIndex: 1, position: "relative" }}>
          {/* <Header /> */}
        </div>

        <div
          ref={sidebarRef}
          className="app-sidebar"
          style={{ minWidth: sidebarWidth }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="app-sidebar-content" style={{ width: "95%" }}>
            <div>
              <Notesidebar notesData={data} currentNote={data.note.id} />
            </div>
          </div>
          <div
            className="app-sidebar-resizer"
            onMouseDown={startResizing}
          ></div>
        </div>

        <div className="app-frame" style={{ zIndex: 2, position: "relative" }}>
          <div style={{ padding: "1%" }}>
            <Grid
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Grid item>
                <Grid container direction="row" spacing={2}>
                  <Grid item>
                    <TextField
                      hiddenLabel
                      id="standard-basic"
                      defaultValue={title}
                      variant="standard"
                      disabled={isDisabled}
                      onChange={(e) => {
                        setTitle(e.target.value);
                      }}
                    />
                  </Grid>
                  <Grid item>
                    {mode == "view" && (
                      <ActionButton variant="contained"
                        color=""
                        type="filled" action={changeMode}>
                        <EditIcon />
                      </ActionButton>
                    )}
                    {mode == "edit" && (
                      <ActionButton variant="contained"
                        color=""
                        type="filled" action={changeMode}>
                        <SaveIcon />
                      </ActionButton>
                    )}
                  </Grid>
                </Grid>
              </Grid>

              <Grid item>
                {mode == "edit" && (
                  <Grid item>
                    <ActionButton
                      variant="contained"
                      color="error"
                      type="filled"
                      action={handleDelete}
                    >
                      <DeleteIcon />
                    </ActionButton>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </div>
          <div>
            {mode == "edit" && (
              <MDEditor
                value={content}
                onChange={setContent}
                preview="live"
                height="500px"
                previewOptions={{
                  rehypePlugins: [[rehypeSanitize]],
                  components: {
                    code: ({ inline, children = [], className, ...props }) => {
                      const txt = children[0] || "";
                      if (inline) {
                        if (
                          typeof txt === "string" &&
                          /^\$\$(.*)\$\$/.test(txt)
                        ) {
                          const html = katex.renderToString(
                            txt.replace(/^\$\$(.*)\$\$/, "$1"),
                            {
                              throwOnError: false,
                            }
                          );
                          return (
                            <code dangerouslySetInnerHTML={{ __html: html }} />
                          );
                        }
                        return <code>{txt}</code>;
                      }
                      const code =
                        props.node && props.node.children
                          ? getCodeString(props.node.children)
                          : txt;
                      if (
                        typeof code === "string" &&
                        typeof className === "string" &&
                        /^language-katex/.test(className.toLocaleLowerCase())
                      ) {
                        const html = katex.renderToString(code, {
                          throwOnError: false,
                        });
                        return (
                          <code
                            style={{ fontSize: "150%" }}
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
                        );
                      }
                      return <code className={String(className)}>{txt}</code>;
                    },
                  },
                }}
              />
            )}
            {mode == "view" && (
              <MDEditor
                value={content}
                onChange={setContent}
                preview="preview"
                height="500px"
                previewOptions={{
                  rehypePlugins: [[rehypeSanitize]],
                  components: {
                    code: ({ inline, children = [], className, ...props }) => {
                      const txt = children[0] || "";
                      if (inline) {
                        if (
                          typeof txt === "string" &&
                          /^\$\$(.*)\$\$/.test(txt)
                        ) {
                          const html = katex.renderToString(
                            txt.replace(/^\$\$(.*)\$\$/, "$1"),
                            {
                              throwOnError: false,
                            }
                          );
                          return (
                            <code dangerouslySetInnerHTML={{ __html: html }} />
                          );
                        }
                        return <code>{txt}</code>;
                      }
                      const code =
                        props.node && props.node.children
                          ? getCodeString(props.node.children)
                          : txt;
                      if (
                        typeof code === "string" &&
                        typeof className === "string" &&
                        /^language-katex/.test(className.toLocaleLowerCase())
                      ) {
                        const html = katex.renderToString(code, {
                          throwOnError: false,
                        });
                        return (
                          <code
                            style={{ fontSize: "150%" }}
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
                        );
                      }
                      return <code className={String(className)}>{txt}</code>;
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
      {searchResults.search_results_page.map(function (d, idx) {
        return (
          <div key={idx}>
            <SearchResult
              search_idx={idx}
              redirect_url={d.redirect_url}
              display_url={d.display_url}
              submission_id={d.submission_id}
              result_hash={d.result_hash}
              description={d.description}
              title={d.title}
              communities_part_of={d.communities_part_of}
              auth_token={jsCookie.get("token")}
              show_relevant={true}
            ></SearchResult>
          </div>
        );
      })}
      {/* <Footer alt={true} /> */}
    </div>
  );
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
    var resolvedURL = context.resolvedUrl;

    var notesURL = baseURL_server + resolvedURL;

    const res = await fetch(notesURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });

    const data = await res.json();

    if (res.status == 200) {
      return { props: { data } };
    } else {
      return { props: { data } };
    }
  }
}

export default Notes;
