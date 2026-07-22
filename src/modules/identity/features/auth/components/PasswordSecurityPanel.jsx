import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { changePasswordApi, requestSetPasswordApi } from '../../../services/authService';
import { doLogoutSuccess } from '../../../redux/authAction';

const PasswordSecurityPanel = ({ capability }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [submitting, setSubmitting] = useState(false);
  const hasPassword = capability !== 'SET_PASSWORD_REQUIRED';
  const requestSet = async () => {
    setSubmitting(true);
    try { await requestSetPasswordApi(); toast.success('Check your email for the secure Set Password link.'); }
    catch (error) { toast.error(error?.EM || 'Unable to send the Set Password email.'); }
    finally { setSubmitting(false); }
  };
  const change = async (event) => {
    event.preventDefault();
    if (form.new_password !== form.confirm_password) { toast.error('Password confirmation does not match.'); return; }
    setSubmitting(true);
    try {
      await changePasswordApi(form);
      dispatch(doLogoutSuccess());
      window.dispatchEvent(new CustomEvent('session:invalidated', { detail: { code: 'PASSWORD_CHANGED' } }));
      toast.success('Password changed. Please log in again.');
      navigate('/login', { replace: true });
    } catch (error) { toast.error(error?.EM || 'Unable to change the password.'); }
    finally { setSubmitting(false); }
  };
  return <div className="content-card password-security-panel"><h6>Password</h6>
    {!hasPassword ? <><p>This social account does not have a local password yet.</p><button type="button" className="btn btn-outline-primary" onClick={requestSet} disabled={submitting}>{submitting ? 'Sending…' : 'Email me a Set Password link'}</button></> : <form onSubmit={change} className="d-grid gap-2">
      <label>Current password<input className="form-control" type="password" autoComplete="current-password" value={form.current_password} onChange={(event) => setForm({ ...form, current_password: event.target.value })} required /></label>
      <label>New password<input className="form-control" type="password" minLength={6} maxLength={128} autoComplete="new-password" value={form.new_password} onChange={(event) => setForm({ ...form, new_password: event.target.value })} required /></label>
      <label>Confirm password<input className="form-control" type="password" minLength={6} maxLength={128} autoComplete="new-password" value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} required /></label>
      <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Changing…' : 'Change password'}</button>
    </form>}
  </div>;
};

export default PasswordSecurityPanel;
