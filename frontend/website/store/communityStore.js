import create from 'zustand';

const useCommunityStore = create((set) => ({
    communityId: '',
    communityName: 'Loading name...',
    communityDescription: 'Loading description...',
    isFollowing: false,
    numFollowers: 0,
    joinedUsers: [],
    numSubs: 0,
    joined: false,
    isPublic: false,
    pinnedSubs: [],
    communitySubmissions: null,
    communitySubmissionsLoading: false,
    page: 0,
    setCommunityStoreProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useCommunityStore;