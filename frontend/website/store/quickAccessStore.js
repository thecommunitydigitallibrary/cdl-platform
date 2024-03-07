import create from 'zustand';

const useQuickAccessStore = create((set) => ({
    userCommunitySubs: [],
    setUserCommunitySubs: (userCommunitySubs) => set((state) => ({ ...state, userCommunitySubs })),
    setsetUserCommunitySubsStoreProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useQuickAccessStore;
