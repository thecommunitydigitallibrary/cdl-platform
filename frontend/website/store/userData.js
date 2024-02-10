import create from 'zustand';

const useUserDataStore = create((set) => ({

    username: 'username',
    email: 'email',
    isLoggedIn: true,
    userCommunities: [],

    setUsername: (username) => set((state) => ({ ...state, username })),
    setEmail: (email) => set((state) => ({ ...state, email })),
    setLoggedIn: (isLoggedIn) => set((state) => ({ ...state, isLoggedIn })),
    setUserDataStoreProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useUserDataStore;
