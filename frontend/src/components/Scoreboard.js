import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { Award, Crown, Medal, Trophy, TrendingUp, Users } from 'lucide-react';

const Scoreboard = ({ apiClient, onLogout }) => {
  const [scoreboard, setScoreboard] = useState([]);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scoreboardRes, teamsRes, membersRes] = await Promise.all([
        apiClient.get('/scoreboard'),
        apiClient.get('/teams'),
        apiClient.get('/members')
      ]);
      
      setScoreboard(scoreboardRes.data);
      setTeams(teamsRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Error loading scoreboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMembersByTeam = (teamId) => {
    return members.filter(member => member.team_id === teamId);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Trophy className="w-6 h-6 text-orange-500" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm">{index + 1}</div>;
    }
  };

  const getRankLabel = (index) => {
    switch (index) {
      case 0:
        return 'Champion';
      case 1:
        return 'Runner-up';
      case 2:
        return '3rd Place';
      default:
        return `${index + 1}th Place`;
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

  const totalPoints = scoreboard.reduce((sum, team) => sum + team.total_points, 0);
  const leadingTeam = scoreboard[0];

  return (
    <div className="min-h-screen festive-bg">
      <Navigation onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-orange-600 mr-3" />
            <h1 className="title-onam text-4xl">Live Scoreboard</h1>
          </div>
          <p className="text-xl text-orange-700">Onam Celebration 2025 Rankings</p>
        </div>

        {/* Champion Spotlight */}
        {leadingTeam && (
          <div className="festive-card p-8 mb-12 text-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1674980629034-4c98a49ce93f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxLZXJhbGElMjBmZXN0aXZhbHxlbnwwfHx8fDE3NTYyMDg4NDh8MA&ixlib=rb-4.1.0&q=85" 
                alt="Kerala Festival"
                className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-yellow-500 shadow-2xl"
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mt-6 mb-2" style={{ color: leadingTeam.color }}>
              {leadingTeam.name}
            </h2>
            <div className="text-5xl font-bold text-yellow-600 mb-2">
              {leadingTeam.total_points} Points
            </div>
            <p className="text-orange-700 text-lg">🎉 Current Champion! 🎉</p>
            
            <div className="mt-6 flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {getMembersByTeam(leadingTeam.id).length}
                </div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totalPoints > 0 ? Math.round((leadingTeam.total_points / totalPoints) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Share</div>
              </div>
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scoreboard.map((team, index) => {
            const teamMembers = getMembersByTeam(team.id);
            const adultMembers = teamMembers.filter(m => m.category === 'Adult');
            const kidMembers = teamMembers.filter(m => m.category === 'Kid');
            const isWinner = index === 0;

            return (
              <div 
                key={team.id} 
                className={`scoreboard-item ${isWinner ? 'winner' : ''}`}
                style={{ '--team-color': team.color }}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold" style={{ color: team.color }}>
                        {team.name}
                      </h3>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-orange-600">
                          {team.total_points}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getRankLabel(index)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {teamMembers.length} total
                        </div>
                        <div>{adultMembers.length} adults</div>
                        <div>{kidMembers.length} kids</div>
                      </div>
                      
                      {totalPoints > 0 && (
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-green-600">
                            {Math.round((team.total_points / totalPoints) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: totalPoints > 0 ? `${(team.total_points / Math.max(...scoreboard.map(t => t.total_points))) * 100}%` : '0%',
                          backgroundColor: team.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-blue-700">{totalPoints}</h3>
            <p className="text-blue-600">Total Points Awarded</p>
          </div>

          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-700">{members.length}</h3>
            <p className="text-green-600">Total Participants</p>
          </div>

          <div className="festive-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-purple-700">{teams.length}</h3>
            <p className="text-purple-600">Competing Teams</p>
          </div>
        </div>

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
    </div>
  );
};

export default Scoreboard;