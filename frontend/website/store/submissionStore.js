import { create } from 'zustand';
const useSubmissionStore = create((set) => ({
    submissionId: "",
    submissionUsername: "",
    submissionTitle: "Loading...",
    submissionDescription: "",
    originalDescription: "",
    submissionDisplayUrl: "",
    submissionSourceUrl: "",
    submissionCommunity: "",
    submissionCommunities: [],
    submissionIsAnonymous: false,
    submissionMode: "view",
    submissionLastModified: "",
    submissionDate: "",
    submissionIncomingConnections: [],
    submissionOutgoingConnections: [],
    submissionSuggestions: null,
    submissionHashtags: [],
    submissionStats: {},


    submissionCommunitiesNameMap: {},
    submissionCommunitiesNamesList: {},
    submissionRemoveCommunityID: [],
    submissionSaveCommunityID: [],
    submissionRemoveCommunityIDList: [],
    submissionSaveCommunityIDList: [],



    isAConnection: false, //not needed actually

    setSubmissionProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useSubmissionStore;

// setSubmissionProps({ submissionMode: "view" });