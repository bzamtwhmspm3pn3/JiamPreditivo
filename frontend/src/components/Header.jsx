import logo from '../assets/favicon-32x32.png';

export function Header() {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={logo} alt="Jiam" style={{ width: '32px', height: '32px' }} />
      <h1>Jiam Preditivo</h1>
    </header>
  );
}
