import create from 'zustand';

/**
 * A custom store for managing snackbar state.
 *
 * @typedef {Object} SnackbarStore
 * @property {boolean} isSnackBarOpen - Indicates whether the snackbar is open or not.
 * @property {string} snackBarMessage - The message to be displayed in the snackbar.
 * @property {string} severity - The severity level of the snackbar. Possible values are 'info', 'success', 'warning', and 'error'.
 * @property {function} openSnackbar - Opens the snackbar with the specified message and severity.
 * @property {function} closeSnackbar - Closes the snackbar.
 */
const useSnackbarStore = create((set) => ({
    isSnackBarOpen: false,
    snackBarMessage: '',
    snackBarSeverity: '',
    openSnackbar: (snackBarMessage, snackBarSeverity) => {
        set({ isSnackBarOpen: true, snackBarMessage: snackBarMessage, snackBarSeverity: snackBarSeverity });
    },
    closeSnackbar: () => {
        set({ isSnackBarOpen: false });
    },

    setSnackBarProps: (props) => set((state) => ({ ...state, ...props })),
}));

export default useSnackbarStore;
