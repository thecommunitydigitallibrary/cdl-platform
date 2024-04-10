import jsCookie from "js-cookie";

import JoinCommunityForm from "./forms/joinCommunityForm";
import CreateCommunityForm from "./forms/createCommunityForm";
import CommunityBox from "./communitybox";
import { useEffect } from "react";
import useUserDataStore from "../store/userData";
let gap = "25px";
export default function CommunitiesDeck(props) {

  const { setUserDataStoreProps } = useUserDataStore();

  useEffect(() => {
    setUserDataStoreProps({ userCommunities: props.community_info });
  }, [props.community_info])

  return (
    <div>
      <h1> Your Communities</h1>
      <br />
      <ul
        style={{
          padding: "0px",
          justifyItems: "center",
          display: "flex",
          width: "90vw",
          flexWrap: "wrap",
        }}
      >
        {[
          <li
            style={{
              display: "inline-block",
              marginBottom: gap,
              marginRight: gap,
            }}
            key="joinCommunity"
          >
            <JoinCommunityForm auth_token={jsCookie.get("token")} />
          </li>,
          <li
            style={{
              display: "inline-block",
              marginBottom: gap,
              marginRight: gap,
            }}
            key="createCommunity"
          >
            <CreateCommunityForm auth_token={jsCookie.get("token")} />
          </li>,
        ].concat(
          props.community_info.map(function (community, idx) {
            return (
              <li
                style={{
                  display: "inline-block",
                  marginBottom: gap,
                  marginRight: gap,
                }}
                key={idx}
              >
                <CommunityBox
                  link={
                    "/search?community=" + community.community_id + "&page=0"
                  }
                  isAdmin={community.is_admin}
                  communityId={community.community_id}
                  joinKey={community.join_key}
                  auth={jsCookie.get("token")}
                  name={community.name}
                  description={community.description}
                  pinned={community.pinned}
                  is_public={community.is_public}
                >
                  {community.name}
                </CommunityBox>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
