import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Monitoring from './pages/Monitoring';
import Templates from './pages/Templates';
import Collaboration from './pages/Collaboration';
import Customization from './pages/Customization';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="templates" element={<Templates />} />
        <Route path="collaboration" element={<Collaboration />} />
        <Route path="customization" element={<Customization />} />
      </Route>
    </Routes>
  );
}
