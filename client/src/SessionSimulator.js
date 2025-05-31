import React, { useState, useEffect } from 'react';

// Helper to generate actions based on the URL
const getActionsForUrl = (url) => {
  if (!url) return [];
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('product')) {
    return [
      { action: 'page_load', delay: 1000 },
      { action: 'view_product', delay: 1500 },
      { action: 'add_to_cart', delay: 2000 },
      { action: 'api_call', delay: 1000 }
    ];
  } else if (lowerUrl.includes('order')) {
    return [
      { action: 'page_load', delay: 1000 },
      { action: 'view_orders', delay: 1500 },
      { action: 'submit_order', delay: 2000 },
      { action: 'api_call', delay: 1000 }
    ];
  }
  // Default actions
  return [
    { action: 'page_load', delay: 1000 },
    { action: 'create_orders', delay: 2000 },
    { action: 'nav_tabs', delay: 1500 },
    { action: 'api_call', delay: 3000 }
  ];
};

const SessionSimulator = ({ url, onSessionComplete }) => {
  const [sessions, setSessions] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [resourceMetrics, setResourceMetrics] = useState({
    cpu: 0,
    memory: 0,
    errorRate: 0
  });
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // Simulate resource metrics
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        // Simulate CPU usage (0-100%)
        const cpuUsage = Math.random() * 100;
        // Simulate memory usage (0-100%)
        const memoryUsage = Math.random() * 100;
        // Simulate error rate (0-5%)
        const errorRate = Math.random() * 5;

        setResourceMetrics({
          cpu: cpuUsage.toFixed(1),
          memory: memoryUsage.toFixed(1),
          errorRate: errorRate.toFixed(2)
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const startSession = async () => {
    setIsRunning(true);
    const sessionId = Date.now();
    const newSession = {
      id: sessionId,
      startTime: new Date(),
      status: 'running',
      metrics: []
    };

    setSessions(prev => [...prev, newSession]);

    // Get actions based on the URL
    const interactions = getActionsForUrl(url);

    for (const interaction of interactions) {
      await new Promise(resolve => setTimeout(resolve, interaction.delay));
      
      // Record metrics for each interaction (use random values for demo)
      const metrics = {
        timestamp: new Date(),
        action: interaction.action,
        cpu: (Math.random() * 100).toFixed(1),
        memory: (Math.random() * 100).toFixed(1),
        errorRate: (Math.random() * 5).toFixed(2)
      };

      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, metrics: [...session.metrics, metrics] }
            : session
        )
      );
    }

    // Complete session
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'completed', endTime: new Date() }
          : session
      )
    );

    setIsRunning(false);
    if (onSessionComplete) {
      onSessionComplete(sessions.find(s => s.id === sessionId));
    }
  };

  return (
    <div className="session-simulator" style={{
      background: '#fff',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      marginBottom: 24
    }}>
      <h3 style={{ marginTop: 0, color: '#1976d2' }}>Session Simulation</h3>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button
          onClick={startSession}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            background: isRunning ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
        >
          {isRunning ? 'Running...' : 'Start New Session'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f8fbff', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>CPU Usage</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#1976d2' }}>
            {resourceMetrics.cpu}%
          </div>
        </div>
        <div style={{ background: '#f8fbff', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Memory Usage</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#1976d2' }}>
            {resourceMetrics.memory}%
          </div>
        </div>
        <div style={{ background: '#f8fbff', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Error Rate</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#1976d2' }}>
            {resourceMetrics.errorRate}%
          </div>
        </div>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fbff' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Session ID</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Start Time</th>
              <th style={{ padding: 12, textAlign: 'left' }}>End Time</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <React.Fragment key={session.id}>
                <tr
                  style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                  onClick={() => setExpandedSessionId(session.id === expandedSessionId ? null : session.id)}
                >
                  <td style={{ padding: 12 }}>{session.id}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: session.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                      color: session.status === 'completed' ? '#2e7d32' : '#f57c00'
                    }}>
                      {session.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{session.startTime.toLocaleTimeString()}</td>
                  <td style={{ padding: 12 }}>{session.endTime?.toLocaleTimeString() || '-'}</td>
                  <td style={{ padding: 12 }}>
                    {session.endTime 
                      ? `${((session.endTime - session.startTime) / 1000).toFixed(1)}s`
                      : '-'
                    }
                  </td>
                </tr>
                {expandedSessionId === session.id && session.metrics && session.metrics.length > 0 && (
                  <tr>
                    <td colSpan={5} style={{ background: '#f8fbff', padding: 0 }}>
                      <div style={{ padding: 16 }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>User Actions</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                          <thead>
                            <tr style={{ background: '#e3f0fa' }}>
                              <th style={{ padding: 8, textAlign: 'left' }}>Timestamp</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>Action</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>CPU (%)</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>Memory (%)</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>Error Rate (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.metrics.map((m, idx) => (
                              <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fbff' : '#eaf4fd' }}>
                                <td style={{ padding: 8 }}>{typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toLocaleTimeString()}</td>
                                <td style={{ padding: 8 }}>{m.action}</td>
                                <td style={{ padding: 8 }}>{m.cpu}</td>
                                <td style={{ padding: 8 }}>{m.memory}</td>
                                <td style={{ padding: 8 }}>{m.errorRate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionSimulator; 