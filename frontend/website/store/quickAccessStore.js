import create from 'zustand';

const useQuickAccessStore = create((set) => ({
    isOpen: false,
    userCommunitySubs: [],
    communityData: {},
    setcommunityData: (communityData) => set((state) => ({ ...state, communityData })),
    setUserCommunitySubs: (userCommunitySubs) => set((state) => ({ ...state, userCommunitySubs })),
    setIsOpen: (isOpen) => set((state) => ({ ...state, isOpen })),
    setUserCommunitySubs: (userCommunitySubs) => set((state) => ({ ...state, userCommunitySubs })),
    setsetUserCommunitySubsStoreProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useQuickAccessStore;
