
export const APP_NAME = "TEXTDATA";

//TODOs
//- delete notesidebar
//- delete notes/[id]
//- delete notes/index
//- probably delete visualizecomponent
//- probably components/connections
//- submissionGraph
//- submissionRecommendations
//- pages/goals


export const BASE_URL_CLIENT = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
export const BASE_URL_SERVER = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
export const WEBSITE_URL = process.env.NEXT_PUBLIC_FROM_CLIENT;


// endpoints
export const WEBSITE_SEARCH_ENDPOINT = "search/website"
export const AUTOCOMPLETE_ENDPOINT = "search/autocomplete"
export const EXPORT_ENDPOINT = "search/export"
export const SUMMARIZE_ENDPOINT = "search/summarize"

export const RECOMMEND_COMMUNITIES_ENDPOINT = "communities/recommend"
export const COMMUNITY_HISTORY_ENDPOINT = "communities/history"
export const COMMUNITIES_ENDPOINT = "communities"
export const FOLLOW_COMMUNITY_ENDPOINT = "communities/follow"
export const JOIN_COMMUNITY_ENDPOINT = "communities/join"
export const LEAVE_COMMUNITY_ENDPOINT = "communities/leave"

export const CREATE_ACCOUNT_ENDPOINT = "users/createAccount"
export const RESET_PW_REQUEST_ENDPOINT = "users/passwordReset"
export const LOGIN_ENDPOINT = "users/login"

export const SUBMISSION_ENDPOINT = "submission"
export const BATCH_SUBMISSION_ENDPOINT = "submission/batch"
export const FEEDBACK_ENDPOINT = "feedback"
export const RECENTLY_ACCESSED_SUB_ENDPOINT = "submission/recentlyAccessed"
export const SUBMIT_REL_JUD = "submitRelJudgments"
export const SUBMISSION_STATS = "submission/fetchSubmissionStats"
export const SUBMISSION_JUDGMENTS = "fetchSubmissionJudgement"