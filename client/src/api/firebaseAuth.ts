// Re-export auth from config so the Axios interceptor can do a dynamic import
// without pulling in the full firebase config at bundle initialization time.
export { auth } from '../config/firebase'
