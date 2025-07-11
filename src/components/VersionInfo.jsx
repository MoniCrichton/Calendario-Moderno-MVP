// src/components/VersionInfo.jsx
export default function VersionInfo({ nivel }) {
  const version = "v4.0";
  return (
    <div style={{
      position: 'fixed',
      bottom: 6,
      right: 10,
      fontSize: '0.75rem',
      color: '#666',
      opacity: 0.6,
      pointerEvents: 'none',
      zIndex: 1000
    }}>
      {version} - {nivel}
    </div>
  );
}
