import React, { useState, useEffect, useContext } from 'react';
import { getAllProblems, deleteProblem, createProblem, updateProblem } from '../../api/admin.api';
import { Context } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../Manage.css';

export default function ProblemsManage() {
  const { url, token } = useContext(Context);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '', title: '', description: '', difficulty: 'easy', tags: '', constraints: '', slug: '', testCasesJson: '[]', isContestProblem: false
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await getAllProblems(url);
      if (res.data.success) {
        setProblems(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch problems");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) return;
    try {
      const res = await deleteProblem(url, token, id);
      if (res.data.success) {
        toast.success("Problem deleted successfully!");
        fetchProblems();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete problem");
    }
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setFormData({ id: '', title: '', description: '', difficulty: 'easy', tags: '', constraints: '', slug: '', testCasesJson: '[]', isContestProblem: false });
    setShowModal(true);
  };

  const openEditModal = (problem) => {
    setIsEdit(true);
    setFormData({
      id: problem._id,
      title: problem.title || '',
      description: problem.description || '',
      difficulty: problem.difficulty || 'easy',
      tags: problem.tags ? problem.tags.join(', ') : '',
      constraints: problem.constraints || '',
      slug: problem.slug || '',
      testCasesJson: problem.testCases ? JSON.stringify(problem.testCases, null, 2) : '[]',
      isContestProblem: problem.isContestProblem || false
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let parsedTestCases = [];
      try {
        parsedTestCases = JSON.parse(formData.testCasesJson);
      } catch (err) {
        return toast.error("Invalid JSON format for Test Cases");
      }

      const submitData = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        constraints: formData.constraints,
        testCases: parsedTestCases,
        isContestProblem: formData.isContestProblem
      };

      if (isEdit) {
        const res = await updateProblem(url, token, formData.id, submitData);
        if (res.data.success) toast.success("Problem updated!");
      } else {
        const res = await createProblem(url, token, submitData);
        if (res.data.success) toast.success("Problem created!");
      }
      setShowModal(false);
      fetchProblems();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} problem`);
    }
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Problems</h2>
        <button className="primary-btn" onClick={openCreateModal}>+ Add Problem</button>
      </div>

      {loading ? (
        <p>Loading problems...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th>Test Cases</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map(problem => (
                <tr key={problem._id}>
                  <td>{problem.title}</td>
                  <td>
                    <span className={`badge ${problem.difficulty === 'hard' ? 'admin' : 'user'}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td>{problem.tags ? problem.tags.join(', ') : '-'}</td>
                  <td>{problem.testCases ? problem.testCases.length : 0}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => openEditModal(problem)}>Edit</button>
                    <button className="action-btn delete" onClick={() => handleDelete(problem._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {problems.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No problems found.</td>
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
            <h3>{isEdit ? 'Edit Problem' : 'Create Problem'}</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Slug (Unique URL identifier)</label>
                <input type="text" name="slug" value={formData.slug} onChange={handleFormChange} placeholder="e.g. valid-anagram (auto-generated if empty)" />
              </div>
              <div className="form-group">
                <label>Description (Supports Markdown/HTML depending on frontend config)</label>
                <textarea rows="4" name="description" value={formData.description} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleFormChange}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tags (Comma separated)</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleFormChange} placeholder="e.g. Array, Math, DP" required />
              </div>
              <div className="form-group">
                <label>Constraints</label>
                <textarea rows="2" name="constraints" value={formData.constraints} onChange={handleFormChange} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  name="isContestProblem" 
                  checked={formData.isContestProblem} 
                  onChange={handleFormChange} 
                  id="isContestProblem"
                  style={{ width: 'auto', margin: 0 }}
                />
                <label htmlFor="isContestProblem" style={{ margin: 0 }}>Is Contest Problem (Hide from Practice)</label>
              </div>
              <div className="form-group">
                <label>Test Cases (Valid JSON Array)</label>
                <textarea 
                  rows="4" 
                  name="testCasesJson" 
                  value={formData.testCasesJson} 
                  onChange={handleFormChange} 
                  placeholder='[{"input":"1 2","output":"3","isSample":true}]'
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
