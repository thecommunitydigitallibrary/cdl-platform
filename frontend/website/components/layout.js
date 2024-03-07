import React, { useState } from "react";
import Header from "./header";
import Footer from "./footer";
import SideNav from "./sidenav";
import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from "../components/ui/ui/resizable";

export default function Layout({ children }) {

    const defaultLayout = [265, 440, 655]

    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>

            <div>
                <Header />
            </div>
            <div style={{ marginTop: '70px', display: 'flex' }}>
                <ResizablePanelGroup direction="horizontal" id={0}
                    className="h-full max-h-[600px] items-stretch">
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
                </ResizablePanelGroup>
            </div >
            <div>
                <Footer />
            </div>
        </>
    );
}

