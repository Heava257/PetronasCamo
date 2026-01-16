import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  Globe,
  User,
  Ban,
  AlertCircle
} from 'lucide-react';
import './SecurityDashboard.css';
import { request } from '../../../util/helper';

const SecurityDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboard = async () => { 
    try {
      setLoading(true);
      setError(null);
      
      
      const data = await request(
        `security/dashboard?timeRange=${timeRange}`,
        'get'
      );
      
      
      if (data) {
        // ✅ Handle different response structures
        const dashboardData = data.dashboard || data;
        
        
        setDashboard(dashboardData);
      } else {
        setError('No data received from server');
      }
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      console.error('Error response:', error.response?.data);
      
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to load dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  const blockIP = async (ipAddress) => {
    if (!window.confirm(`Block IP ${ipAddress}?`)) return;
    
    try {
      await request('security/block-ip', 'post', {
        ip_address: ipAddress,
        reason: 'Blocked from security dashboard - multiple threats detected'
      });
      
      alert('✅ IP blocked successfully');
      fetchDashboard();
    } catch (error) {
      console.error('Failed to block IP:', error);
      alert('❌ Failed to block IP: ' + (error.response?.data?.message || error.message));
    }
  };

  const getRiskColor = (score) => {
    if (score >= 90) return 'risk-critical';
    if (score >= 75) return 'risk-high';
    if (score >= 50) return 'risk-medium';
    return 'risk-low';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Loading State
  if (loading && !dashboard) {
    return (
      <div className="security-dashboard loading">
        <Shield className="loading-icon" size={48} />
        <p>Loading security dashboard...</p>
      </div>
    );
  }

  // ✅ Error State
  if (error && !dashboard) {
    return (
      <div className="security-dashboard error-state">
        <AlertCircle size={48} className="error-icon" />
        <h2>Failed to Load Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboard} className="retry-btn">
          <Activity size={16} />
          Retry
        </button>
      </div>
    );
  }

  // ✅ Extract data with fallbacks
  const summary = dashboard?.summary || {};
  const recentIncidents = dashboard?.recent_incidents || [];
  const topAttackers = dashboard?.top_attackers || [];
  const attackTypes = dashboard?.attack_types || [];


  return (
    <div className="security-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <Shield size={32} className="header-icon" />
          <div>
            <h1>Security Monitoring</h1>
            <p>AI-Powered Threat Detection System</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="time-selector">
            <button 
              className={timeRange === '24h' ? 'active' : ''}
              onClick={() => setTimeRange('24h')}
            >
              24 Hours
            </button>
            <button 
              className={timeRange === '7d' ? 'active' : ''}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button 
              className={timeRange === '30d' ? 'active' : ''}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
          </div>
          
          <button className="refresh-btn" onClick={fetchDashboard} disabled={loading}>
            <Activity size={16} className={loading ? 'spinning' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card critical">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Critical Threats</h3>
            <p className="stat-number">
              {summary.critical_incidents || 0}
            </p>
            <span className="stat-label">Immediate attention required</span>
          </div>
        </div>

        <div className="stat-card high">
          <div className="stat-icon">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>High Risk Incidents</h3>
            <p className="stat-number">
              {summary.high_incidents || 0}
            </p>
            <span className="stat-label">Under investigation</span>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Incidents</h3>
            <p className="stat-number">
              {summary.total_incidents || 0}
            </p>
            <span className="stat-label">In selected period</span>
          </div>
        </div>

        <div className="stat-card score">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Avg Risk Score</h3>
            <p className="stat-number">
              {summary.avg_risk_score 
                ? Number(summary.avg_risk_score).toFixed(1)
                : '0.0'}
            </p>
            <span className="stat-label">Out of 100</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Incidents */}
        <div className="dashboard-section incidents-section">
          <div className="section-header">
            <h2>
              <AlertTriangle size={20} />
              Recent Security Incidents
            </h2>
            <span className="incident-count">
              {recentIncidents.length} incidents
            </span>
          </div>

          <div className="incidents-list">
            {recentIncidents.length > 0 ? (
              recentIncidents.map(incident => {
                // ✅ Safely parse threats and anomalies
                let threats = [];
                let anomalies = [];
                
                try {
                  if (incident.threats) {
                    threats = typeof incident.threats === 'string' 
                      ? JSON.parse(incident.threats) 
                      : incident.threats;
                  }
                  if (incident.anomalies) {
                    anomalies = typeof incident.anomalies === 'string'
                      ? JSON.parse(incident.anomalies)
                      : incident.anomalies;
                  }
                } catch (e) {
                  console.error('Failed to parse incident data:', e, incident);
                }

                // Ensure arrays
                threats = Array.isArray(threats) ? threats : [];
                anomalies = Array.isArray(anomalies) ? anomalies : [];

                return (
                  <div 
                    key={incident.id} 
                    className={`incident-card ${incident.status || 'medium'} ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="incident-header">
                      <div className="incident-user">
                        <User size={16} />
                        <span>{incident.user_name || 'Unknown User'}</span>
                        <code>({incident.username || 'N/A'})</code>
                      </div>
                      <div className="incident-badges">
                        <span className={`risk-badge ${getRiskColor(incident.risk_score || 0)}`}>
                          {incident.risk_score || 0}/100
                        </span>
                        <span className={`status-badge ${incident.status || 'medium'}`}>
                          {(incident.status || 'medium').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="incident-details">
                      <div className="detail-row">
                        <Globe size={14} />
                        <span><code>{incident.ip_address || 'Unknown'}</code></span>
                      </div>
                      <div className="detail-row">
                        <Clock size={14} />
                        <span>{formatDate(incident.created_at)}</span>
                      </div>
                      <div className="detail-row action">
                        <Activity size={14} />
                        <span>{incident.action || 'Unknown action'}</span>
                      </div>
                    </div>

                    {/* Threats */}
                    {threats.length > 0 && (
                      <div className="incident-threats">
                        <strong>Detected Threats ({threats.length}):</strong>
                        <div className="threat-tags">
                          {threats.map((threat, idx) => (
                            <span 
                              key={idx} 
                              className={`threat-tag ${threat.severity || 'medium'}`}
                              title={threat.description || ''}
                            >
                              {(threat.type || 'UNKNOWN').replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Anomalies */}
                    {anomalies.length > 0 && (
                      <div className="incident-anomalies">
                        <strong>Behavioral Anomalies ({anomalies.length}):</strong>
                        <div className="anomaly-tags">
                          {anomalies.map((anomaly, idx) => (
                            <span 
                              key={idx} 
                              className="anomaly-tag"
                              title={anomaly.description || ''}
                            >
                              {(anomaly.type || 'UNKNOWN').replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show description if available */}
                    {incident.description && (
                      <div className="incident-description">
                        <small>{incident.description}</small>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Shield size={48} />
                <p>No security incidents detected in this period</p>
                <span>Your system is secure! ✅</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Attackers */}
        <div className="dashboard-section attackers-section">
          <div className="section-header">
            <h2>
              <Ban size={20} />
              Top Threat Sources
            </h2>
          </div>

          <div className="attackers-table-container">
            {topAttackers.length > 0 ? (
              <table className="attackers-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Incidents</th>
                    <th>Max Risk</th>
                    <th>Last Seen</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topAttackers.map(attacker => (
                    <tr key={attacker.ip_address}>
                      <td>
                        <code className="ip-code">{attacker.ip_address}</code>
                      </td>
                      <td>
                        <span className="incident-badge">{attacker.incident_count}</span>
                      </td>
                      <td>
                        <span className={`risk-indicator ${getRiskColor(attacker.max_risk_score || 0)}`}>
                          {attacker.max_risk_score || 0}/100
                        </span>
                      </td>
                      <td className="timestamp">
                        {formatDate(attacker.last_incident)}
                      </td>
                      <td>
                        <button 
                          className="btn-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            blockIP(attacker.ip_address);
                          }}
                        >
                          <Ban size={14} />
                          Block IP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Shield size={32} />
                <p>No threat sources detected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: 10, 
          right: 10, 
          background: '#000', 
          color: '#0f0', 
          padding: '10px', 
          fontSize: '12px',
          maxWidth: '300px',
          borderRadius: '5px'
        }}>
          <strong>Debug Info:</strong>
          <div>Total Incidents: {summary.total_incidents || 0}</div>
          <div>Array Length: {recentIncidents.length}</div>
          <div>Has Data: {dashboard ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;