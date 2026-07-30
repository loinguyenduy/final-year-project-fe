import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { registerUserApi } from '../../../services/authService';
import '../styles/Auth.scss';
import { buildApiUrl } from '../../../../../core/config/runtimeUrls';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleParams = searchParams.get('role');
    const assignedRole = (roleParams === 'HANDYMAN') ? 'HANDYMAN' : 'CUSTOMER';

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault(); //to prevent page reload when submitting the form

        if (!fullName || !email || !password || !confirmPassword) {
            toast.error("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Confirm password does not match!");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        setIsLoading(true);

        try {
            let res = await registerUserApi(email, password, fullName, phone, assignedRole);
            
            if (res && res.EC === 0) {
                toast.success("Account created successfully!");
                navigate('/check-email', { state: { email: email } });
            } else {
                toast.error(res.EM);
            }
        } catch (error) {
            if (error?.code === 'VERIFICATION_EMAIL_DELIVERY_FAILED') {
                toast.warning('Account created, but the verification email could not be delivered. Please use resend.');
                navigate('/check-email', { state: { email: email } });
            } else {
                toast.error(error?.EM || "An error occurred on the server.");
            }
        }
        setIsLoading(false);
    };

    const handleSocialLogin = (provider) => {
        window.location.assign(buildApiUrl(`/auth/${provider}`));
    };

    return (
        <AuthLayout>
            <div className="text-center mb-4">
                <h3 className="auth-title">
                    {assignedRole === 'HANDYMAN' ? 'Become a Professional' : 'Create an Account'}
                    </h3>
                <p className="auth-subtitle">
                    {assignedRole === 'HANDYMAN' 
                        ? 'Register your professional profile to start earning' 
                        : 'Enter your information below to register'}
                </p>
            </div>

            <form onSubmit={handleRegister}>
                <div className="mb-3">
                    <label className="form-label custom-label">Full Name</label>
                    <input 
                        type="text" className="form-control" placeholder="Duy Loi Nguyen"
                        value={fullName} onChange={(e) => setFullName(e.target.value)} required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label custom-label">Email</label>
                    <input 
                        type="email" className="form-control" placeholder="name@gmail.com"
                        value={email} onChange={(e) => setEmail(e.target.value)} required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label custom-label">Phone (Optional)</label>
                    <input 
                        type="text" className="form-control" placeholder="+1234567890"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                
                <div className="mb-3">
                    <label className="form-label custom-label">Password</label>
                    <input 
                        type="password" className="form-control" placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                    />
                </div>

                <div className="mb-4">
                    <label className="form-label custom-label">Confirm Password</label>
                    <input 
                        type="password" className="form-control" placeholder="••••••••"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Sign up"}
                </button>
            </form>

            <div className="divider">OR SIGN UP WITH</div>

            <div className="row gx-2">
                <div className="col-6">
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('google')}>
                        <span className="icon-google">G</span> Google
                    </button>
                </div>
                <div className="col-6">
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('facebook')}>
                        <span className="icon-facebook">f</span> Facebook
                    </button>
                </div>
            </div>

            <div className="auth-footer">
                Already have an account? <Link to="/login" className="auth-footer-link">Log in</Link>
            </div>
        </AuthLayout>
    );
};

export default RegisterPage;
