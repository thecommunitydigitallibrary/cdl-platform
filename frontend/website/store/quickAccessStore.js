import create from 'zustand';

const useQuickAccessStore = create((set) => ({
    isOpen: false,
    userCommunitySubs: [],
    communityData: {},
    ownSubmissionToggle: true, //this is the submission checkbox toggle that will be used in header in desktop view and the drawer in mobile 
    isMobileView: false, //this is the media query for the drawer
    setcommunityData: (communityData) => set((state) => ({ ...state, communityData })),
    setUserCommunitySubs: (userCommunitySubs) => set((state) => ({ ...state, userCommunitySubs })),
    setIsOpen: (isOpen) => set((state) => ({ ...state, isOpen })),
    setUserCommunitySubs: (userCommunitySubs) => set((state) => ({ ...state, userCommunitySubs })),
    setQuickAccessStoreProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useQuickAccessStore;
