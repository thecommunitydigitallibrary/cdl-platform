import "../styles/style.css"
import "../styles/SearchBar.css"
import "../styles/tailwind.css"
import Layout from "../components/layout"
import WebSocketManager from '../components/webSocketManager';

export default function MyApp({ Component, pageProps }) {
  return <Layout>
    <Component {...pageProps} />
    <WebSocketManager />
  </Layout>
}