import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../constants';
import { authSessionService, mockAuthApiService } from '../../services/auth';
import sbiLogo from '../../assets/sbi_logo_launch.jpg';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState('user.sbi@bank.com');
  const [password, setPassword] = useState('User@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email && !email.trim() ? 'Email is required' : touched.email && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email' : '';
  const passwordError = touched.password && !password ? 'Password is required' : '';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError || passwordError || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await mockAuthApiService.login({ email, password, rememberMe: false });
      setMessage(`Dummy API: ${response.message} (${response.user.role})`);
      authSessionService.setSession(response);
      navigate(APP_ROUTES.dashboard);
    } catch (error) {
      console.error('Login failed', error);
      setMessage(error instanceof Error ? error.message : 'Dummy API failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="SBI OCR Login">
        <header className="top-branding">
          <div className="brand-wrap">
            <div className="brand-mark" aria-hidden="true">
              <img src={sbiLogo} alt="SBI logo" />
            </div>
            <h1>SBI OCR</h1>
          </div>
        </header>

        <div className="login-content">
          <h2>Welcome to Your Account</h2>
          <p className="login-subtitle">Sign in to continue with the SBI OCR verification workspace.</p>

          <form className="login-card" onSubmit={onSubmit}>
            <label className="field" htmlFor="email">
              <span className="field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="8" r="4" fill="#7c96b5"></circle>
                  <path d="M4 20c0-4.2 3.6-7 8-7s8 2.8 8 7" fill="#7c96b5"></path>
                </svg>
              </span>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, email: true }))} placeholder="Email Address" />
            </label>
            <p className="error-text">{emailError}</p>

            <label className="field" htmlFor="password">
              <span className="field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <rect x="6" y="10" width="12" height="10" rx="2" fill="#7c96b5"></rect>
                  <path d="M8 10V7.8A4 4 0 0 1 12 4a4 4 0 0 1 4 3.8V10" stroke="#7c96b5" strokeWidth="2" fill="none"></path>
                </svg>
              </span>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, password: true }))} placeholder="Password" />
            </label>
            <p className="error-text">{passwordError}</p>

            <button className="login-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>

            {message ? <p className="status">{message}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
