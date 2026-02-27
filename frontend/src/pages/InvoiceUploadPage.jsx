import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { SearchableSelect } from '../components/SearchableSelect';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { invoiceService, masterDataService } from '../services/api';
import { Upload, ChevronDown, Trash2 } from 'lucide-react';

export const InvoiceUploadPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    country_id: '',
    brand_id: '',
    business_unit_id: '',
    supplier_id: '',
    invoice_file: null,
    supporting_file: null,
  });

  // Master data
  const [countries, setCountries] = useState([]);
  const [brands, setBrands] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Decathlon data table
  const [decathlonData, setDecathlonData] = useState([
    { barcode: '', model: '' },
  ]);

  // Confirmation dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await masterDataService.getCountries();
      setCountries(response.data);
    } catch (err) {
      setError('Failed to load countries');
    }
  };

  const handleCountryChange = async (countryId) => {
    setFormData({
      ...formData,
      country_id: countryId,
      brand_id: '',
      business_unit_id: '',
      supplier_id: '',
    });
    setBrands([]);
    setBusinessUnits([]);
    setSuppliers([]);

    if (countryId) {
      try {
        const response = await masterDataService.getBrandsByCountry(countryId);
        setBrands(response.data);
      } catch (err) {
        setError('Failed to load brands');
      }
    }
  };

  const handleBrandChange = async (brandId) => {
    setFormData({
      ...formData,
      brand_id: brandId,
      business_unit_id: '',
      supplier_id: '',
    });
    setBusinessUnits([]);
    setSuppliers([]);

    if (brandId && formData.country_id) {
      try {
        const response = await masterDataService.getBusinessUnits(formData.country_id, brandId);
        setBusinessUnits(response.data);
      } catch (err) {
        setError('Failed to load business units');
      }
    }
  };

  const handleBusinessUnitChange = (businessUnitId) => {
    setFormData({ ...formData, business_unit_id: businessUnitId });
  };

  const handleSupplierChange = async (countryId, brandId) => {
    if (countryId && brandId) {
      try {
        const response = await masterDataService.getSuppliers(countryId, brandId);
        setSuppliers(response.data);
      } catch (err) {
        setError('Failed to load suppliers');
      }
    }
  };

  useEffect(() => {
    if (formData.country_id && formData.brand_id) {
      handleSupplierChange(formData.country_id, formData.brand_id);
    }
  }, [formData.country_id, formData.brand_id]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleDecathlonDataChange = (index, field, value) => {
    const newData = [...decathlonData];
    newData[index][field] = value;
    setDecathlonData(newData);
  };

  const addDecathlonRow = () => {
    setDecathlonData([...decathlonData, { barcode: '', model: '' }]);
  };

  const handleClearAllData = () => {
    setDecathlonData([{ barcode: '', model: '' }]);
    setShowClearConfirm(false);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const rows = text.split('\n').filter((row) => row.trim());

    const newData = [];
    rows.forEach((row) => {
      const [barcode, model] = row.split('\t');
      if (barcode && model) {
        newData.push({ barcode: barcode.trim(), model: model.trim() });
      }
    });

    if (newData.length > 0) {
      setDecathlonData(newData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.country_id || !formData.brand_id || !formData.business_unit_id || !formData.supplier_id) {
      setError('Please fill in all dropdown fields');
      return;
    }

    if (!formData.invoice_file || !formData.supporting_file) {
      setError('Please upload both invoice and supporting files');
      return;
    }

    setLoading(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append('country_id', formData.country_id);
      submitFormData.append('brand_id', formData.brand_id);
      submitFormData.append('business_unit_id', formData.business_unit_id);
      submitFormData.append('supplier_id', formData.supplier_id);
      submitFormData.append('invoice_file', formData.invoice_file);
      submitFormData.append('supporting_file', formData.supporting_file);
      submitFormData.append('decathlon_data', JSON.stringify(decathlonData));

      const response = await invoiceService.uploadInvoice(submitFormData);
      navigate(`/invoices/${response.data.invoice_id}/preview`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedBrand = brands.find((b) => b.id === parseInt(formData.brand_id));

  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-4 rounded-full animate-spin border-t-primary"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">Processing Invoice...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we process your invoice</p>
          </div>
        </div>
      )}
      <Navbar />

      <main className="container-max py-8">
        <h1 className="text-3xl font-bold mb-12 text-gray-700">Upload Invoice</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selection Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SearchableSelect
                  options={countries}
                  value={formData.country_id}
                  onChange={handleCountryChange}
                  placeholder="Select Country"
                  label="Country *"
                  optionLabelKey="name"
                  optionValueKey="id"
                />
              </div>

              <div>
                <SearchableSelect
                  options={brands}
                  value={formData.brand_id}
                  onChange={handleBrandChange}
                  placeholder="Select Brand"
                  label="Brand *"
                  disabled={!formData.country_id}
                  optionLabelKey="name"
                  optionValueKey="id"
                />
              </div>

              <div>
                <SearchableSelect
                  options={businessUnits}
                  value={formData.business_unit_id}
                  onChange={handleBusinessUnitChange}
                  placeholder="Select Business Unit"
                  label="Business Unit *"
                  disabled={!formData.brand_id}
                  optionLabelKey="name"
                  optionValueKey="id"
                />
              </div>

              <div>
                <SearchableSelect
                  options={suppliers}
                  value={formData.supplier_id}
                  onChange={(val) => setFormData({ ...formData, supplier_id: val })}
                  placeholder="Select Supplier"
                  label="Supplier *"
                  disabled={!formData.country_id || !formData.brand_id}
                  optionLabelKey="name"
                  optionValueKey="id"
                />
              </div>
            </div>
          </div>

          {/* Decathlon Products */}
          {selectedBrand?.name?.includes('Decathlon') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-700">
                    Product Details
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Enter barcode and model information. You can paste data from Excel (Barcode | Model).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition font-medium"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              </div>

              <div className="overflow-x-auto mt-6" onPaste={handlePaste}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Barcode
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Model
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {decathlonData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.barcode}
                            onChange={(e) =>
                              handleDecathlonDataChange(
                                index,
                                'barcode',
                                e.target.value
                              )
                            }
                            onPaste={(e) => {
                              e.preventDefault();
                              const text = e.clipboardData.getData('text');
                              const barcodes = text.split('\n').map((line) => line.trim()).filter((line) => line);

                              if (barcodes.length === 0) return;

                              // Check if pasting multiple barcodes or tab-separated (barcode\tmodel)
                              const hasModel = barcodes[0].includes('\t');

                              if (hasModel) {
                                // Tab-separated: barcode\tmodel
                                const newData = [];
                                barcodes.forEach((row) => {
                                  const [barcode, model] = row.split('\t');
                                  if (barcode) {
                                    newData.push({ barcode: barcode.trim(), model: model ? model.trim() : '' });
                                  }
                                });
                                if (newData.length > 0) {
                                  setDecathlonData(newData);
                                }
                              } else {
                                // Just barcodes - fill starting from current row
                                const newData = [...decathlonData];
                                let currentIndex = index;

                                barcodes.forEach((barcode) => {
                                  if (currentIndex < newData.length) {
                                    newData[currentIndex].barcode = barcode;
                                  } else {
                                    newData.push({ barcode, model: '' });
                                  }
                                  currentIndex++;
                                });

                                setDecathlonData(newData);
                              }
                            }}
                            placeholder="e.g., 12345678 (paste barcodes or barcode|model)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.model}
                            onChange={(e) =>
                              handleDecathlonDataChange(index, 'model', e.target.value)
                            }
                            onPaste={(e) => {
                              e.preventDefault();
                              const text = e.clipboardData.getData('text');
                              const models = text.split('\n').map((line) => line.trim()).filter((line) => line);

                              if (models.length === 0) return;

                              // Check if pasting tab-separated (model\tbarcode) - reverse order
                              const hasBarcode = models[0].includes('\t');

                              if (hasBarcode) {
                                // Tab-separated: could be model\tbarcode or barcode\tmodel
                                const newData = [];
                                models.forEach((row) => {
                                  const parts = row.split('\t');
                                  if (parts.length === 2) {
                                    // Assume first is model, second is barcode (since pasting from model column)
                                    newData.push({ barcode: parts[1].trim(), model: parts[0].trim() });
                                  } else if (parts.length === 1) {
                                    newData.push({ barcode: '', model: parts[0].trim() });
                                  }
                                });
                                if (newData.length > 0) {
                                  setDecathlonData(newData);
                                }
                              } else {
                                // Just models - fill starting from current row
                                const newData = [...decathlonData];
                                let currentIndex = index;

                                models.forEach((model) => {
                                  if (currentIndex < newData.length) {
                                    newData[currentIndex].model = model;
                                  } else {
                                    newData.push({ barcode: '', model });
                                  }
                                  currentIndex++;
                                });

                                setDecathlonData(newData);
                              }
                            }}
                            placeholder="e.g., SKU-001 (paste models)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1"
                            style={{ '--tw-ring-color': '#91c541' }}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const newData = decathlonData.filter((_, i) => i !== index);
                              setDecathlonData(newData.length === 0 ? [{ barcode: '', model: '' }] : newData);
                            }}
                            className="text-xs font-medium px-3 py-1 rounded-lg transition text-gray-700 bg-gray-100 hover:bg-gray-200"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addDecathlonRow}
                className="mt-6 text-sm font-medium px-4 py-2 rounded-lg transition text-white bg-primary hover:opacity-90"
              >
                + Add Row
              </button>
            </div>
          )}

          {/* File Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-semibold mb-6 text-gray-700">
              Upload Files
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-3 text-gray-700">
                  Invoice File (PDF or Image) *
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition cursor-pointer bg-gray-50 hover:border-primary hover:bg-blue-50/20"
                >
                  <input
                    type="file"
                    name="invoice_file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id="invoice-file"
                  />
                  <label htmlFor="invoice-file" className="cursor-pointer block">
                    <Upload className="mx-auto mb-2 text-primary" size={24} />
                    <p className="text-gray-700 font-medium">
                      {formData.invoice_file
                        ? formData.invoice_file.name
                        : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-3 text-gray-700">
                  Supporting Excel File *
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition cursor-pointer bg-gray-50 hover:border-primary hover:bg-blue-50/20"
                >
                  <input
                    type="file"
                    name="supporting_file"
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                    className="hidden"
                    id="supporting-file"
                  />
                  <label htmlFor="supporting-file" className="cursor-pointer block">
                    <Upload className="mx-auto mb-2 text-primary" size={24} />
                    <p className="text-gray-700 font-medium">
                      {formData.supporting_file
                        ? formData.supporting_file.name
                        : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">XLSX, XLS</p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="px-6 py-3 border border-gray-300 font-medium rounded-lg transition text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 bg-primary hover:opacity-90"
            >
              {loading ? 'Processing...' : 'Process Invoice'}
            </button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showClearConfirm}
          title="Clear All Data?"
          message="Are you sure you want to remove all barcodes and models? This action cannot be undone."
          confirmText="Clear All"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleClearAllData}
          onCancel={() => setShowClearConfirm(false)}
        />
      </main>
    </div>
  );
};
