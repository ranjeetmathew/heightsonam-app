import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { Calendar, Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react';

const Events = ({ apiClient, onLogout }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await apiClient.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
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
          created_at: editingEvent.created_at
        });
      } else {
        await apiClient.post('/events', formData);
      }
      
      setShowModal(false);
      setEditingEvent(null);
      setFormData({ name: '', description: '', event_date: '' });
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      event_date: new Date(event.event_date).toISOString().slice(0, 16)
    });
    setShowModal(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await apiClient.delete(`/events/${eventId}`);
        loadEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({ name: '', description: '', event_date: '' });
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
    const upcoming = events.filter(event => new Date(event.event_date) > now);
    const past = events.filter(event => new Date(event.event_date) <= now);
    
    return {
      upcoming: upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)),
      past: past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
    };
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

  const { upcoming, past } = categorizeEvents();

  return (
    <div className="min-h-screen festive-bg">
      <Navigation onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-orange-600" />
            <h1 className="title-onam text-4xl">Event Management</h1>
          </div>
          <button
            onClick={openAddModal}
            className="btn-onam flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Event</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center text-green-700">
              <Clock className="w-6 h-6 mr-2" />
              Upcoming Events ({upcoming.length})
            </h2>
            
            <div className="space-y-4">
              {upcoming.length > 0 ? (
                upcoming.map((event) => {
                  const { date, time } = formatEventDate(event.event_date);
                  
                  return (
                    <div key={event.id} className="event-item">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-orange-700 mb-2">
                            {event.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {event.description}
                          </p>
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
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(event)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No upcoming events</p>
                  <button
                    onClick={openAddModal}
                    className="btn-secondary"
                  >
                    Create First Event
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Past Events */}
          <div className="festive-card p-6">
            <h2 className="subtitle-onam text-2xl mb-6 flex items-center text-gray-700">
              <MapPin className="w-6 h-6 mr-2" />
              Past Events ({past.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {past.length > 0 ? (
                past.map((event) => {
                  const { date, time } = formatEventDate(event.event_date);
                  
                  return (
                    <div key={event.id} className="event-item opacity-75">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-700 mb-2">
                            {event.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {event.description}
                          </p>
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
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(event)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No past events</p>
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
    </div>
  );
};

export default Events;