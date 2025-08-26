import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import AdminLoginModal from './AdminLoginModal';
import { Trophy, Users, Calendar, Award, Crown, Star, Settings, LogIn, Medal } from 'lucide-react';

const PublicDashboard = ({ apiClient, isAdmin, onAdminLogin, onAdminLogout }) => {
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [scoreboard, setScoreboard] = useState([]);
  const [individualRankings, setIndividualRankings] = useState({ adults: [], kids: [] });
  const [loading, setLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teamsRes, eventsRes, scoreboardRes, rankingsRes] = await Promise.all([
        apiClient.get('/teams'),
        apiClient.get('/events'),
        apiClient.get('/scoreboard'),
        apiClient.get('/individual-rankings')
      ]);
      
      setTeams(teamsRes.data);
      setEvents(eventsRes.data);
      setScoreboard(scoreboardRes.data);
      setIndividualRankings(rankingsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen festive-bg">
        <Navigation isAdmin={isAdmin} onAdminLogout={onAdminLogout} />
        <div className="flex items-center justify-center h-96">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const upcomingEvents = events
    .filter(event => !event.is_completed && new Date(event.event_date) > new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 3);

  const recentEvents = events
    .filter(event => event.is_completed)
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
    .slice(0, 3);

  const leadingTeam = scoreboard[0] || {};
  const totalMembers = teams.reduce((sum, team) => {
    return sum + (individualRankings.adults.filter(m => m.team_id === team.id).length +
                   individualRankings.kids.filter(m => m.team_id === team.id).length);
  }, 0);

  return (
    <div className="min-h-screen festive-bg">
      <Navigation isAdmin={isAdmin} onAdminLogout={onAdminLogout} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
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
          
          {/* Admin Login Button */}
          {!isAdmin && (
            <button
              onClick={() => setShowAdminLogin(true)}
              className="mt-4 btn-secondary flex items-center space-x-2 mx-auto"
            >
              <Settings className="w-4 h-4" />
              <span>Admin Login</span>
            </button>
          )}
          
          {isAdmin && (
            <div className="mt-4 bg-green-100 text-green-800 px-4 py-2 rounded-full inline-flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>Admin Mode Active</span>
            </div>
          )}
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-blue-700">{upcomingEvents.length}</h3>
            <p className="text-blue-600">Upcoming Events</p>
          </div>

          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-700">{totalMembers}</h3>
            <p className="text-red-600">Participants</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Team Scoreboard */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center">
              <Trophy className="w-6 h-6 mr-2" />
              Team Scoreboard
            </h2>
            <div className="space-y-4">
              {scoreboard.map((team, index) => (
                <div 
                  key={team.id} 
                  className={`scoreboard-item ${index === 0 ? 'winner' : ''}`}
                  style={{ '--team-color': team.color }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {index === 0 ? <Crown className="w-6 h-6 text-yellow-500" /> : 
                       index === 1 ? <Medal className="w-6 h-6 text-gray-400" /> :
                       <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">{index + 1}</div>}
                    </div>
                    
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: team.color }}>
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {index === 0 ? 'Current Leader' : `${index + 1}${index === 1 ? 'nd' : 'rd'} Place`}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {team.total_points}
                      </div>
                      <div className="text-sm text-gray-600">Points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
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
                        <div className="flex items-center mt-2 space-x-4 text-sm">
                          <div className="flex items-center text-orange-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(event.event_date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {event.category}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {event.event_type}
                          </span>
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

        {/* Individual Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Adult Rankings */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2" />
              Adult Individual Rankings
            </h2>
            <div className="space-y-3">
              {individualRankings.adults.slice(0, 5).map((member, index) => {
                const team = teams.find(t => t.id === member.team_id);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-sm text-gray-600" style={{ color: team?.color }}>
                          {team?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {member.individual_points || 0}
                    </div>
                  </div>
                );
              })}
              {individualRankings.adults.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No adult participants yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Kid Rankings */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2" />
              Kid Individual Rankings
            </h2>
            <div className="space-y-3">
              {individualRankings.kids.slice(0, 5).map((member, index) => {
                const team = teams.find(t => t.id === member.team_id);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-sm text-gray-600" style={{ color: team?.color }}>
                          {team?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {member.individual_points || 0}
                    </div>
                  </div>
                );
              })}
              {individualRankings.kids.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No kid participants yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center">
              <Trophy className="w-6 h-6 mr-2" />
              Recent Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="event-item">
                  <h3 className="font-semibold text-lg text-orange-700 mb-2">{event.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex space-x-2">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        {event.category}
                      </span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        {event.event_type}
                      </span>
                    </div>
                    <span className="text-green-600 font-semibold">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Message */}
        <div className="text-center mt-12 p-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full px-6 py-3">
            <Crown className="w-5 h-5 text-orange-600" />
            <span className="text-orange-700 font-semibold">
              May the best team win! Happy Onam 2025! 🌼
            </span>
          </div>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLoginModal
          apiClient={apiClient}
          onLogin={onAdminLogin}
          onClose={() => setShowAdminLogin(false)}
        />
      )}
    </div>
  );
};

export default PublicDashboard;