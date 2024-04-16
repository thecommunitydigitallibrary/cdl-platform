import jsCookie from "js-cookie";

import JoinCommunityForm from "./forms/joinCommunityForm";
import CreateCommunityForm from "./forms/createCommunityForm";
import CommunityBox from "./communitybox";
import { useEffect } from "react";
import useUserDataStore from "../store/userData";
let gap = "25px";
export default function CommunitiesDeck(props) {


  const { setUserDataStoreProps, userFollowedCommunities } = useUserDataStore();

  useEffect(() => {
    if (!props.followDeck) {
      setUserDataStoreProps({ userCommunities: props.community_info });
    }
    else {
      setUserDataStoreProps({ userFollowedCommunities: props.community_info });
    }
  }, [props.community_info])

  return (
    <div>
      {props.followDeck ? <h1>Communities You've Followed</h1> :
        <h1>Communities You've Created or Joined</h1>}
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
          !props.followDeck && <li
            style={{
              display: "inline-block",
              marginBottom: gap,
              marginRight: gap,
            }}
            key="joinCommunity"
          >
            <JoinCommunityForm auth_token={jsCookie.get("token")} />
          </li>,
          !props.followDeck && <li
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
          props.community_info && props.community_info.map(function (community, idx) {
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
                  link={"/community/" + community.community_id}
                  isAdmin={community.is_admin}
                  communityId={community.community_id}
                  joinKey={community.join_key}
                  auth={jsCookie.get("token")}
                  name={community.name}
                  description={community.description}
                  pinned={community.pinned}
                  is_public={community.is_public}
                  followDeck={props.followDeck}
                >
                  {community.name}
                </CommunityBox>
              </li>
            );
          })
        )}
      </ul>
      {props.followDeck && userFollowedCommunities && userFollowedCommunities.length == 0 && (
        <p className="text-center mt-5 pb-5">
          You are not following any communities.</p>
      )}
    </div>
  );
}
