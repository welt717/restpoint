import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';

// ─── Chemical Module ──────────────────────────────────────────────────────
// Full chemical inventory + per-deceased usage tracking
// ───────────────────────────────────────────────────────────────────────────

export default function ChemicalsPage() {
  const [view, setView] = useState('dashboard'); // dashboard | inventory | usage | add | edit
  const [chemicals, setChemicals] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [deceasedList, setDeceasedList] = useState([]);
  const [usageReport, setUsageReport] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '', category: 'embalming', unit: 'liters',
    current_stock: 0, min_stock_level: 0, unit_cost: 0,
    supplier: '', batch_number: '', expiry_date: '', notes: ''
  });

  // Usage form
  const [usageForm, setUsageForm] = useState({
    deceased_id: '', chemical_id: '', quantity_used: '', usage_notes: ''
  });

  // Stock receive/adjust
  const [stockForm, setStockForm] = useState({ quantity: '', notes: '' });
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState('receive');

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ─── API Calls ──────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    setLoading(true); clearMessages();
    try {
      const res = await api.get(ENDPOINTS.CHEMICALS.DASHBOARD);
      setDashboard(res.data.data);
    } catch (e) { setError('Failed to load dashboard'); }
    setLoading(false);
  }, []);

  const fetchChemicals = useCallback(async () => {
    setLoading(true); clearMessages();
    try {
      const params = search ? { search } : {};
      const res = await api.get(ENDPOINTS.CHEMICALS.LIST, { params });
      setChemicals(res.data.data || []);
    } catch (e) { setError('Failed to load chemicals'); }
    setLoading(false);
  }, [search]);

  const fetchLowStock = useCallback(async () => {
    try {
      const res = await api.get(ENDPOINTS.CHEMICALS.LOW_STOCK);
      setLowStock(res.data.data || []);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchDeceased = useCallback(async () => {
    try {
      const res = await api.get(ENDPOINTS.DECEASED.LIST);
      setDeceasedList(res.data.data || res.data || []);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchUsageReport = useCallback(async () => {
    setLoading(true); clearMessages();
    try {
      const res = await api.get(ENDPOINTS.CHEMICALS.USAGE_REPORT);
      setUsageReport(res.data.data || []);
    } catch (e) { setError('Failed to load usage report'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchLowStock();
    fetchDeceased();
  }, [fetchDashboard, fetchLowStock, fetchDeceased]);

  // ─── CRUD ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault(); clearMessages();
    if (!form.name) return setError('Chemical name is required');
    setLoading(true);
    try {
      if (selectedChemical) {
        await api.put(ENDPOINTS.CHEMICALS.UPDATE(selectedChemical.id), form);
        setSuccess('Chemical updated');
      } else {
        await api.post(ENDPOINTS.CHEMICALS.CREATE, form);
        setSuccess('Chemical created');
      }
      setForm({ name: '', category: 'embalming', unit: 'liters', current_stock: 0, min_stock_level: 0, unit_cost: 0, supplier: '', batch_number: '', expiry_date: '', notes: '' });
      setSelectedChemical(null);
      setView('inventory');
      fetchChemicals();
    } catch (e) { setError(e.response?.data?.message || 'Operation failed'); }
    setLoading(false);
  };

  const handleEdit = (chem) => {
    setSelectedChemical(chem);
    setForm({
      name: chem.name, category: chem.category, unit: chem.unit,
      current_stock: chem.current_stock, min_stock_level: chem.min_stock_level,
      unit_cost: chem.unit_cost, supplier: chem.supplier || '',
      batch_number: chem.batch_number || '', expiry_date: chem.expiry_date?.split('T')[0] || '',
      notes: chem.notes || ''
    });
    setView('add');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this chemical?')) return;
    try {
      await api.delete(ENDPOINTS.CHEMICALS.DELETE(id));
      setSuccess('Chemical removed');
      fetchChemicals();
    } catch (e) { setError('Failed to remove'); }
  };

  // ─── Stock Actions ──────────────────────────────────────────────────────

  const openStockModal = (chem, action) => {
    setSelectedChemical(chem);
    setStockAction(action);
    setStockForm({ quantity: '', notes: '' });
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault(); clearMessages();
    if (!stockForm.quantity || parseFloat(stockForm.quantity) <= 0)
      return setError('Valid quantity required');
    setLoading(true);
    try {
      const endpoint = stockAction === 'receive'
        ? ENDPOINTS.CHEMICALS.RECEIVE(selectedChemical.id)
        : ENDPOINTS.CHEMICALS.ADJUST(selectedChemical.id);
      const payload = stockAction === 'receive'
        ? { quantity: stockForm.quantity, notes: stockForm.notes }
        : { new_quantity: stockForm.quantity, reason: stockForm.notes };

      await api.post(endpoint, payload);
      setSuccess(`Stock ${stockAction === 'receive' ? 'received' : 'adjusted'}`);
      setShowStockModal(false);
      fetchChemicals();
      fetchDashboard();
      fetchLowStock();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  // ─── Usage ──────────────────────────────────────────────────────────────

  const handleUsageSubmit = async (e) => {
    e.preventDefault(); clearMessages();
    if (!usageForm.deceased_id || !usageForm.chemical_id || !usageForm.quantity_used)
      return setError('All fields required');
    if (parseFloat(usageForm.quantity_used) <= 0)
      return setError('Quantity must be positive');
    setLoading(true);
    try {
      const res = await api.post(ENDPOINTS.CHEMICALS.USAGE, usageForm);
      setSuccess(res.data.message);
      setUsageForm({ deceased_id: '', chemical_id: '', quantity_used: '', usage_notes: '' });
      fetchChemicals();
      fetchDashboard();
    } catch (e) { setError(e.response?.data?.message || 'Usage failed'); }
    setLoading(false);
  };

  // ─── View: Dashboard ────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center">
              <h6>Total Chemicals</h6>
              <h2>{dashboard?.total_chemicals || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white h-100">
            <div className="card-body text-center">
              <h6>Low Stock</h6>
              <h2>{dashboard?.low_stock_count || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body text-center">
              <h6>Used (30 days)</h6>
              <h2>{dashboard?.total_usage_30d || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body text-center">
              <h6>Alerts</h6>
              <h2>{lowStock.length}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Top Used Chemicals */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header"><strong>Top Used Chemicals (30 days)</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Chemical</th><th>Unit</th><th>Used</th></tr></thead>
                <tbody>
                  {(dashboard?.top_used_chemicals || []).map(c => (
                    <tr key={c.id}><td>{c.name}</td><td>{c.unit}</td><td>{c.total_used}</td></tr>
                  ))}
                  {(!dashboard?.top_used_chemicals || dashboard.top_used_chemicals.length === 0) &&
                    <tr><td colSpan={3} className="text-muted text-center">No usage data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header text-danger"><strong>⚠ Low Stock Alerts</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Chemical</th><th>Stock</th><th>Min</th><th>Status</th></tr></thead>
                <tbody>
                  {lowStock.map(c => (
                    <tr key={c.id} className="table-danger">
                      <td>{c.name}</td>
                      <td>{c.current_stock}</td>
                      <td>{c.min_stock_level}</td>
                      <td><span className="badge bg-danger">Reorder</span></td>
                    </tr>
                  ))}
                  {lowStock.length === 0 &&
                    <tr><td colSpan={4} className="text-success text-center">✓ All stocked up</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="col-12">
          <div className="card">
            <div className="card-header"><strong>Recent Transactions</strong></div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Date</th><th>Chemical</th><th>Type</th><th>Qty</th><th>Stock Before</th><th>After</th></tr></thead>
                <tbody>
                  {(dashboard?.recent_transactions || []).map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>{t.chemical_name}</td>
                      <td><span className={`badge bg-${t.transaction_type === 'received' ? 'success' : t.transaction_type === 'consumed' ? 'danger' : 'warning'}`}>{t.transaction_type}</span></td>
                      <td>{t.quantity} {t.unit}</td>
                      <td>{t.previous_stock}</td>
                      <td>{t.new_stock}</td>
                    </tr>
                  ))}
                  {(!dashboard?.recent_transactions || dashboard.recent_transactions.length === 0) &&
                    <tr><td colSpan={6} className="text-muted text-center">No transactions</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── View: Inventory ────────────────────────────────────────────────────

  const renderInventory = () => (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <input className="form-control w-25" placeholder="Search chemicals..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => { setSelectedChemical(null); setForm({ name: '', category: 'embalming', unit: 'liters', current_stock: 0, min_stock_level: 0, unit_cost: 0, supplier: '', batch_number: '', expiry_date: '', notes: '' }); setView('add'); }}>
          + Add Chemical
        </button>
      </div>
      <div className="card">
        <div className="card-body p-0">
          <table className="table table-striped mb-0">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Unit</th><th>In Stock</th><th>Min Level</th><th>Cost</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {chemicals.map(c => (
                <tr key={c.id} className={c.current_stock <= c.min_stock_level ? 'table-danger' : ''}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.category}</td>
                  <td>{c.unit}</td>
                  <td>{c.current_stock}</td>
                  <td>{c.min_stock_level}</td>
                  <td>KSh {parseFloat(c.unit_cost || 0).toLocaleString()}</td>
                  <td>
                    {c.is_low_stock || c.current_stock <= c.min_stock_level
                      ? <span className="badge bg-danger">Low</span>
                      : <span className="badge bg-success">OK</span>}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(c)}>Edit</button>
                    <button className="btn btn-sm btn-outline-success me-1" onClick={() => openStockModal(c, 'receive')}>+Stock</button>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openStockModal(c, 'adjust')}>Adjust</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {chemicals.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No chemicals found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ─── View: Add/Edit Form ────────────────────────────────────────────────

  const renderForm = () => (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header">
            <strong>{selectedChemical ? 'Edit Chemical' : 'Add New Chemical'}</strong>
            <button className="btn btn-sm btn-outline-secondary float-end" onClick={() => setView('inventory')}>Back</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="embalming">Embalming</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="preservation">Preservation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option value="liters">Liters</option>
                    <option value="ml">Milliliters</option>
                    <option value="kg">Kilograms</option>
                    <option value="grams">Grams</option>
                    <option value="pieces">Pieces</option>
                    <option value="bottles">Bottles</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Initial Stock</label>
                  <input type="number" step="0.01" className="form-control" value={form.current_stock}
                    onChange={e => setForm({...form, current_stock: e.target.value})}
                    disabled={selectedChemical} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Min Stock Level</label>
                  <input type="number" step="0.01" className="form-control" value={form.min_stock_level}
                    onChange={e => setForm({...form, min_stock_level: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Unit Cost (KSh)</label>
                  <input type="number" step="0.01" className="form-control" value={form.unit_cost}
                    onChange={e => setForm({...form, unit_cost: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Supplier</label>
                  <input className="form-control" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Batch #</label>
                  <input className="form-control" value={form.batch_number} onChange={e => setForm({...form, batch_number: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Expiry Date</label>
                  <input type="date" className="form-control" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
                {loading ? 'Saving...' : selectedChemical ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── View: Usage ────────────────────────────────────────────────────────

  const renderUsage = () => (
    <div className="row g-3">
      <div className="col-md-5">
        <div className="card">
          <div className="card-header"><strong>Record Chemical Usage</strong></div>
          <div className="card-body">
            <form onSubmit={handleUsageSubmit}>
              <div className="mb-3">
                <label className="form-label">Deceased</label>
                <select className="form-select" value={usageForm.deceased_id}
                  onChange={e => setUsageForm({...usageForm, deceased_id: e.target.value})} required>
                  <option value="">-- Select Deceased --</option>
                  {(Array.isArray(deceasedList) ? deceasedList : []).map(d => (
                    <option key={d.deceased_id || d.id} value={d.deceased_id || d.id}>
                      {d.full_name} {d.date_of_death ? `(${new Date(d.date_of_death).toLocaleDateString()})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Chemical</label>
                <select className="form-select" value={usageForm.chemical_id}
                  onChange={e => setUsageForm({...usageForm, chemical_id: e.target.value})} required>
                  <option value="">-- Select Chemical --</option>
                  {chemicals.filter(c => c.current_stock > 0).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Stock: {c.current_stock} {c.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Quantity Used</label>
                <input type="number" step="0.01" className="form-control" value={usageForm.quantity_used}
                  onChange={e => setUsageForm({...usageForm, quantity_used: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="2" value={usageForm.usage_notes}
                  onChange={e => setUsageForm({...usageForm, usage_notes: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Recording...' : 'Record Usage & Deduct Stock'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-md-7">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <strong>Usage Report</strong>
            <button className="btn btn-sm btn-outline-primary" onClick={() => { fetchUsageReport(); fetchChemicals(); }}>Refresh</button>
          </div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead><tr><th>Date</th><th>Deceased</th><th>Chemical</th><th>Qty</th><th>Notes</th></tr></thead>
              <tbody>
                {usageReport.map(u => (
                  <tr key={u.id}>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>{u.deceased_name || `#${u.deceased_id}`}</td>
                    <td>{u.chemical_name}</td>
                    <td>{u.quantity_used} {u.unit}</td>
                    <td className="text-muted">{u.usage_notes || '-'}</td>
                  </tr>
                ))}
                {usageReport.length === 0 &&
                  <tr><td colSpan={5} className="text-center text-muted py-3">No usage recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Stock Modal ────────────────────────────────────────────────────────

  const renderStockModal = () => showStockModal ? (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {stockAction === 'receive' ? 'Receive Stock' : 'Adjust Stock'} — {selectedChemical?.name}
            </h5>
            <button className="btn-close" onClick={() => setShowStockModal(false)}></button>
          </div>
          <form onSubmit={handleStockSubmit}>
            <div className="modal-body">
              <p>Current stock: <strong>{selectedChemical?.current_stock} {selectedChemical?.unit}</strong></p>
              <div className="mb-3">
                <label className="form-label">
                  {stockAction === 'receive' ? 'Quantity to Add' : 'New Quantity'}
                </label>
                <input type="number" step="0.01" className="form-control"
                  value={stockForm.quantity}
                  onChange={e => setStockForm({...stockForm, quantity: e.target.value})}
                  required />
              </div>
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="2" value={stockForm.notes}
                  onChange={e => setStockForm({...stockForm, notes: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Processing...' : stockAction === 'receive' ? 'Receive' : 'Adjust'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <div className="container-fluid py-4">
      {/* Messages */}
      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">{error}
        <button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success alert-dismissible fade show" role="alert">{success}
        <button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}

      {/* Navigation tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setView('dashboard'); fetchDashboard(); fetchLowStock(); }}>
            📊 Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${view === 'inventory' ? 'active' : ''}`}
            onClick={() => { setView('inventory'); fetchChemicals(); }}>
            🧪 Inventory
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${view === 'usage' ? 'active' : ''}`}
            onClick={() => { setView('usage'); fetchChemicals(); fetchUsageReport(); }}>
            💉 Usage
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${view === 'add' ? 'active' : ''}`}
            onClick={() => { setSelectedChemical(null); setForm({ name: '', category: 'embalming', unit: 'liters', current_stock: 0, min_stock_level: 0, unit_cost: 0, supplier: '', batch_number: '', expiry_date: '', notes: '' }); setView('add'); }}>
            ➕ {selectedChemical ? 'Edit' : 'Add'}
          </button>
        </li>
      </ul>

      {loading && <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}

      {!loading && view === 'dashboard' && renderDashboard()}
      {!loading && view === 'inventory' && renderInventory()}
      {!loading && view === 'add' && renderForm()}
      {!loading && view === 'usage' && renderUsage()}

      {renderStockModal()}
    </div>
  );
}