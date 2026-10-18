import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import 'react-toastify/dist/ReactToastify.css';

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
import { formatDate } from './adminHelpers'

import axios from 'axios';
import { errMsg, successMsg } from '../../Utils/helpers';

const UsersList = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [allUsers, setAllUsers] = useState([])
    const [isDeleted, setIsDeleted] = useState('')
    const [deletedId, setDeletedId] = useState('')
    const [roleFilter, setRoleFilter] = useState('')

    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    }

    const listUsers = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/users`, config)
            setAllUsers(data.users)
            setLoading(false)
        } catch (error) {
            setError(error.response?.data?.message || error.message)
            setLoading(false)
        }
    }

    const deleteUser = async (id, name) => {
        if (!window.confirm(`Move "${name}" to trash? You can restore them later.`)) return
        try {
            setDeletedId(id)
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/user/${id}`, config)
            setIsDeleted(data.success)
        } catch (error) {
            setError(error.response?.data?.message || error.message)
        }
    }

    useEffect(() => {
        listUsers();
    }, [])

    useEffect(() => {
        if (error) {
            errMsg(error);
            setError('')
        }
    }, [error])

    useEffect(() => {
        if (isDeleted) {
            successMsg('User moved to trash');
            setAllUsers(prev => prev.filter(u => u._id !== deletedId))
            setIsDeleted('')
        }
    }, [isDeleted])

    const admins = allUsers.filter(u => u.role === 'admin').length
    const activeRoles = new Set(allUsers.map(u => u.role).filter(Boolean)).size
    const rows = roleFilter ? allUsers.filter(u => u.role === roleFilter) : allUsers

    const columns = [
        {
            key: 'name', label: 'User', sortable: true,
            render: (u) => (
                <div className="adm-user">
                    {u.avatar && u.avatar.url
                        ? <img src={u.avatar.url} alt={u.name} />
                        : <span className="initial">{(u.name || '?').charAt(0).toUpperCase()}</span>}
                    <span className="adm-strong">{u.name}</span>
                </div>
            )
        },
        { key: 'email', label: 'Email', sortable: true, render: (u) => <span className="adm-muted">{u.email}</span> },
        {
            key: 'role', label: 'Role', sortable: true,
            render: (u) => <span className={`adm-pill ${u.role === 'admin' ? 'maroon' : 'tag'}`}>{u.role}</span>
        },
        { key: 'createdAt', label: 'Joined', sortable: true, sortValue: (u) => new Date(u.createdAt || 0).getTime(), render: (u) => <span className="adm-muted">{formatDate(u.createdAt)}</span> },
        {
            key: 'actions', label: '',
            render: (u) => (
                <div className="adm-actions">
                    <Link to={`/admin/user/${u._id}`} className="adm-icon-btn" title="Edit">
                        <i className="fa fa-pencil"></i>
                    </Link>
                    <button className="adm-icon-btn danger" title="Move to trash" onClick={() => deleteUser(u._id, u.name)}>
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            )
        },
    ]

    return (
        <>
            <MetaData title={'All Users'} />
            <AdminLayout
                title="Users"
                subtitle={<><b>{allUsers.length}</b> total, proceed to manage them</>}
                actions={<Link to="/admin/users/trash" className="adm-btn">View deleted</Link>}
            >
                {loading ? <Loader /> : (
                    <>
                        <div className="adm-stats">
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-users"></i></div>
                                <div><div className="adm-stat-value">{allUsers.length}</div><div className="adm-stat-label">Users</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-shield"></i></div>
                                <div><div className="adm-stat-value">{admins}</div><div className="adm-stat-label">Admins</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-user"></i></div>
                                <div><div className="adm-stat-value">{allUsers.length - admins}</div><div className="adm-stat-label">Customers</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-id-badge"></i></div>
                                <div><div className="adm-stat-value">{activeRoles}</div><div className="adm-stat-label">Active roles</div></div>
                            </div>
                        </div>

                        <DataTable
                            title="All users"
                            columns={columns}
                            rows={rows}
                            rowKey={(u) => u._id}
                            searchText={(u) => `${u.name} ${u.email} ${u.role}`}
                            searchPlaceholder="Search users..."
                            emptyText="No users found."
                            actions={<Link to="/admin/user/new" className="adm-btn adm-btn-primary">+ Add user</Link>}
                            filters={
                                <select className="adm-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                                    <option value="">All roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                </select>
                            }
                        />
                    </>
                )}
            </AdminLayout>
        </>
    )
}

export default UsersList
