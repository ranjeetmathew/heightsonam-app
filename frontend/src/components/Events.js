import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { Calendar, Plus, Edit, Trash2, Clock, MapPin, Trophy, Users, Star, Award } from 'lucide-react';

const Events = ({ apiClient, isAdmin, onAdminLogout }) => {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    category: 'Mixed',
    event_type: 'Team'
  });
  const [winnerData, setWinnerData] = useState({
    winner_team_id: '',
    runner_up_team_id: '',
    winner_member_id: '',
    runner_up_member_id: '',
    winner_points: 10,
    runner_up_points: 5,
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, teamsRes, membersRes, resultsRes] = await Promise.all([
        apiClient.get('/events'),
        apiClient.get('/teams'),
        apiClient.get('/members'),
        apiClient.get('/results')
      ]);
      
      setEvents(eventsRes.data);
      setTeams(teamsRes.data);
      setMembers(membersRes.data);
      setResults(resultsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEvent) {
        await apiClient.put(`/events/${editingEvent.id}`, {
          ...formData,
          id: editingEvent.id,
          is_completed: editingEvent.is_completed,
          created_at: editingEvent.created_at
        });
      } else {
        await apiClient.post('/events', formData);
      }
      
      setShowModal(false);
      setEditingEvent(null);
      setFormData({ name: '', description: '', event_date: '', category: 'Mixed', event_type: 'Team' });
      loadData();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleWinnerSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/results', {
        ...winnerData,
        event_id: selectedEvent.id
      });
      
      setShowWinnerModal(false);
      setSelectedEvent(null);
      setWinnerData({
        winner_team_id: '',
        runner_up_team_id: '',
        winner_member_id: '',
        runner_up_member_id: '',
        winner_points: 10,
        runner_up_points: 5,
        remarks: ''
      });
      loadData();
    } catch (error) {
      console.error('Error saving winners:', error);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      category: event.category,
      event_type: event.event_type
    });
    setShowModal(true);
  };

  const handleSelectWinners = (event) => {
    setSelectedEvent(event);
    setShowWinnerModal(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await apiClient.delete(`/events/${eventId}`);
        loadData();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({ name: '', description: '', event_date: '', category: 'Mixed', event_type: 'Team' });
    setShowModal(true);
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const categorizeEvents = () => {
    const now = new Date();
    const upcoming = events.filter(event => !event.is_completed && new Date(event.event_date) > now);
    const completed = events.filter(event => event.is_completed);
    const past = events.filter(event => !event.is_completed && new Date(event.event_date) <= now);
    
    return {
      upcoming: upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)),
      completed: completed.sort((a, b) => new Date(b.event_date) - new Date(a.event_date)),
      past: past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
    };
  };

  const getAvailableWinners = () => {
    if (!selectedEvent) return [];
    
    if (selectedEvent.event_type === 'Team') {
      return teams;
    } else {
      return members.filter(member => 
        selectedEvent.category === 'Mixed' || member.category === selectedEvent.category
      );
    }
  };

  const hasResult = (eventId) => {
    return results.some(result => result.event_id === eventId);
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

  const { upcoming, completed, past } = categorizeEvents();

  return (
    <div className="min-h-screen festive-bg">
      <Navigation isAdmin={isAdmin} onAdminLogout={onAdminLogout} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-orange-600" />
            <h1 className="title-onam text-4xl">Events</h1>
          </div>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="btn-onam flex items-center space-x-2"
              style={{ zIndex: 10, position: 'relative' }}
            >
              <Plus size={20} />
              <span>Add Event</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center text-green-700">
              <Clock className="w-6 h-6 mr-2" />
              Upcoming ({upcoming.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {upcoming.length > 0 ? (
                upcoming.map((event) => {
                  const { date, time } = formatEventDate(event.event_date);
                  
                  return (
                    <div key={event.id} className="event-item">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-orange-700">
                              {event.name}
                            </h3>
                            {isAdmin && (
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => handleEdit(event)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(event.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-2 text-sm mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {event.category}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              {event.event_type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-orange-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              {date}
                            </div>
                            <div className="flex items-center text-orange-600">
                              <Clock className="w-4 h-4 mr-1" />
                              {time}
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleSelectWinners(event)}
                              className="btn-onam text-xs px-3 py-1 mt-3"
                            >
                              Select Winners
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No upcoming events</p>
                  {isAdmin && (
                    <button
                      onClick={openAddModal}
                      className="btn-secondary"
                    >
                      Create First Event
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Completed Events */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center text-purple-700">
              <Trophy className="w-6 h-6 mr-2" />
              Completed ({completed.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {completed.length > 0 ? (
                completed.map((event) => {
                  const { date, time } = formatEventDate(event.event_date);
                  
                  return (
                    <div key={event.id} className="event-item bg-green-50 border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-green-700">
                              {event.name}
                            </h3>
                            {isAdmin && (
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => handleEdit(event)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleSelectWinners(event)}
                                  className="text-green-600 hover:text-green-800 p-1"
                                >
                                  <Trophy size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-2 text-sm mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {event.category}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              {event.event_type}
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              ✅ Completed
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {date}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No completed events</p>
                </div>
              )}
            </div>
          </div>

          {/* Past Events (Pending Results) */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center text-red-700">
              <MapPin className="w-6 h-6 mr-2" />
              Pending Results ({past.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {past.length > 0 ? (
                past.map((event) => {
                  const { date, time } = formatEventDate(event.event_date);
                  
                  return (
                    <div key={event.id} className="event-item bg-red-50 border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-red-700">
                              {event.name}
                            </h3>
                            {isAdmin && (
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => handleEdit(event)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleSelectWinners(event)}
                                  className="text-orange-600 hover:text-orange-800 p-1"
                                >
                                  <Award size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-2 text-sm mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {event.category}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              {event.event_type}
                            </span>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                              ⏰ Needs Results
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {date}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {time}
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleSelectWinners(event)}
                              className="btn-onam text-xs px-3 py-1 mt-3 bg-red-500 hover:bg-red-600"
                            >
                              Add Results
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No events need results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter event name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input min-h-20"
                  placeholder="Enter event description"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="Adult">Adult Only</option>
                    <option value="Kid">Kid Only</option>
                    <option value="Mixed">Mixed (Adults & Kids)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="Team">Team Event</option>
                    <option value="Individual">Individual Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="form-input"
                  required
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
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Winner Selection Modal */}
      {showWinnerModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">
              Select Winners - {selectedEvent.name}
            </h2>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {selectedEvent.category}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {selectedEvent.event_type}
                </span>
              </div>
            </div>
            
            <form onSubmit={handleWinnerSubmit} className="space-y-4">
              {selectedEvent.event_type === 'Team' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Winner Team
                    </label>
                    <select
                      value={winnerData.winner_team_id}
                      onChange={(e) => setWinnerData({ ...winnerData, winner_team_id: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="">Select winner team</option>
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
                      value={winnerData.runner_up_team_id}
                      onChange={(e) => setWinnerData({ ...winnerData, runner_up_team_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select runner-up team (optional)</option>
                      {teams.filter(team => team.id !== winnerData.winner_team_id).map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Winner ({selectedEvent.category === 'Mixed' ? 'Any Category' : selectedEvent.category})
                    </label>
                    <select
                      value={winnerData.winner_member_id}
                      onChange={(e) => setWinnerData({ ...winnerData, winner_member_id: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="">Select winner</option>
                      {getAvailableWinners().map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.category}) - {teams.find(t => t.id === member.team_id)?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Runner-up (Optional)
                    </label>
                    <select
                      value={winnerData.runner_up_member_id}
                      onChange={(e) => setWinnerData({ ...winnerData, runner_up_member_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select runner-up (optional)</option>
                      {getAvailableWinners().filter(member => member.id !== winnerData.winner_member_id).map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.category}) - {teams.find(t => t.id === member.team_id)?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Winner Points
                  </label>
                  <input
                    type="number"
                    value={winnerData.winner_points}
                    onChange={(e) => setWinnerData({ ...winnerData, winner_points: parseInt(e.target.value) })}
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
                    value={winnerData.runner_up_points}
                    onChange={(e) => setWinnerData({ ...winnerData, runner_up_points: parseInt(e.target.value) })}
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
                  value={winnerData.remarks}
                  onChange={(e) => setWinnerData({ ...winnerData, remarks: e.target.value })}
                  className="form-input min-h-20"
                  placeholder="Best performer, special mention, etc."
                  rows="2"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWinnerModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-onam flex-1"
                >
                  Save Winners
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;