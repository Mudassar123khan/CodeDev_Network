import React, { useState, useEffect, useContext } from 'react';
import { getAllUsers, deleteUser, createUser, updateUser, syncAllUsersApi, syncSingleUser } from '../../api/admin.api';
import { Context } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Manage.css';

export default function UsersManage() {
  const { url, token } = useContext(Context);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: '', username: '', email: '', password: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers(url, token);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await deleteUser(url, token, id);
      if (res.data.success) {
        toast.success("User deleted successfully!");
        fetchUsers();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setFormData({ id: '', username: '', email: '', password: '', role: 'user' });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEdit(true);
    setFormData({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      password: '' // Keep empty unless being updated
    });
    setShowModal(true);
  };

  const handleSyncAll = async () => {
    if (!window.confirm("Queue all users for synchronization?")) return;
    try {
      const res = await syncAllUsersApi(url, token);
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to trigger global sync");
    }
  };

  const handleSyncSingle = async (user) => {
    try {
      const res = await syncSingleUser(url, token, user._id);
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to trigger user sync");
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        // Prepare data (exclude password if emptied to avoid overwriting with empty string)
        const submitData = { ...formData };
        if (!submitData.password) delete submitData.password;

        const res = await updateUser(url, token, formData.id, submitData);
        if (res.data.success) toast.success("User updated!");
      } else {
        const res = await createUser(url, token, formData);
        if (res.data.success) toast.success("User created!");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
    }
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Users</h2>
        <div>
          <button className="secondary-btn" onClick={handleSyncAll} style={{ marginRight: '10px' }}>Sync All Users</button>
          <button className="primary-btn" onClick={openCreateModal}>+ Add User</button>
        </div>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => openEditModal(user)}>Edit</button>
                    <button className="action-btn delete" onClick={() => handleDelete(user._id)}>Delete</button>
                    <button className="action-btn" style={{ color: '#16a34a' }} onClick={() => handleSyncSingle(user)}>Sync</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No users found.</td>
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
            <h3>{isEdit ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>{isEdit ? 'Password (leave blank to keep current)' : 'Password'}</label>
                <input type="password" name="password" value={formData.password} onChange={handleFormChange} required={!isEdit} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleFormChange}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
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
