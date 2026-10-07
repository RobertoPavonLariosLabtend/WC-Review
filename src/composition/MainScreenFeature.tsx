import { useState } from 'react';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { createFirebasePlacesRepository, mainConfiguration } from '../features/main-screen/repository/firebase-places-repository';
import { createExpoLocationRepository } from '../features/main-screen/repository/expo-location-repository';
import { createMainUseCases } from '../features/main-screen/use-cases';
import MainScreen from '../features/main-screen/ui/MainScreen';
function SessionMainScreen() {
  const [cases] = useState(() => createMainUseCases(createFirebasePlacesRepository(), createExpoLocationRepository()));
  return <MainScreen useCases={cases} mapReady={mainConfiguration().mapReady} />;
}
export default function MainScreenFeature() {
  const { user } = useAuth();
  return user ? <SessionMainScreen key={user.id} /> : null;
}
