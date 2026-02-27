import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { invoiceService } from '../services/api';
import { Eye, Plus, Trash2 } from 'lucide-react';

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.listUserInvoices(page, 10);
      setInvoices(response.data.invoices);
      setTotalPages(response.data.pages);
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.deleteInvoice(id);
        fetchInvoices(); // Refresh list
      } catch (err) {
        console.error('Failed to delete invoice:', err);
        alert('Failed to delete invoice');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container-max py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-700">Invoices</h1>
          <button
            onClick={() => navigate('/invoices/upload')}
            className="flex items-center gap-2 text-white font-medium py-2 px-6 rounded-lg transition bg-primary hover:opacity-90"
          >
            <Plus size={20} />
            Upload Invoice
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-primary"></div>
            <p className="text-gray-600">Loading invoices...</p>
          </div>
        ) : invoices.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">
                      Invoice #
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">
                      Supplier
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">
                      Items
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6">{invoice.invoice_number || 'N/A'}</td>
                      <td className="py-3 px-6">{invoice.invoice_date || 'N/A'}</td>
                      <td className="py-3 px-6">
                        {invoice.supplier?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-6">
                        {invoice.currency} {invoice.total_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-6">{invoice.items?.length || 0}</td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${invoice.status === 'processed'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <button
                          onClick={() =>
                            navigate(`/invoices/${invoice.id}/preview`)
                          }
                          className="flex items-center gap-1 font-medium mr-3 text-primary hover:opacity-80"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="flex items-center gap-1 font-medium text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No invoices found</p>
            <button
              onClick={() => navigate('/invoices/upload')}
              className="text-white font-medium py-2 px-6 rounded-lg transition bg-primary hover:opacity-90"
            >
              Upload Your First Invoice
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
