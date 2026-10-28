// In-memory stand-in for the Android keystore, shared by every test file.
const mockStore = new Map();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key) => (mockStore.has(key) ? mockStore.get(key) : null)),
  setItemAsync: jest.fn(async (key, value) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key) => {
    mockStore.delete(key);
  }),
}));

beforeEach(() => {
  mockStore.clear();
});
