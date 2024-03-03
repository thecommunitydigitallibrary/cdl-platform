import Header from "./header";
import SideNav from "./sidenav";

export default function Layout({ children }) {
    return (
        <>
            <Header />
            <div style={{ display: 'flex' }}>
                <SideNav />
                <main style={{ flexGrow: 1 }}>
                    {children}
                </main>
            </div>
        </>
    );
}
