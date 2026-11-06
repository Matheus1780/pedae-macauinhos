import { Redirect } from 'expo-router';
import { useApp } from '../src/state/AppProvider';
export default function Index() {
  const { data } = useApp();
  return <Redirect href={data?.onboarded ? '/(tabs)' : '/onboarding'} />;
}
