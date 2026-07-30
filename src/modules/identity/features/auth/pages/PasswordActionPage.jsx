import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { completePasswordResetApi, completeSetPasswordApi, validatePasswordResetApi, validateSetPasswordApi } from '../../../services/authService';
import '../styles/PasswordAction.scss';

const readAndRemoveFragmentToken = () => {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = params.get('token') || '';
  window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  return token;
};

const PasswordActionPage = ({ mode }) => {
  const tokenRef = useRef('');
  const [state, setState] = useState('VALIDATING');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isSet = mode === 'SET';

  useEffect(() => {
    const token = readAndRemoveFragmentToken();
    tokenRef.current = token;
    if (!token) {
      setMessage('This password link is missing or invalid. Open the original email link again.');
      setState('INVALID');
      return undefined;
    }
    let active = true;
    const validate = isSet ? validateSetPasswordApi : validatePasswordResetApi;
    validate(token).then(() => { if (active) setState('READY'); }).catch((error) => {
      if (active) { setMessage(error?.EM || 'This password link is invalid or has expired.'); setState('INVALID'); }
    });
    return () => { active = false; tokenRef.current = ''; };
  }, [isSet]);

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { setMessage('Password confirmation does not match.'); return; }
    setState('SUBMITTING');
    setMessage('');
    try {
      const complete = isSet ? completeSetPasswordApi : completePasswordResetApi;
      await complete({ token: tokenRef.current, new_password: password, confirm_password: confirmPassword });
      tokenRef.current = '';
      setState('COMPLETE');
    } catch (error) {
      setMessage(error?.EM || 'The password could not be updated.');
      setState(error?.code?.includes('TOKEN') ? 'INVALID' : 'READY');
    }
  };

  return <AuthLayout><div className="password-action">
    <h2>{isSet ? 'Set a password' : 'Reset your password'}</h2>
    {state === 'VALIDATING' && <p role="status">Checking your secure link…</p>}
    {state === 'INVALID' && <div className="password-action__notice password-action__notice--error" role="alert"><p>{message}</p><Link to={isSet ? '/login' : '/forgot-password'}>{isSet ? 'Return to login' : 'Request a new link'}</Link></div>}
    {state === 'COMPLETE' && <div className="password-action__notice" role="status"><h3>Password updated</h3><p>Existing sessions were signed out. Please log in again.</p><Link to="/login">Continue to login</Link></div>}
    {['READY', 'SUBMITTING'].includes(state) && <form onSubmit={submit}>
      <p>Use between 6 and 128 characters.</p>
      <label htmlFor="new-password">New password</label>
      <input id="new-password" type={showPassword ? 'text' : 'password'} minLength={6} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      <label htmlFor="confirm-password">Confirm password</label>
      <input id="confirm-password" type={showPassword ? 'text' : 'password'} minLength={6} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
      <label className="password-action__toggle"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show passwords</label>
      {message && <p className="password-action__error" role="alert">{message}</p>}
      <button type="submit" disabled={state === 'SUBMITTING'}>{state === 'SUBMITTING' ? 'Updating…' : (isSet ? 'Set password' : 'Reset password')}</button>
    </form>}
  </div></AuthLayout>;
};

export default PasswordActionPage;
