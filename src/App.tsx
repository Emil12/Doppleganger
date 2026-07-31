import { Route, Switch } from 'wouter';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MultiplayerPage } from './pages/MultiplayerPage';

// Здесь живут только маршруты. Сами экраны складывай в src/pages/.
export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/multiplayer" component={MultiplayerPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
