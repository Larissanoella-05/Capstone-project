import { Redirect } from 'expo-router';
import { HOME_BY_ROLE, useAuth } from '../src/context/AuthContext.js';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? HOME_BY_ROLE[user.role] : '/welcome'} />;
}
