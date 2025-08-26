import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { Trophy, Users, Calendar, Award, Crown, Star } from 'lucide-react';

const Dashboard = ({ onLogout, apiClient }) => {
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teamsRes, eventsRes] = await Promise.all([
        apiClient.get('/teams'),
        apiClient.get('/events')
      ]);
      
      setTeams(teamsRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen festive-bg">
        <Navigation onLogout={onLogout} />
        <div className="flex items-center justify-center h-96">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const upcomingEvents = events
    .filter(event => new Date(event.event_date) > new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 3);

  const leadingTeam = teams.reduce((prev, current) => 
    (prev.total_points > current.total_points) ? prev : current, teams[0] || {}
  );

  return (
    <div className="min-h-screen festive-bg">
      <Navigation onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative">
            <img 
              src="https://images.pexels.com/photos/13752953/pexels-photo-13752953.jpeg" 
              alt="Onam Pookalam"
              className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white shadow-2xl"
            />
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="title-onam text-5xl mt-6">Onam Celebration 2025</h1>
          <p className="text-xl text-orange-700 mt-2">Festival of Joy & Unity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-orange-700">{teams.length}</h3>
            <p className="text-orange-600">Teams</p>
          </div>

          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-700">{events.length}</h3>
            <p className="text-green-600">Total Events</p>
          </div>

          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-purple-700">{upcomingEvents.length}</h3>
            <p className="text-purple-600">Upcoming Events</p>
          </div>

          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-700">{leadingTeam.total_points || 0}</h3>
            <p className="text-red-600">Leading Score</p>
          </div>
        </div>

        {/* Teams Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Teams Overview
            </h2>
            <div className="space-y-4">
              {teams.map((team) => (
                <div 
                  key={team.id} 
                  className="team-card p-4"
                  style={{ '--team-color': team.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="team-logo w-12 h-12 text-lg">
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{team.name}</h3>
                        <p className="text-sm text-gray-600">Active Team</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: team.color }}>
                        {team.total_points}
                      </div>
                      <p className="text-sm text-gray-600">Points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-orange-700">{event.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                        <div className="flex items-center mt-2 text-sm text-orange-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.event_date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Leader */}
        {leadingTeam.name && (
          <div className="festive-card p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-yellow-500 mr-2" />
              <h2 className="subtitle-onam text-3xl">Current Leader</h2>
            </div>
            <div 
              className="team-logo w-24 h-24 text-3xl mb-4"
              style={{ '--team-color': leadingTeam.color }}
            >
              {leadingTeam.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: leadingTeam.color }}>
              {leadingTeam.name}
            </h3>
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {leadingTeam.total_points} Points
            </div>
            <p className="text-gray-600">Leading the celebration!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;