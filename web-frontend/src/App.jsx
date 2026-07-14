import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Home from './pages/shop/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/customer/Profile';

function App() {
    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col">
            {/* Global Navigation */}
            <Navbar />

            {/* Dynamic Page Content */}
            <main className="flex-grow w-full">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/address-book" element={<Profile />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;