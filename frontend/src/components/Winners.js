import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { Trophy, Plus, Medal, Star, Crown, Settings } from 'lucide-react';

const Winners = ({ apiClient, onLogout }) => {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [results, setResults] = useState([]);
  const [pointsConfig, setPointsConfig] = useState({ winner_points: 10, runner_up_points: 5 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newResult, setNewResult] = useState({
    event_id: '',
    winner_team_id: '',
    runner_up_team_id: '',
    remarks: '',
    winner_points: 10,
    runner_up_points: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, teamsRes, resultsRes, configRes] = await Promise.all([
        apiClient.get('/events'),
        apiClient.get('/teams'),
        apiClient.get('/results'),
        apiClient.get('/points-config')
      ]);
      
      setEvents(eventsRes.data);
      setTeams(teamsRes.data);
      setResults(resultsRes.data);
      setPointsConfig(configRes.data);
      setNewResult(prev => ({
        ...prev,
        winner_points: configRes.data.winner_points,
        runner_up_points: configRes.data.runner_up_points
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/results', newResult);
      setNewResult({
        event_id: '',
        winner_team_id: '',
        runner_up_team_id: '',
        remarks: '',
        winner_points: pointsConfig.winner_points,
        runner_up_points: pointsConfig.runner_up_points
      });
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding result:', error);
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.put('/points-config', pointsConfig);
      setShowConfigModal(false);
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Unknown Event';
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getTeamColor = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.color : '#FF6B35';
  };

  const eventsWithoutResults = events.filter(event => 
    !results.some(result => result.event_id === event.id)
  );

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
            <Trophy className="w-8 h-8 text-orange-600" />
            <h1 className="title-onam text-4xl">Winners & Results</h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Settings size={20} />
              <span>Points Config</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-onam flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Result</span>
            </button>
          </div>
        </div>

        {/* Points Configuration Display */}
        <div className="festive-card p-4 mb-8">
          <div className="flex items-center justify-center space-x-8 text-center">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Winner: {pointsConfig.winner_points} points</span>
            </div>
            <div className="flex items-center space-x-2">
              <Medal className="w-5 h-5 text-gray-500" />
              <span className="font-semibold">Runner-up: {pointsConfig.runner_up_points} points</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Results List */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center text-orange-700">
              <Star className="w-6 h-6 mr-2" />
              Event Results ({results.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.length > 0 ? (
                results.map((result) => (
                  <div key={result.id} className="event-item">
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg text-orange-700 mb-1">
                        {getEventName(result.event_id)}
                      </h3>
                      {result.remarks && (
                        <p className="text-sm text-gray-600 italic">"{result.remarks}"</p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {/* Winner */}
                      <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <Crown className="w-5 h-5 text-yellow-500" />
                          <div>
                            <div className="font-semibold" style={{ color: getTeamColor(result.winner_team_id) }}>
                              {getTeamName(result.winner_team_id)}
                            </div>
                            <div className="text-sm text-gray-600">Winner</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">
                          +{result.winner_points}
                        </div>
                      </div>

                      {/* Runner-up */}
                      {result.runner_up_team_id && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <Medal className="w-5 h-5 text-gray-500" />
                            <div>
                              <div className="font-semibold" style={{ color: getTeamColor(result.runner_up_team_id) }}>
                                {getTeamName(result.runner_up_team_id)}
                              </div>
                              <div className="text-sm text-gray-600">Runner-up</div>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-gray-600">
                            +{result.runner_up_points}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-3">
                      {new Date(result.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No results added yet</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-secondary"
                  >
                    Add First Result
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pending Events */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center text-green-700">
              <Medal className="w-6 h-6 mr-2" />
              Pending Results ({eventsWithoutResults.length})
            </h2>
            
            <div className="space-y-4">
              {eventsWithoutResults.length > 0 ? (
                eventsWithoutResults.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-green-700 mb-2">
                          {event.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {event.description}
                        </p>
                        <div className="text-sm text-gray-500">
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
                      <button
                        onClick={() => {
                          setNewResult(prev => ({
                            ...prev,
                            event_id: event.id
                          }));
                          setShowModal(true);
                        }}
                        className="btn-onam text-sm px-3 py-2"
                      >
                        Add Result
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Medal className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>All events have results!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Result Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Add Event Result</h2>
            
            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event
                </label>
                <select
                  value={newResult.event_id}
                  onChange={(e) => setNewResult({ ...newResult, event_id: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="">Select an event</option>
                  {eventsWithoutResults.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Winner Team
                </label>
                <select
                  value={newResult.winner_team_id}
                  onChange={(e) => setNewResult({ ...newResult, winner_team_id: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="">Select winner</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Runner-up Team (Optional)
                </label>
                <select
                  value={newResult.runner_up_team_id}
                  onChange={(e) => setNewResult({ ...newResult, runner_up_team_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select runner-up (optional)</option>
                  {teams.filter(team => team.id !== newResult.winner_team_id).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Winner Points
                  </label>
                  <input
                    type="number"
                    value={newResult.winner_points}
                    onChange={(e) => setNewResult({ ...newResult, winner_points: parseInt(e.target.value) })}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Runner-up Points
                  </label>
                  <input
                    type="number"
                    value={newResult.runner_up_points}
                    onChange={(e) => setNewResult({ ...newResult, runner_up_points: parseInt(e.target.value) })}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={newResult.remarks}
                  onChange={(e) => setNewResult({ ...newResult, remarks: e.target.value })}
                  className="form-input min-h-20"
                  placeholder="Best performer, special mention, etc."
                  rows="2"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-onam flex-1"
                >
                  Add Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Points Configuration Modal */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Points Configuration</h2>
            
            <form onSubmit={handleUpdateConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Winner Points
                </label>
                <input
                  type="number"
                  value={pointsConfig.winner_points}
                  onChange={(e) => setPointsConfig({ ...pointsConfig, winner_points: parseInt(e.target.value) })}
                  className="form-input"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Runner-up Points
                </label>
                <input
                  type="number"
                  value={pointsConfig.runner_up_points}
                  onChange={(e) => setPointsConfig({ ...pointsConfig, runner_up_points: parseInt(e.target.value) })}
                  className="form-input"
                  min="0"
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Changing points configuration will only affect future results. 
                  Existing results will keep their original points.
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-onam flex-1"
                >
                  Update Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Winners;