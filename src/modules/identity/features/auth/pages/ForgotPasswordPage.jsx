import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { requestPasswordResetApi } from '../../../services/authService';
import '../styles/PasswordAction.scss';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await requestPasswordResetApi(email);
      setComplete(true);
    } catch (requestError) {
      setError(requestError?.EM || 'The request could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthLayout><div className="password-action">
    <h2>Forgot your password?</h2>
    {complete ? <div className="password-action__notice" role="status">
      <h3>Check your email</h3><p>If an eligible account exists, a password reset email has been sent.</p><Link to="/login">Return to login</Link>
    </div> : <>
      <p>Enter the email used for your Customer or Handyman account.</p>
      <form onSubmit={submit}>
        <label htmlFor="forgot-email">Email</label>
        <input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        {error && <p className="password-action__error" role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</button>
      </form>
      <Link className="password-action__back" to="/login">Back to login</Link>
    </>}
  </div></AuthLayout>;
};

export default ForgotPasswordPage;
