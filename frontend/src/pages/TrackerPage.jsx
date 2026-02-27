import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { trackerService, invoiceService } from '../services/api';
import { Download, ExternalLink, FileText, Package, AlertCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';

// Helper function to parse YYYYMMDD format to readable date
const parseYYYYMMDDDate = (dateString) => {
  if (!dateString) return '-';
  if (dateString.length !== 8) return dateString; // If not in YYYYMMDD format, return as-is
  
  try {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${month}/${day}/${year}`;
  } catch (err) {
    return dateString;
  }
};

export const TrackerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [expandedBU, setExpandedBU] = useState({});

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await trackerService.getAllTrackers();
      setData(response.data.data || []);
    } catch (err) {
      console.error('Failed to load trackers:', err);
      setError('Failed to load tracker data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async (invoiceId) => {
    try {
      const response = await invoiceService.downloadExcel(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoiceId}_export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download Excel:', err);
    }
  };

  const handleDownloadInvoiceFile = async (invoiceId, fileName) => {
    try {
      const response = await invoiceService.downloadInvoiceFile(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `invoice_${invoiceId}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download invoice file:', err);
    }
  };

  const handleDownloadSupportingFile = async (invoiceId, fileName) => {
    try {
      const response = await invoiceService.downloadSupportingFile(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `supporting_${invoiceId}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download supporting file:', err);
    }
  };

  const toggleCountry = (countryId) => {
    setExpandedCountry(expandedCountry === countryId ? null : countryId);
  };

  const toggleBU = (buId) => {
    setExpandedBU(prev => ({
      ...prev,
      [buId]: !prev[buId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading tracker data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LPO Tracker & Archive</h1>
          <p className="text-gray-600 mt-2">View and manage all your tracked LPOs organized by country and business unit</p>
        </div>

        {/* Empty State */}
        {data.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Tracked LPOs Yet</h3>
            <p className="text-gray-600">Start by adding invoices to the tracker. Go to your invoices and click "Add to Tracker" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((countryData) => (
              <div key={countryData.country?.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Country Header */}
                <button
                  onClick={() => toggleCountry(countryData.country?.id)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 flex items-center justify-between"
                >
                  <span className="text-lg font-semibold">{countryData.country?.country_name || 'Unknown Country'}</span>
                  {expandedCountry === countryData.country?.id ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </button>

                {/* Business Units */}
                {expandedCountry === countryData.country?.id && (
                  <div className="border-t border-gray-200">
                    {countryData.business_units?.map((buData) => (
                      <div key={buData.bu?.id} className="border-b border-gray-200 last:border-b-0">
                        {/* BU Header */}
                        <button
                          onClick={() => toggleBU(buData.bu?.id)}
                          className="w-full px-6 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
                        >
                          <div>
                            <span className="font-semibold text-gray-900">{buData.bu?.store_name || buData.bu?.name}</span>
                            <span className="text-sm text-gray-600 ml-2">({buData.bu?.bu_code})</span>
                            <span className="text-sm text-gray-500 ml-2">• {buData.trackers?.length || 0} LPO(s)</span>
                          </div>
                          {expandedBU[buData.bu?.id] ? (
                            <ChevronUp size={20} className="text-gray-600" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-600" />
                          )}
                        </button>

                        {/* Trackers Table */}
                        {expandedBU[buData.bu?.id] && (
                          <div className="px-6 py-4 bg-white overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b-2 border-gray-200">
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Serial No.</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Date of Request</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Ticket No.</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Invoice No.</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Invoice Date</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Total Amount</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Total Qty Rcv'd</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Shipment No.</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Costing</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">SP Shipment</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Uploaded Files</th>
                                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {buData.trackers?.map((tracker) => (
                                  <tr key={tracker.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-2 font-medium text-gray-900">{tracker.serial_number}</td>
                                    <td className="py-3 px-2 text-gray-700">
                                      {tracker.date_of_request ? parseYYYYMMDDDate(tracker.date_of_request) : '-'}
                                    </td>
                                    <td className="py-3 px-2 text-gray-700">{tracker.ticket_no || '-'}</td>
                                    <td className="py-3 px-2 text-gray-700">{tracker.invoice_number || '-'}</td>
                                    <td className="py-3 px-2 text-gray-700">
                                      {tracker.invoice_date ? parseYYYYMMDDDate(tracker.invoice_date) : '-'}
                                    </td>
                                    <td className="py-3 px-2 text-gray-700">
                                      {tracker.total_amount ? `$${tracker.total_amount.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="py-3 px-2 text-gray-700">{tracker.total_quantity_received || '-'}</td>
                                    <td className="py-3 px-2 text-gray-700">{tracker.shipment_no || '-'}</td>
                                    <td className="py-3 px-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        tracker.shipment_status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                        tracker.shipment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        tracker.shipment_status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {tracker.shipment_status || '-'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        tracker.communicated_with_costing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {tracker.communicated_with_costing ? 'Yes' : 'No'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        tracker.sp_shipment ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {tracker.sp_shipment ? `Yes (${tracker.sp_ticket_no})` : 'No'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-2">
                                      <div className="flex gap-2 flex-wrap">
                                        {tracker.invoice_file_path && (
                                          <button
                                            onClick={() => handleDownloadInvoiceFile(tracker.invoice_id, tracker.invoice_file_path.split('/').pop())}
                                            className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 flex items-center gap-1"
                                            title="Download Invoice File"
                                          >
                                            <FileText size={16} />
                                            <span className="text-xs">Invoice</span>
                                          </button>
                                        )}
                                        {tracker.supporting_file_path && (
                                          <button
                                            onClick={() => handleDownloadSupportingFile(tracker.invoice_id, tracker.supporting_file_path.split('/').pop())}
                                            className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50 flex items-center gap-1"
                                            title="Download Excel Sheet"
                                          >
                                            <FileText size={16} />
                                            <span className="text-xs">Excel</span>
                                          </button>
                                        )}
                                        {!tracker.invoice_file_path && !tracker.supporting_file_path && (
                                          <span className="text-gray-400 text-xs">No files</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-2">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => navigate(`/invoices/${tracker.invoice_id}`)}
                                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                          title="View Invoice"
                                        >
                                          <ExternalLink size={18} />
                                        </button>
                                        <button
                                          onClick={() => handleDownloadExcel(tracker.invoice_id)}
                                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                          title="Download IM/PO Excel"
                                        >
                                          <Download size={18} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
