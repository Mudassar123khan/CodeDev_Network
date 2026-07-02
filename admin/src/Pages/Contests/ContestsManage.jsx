import React, { useState, useEffect, useContext } from 'react';
import { getAllContests, deleteContest, createContest, updateContest, getAllProblems, getContestBySlug } from '../../api/admin.api';
import { Context } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../Manage.css';

export default function ContestsManage() {
  const { url, token } = useContext(Context);
  const [contests, setContests] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  // Date values for input fields need to be styled "YYYY-MM-DDTHH:mm" for datetime-local
  const [formData, setFormData] = useState({
    id: '', title: '', slug: '', startTime: '', endTime: '', problemSlugs: ''
  });

  useEffect(() => {
    fetchContests();
    fetchProblems();
  }, [url, token]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const res = await getAllContests(url, token);
      if (res.data.success) {
        setContests(res.data.contests);
      }
    } catch {
      toast.error("Failed to fetch contests");
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await getAllProblems(url);
      setAllProblems(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch problems", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contest?")) return;
    try {
      const res = await deleteContest(url, token, id);
      if (res.data.success) {
        toast.success("Contest deleted successfully!");
        fetchContests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete contest");
    }
  };

  const toInputDateStr = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const pad = (num) => String(num).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setFormData({ id: '', title: '', slug: '', startTime: '', endTime: '', problemSlugs: '' });
    setShowModal(true);
  };

  const openEditModal = async (contest) => {
    setIsEdit(true);
    setFormData({
      id: contest._id,
      title: contest.title || '',
      slug: contest.slug || '',
      startTime: toInputDateStr(contest.startTime),
      endTime: toInputDateStr(contest.endTime),
      problemSlugs: 'Loading...'
    });
    setShowModal(true);

    try {
      const res = await getContestBySlug(url, token, contest.slug);
      if (res.data.success) {
        const fullContest = res.data.contest;
        const slugs = fullContest.problems.map(p => p.problemId?.slug || p.problemId).filter(Boolean).join(', ');
        setFormData(prev => ({
          ...prev,
          problemSlugs: slugs
        }));
      } else {
        setFormData(prev => ({ ...prev, problemSlugs: '' }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contest problems");
      setFormData(prev => ({ ...prev, problemSlugs: '' }));
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.problemSlugs === 'Loading...') {
      return toast.error("Please wait for contest problems to load.");
    }

    try {
      const slugs = formData.problemSlugs
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const parsedProblems = [];
      for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i];
        const problem = allProblems.find(p => p.slug.toLowerCase() === slug.toLowerCase());
        if (!problem) {
          return toast.error(`Problem slug "${slug}" not found in database!`);
        }
        parsedProblems.push({
          problemId: problem._id,
          order: i + 1,
          points: 100 // default points
        });
      }

      if (!isEdit && parsedProblems.length === 0) {
          return toast.error("At least one problem is required to create a contest.");
      }

      const submitData = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        problems: parsedProblems
      };

      if (isEdit) {
        const res = await updateContest(url, token, formData.id, submitData);
        if (res.data.success) toast.success("Contest updated!");
      } else {
        const res = await createContest(url, token, submitData);
        if (res.data.success) toast.success("Contest created!");
      }
      setShowModal(false);
      fetchContests();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} contest`);
    }
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Contests</h2>
        <button className="primary-btn" onClick={openCreateModal}>+ Add Contest</button>
      </div>

      {loading ? (
        <p>Loading contests...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((contest) => (
                <tr key={contest._id}>
                  <td>{contest.title}</td>
                  <td>
                    <span className={`badge ${contest.status === 'upcoming' ? 'admin' : 'user'}`}>
                      {contest.status}
                    </span>
                  </td>
                  <td>{new Date(contest.startTime).toLocaleString()}</td>
                  <td>{new Date(contest.endTime).toLocaleString()}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => openEditModal(contest)}>Edit</button>
                    <button className="action-btn delete" onClick={() => handleDelete(contest._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {contests.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No contests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{isEdit ? 'Edit Contest' : 'Create Contest'}</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Slug (Unique URL identifier)</label>
                <input type="text" name="slug" value={formData.slug} onChange={handleFormChange} placeholder="e.g. weekly-contest-1 (auto-generated if empty)" />
              </div>
              
              <div className="form-group">
                <label>Start Time</label>
                <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleFormChange} required />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleFormChange} required />
              </div>
              
              <div className="form-group">
                <label>Problems (List of slugs separated by commas or newlines)</label>
                {!isEdit && <p style={{fontSize: '11px', color: '#888', marginBottom: '4px'}}>Mandatory for creation.</p>}
                <textarea 
                  rows="4" 
                  name="problemSlugs" 
                  value={formData.problemSlugs} 
                  onChange={handleFormChange} 
                  placeholder="e.g. two-sum, add-two-numbers"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{isEdit ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
