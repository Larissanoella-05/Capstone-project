// The push token this phone last registered with the API, so sign-out can unregister it.
// Kept apart from push.js so the auth code does not import the native notifications module.
let registeredToken = null;

export const getRegisteredToken = () => registeredToken;
export const setRegisteredToken = (token) => {
  registeredToken = token;
};
