export default function InvalidTokenPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>!</div>
        <h1 style={{ fontSize: 22, color: '#1e293b', marginBottom: 8 }}>유효하지 않은 링크</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          초대 링크가 만료되었거나 유효하지 않습니다.<br />
          상담사에게 새로운 초대 링크를 요청해 주세요.
        </p>
      </div>
    </div>
  );
}
