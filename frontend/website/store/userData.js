import create from 'zustand';

const useUserDataStore = create((set) => ({

    user_id: null,
    username: 'username',
    email: 'email',
    isLoggedOut: true,
    userCommunities: [],
    userFollowedCommunities: [],
    socket: null,
    
    setUsername: (username) => set((state) => ({ ...state, username })),
    setEmail: (email) => set((state) => ({ ...state, email })),
    setLoggedOut: (isLoggedOut) => set((state) => ({ ...state, isLoggedOut })),
    setUserDataStoreProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useUserDataStore;
