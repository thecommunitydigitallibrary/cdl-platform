import "bootstrap/dist/css/bootstrap.min.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/header";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import jsCookie from "js-cookie";
import Router, { useRouter } from "next/router";
import Footer from "../../components/footer";
import Notesidebar from "../../components/notesidebar";
import ActionButton from "../../components/buttons/actionbutton";
import Box from "@mui/system/Box";
import Head from "next/head";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const notesEndpoint = "notes/";

function Notes({ data }) {
  // for resizable sidebar
  const sidebarRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState("20%");

  const startResizing = useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);
  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);
  const resize = useCallback(
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

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // create new page
  const [create, setCreate] = useState(true);

  //adding new page to backend
  const [title, setTitle] = useState("");

  const createNewPage = async (event) => {
    const res = await fetch(baseURL_client + notesEndpoint, {
      method: "POST",
      body: JSON.stringify({
        title: title.length < 1 ? "Untitled" : title,
      }),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status === 200) {
      Router.push("/notes/" + response.id);
    } else {
      alert("Something went wrong. Please try again later");
    }
  };

  return (
    <div>
      <Head>
        <title>Notes - TextData</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>
      <div className="allResults">
        <div className="searchR">
          {/* <Header /> */}
        </div>
      </div>

      <div className="app-container">
        <div
          ref={sidebarRef}
          className="app-sidebar"
          style={{ minWidth: sidebarWidth }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="app-sidebar-content" style={{ width: "95%" }}>
            <div>
              <Notesidebar notesData={data} />
            </div>
          </div>
          <div
            className="app-sidebar-resizer"
            onMouseDown={startResizing}
          ></div>
        </div>
        <div className="app-frame" style={{ zIndex: 2, position: "relative" }}>
          {create ? (
            <Box margin={"5%"}>
              <Item>
                <form>
                  <input
                    type="text"
                    className="form-control mt-1"
                    name="title"
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                    placeholder="Enter Page Title"
                    style={{ width: "100%" }}
                  />
                  <br />
                  <ActionButton variant="contained" action={createNewPage}>
                    {"Create"}
                  </ActionButton>
                </form>
              </Item>
            </Box>
          ) : (
            <Item>
              Click or create a note to get started. Previews and edits will
              appear here.
            </Item>
          )}
        </div>
      </div>

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
    var notesURL = baseURL_server + notesEndpoint;

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
