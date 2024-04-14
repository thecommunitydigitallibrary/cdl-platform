import { create } from 'zustand';
const useSubmissionStore = create((set) => ({
    submissionId: "",
    submissionUsername: "",
    submissionTitle: "Loading...",
    originalTitle: null,
    submissionDescription: "",
    originalDescription: null,
    submissionDisplayUrl: "",
    originalSourceUrl: "",
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
    submissionCanDelete: false,

    submissionCommunitiesNameMap: {},
    submissionCommunitiesNamesList: {},
    submissionRemoveCommunityID: [],
    submissionSaveCommunityID: [],
    submissionRemoveCommunityIDList: [],
    submissionSaveCommunityIDList: [],

    isAConnection: false,
    hasUnsavedChanges: false,
    setSubmissionProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useSubmissionStore;

// setSubmissionProps({ submissionMode: "view" });