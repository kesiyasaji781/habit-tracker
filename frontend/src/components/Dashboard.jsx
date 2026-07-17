import React, { useEffect, useState } from 'react';
import { Plus, Check, Trash2, TrendingUp, Sparkles, Award } from 'lucide-react';

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState({ total_habits: 0, completed_habits: 0, completion_rate: 0 });
  const [analytics, setAnalytics] = useState({ labels: [], values: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [description, setDescription] = useState('');
  
  // Confetti particles state
  const [particles, setParticles] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch habits and stats
      const habitsRes = await fetch('/api/habits');
      if (!habitsRes.ok) throw new Error('Failed to load habits');
      const habitsData = await habitsRes.json();
      setHabits(habitsData.habits);
      setStats({
        total_habits: habitsData.total_habits,
        completed_habits: habitsData.completed_habits,
        completion_rate: habitsData.completion_rate
      });

      // Fetch weekly analytics
      const analyticsRes = await fetch('/api/analytics');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add habit');
      }

      setName('');
      setDescription('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteHabit = async (id) => {
    try {
      const response = await fetch(`/api/habits/${id}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete habit');
      }

      // Trigger micro-celebration animation
      triggerConfetti();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;

    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete habit');
      }

      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const triggerConfetti = () => {
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#a855f7'];
    const newParticles = Array.from({ length: 60 }).map((_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      return {
        id: Date.now() + idx,
        x: Math.random() * 100, // random screen width percentage
        y: -10,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speedX: Math.cos(angle) * speed * 0.1,
        speedY: 4 + Math.random() * 6,
        opacity: 1
      };
    });
    setParticles(newParticles);
    
    // Auto cleanup particles
    setTimeout(() => {
      setParticles([]);
    }, 2500);
  };

  // Custom SVG Bar Chart calculation
  const renderChart = () => {
    const values = analytics.values || [];
    const labels = analytics.labels || [];
    if (values.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No log data available for this week.</p>;

    const maxVal = Math.max(...values, 2); // default scale max to at least 2
    const chartHeight = 160;
    const chartWidth = 700;
    const paddingLeft = 40;
    const paddingBottom = 30;
    const paddingTop = 20;
    const paddingRight = 20;

    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const barWidth = 40;
    const totalBars = values.length;
    const gap = (graphWidth - (barWidth * totalBars)) / (totalBars - 1);

    return (
      <div className="chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + paddingTop + paddingBottom}`} className="svg-chart">
          {/* Grid Lines & Axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + chartHeight}
            className="chart-axis-line"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + chartHeight}
            className="chart-axis-line"
          />

          {/* Horizontal Grid lines (e.g. 3 lines) */}
          {[0.5, 1].map((ratio, index) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  className="chart-grid-line"
                />
                <text x={paddingLeft - 10} y={y + 4} className="chart-text" style={{ textAnchor: 'end' }}>
                  {Math.round(maxVal * ratio)}
                </text>
              </g>
            );
          })}

          {/* Bars & Labels */}
          {values.map((val, idx) => {
            const x = paddingLeft + idx * (barWidth + gap);
            const height = (val / maxVal) * chartHeight;
            const y = paddingTop + chartHeight - height;
            
            // Format labels for dates (e.g., just day of week or short date)
            const dateObj = new Date(labels[idx]);
            const formattedLabel = isNaN(dateObj.getTime())
              ? labels[idx]
              : dateObj.toLocaleDateString(undefined, { weekday: 'short' });

            return (
              <g key={idx}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(height, 2)} /* tiny minimum height to show zero values */
                  className="chart-bar"
                />
                
                {/* Value Label above Bar */}
                {val > 0 && (
                  <text x={x + barWidth / 2} y={y - 6} className="chart-bar-value">
                    {val}
                  </text>
                )}

                {/* Day label below Axis */}
                <text x={x + barWidth / 2} y={paddingTop + chartHeight + 20} className="chart-text">
                  {formattedLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-main" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <h3>Loading your habits...</h3>
      </div>
    );
  }

  return (
    <div className="dashboard-main">
      {/* Confetti Container */}
      {particles.length > 0 && (
        <div className="confetti-container">
          {particles.map((p) => (
            <div
              key={p.id}
              className="confetti"
              style={{
                left: `${p.x}vw`,
                top: `${p.y}vh`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`,
                animationDuration: `${p.speedY / 2}s`
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="alert-banner alert-banner-error" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: 'none' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="btn btn-secondary btn-icon" style={{ padding: '0.2rem', borderRadius: '50%' }}>✕</button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Habits</span>
            <span className="stat-value">{stats.total_habits}</span>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon-wrapper">
            <Check size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed Today</span>
            <span className="stat-value">{stats.completed_habits}</span>
          </div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-icon-wrapper">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Success Rate</span>
            <span className="stat-value">{stats.completion_rate}%</span>
          </div>
        </div>
      </div>

      {/* Add Habit Section */}
      <div className="section-card">
        <h3 className="section-title">
          <Plus size={20} style={{ color: 'var(--primary)' }} />
          Add New Habit
        </h3>
        <form onSubmit={handleAddHabit}>
          <div className="habit-form-grid">
            <div className="form-group">
              <label className="form-label">Habit Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Morning Jog"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control select-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Fitness</option>
                <option>Study</option>
                <option>Reading</option>
                <option>Meditation</option>
                <option>General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 30 mins around the park"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 1.5rem' }}>
              <Plus size={18} />
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Habits List Section */}
      <div className="section-card">
        <h3 className="section-title">
          <Sparkles size={20} style={{ color: 'var(--warning)' }} />
          Your Habits
        </h3>
        <div className="table-responsive">
          {habits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              No habits created yet. Use the form above to add your first habit!
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Streak</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id}>
                    <td>
                      <div className="habit-name">{habit.name}</div>
                      {habit.description && <div className="habit-desc">{habit.description}</div>}
                    </td>
                    <td>
                      <span className="badge badge-secondary">{habit.category}</span>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      🔥 {habit.streak} {habit.streak > 0 && habit.completed_today ? 'days' : ''}
                    </td>
                    <td>
                      {habit.completed_today ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCompleteHabit(habit.id)}
                          disabled={habit.completed_today}
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem',
                            opacity: habit.completed_today ? 0.6 : 1,
                            cursor: habit.completed_today ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Check size={14} />
                          {habit.completed_today ? 'Done' : 'Complete'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteHabit(habit.id)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="section-card" style={{ marginBottom: '1rem' }}>
        <h3 className="section-title">
          <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
          Weekly Analytics
        </h3>
        {renderChart()}
      </div>
    </div>
  );
}
