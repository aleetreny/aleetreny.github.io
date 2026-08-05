import { DeskBoard } from './components/DeskBoard';
import { runtimeConfig } from './lib/config';

export default function App() {
  const ownerIntent = new URLSearchParams(window.location.search).get('owner') === '1';
  return <DeskBoard remoteDataEnabled={runtimeConfig.remoteDataEnabled} ownerIntent={ownerIntent} />;
}
