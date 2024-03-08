
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./header";
import Footer from "./footer";
import SideNav from "./sidenav";
import useQuickAccessStore from "../store/quickAccessStore";
import { Divider, Paper } from "@mui/material";
import jsCookie from "js-cookie";


export default function Layout({ children }) {

    const { isOpen } = useQuickAccessStore();

    const defaultLayout = [265, 440, 655]


    // Set a default width for the second div when the SideNav is not visible
    const secondDivWidth = isOpen ? '75%' : '100%';

    const [isCollapsed, setIsCollapsed] = useState(false);
    // for resizable sidebar
    const sidebarRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(250);

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

    return (
        <>
            <div>
                <Header />
            </div>


            {/* (jsCookie.get("token") == "" || jsCookie.get("token") == undefined) ?
                <>
                    {/* <div style={{ marginLeft: '50vh', marginRight: '50vh', marginTop: '15vh', marginBottom: '10vh' }}> 
                    <Paper style={{ marginLeft: '55vh', marginRight: '55vh', padding: '5vh', marginTop: '15vh', marginBottom: '10vh' }}>
                        <main>
                            {children ? children : <div>Nothing to see here</div>}
                        </main>
                    </Paper>
                     </div> 
                </> */}


            <div className="h-full max-h-[600px] items-stretch" style={{ marginTop: '70px', display: 'flex' }}>
                <div style={{ overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'gray white' }}>
                    <div>
                        {/* Include any additional styling or components for SideNav if needed */}
                        <SideNav />
                    </div>
                </div>
                <Divider orientation="vertical" flexItem style={{ color: 'grey' }} />

                <div style={{ flex: '1', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}>
                    <main>
                        {children ? children : <div>Nothing to see here</div>}
                    </main>
                </div>
            </div>


            <div>
                <Footer />
            </div>



            {/* <ResizablePanelGroup
                    direction="horizontal"
                    onLayout={(sizes) => {
                        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
                            sizes
                        )}`
                    }}
                    className="h-full max-h-[800px] items-stretch"
                >
                    <ResizablePanel
                        id={0}
                        defaultSize={265}
                        collapsedSize={1}
                        collapsible={true}
                        minSize={10}
                        maxSize={15}
                        onCollapse={(collapsed) => {
                            setIsCollapsed(collapsed);
                            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(collapsed)}`;
                        }}
                        className={isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"}
                        style={{ overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'gray white' }}>
                        <SideNav />
                    </ResizablePanel>

                    <ResizableHandle withHandle id={1} />
                    <ResizablePanel
                        id={2}
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}
                        defaultSize={440}
                        minSize={30}>
                        <main>
                            {children ? children : <div>Nothing to see here</div>}
                        </main>
                    </ResizablePanel>
                </ResizablePanelGroup> */}

        </>
    );
}

