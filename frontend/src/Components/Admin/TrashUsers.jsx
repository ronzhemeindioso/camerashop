import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
import { confirmRestore, confirmPermanent } from '../../Utils/confirmDialog'

const API = import.meta.env.VITE_API

const RED = '#d32f2f'
const RED_DARK = '#b71c1c'

const TrashUsers = () => {
    const [users, setUsers] = useState([])
    const [selected, setSelected] = useState([])
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

    const restore = async (id, name) => {
        if (!(await confirmRestore(`Restore "${name}"?`, 'They will go back to the users list.'))) return
        try {
            await axios.put(`${API}/admin/user/${id}/restore`, {}, { withCredentials: true })
            toast.success('User restored', { position: 'bottom-right' })
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

    // Permanent delete for one or many users (ids = array of _id)
    const permanentDelete = async (ids, label) => {
        const ok = await confirmPermanent(
            'Delete permanently?',
            `${label} will be removed for good. This cannot be undone.`,
        )
        if (!ok) return
        try {
            const { data } = await axios.delete(`${API}/admin/users/permanent`, {
                data: { ids },
                withCredentials: true,
            })
            toast.success(data.message || 'Permanently deleted', { position: 'bottom-right' })
            setSelected(prev => prev.filter(x => !ids.includes(x)))
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

    // only act on ticked rows that still exist in the list
    const shownIds = new Set(users.map(u => u._id))
    const selectedInView = selected.filter(id => shownIds.has(id))

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
                    <button className="adm-icon-btn" title="Restore" onClick={() => restore(u._id, u.name)}>
                        <i className="fa fa-undo"></i>
                    </button>
                    <button className="adm-icon-btn danger" title="Delete permanently" onClick={() => permanentDelete([u._id], `"${u.name}"`)}>
                        <i className="fa fa-trash"></i>
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
                        selectable
                        selectedIds={selectedInView}
                        onSelectionChange={setSelected}
                        actions={
                            selectedInView.length > 0 && (
                                <button
                                    type="button"
                                    className="adm-btn"
                                    style={{ background: RED, borderColor: RED, color: '#fff', fontWeight: 600 }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = RED_DARK }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = RED }}
                                    onClick={() => permanentDelete(selectedInView, `${selectedInView.length} selected user(s)`)}
                                >
                                    <i className="fa fa-trash"></i> Delete selected permanently ({selectedInView.length})
                                </button>
                            )
                        }
                    />
                )}
            </AdminLayout>
        </>
    )
}

export default TrashUsers
