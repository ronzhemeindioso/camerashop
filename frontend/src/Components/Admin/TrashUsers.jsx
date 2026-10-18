import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'

const API = import.meta.env.VITE_API

const TrashUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/admin/users?deleted=true`, { withCredentials: true })
            setUsers(data.users || [])
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const restore = async (id) => {
        try {
            await axios.put(`${API}/admin/user/${id}/restore`, {}, { withCredentials: true })
            toast.success('User restored', { position: 'bottom-right' })
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

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
        {
            key: 'deletedAt', label: 'Deleted', sortable: true,
            sortValue: (u) => new Date(u.deletedAt || 0).getTime(),
            render: (u) => new Date(u.deletedAt).toLocaleString()
        },
        {
            key: 'actions', label: '',
            render: (u) => (
                <div className="adm-actions">
                    <button className="adm-icon-btn" title="Restore" onClick={() => restore(u._id)}>
                        <i className="fa fa-undo"></i>
                    </button>
                </div>
            )
        },
    ]

    return (
        <>
            <MetaData title={'Deleted Users'} />
            <AdminLayout
                title="Deleted users"
                subtitle={<><b>{users.length}</b> in trash · <Link to="/admin/users">Back to users</Link></>}
            >
                {loading ? <Loader /> : (
                    <DataTable
                        title="Trash"
                        columns={columns}
                        rows={users}
                        rowKey={(u) => u._id}
                        searchText={(u) => `${u.name} ${u.email} ${u.role}`}
                        searchPlaceholder="Search deleted users..."
                        emptyText="Trash is empty."
                    />
                )}
            </AdminLayout>
        </>
    )
}

export default TrashUsers
