import React, { useEffect, useState } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to load profile details');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-main" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <h3>Loading profile...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-main">
        <div className="alert-banner alert-banner-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-main">
      <div className="glass-card profile-card">
        <div className="profile-avatar">
          {profile.username ? profile.username.substring(0, 2).toUpperCase() : 'U'}
        </div>
        <h2 className="profile-name">{profile.username}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Habit Tracker Member</p>

        <div className="profile-streak-box">
          <div className="streak-metric">
            <div className="streak-metric-title">Total Active Habits</div>
            <div className="streak-metric-val">{profile.total_habits}</div>
          </div>

          <div className="streak-metric streak-metric-warning">
            <div className="streak-metric-title">Total Combined Streak</div>
            <div className="streak-metric-val">🔥 {profile.total_streak}</div>
          </div>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Keep up the great work! Every day you check off your habits contributes to building long-term positive routines.
        </p>
      </div>
    </div>
  );
}
