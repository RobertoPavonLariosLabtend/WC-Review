import { useState } from 'react';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { createBundledPlacesRepository } from '../features/main-screen/repository/bundled-places-repository';
import { createExpoLocationRepository } from '../features/main-screen/repository/expo-location-repository';
import { createMainUseCases } from '../features/main-screen/use-cases';
import MainScreen from '../features/main-screen/ui/MainScreen';
function SessionMainScreen() {
  const [cases] = useState(() => createMainUseCases(createBundledPlacesRepository(), createExpoLocationRepository()));
  return <MainScreen useCases={cases} />;
}
export default function MainScreenFeature() {
  const { user } = useAuth();
  return user ? <SessionMainScreen key={user.id} /> : null;
}
