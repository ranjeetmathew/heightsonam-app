import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { Users, Plus, Trash2, UserPlus, Crown } from 'lucide-react';

const Teams = ({ apiClient, onLogout }) => {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    category: 'Adult',
    team_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsRes, membersRes] = await Promise.all([
        apiClient.get('/teams'),
        apiClient.get('/members')
      ]);
      
      setTeams(teamsRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/members', newMember);
      setNewMember({ name: '', category: 'Adult', team_id: '' });
      setShowAddMember(false);
      loadData();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await apiClient.delete(`/members/${memberId}`);
        loadData();
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
  };

  const getMembersByTeam = (teamId) => {
    return members.filter(member => member.team_id === teamId);
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

  return (
    <div className="min-h-screen festive-bg">
      <Navigation onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-orange-600" />
            <h1 className="title-onam text-4xl">Team Management</h1>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-onam flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Member</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams.map((team) => {
            const teamMembers = getMembersByTeam(team.id);
            const adultMembers = teamMembers.filter(m => m.category === 'Adult');
            const kidMembers = teamMembers.filter(m => m.category === 'Kid');

            return (
              <div 
                key={team.id} 
                className="festive-card p-6"
                style={{ '--team-color': team.color }}
              >
                <div className="team-card mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="team-logo w-16 h-16 text-xl">
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: team.color }}>
                          {team.name}
                        </h2>
                        <p className="text-gray-600">
                          {teamMembers.length} members • {team.total_points} points
                        </p>
                      </div>
                    </div>
                    <Crown className="w-6 h-6 text-yellow-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {adultMembers.length}
                      </div>
                      <div className="text-sm text-blue-700">Adults</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {kidMembers.length}
                      </div>
                      <div className="text-sm text-green-700">Kids</div>
                    </div>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">Team Members</h3>
                  
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                      <div key={member.id} className="member-item">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: team.color }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{member.name}</div>
                            <div 
                              className="member-category"
                              style={{ '--team-color': team.color }}
                            >
                              {member.category}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No members added yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Add New Member</h2>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter member name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newMember.category}
                  onChange={(e) => setNewMember({ ...newMember, category: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="Adult">Adult</option>
                  <option value="Kid">Kid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team
                </label>
                <select
                  value={newMember.team_id}
                  onChange={(e) => setNewMember({ ...newMember, team_id: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-onam flex-1"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;