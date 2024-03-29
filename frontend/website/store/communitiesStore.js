import create from 'zustand';

const useCommunitiesStore = create((set) => ({
    communities: [],
    setCommunities: (communities) => set((state) => ({ ...state, communities })),
    setCommunitiesStoreProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useCommunitiesStore;