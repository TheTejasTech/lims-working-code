import { useSelector, useDispatch } from 'react-redux';
import { login, register, logout, fetchMe, clearError } from '../app/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  return {
    ...auth,
    login: (credentials) => dispatch(login(credentials)),
    register: (payload) => dispatch(register(payload)),
    logout: () => dispatch(logout()),
    fetchMe: () => dispatch(fetchMe()),
    clearError: () => dispatch(clearError()),
  };
};
