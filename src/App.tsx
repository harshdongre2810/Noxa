/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Intro from './pages/Intro';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import AddFriendByLink from './pages/AddFriendByLink';
import AIAssistant from './pages/AIAssistant';
import AppLockOverlay from './components/AppLockOverlay';

export default function App() {
  return (
    <BrowserRouter>
      <AppLockOverlay>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Splash />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/add/:username" element={<AddFriendByLink />} />
          </Route>
        </Routes>
      </AppLockOverlay>
    </BrowserRouter>
  );
}
