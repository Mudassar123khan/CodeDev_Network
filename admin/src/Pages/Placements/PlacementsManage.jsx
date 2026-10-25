import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  getAllPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
  updatePlacementMeta,
  recalculatePlacement,
} from '../../api/admin.api';
import { Context } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../Manage.css';

const initialForm = {
  branch: '',
  shortName: '',
  program: 'B.Tech',
  totalStudents: '',
  studentsPlaced: 0,
  totalOffers: 0,
  minPackage: '',
  maxPackage: '',
  medianPackage: '',
  averagePackage: '',
  order: 0,
  isOverall: false,
};

export default function PlacementsManage() {
  const { url, token } = useContext(Context);
  const [stats, setStats] = useState([]);
  const [meta, setMeta] = useState({ companiesCovered: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Record Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [savingRecord, setSavingRecord] = useState(false);

  // Meta Modal State
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metaCompanies, setMetaCompanies] = useState('');
  const [metaNotes, setMetaNotes] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  // Recalculating state
  const [recalculating, setRecalculating] = useState(false);

  // Fetch placement stats & meta
  const fetchPlacements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPlacements(url, token);
      if (res.data.success) {
        setStats(res.data.data.stats || []);
        if (res.data.data.meta) {
          setMeta(res.data.data.meta);
          setMetaCompanies((res.data.data.meta.companiesCovered || []).join(', '));
          setMetaNotes((res.data.data.meta.notes || []).join('\n'));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch placement statistics');
    } finally {
      setLoading(false);
    }
  }, [url, token]);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  // Open Create Modal
  const openCreateModal = () => {
    setIsEdit(false);
    setEditingId(null);
    setFormData({
      ...initialForm,
      order: stats.length + 1,
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (stat) => {
    setIsEdit(true);
    setEditingId(stat._id);
    setFormData({
      branch: stat.branch || '',
      shortName: stat.shortName || '',
      program: stat.program || 'B.Tech',
      totalStudents: stat.totalStudents ?? '',
      studentsPlaced: stat.studentsPlaced ?? 0,
      totalOffers: stat.totalOffers ?? 0,
      minPackage: stat.minPackage ?? '',
      maxPackage: stat.maxPackage ?? '',
      medianPackage: stat.medianPackage ?? '',
      averagePackage: stat.averagePackage ?? '',
      order: stat.order ?? 0,
      isOverall: Boolean(stat.isOverall),
    });
    setShowModal(true);
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Submit Record Save
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch.trim()) {
      toast.warning('Branch name is required');
      return;
    }

    try {
      setSavingRecord(true);
      if (isEdit && editingId) {
        const res = await updatePlacement(url, token, editingId, formData);
        if (res.data.success) {
          toast.success('Placement record updated successfully!');
          setShowModal(false);
          fetchPlacements();
        }
      } else {
        const res = await createPlacement(url, token, formData);
        if (res.data.success) {
          toast.success('New placement record created successfully!');
          setShowModal(false);
          fetchPlacements();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save placement record');
    } finally {
      setSavingRecord(false);
    }
  };

  // Delete Record
  const handleDelete = async (id, branchName) => {
    if (!window.confirm(`Are you sure you want to delete the record for "${branchName}"?`)) return;
    try {
      const res = await deletePlacement(url, token, id);
      if (res.data.success) {
        toast.success(`"${branchName}" deleted successfully`);
        fetchPlacements();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete placement record');
    }
  };

  // Submit Meta Save
  const handleMetaSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingMeta(true);
      const companies = metaCompanies
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const notes = metaNotes
        .split('\n')
        .map((n) => n.trim())
        .filter(Boolean);

      const res = await updatePlacementMeta(url, token, {
        program: 'B.Tech',
        companiesCovered: companies,
        notes,
      });

      if (res.data.success) {
        toast.success('Companies and notes updated successfully!');
        setMeta(res.data.data);
        setShowMetaModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update metadata');
    } finally {
      setSavingMeta(false);
    }
  };

  // Auto-calculate Overall Summary
  const handleRecalculate = async () => {
    if (
      !window.confirm(
        'Auto-calculate overall summary totals (offers, placed, packages) from all individual branches?'
      )
    )
      return;

    try {
      setRecalculating(true);
      const res = await recalculatePlacement(url, token, 'B.Tech');
      if (res.data.success) {
        toast.success('Overall summary recalculated and updated!');
        fetchPlacements();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to recalculate overall stats');
    } finally {
      setRecalculating(false);
    }
  };

  // Filtered stats by search
  const filteredStats = useMemo(() => {
    return stats.filter((s) => {
      const term = searchTerm.toLowerCase();
      return (
        s.branch.toLowerCase().includes(term) ||
        (s.shortName && s.shortName.toLowerCase().includes(term))
      );
    });
  }, [stats, searchTerm]);

  return (
    <div className="manage-container">
      {/* Header */}
      <div className="manage-header">
        <div>
          <h2>Manage Placement Statistics</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Add, update branch offers, student counts, and package statistics in database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="secondary-btn"
            onClick={handleRecalculate}
            disabled={recalculating}
            title="Auto-calculate overall numbers from branch records"
          >
            {recalculating ? 'Calculating...' : '⚡ Auto-Calculate Overall'}
          </button>

          <button
            className="secondary-btn"
            onClick={() => setShowMetaModal(true)}
          >
            ⚙ Companies & Notes
          </button>

          <button className="primary-btn" onClick={openCreateModal}>
            + Add Branch Record
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ maxWidth: '350px' }}>
        <input
          type="text"
          placeholder="Search branch name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Placements Table */}
      {loading ? (
        <p>Loading placement records...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Branch</th>
                <th>Short Name</th>
                <th>Type</th>
                <th>Total Students</th>
                <th>Students Placed</th>
                <th>Total Offers</th>
                <th>Min (LPA)</th>
                <th>Max (LPA)</th>
                <th>Median (LPA)</th>
                <th>Avg (LPA)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '24px' }}>
                    No placement records found.
                  </td>
                </tr>
              ) : (
                filteredStats.map((item) => (
                  <tr
                    key={item._id}
                    style={
                      item.isOverall
                        ? { backgroundColor: '#fffbeb', fontWeight: '500' }
                        : {}
                    }
                  >
                    <td>#{item.order ?? 0}</td>
                    <td>
                      <strong>{item.branch}</strong>
                    </td>
                    <td>{item.shortName || '—'}</td>
                    <td>
                      <span className={`badge ${item.isOverall ? 'admin' : 'user'}`}>
                        {item.isOverall ? 'Overall' : 'Branch'}
                      </span>
                    </td>
                    <td>
                      {item.totalStudents !== null &&
                      item.totalStudents !== undefined &&
                      item.totalStudents !== ''
                        ? item.totalStudents
                        : '—'}
                    </td>
                    <td style={{ color: '#16a34a', fontWeight: '600' }}>
                      {item.studentsPlaced ?? 0}
                    </td>
                    <td style={{ color: '#2563eb', fontWeight: '600' }}>
                      {item.totalOffers ?? 0}
                    </td>
                    <td>
                      {item.minPackage !== null && item.minPackage !== undefined
                        ? `₹${Number(item.minPackage).toFixed(2)}`
                        : '—'}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {item.maxPackage !== null && item.maxPackage !== undefined
                        ? `₹${Number(item.maxPackage).toFixed(2)}`
                        : '—'}
                    </td>
                    <td>
                      {item.medianPackage !== null && item.medianPackage !== undefined
                        ? `₹${Number(item.medianPackage).toFixed(2)}`
                        : '—'}
                    </td>
                    <td>
                      {item.averagePackage !== null && item.averagePackage !== undefined
                        ? `₹${Number(item.averagePackage).toFixed(2)}`
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="action-btn edit"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(item._id, item.branch)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Meta Preview Box */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: '0 0 10px', color: '#1e293b' }}>
            Current Placement Metadata
          </h4>
          <button
            className="secondary-btn"
            style={{ padding: '6px 12px', fontSize: '13px' }}
            onClick={() => setShowMetaModal(true)}
          >
            Edit Metadata
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
          <strong>Companies Covered: </strong>
          {meta.companiesCovered && meta.companiesCovered.length > 0
            ? meta.companiesCovered.join(', ')
            : 'None'}
        </div>
        <div style={{ fontSize: '14px', color: '#475569' }}>
          <strong>Official Notes:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
            {meta.notes && meta.notes.length > 0 ? (
              meta.notes.map((note, idx) => <li key={idx}>{note}</li>)
            ) : (
              <li>None</li>
            )}
          </ul>
        </div>
      </div>

      {/* =========================================================
          ADD / EDIT MODAL
          ========================================================= */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{isEdit ? 'Edit Placement Record' : 'Add Placement Record'}</h3>

            <form onSubmit={handleRecordSubmit} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Branch Name *</label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    placeholder="e.g. Computer Engineering"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Short Name</label>
                  <input
                    type="text"
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleChange}
                    placeholder="e.g. Computer"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Program</label>
                  <input
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    placeholder="B.Tech"
                  />
                </div>

                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isOverall"
                  name="isOverall"
                  checked={formData.isOverall}
                  onChange={handleChange}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="isOverall" style={{ cursor: 'pointer', margin: 0 }}>
                  Is this the Overall / Summary row?
                </label>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Total Students (empty if unknown)</label>
                  <input
                    type="number"
                    name="totalStudents"
                    value={formData.totalStudents}
                    onChange={handleChange}
                    placeholder="e.g. 88"
                  />
                </div>

                <div className="form-group">
                  <label>Students Placed *</label>
                  <input
                    type="number"
                    name="studentsPlaced"
                    value={formData.studentsPlaced}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Offers *</label>
                  <input
                    type="number"
                    name="totalOffers"
                    value={formData.totalOffers}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Min Package (LPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="minPackage"
                    value={formData.minPackage}
                    onChange={handleChange}
                    placeholder="e.g. 3.60"
                  />
                </div>

                <div className="form-group">
                  <label>Max Package (LPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="maxPackage"
                    value={formData.maxPackage}
                    onChange={handleChange}
                    placeholder="e.g. 35.00"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Median Package (LPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="medianPackage"
                    value={formData.medianPackage}
                    onChange={handleChange}
                    placeholder="e.g. 8.50"
                  />
                </div>

                <div className="form-group">
                  <label>Average Package (LPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="averagePackage"
                    value={formData.averagePackage}
                    onChange={handleChange}
                    placeholder="e.g. 10.35"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={savingRecord}
                >
                  {savingRecord ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          COMPANIES & NOTES MODAL
          ========================================================= */}
      {showMetaModal && (
        <div className="modal-overlay" onClick={() => setShowMetaModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: '550px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit Companies & Notes</h3>

            <form onSubmit={handleMetaSubmit} className="modal-form">
              <div className="form-group">
                <label>Companies Covered (comma-separated)</label>
                <textarea
                  rows={3}
                  value={metaCompanies}
                  onChange={(e) => setMetaCompanies(e.target.value)}
                  placeholder="Accenture, TCS, EPAM, IDFC First Bank, Juspay, Visa"
                />
              </div>

              <div className="form-group">
                <label>Official Notes / Disclaimers (one per line)</label>
                <textarea
                  rows={4}
                  value={metaNotes}
                  onChange={(e) => setMetaNotes(e.target.value)}
                  placeholder="This data is not official and has been collected from various sources&#10;We are not responsible for any misinterpretation of this data"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowMetaModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={savingMeta}
                >
                  {savingMeta ? 'Saving...' : 'Save Metadata'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
