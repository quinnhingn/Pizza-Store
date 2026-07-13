import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="bg-red-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-tight">
                    Pizza Store
                </Link>
                <div className="space-x-4">
                    <Link to="/login" className="hover:text-gray-200 transition-colors">
                        Login
                    </Link>
                    <Link to="/register" className="bg-white text-red-600 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors">
                        Register
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;