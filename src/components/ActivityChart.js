import React from 'react';

function ActivityChart({ data = [], title = "Activity Overview" }) {
  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : [
    { date: '2024-01-01', verifications: 2, balance: 0.5 },
    { date: '2024-01-02', verifications: 1, balance: 0.3 },
    { date: '2024-01-03', verifications: 3, balance: 0.8 },
    { date: '2024-01-04', verifications: 2, balance: 0.6 },
    { date: '2024-01-05', verifications: 4, balance: 1.2 },
    { date: '2024-01-06', verifications: 1, balance: 0.4 },
    { date: '2024-01-07', verifications: 2, balance: 0.7 }
  ];

  const maxVerifications = Math.max(...chartData.map(d => d.verifications));
  const maxBalance = Math.max(...chartData.map(d => d.balance));

  return (
    <div className="card fade-in" style={{ padding: '1.5rem' }}>
      <h4 className="text-tertiary" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3b82f6' }}>trending_up</span>
        {title}
      </h4>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div className="text-caption" style={{ color: '#64748b', marginBottom: '0.5rem' }}>
            Verifications
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '4px', height: '60px' }}>
            {chartData.map((item, index) => (
              <div
                key={index}
                className="fade-in"
                style={{
                  flex: 1,
                  height: `${(item.verifications / maxVerifications) * 100}%`,
                  background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                  borderRadius: '2px 2px 0 0',
                  minHeight: '4px',
                  transition: 'all 0.3s ease',
                  animationDelay: `${index * 0.1}s`
                }}
                title={`${item.date}: ${item.verifications} verifications`}
              />
            ))}
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <div className="text-caption" style={{ color: '#64748b', marginBottom: '0.5rem' }}>
            Balance (BTC)
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '4px', height: '60px' }}>
            {chartData.map((item, index) => (
              <div
                key={index}
                className="fade-in"
                style={{
                  flex: 1,
                  height: `${(item.balance / maxBalance) * 100}%`,
                  background: 'linear-gradient(to top, #4CAF50, #81c784)',
                  borderRadius: '2px 2px 0 0',
                  minHeight: '4px',
                  transition: 'all 0.3s ease',
                  animationDelay: `${index * 0.1}s`
                }}
                title={`${item.date}: ${item.balance} BTC`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
        <span>{chartData[0]?.date}</span>
        <span>{chartData[chartData.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default ActivityChart;
