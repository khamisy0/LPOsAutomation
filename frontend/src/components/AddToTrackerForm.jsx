import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { trackerService } from '../services/api';

export const AddToTrackerForm = ({ invoiceId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    invoice_id: invoiceId,
    date_of_request: '',
    ticket_no: '',
    shipment_no: '',
    shipment_status: '',
    communicated_with_costing: false,
    sp_shipment: false,
    sp_ticket_no: '',
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.date_of_request) {
      setError('Date of Request is required');
      return;
    }
    if (!formData.ticket_no) {
      setError('Ticket No. is required');
      return;
    }
    if (!formData.shipment_no) {
      setError('Shipment No. is required');
      return;
    }
    if (!formData.shipment_status) {
      setError('Shipment Status is required');
      return;
    }
    if (formData.sp_shipment && !formData.sp_ticket_no) {
      setError('SP Ticket No. is required when SP Shipment is Yes');
      return;
    }

    try {
      setLoading(true);
      await trackerService.addToTracker(formData);
      setSuccess('Successfully added to tracker!');
      
      // Reset form
      setFormData({
        invoice_id: invoiceId,
        date_of_request: '',
        ticket_no: '',
        shipment_no: '',
        shipment_status: '',
        communicated_with_costing: false,
        sp_shipment: false,
        sp_ticket_no: '',
      });

      // Close after success
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to tracker');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add to Tracker</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 items-start">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-3 items-start">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Date of Request */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Request *
            </label>
            <input
              type="date"
              name="date_of_request"
              value={formData.date_of_request}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          {/* Ticket No */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket No. *
            </label>
            <input
              type="text"
              name="ticket_no"
              value={formData.ticket_no}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ticket number"
              required
              disabled={loading}
            />
          </div>

          {/* Shipment No */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipment No. *
            </label>
            <input
              type="text"
              name="shipment_no"
              value={formData.shipment_no}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter shipment number"
              required
              disabled={loading}
            />
          </div>

          {/* Shipment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipment Status *
            </label>
            <select
              name="shipment_status"
              value={formData.shipment_status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="">Select status</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Communicated with Costing Team */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="communicated_with_costing"
              name="communicated_with_costing"
              checked={formData.communicated_with_costing}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              disabled={loading}
            />
            <label htmlFor="communicated_with_costing" className="text-sm font-medium text-gray-700">
              Communicated with Costing Team
            </label>
          </div>

          {/* SP Shipment */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sp_shipment"
              name="sp_shipment"
              checked={formData.sp_shipment}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              disabled={loading}
            />
            <label htmlFor="sp_shipment" className="text-sm font-medium text-gray-700">
              SP Shipment
            </label>
          </div>

          {/* SP Ticket No (conditional) */}
          {formData.sp_shipment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SP Ticket No. *
              </label>
              <input
                type="text"
                name="sp_ticket_no"
                value={formData.sp_ticket_no}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter SP Ticket Number"
                required={formData.sp_shipment}
                disabled={loading}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add to Tracker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
