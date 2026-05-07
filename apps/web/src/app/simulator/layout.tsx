import './simulator.css';

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="simulator-root">{children}</div>;
}
