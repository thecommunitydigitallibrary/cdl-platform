
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

            <div className="h-full max-h-[600px] items-stretch" style={{ marginTop: '70px', display: 'flex' }}>
                <div style={{ overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'gray white' }} className='bg-gray-100'>
                    <div>
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
        </>
    );
}

