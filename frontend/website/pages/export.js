import "bootstrap/dist/css/bootstrap.min.css";
import Head from "next/head";

import { BASE_URL_SERVER, EXPORT_ENDPOINT } from '../static/constants';

// Relevant Flag here for now
//let show_relevant = true;

function Export({ data }) {
    

    return (<div>
                <Head>
                    <title>Export Search Result - TextData</title>
                    <link rel="icon" href="/images/tree32.png" />
                </Head>
                <pre>
                    {JSON.stringify(data, null, 2) }
                </pre>
            </div>);
}



// This gets called on every request
export async function getServerSideProps(context) {
    var show_relevance_judgment = true
    var own_submissions = false

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
        var exportURL = BASE_URL_SERVER + EXPORT_ENDPOINT;
        if (context.query.search_id != undefined) {
            exportURL += "?search_id=" + context.query.search_id;
        }

        const res = await fetch(exportURL, {
            headers: new Headers({
                Authorization: context.req.cookies.token,
            }),
        });

        const data = await res.json();
        return { props: { data } };
    }
}

export default Export;