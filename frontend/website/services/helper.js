import { BASE_URL_CLIENT, COMMUNITIES_ENDPOINT } from "../static/constants";
import jsCookie from "js-cookie";
import useUserDataStore from "../store/userData";
import useQuickAccessStore from "../store/quickAccessStore";

const { setUserDataStoreProps } = useUserDataStore();

const { communityData, setcommunityData } = useQuickAccessStore();

export const updateDropDownSearch = async () => {
    let resp = await fetch(BASE_URL_CLIENT + COMMUNITIES_ENDPOINT, {
        method: "GET",
        headers: new Headers({
            Authorization: jsCookie.get("token"),
            "Content-Type": "application/json",
        }),
    });

    var responseComm = await resp.json();
    setUserDataStoreProps({ userCommunities: responseComm.community_info });
    setcommunityData(responseComm.community_info);
    setUserDataStoreProps({ username: responseComm.username });
    localStorage.setItem("dropdowndata", JSON.stringify(responseComm));

};