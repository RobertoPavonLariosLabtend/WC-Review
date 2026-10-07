import { useState } from 'react';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { createOverpassPlacesRepository } from '../features/main-screen/repository/overpass-places-repository';
import { createExpoLocationRepository } from '../features/main-screen/repository/expo-location-repository';
import { createMainUseCases } from '../features/main-screen/use-cases';
import MainScreen from '../features/main-screen/ui/MainScreen';
function SessionMainScreen() {
  const [cases] = useState(() => createMainUseCases(createOverpassPlacesRepository(), createExpoLocationRepository()));
  return <MainScreen useCases={cases} />;
}
export default function MainScreenFeature() {
  const { user } = useAuth();
  return user ? <SessionMainScreen key={user.id} /> : null;
}
