import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { AddToTrackerForm } from '../components/AddToTrackerForm';
import { invoiceService, trackerService } from '../services/api';
import { Download, ArrowLeft, Pencil, Save, X, Check, Building2, ZoomIn, ZoomOut, ArrowRightLeft, Plus } from 'lucide-react';

export const InvoicePreviewPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const previewContainerRef = useRef(null);
  
  const [invoice, setInvoice] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [tableView, setTableView] = useState('po'); // 'po' or 'im'
  const [isTrackerFormOpen, setIsTrackerFormOpen] = useState(false);
  const [isInTracker, setIsInTracker] = useState(false);

  // Editing states
  const [editState, setEditState] = useState({
    summary: false,
    details: false,
    products: false,
    im_products: false
  });
  const [editedData, setEditedData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvoice();
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(invoiceId);
      setInvoice(response.data);
      setEditedData(JSON.parse(JSON.stringify(response.data))); // Deep copy for editing

      // Check if already in tracker
      try {
        const trackerRes = await trackerService.getTrackerByInvoice(invoiceId);
        setIsInTracker(!!trackerRes.data.tracker);
      } catch (err) {
        console.log('Tracker check info:', err.message);
      }

      try {
        const fileRes = await invoiceService.getInvoiceFile(invoiceId);

        // Check if server returned error JSON instead of file
        if (fileRes.data.type === 'application/json') {
          const text = await fileRes.data.text();
          console.error('Server returned error:', text);
          throw new Error('Failed to load file: ' + text);
        }

        // Force PDF mime type if extension is .pdf
        const isPdf = response.data.invoice_file_path?.toLowerCase().endsWith('.pdf');

        // Create blob with correct type
        const blob = new Blob([fileRes.data], {
          type: isPdf ? 'application/pdf' : fileRes.data.type
        });

        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error('Failed to load invoice image:', err);
        setError('Failed to load invoice file');
      }
    } catch (err) {
      setError('Failed to load invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const response = await invoiceService.downloadExcel(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoice.invoice_number || 'export'}_${invoice.invoice_date || 'date'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download Excel file');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadInvoiceFile = async () => {
    try {
      setDownloading(true);
      const response = await invoiceService.downloadInvoiceFile(invoiceId);
      const fileName = invoice.invoice_file_path?.split('/').pop() || `invoice_${invoiceId}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download invoice file');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSupportingFile = async () => {
    try {
      setDownloading(true);
      const response = await invoiceService.downloadSupportingFile(invoiceId);
      const fileName = invoice.supporting_file_path?.split('/').pop() || `supporting_${invoiceId}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download supporting file');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const toggleEdit = (section) => {
    setEditState(prev => ({ ...prev, [section]: !prev[section] }));
    if (!editState[section]) {
      // When entering edit mode, populate brand_code and supplier_code
      const editData = JSON.parse(JSON.stringify(invoice));
      if (editData.items && invoice.brand && invoice.supplier) {
        editData.items = editData.items.map(item => ({
          ...item,
          brand_code: invoice.brand?.brand_code || item.brand_code || '',
          supplier_code: invoice.supplier?.supplier_code || item.supplier_code || ''
        }));
      }
      setEditedData(editData);
    }
  };

  const cancelEdit = (section) => {
    // Reset edited data to current invoice data for that section
    setEditedData(JSON.parse(JSON.stringify(invoice)));
    setEditState(prev => ({ ...prev, [section]: false }));
  };

  const handleSave = async (section) => {
    try {
      setSaving(true);
      const response = await invoiceService.updateInvoice(invoiceId, editedData);
      setInvoice(response.data);
      setEditState(prev => ({ ...prev, [section]: false }));
    } catch (err) {
      console.error('Failed to save invoice:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editedData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedData(prev => ({ ...prev, items: newItems }));
  };

  const handleBarcodePaste = (index, e) => {
    // Prevent default paste behavior
    e.preventDefault();

    // Get pasted text
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    if (!pastedText) return;

    // Split by newlines and filter empty lines
    const barcodes = pastedText.split(/\r?\n/).map(b => b.trim()).filter(b => b);

    if (barcodes.length === 0) return;

    // If only one barcode, treat as normal input but on this specific field
    if (barcodes.length === 1) {
      handleItemChange(index, 'barcode', barcodes[0]);
      return;
    }

    // Update multiple rows
    const newItems = [...editedData.items];
    barcodes.forEach((barcode, i) => {
      const targetIndex = index + i;
      if (targetIndex < newItems.length) {
        newItems[targetIndex] = { ...newItems[targetIndex], barcode: barcode };
      }
    });

    setEditedData(prev => ({ ...prev, items: newItems }));
  };

  const handleZoom = (direction) => {
    const zoomStep = 10;
    if (direction === 'in' && zoom < 200) {
      setZoom(zoom + zoomStep);
    } else if (direction === 'out' && zoom > 50) {
      setZoom(zoom - zoomStep);
    }
  };

  const handleMouseWheel = (e) => {
    if (!e.ctrlKey) return;
    
    e.preventDefault();
    const zoomStep = 10;
    
    if (e.deltaY < 0) {
      // Zoom in
      setZoom(prev => Math.min(prev + zoomStep, 200));
    } else {
      // Zoom out
      setZoom(prev => Math.max(prev - zoomStep, 50));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-primary"></div>
            <p className="text-gray-600">Loading invoice preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="container-max py-8 flex-1">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error || 'Invoice not found'}
          </div>
          <button onClick={() => navigate('/invoices')} className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
            ← Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="container-max py-8 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 font-medium hover:opacity-80 transition text-primary"
          >
            <ArrowLeft size={18} />
            Back to Invoices
          </button>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${invoice.status === 'processed' ? 'bg-green-100 text-green-700' :
              invoice.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Content Grid - 5/12 Preview, 7/12 Content */}
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Left Side: Invoice Preview (Narrower) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8" style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}>
            <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between z-10 relative">
              <h3 className="font-bold text-gray-800">Invoice Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom('out')}
                  className="p-1.5 hover:bg-gray-200 rounded transition text-gray-600"
                  title="Zoom Out (Ctrl + Scroll)"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-bold text-gray-600 min-w-[45px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-1.5 hover:bg-gray-200 rounded transition text-gray-600"
                  title="Zoom In (Ctrl + Scroll)"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            <div
              ref={previewContainerRef}
              className="flex-1 bg-gray-100 relative overflow-auto flex items-center justify-center p-4"
              onWheel={handleMouseWheel}
            >
              {imageUrl ? (
                invoice.invoice_file_path?.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        width: 'fit-content',
                        height: 'fit-content'
                      }}
                    >
                      <embed
                        src={imageUrl}
                        type="application/pdf"
                        className="rounded shadow-lg bg-white"
                        style={{ width: '800px', height: '1000px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center'
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Invoice"
                      className="max-w-full h-auto object-contain shadow-lg bg-white rounded"
                    />
                  </div>
                )
              ) : invoice.invoice_file_path ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-2 border-primary"></div>
                    <p className="text-gray-500 text-sm">Loading preview...</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center italic text-gray-400">
                  No invoice file available
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Data and Cards (Wider) */}
          <div className="col-span-12 lg:col-span-7 space-y-6">

            {/* Top Cards Section */}
            <div className="grid grid-cols-5 gap-4">
              {/* Invoice Summary Card */}
              <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 group">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                      <Download size={16} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs">Invoice Summary</h4>
                  </div>
                  {!editState.summary ? (
                    <button onClick={() => toggleEdit('summary')} className="p-1 hover:bg-gray-100 rounded text-gray-400 opacity-0 group-hover:opacity-100 transition">
                      <Pencil size={12} />
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => handleSave('summary')} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => cancelEdit('summary')} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Invoice Number</label>
                    {!editState.summary ? (
                      <span className="font-bold text-gray-900 block truncate text-sm">
                        {invoice.invoice_number || 'N/A'}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={editedData.invoice_number || ''}
                        onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                        className="w-full text-sm font-bold border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Invoice Date</label>
                    {!editState.summary ? (
                      <span className="font-bold text-gray-900 block text-sm">{invoice.invoice_date || 'N/A'}</span>
                    ) : (
                      <input
                        type="text"
                        value={editedData.invoice_date || ''}
                        onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                        className="w-full text-sm font-bold border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-50">
                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Total Amount</label>
                    {!editState.summary ? (
                      <span className="font-black text-lg block text-primary">
                        {invoice.currency} {invoice.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editedData.currency || ''}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          className="w-16 text-sm font-bold border rounded px-2 py-1 uppercase"
                        />
                        <input
                          type="number"
                          value={editedData.total_amount || 0}
                          onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value))}
                          className="flex-1 text-sm font-bold border rounded px-2 py-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Details Card */}
              <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 group">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-100 text-primary font-bold text-xs">
                      <Building2 size={16} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs">Invoice Details</h4>
                  </div>
                  {/* Manual Edit for Entity Details might be complex due to BU/Supplier IDs, but we can allow text for now or simple ID swap */}
                  {/* User asked for edit buttons on each section. For details, we'll keep it simple for now (text fields) */}
                  {!editState.details ? (
                    <button onClick={() => toggleEdit('details')} className="p-1 hover:bg-gray-100 rounded text-gray-400 opacity-0 group-hover:opacity-100 transition">
                      <Pencil size={12} />
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => handleSave('details')} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => cancelEdit('details')} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Company</label>
                      <span className="font-bold text-gray-800 block truncate text-sm">
                        {invoice.company?.company_name || 'N/A'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">Code: {invoice.company?.company_code || 'N/A'}</span>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Business Unit</label>
                      <span className="font-bold text-gray-800 block truncate text-sm">
                        {invoice.business_unit?.name || 'N/A'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">Code: {invoice.business_unit?.bu_code || 'N/A'}</span>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Supplier</label>
                      <span className="font-bold text-gray-800 block truncate text-sm">
                        {invoice.supplier?.name || 'N/A'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">Code: {invoice.supplier?.supplier_code || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PO Creation / IM Creation Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px] group">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900">
                    {tableView === 'po' ? 'PO Creation' : 'IM Creation'}
                  </h3>
                  <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                    {invoice.items?.length || 0} Items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTableView(tableView === 'po' ? 'im' : 'po')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition"
                  >
                    <ArrowRightLeft size={12} />
                    <span>Switch to {tableView === 'po' ? 'IM' : 'PO'} Creation</span>
                  </button>
                  
                  {tableView === 'po' && (
                    <>
                      {!editState.products ? (
                        <button onClick={() => toggleEdit('products')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition">
                          <Pencil size={12} />
                          <span>Edit List</span>
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleSave('products')} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold transition">
                            <Save size={12} />
                            <span>Save Changes</span>
                          </button>
                          <button onClick={() => cancelEdit('products')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition">
                            <X size={12} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {tableView === 'im' && (
                    <>
                      {!editState.im_products ? (
                        <button onClick={() => toggleEdit('im_products')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition">
                          <Pencil size={12} />
                          <span>Edit List</span>
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleSave('im_products')} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold transition">
                            <Save size={12} />
                            <span>Save Changes</span>
                          </button>
                          <button onClick={() => cancelEdit('im_products')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition">
                            <X size={12} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {tableView === 'po' ? (
                  // PO Creation Table
                  <table className="w-full text-[11px] border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-white z-20">
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-bold text-gray-500 border-b uppercase tracking-tighter w-40">Item Code</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-500 border-b uppercase tracking-tighter w-40">Color | Size</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-500 border-b uppercase tracking-tighter w-40">Barcode</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-500 border-b uppercase tracking-tighter w-20">Qty</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-500 border-b uppercase tracking-tighter w-24">Foreign Cur</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-500 border-b uppercase tracking-tighter w-24">Foreign FOB</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-500 border-b uppercase tracking-tighter w-24">Unit Retail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(editState.products ? editedData.items : invoice.items)?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-2 px-4 font-mono font-medium">
                            {!editState.products ? item.itemcode : (
                              <input
                                type="text"
                                value={item.itemcode || ''}
                                onChange={(e) => handleItemChange(idx, 'itemcode', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-4 text-gray-500 whitespace-nowrap">
                            {!editState.products ? item.color_size : (
                              <input
                                type="text"
                                value={item.color_size || ''}
                                onChange={(e) => handleItemChange(idx, 'color_size', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-4 font-bold text-blue-600">
                            {!editState.products ? item.barcode : (
                              <input
                                type="text"
                                value={item.barcode || ''}
                                onChange={(e) => handleItemChange(idx, 'barcode', e.target.value)}
                                onPaste={(e) => handleBarcodePaste(idx, e)}
                                className="w-full border rounded px-1.5 py-0.5 text-blue-600 font-bold"
                              />
                            )}
                          </td>
                          <td className="py-2 px-4 font-medium">
                            {!editState.products ? item.quantity : (
                              <input
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-4 font-bold text-gray-600">
                            {invoice.currency}
                          </td>
                          <td className="py-2 px-4 font-medium text-gray-900">
                            {!editState.products ? item.unit_cost?.toFixed(2) : (
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_cost || 0}
                                onChange={(e) => handleItemChange(idx, 'unit_cost', parseFloat(e.target.value))}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-4 font-black text-gray-900">
                            {!editState.products ? item.unit_retail?.toFixed(2) : (
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_retail || 0}
                                onChange={(e) => handleItemChange(idx, 'unit_retail', parseFloat(e.target.value))}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // IM Creation Table
                  <table className="w-full text-[11px] border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-white z-20">
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-32">Itemcode</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-32">Item Description</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-24">Mancode</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-24">Brand Code</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-20">Season</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-24">Supplier Code</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-28">Section</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-28">Family</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-32">Subfamily</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-500 border-b uppercase tracking-tighter w-28">Alternate Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(editState.im_products ? editedData.items : invoice.items)?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-2 px-3 font-mono font-medium text-gray-900">
                            {!editState.im_products ? (item.itemcode || '-') : (
                              <input
                                type="text"
                                value={item.itemcode || ''}
                                onChange={(e) => handleItemChange(idx, 'itemcode', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {!editState.im_products ? (item.item_description || '-') : (
                              <input
                                type="text"
                                value={item.item_description || ''}
                                onChange={(e) => handleItemChange(idx, 'item_description', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {!editState.im_products ? (item.mancode || '-') : (
                              <input
                                type="text"
                                value={item.mancode || ''}
                                onChange={(e) => handleItemChange(idx, 'mancode', e.target.value)}
                                placeholder="Model"
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {!editState.im_products ? (item.brand_code || '-') : (
                              <input
                                type="text"
                                value={item.brand_code || ''}
                                disabled
                                className="w-full border rounded px-1.5 py-0.5 bg-gray-100 cursor-not-allowed"
                                title="Auto-populated from selected brand"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700 font-medium">
                            {!editState.im_products ? (item.season || '-') : (
                              <input
                                type="text"
                                value={item.season || ''}
                                onChange={(e) => handleItemChange(idx, 'season', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {!editState.im_products ? (item.supplier_code || '-') : (
                              <input
                                type="text"
                                value={item.supplier_code || ''}
                                disabled
                                className="w-full border rounded px-1.5 py-0.5 bg-gray-100 cursor-not-allowed"
                                title="Auto-populated from selected supplier"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {!editState.im_products ? (item.section || '-') : (
                              <input
                                type="text"
                                value={item.section || ''}
                                onChange={(e) => handleItemChange(idx, 'section', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {!editState.im_products ? (item.family || '-') : (
                              <input
                                type="text"
                                value={item.family || ''}
                                onChange={(e) => handleItemChange(idx, 'family', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {!editState.im_products ? (item.subfamily || '-') : (
                              <input
                                type="text"
                                value={item.subfamily || ''}
                                onChange={(e) => handleItemChange(idx, 'subfamily', e.target.value)}
                                className="w-full border rounded px-1.5 py-0.5"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-600">
                            {!editState.im_products ? (item.alternate_code || '-') : (
                              <input
                                type="text"
                                value={item.alternate_code || ''}
                                onChange={(e) => handleItemChange(idx, 'alternate_code', e.target.value)}
                                placeholder="Decathlon SKU"
                                className="w-full border rounded px-1.5 py-0.5 text-blue-600 font-bold"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              {invoice.invoice_file_path && (
                <button
                  onClick={handleDownloadInvoiceFile}
                  disabled={downloading || Object.values(editState).some(v => v)}
                  className="flex items-center gap-2 text-white font-bold py-2 px-6 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-sm"
                  title="Download the original invoice file"
                >
                  {downloading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Download size={16} />
                  )}
                  Download Invoice
                </button>
              )}
              {invoice.supporting_file_path && (
                <button
                  onClick={handleDownloadSupportingFile}
                  disabled={downloading || Object.values(editState).some(v => v)}
                  className="flex items-center gap-2 text-white font-bold py-2 px-6 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 bg-orange-600 hover:bg-orange-700 text-sm"
                  title="Download the original Excel sheet"
                >
                  {downloading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Download size={16} />
                  )}
                  Download Excel
                </button>
              )}
              {!isInTracker && (
                <button
                  onClick={() => setIsTrackerFormOpen(true)}
                  disabled={Object.values(editState).some(v => v)}
                  className="flex items-center gap-3 text-white font-black py-4 px-10 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 tracking-wide bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={20} />
                  ADD TO TRACKER
                </button>
              )}
              <button
                onClick={handleDownloadExcel}
                disabled={downloading || Object.values(editState).some(v => v)}
                className="flex items-center gap-3 text-white font-black py-4 px-10 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 tracking-wide bg-primary"
              >
                {downloading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Download size={20} />
                )}
                {downloading ? 'Preparing File...' : 'GENERATE EXCEL'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add to Tracker Form Modal */}
      <AddToTrackerForm
        invoiceId={parseInt(invoiceId)}
        isOpen={isTrackerFormOpen}
        onClose={() => setIsTrackerFormOpen(false)}
        onSuccess={() => {
          setIsInTracker(true);
          setIsTrackerFormOpen(false);
        }}
      />
    </div>
  );
};
