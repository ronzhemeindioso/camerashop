import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import DataTable from './DataTable'
import { money, formatDate } from './adminHelpers'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useDispatch, useSelector } from 'react-redux'
import { allOrders, clearErrors, deleteOrder } from '../../actions/orderActions'
import { DELETE_ORDER_RESET } from '../../constants/orderConstants'

const statusColor = (status = '') => {
    if (status.includes('Delivered')) return 'green'
    if (status.includes('Shipped')) return 'blue'
    return 'amber'
}

const OrdersList = () => {
    const dispatch = useDispatch();
    const { loading, error, orders } = useSelector(state => state.allOrders);
    const { isDeleted } = useSelector(state => state.order)
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        dispatch(allOrders())
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
        if (isDeleted) {
            toast.success('Order deleted successfully', { position: 'bottom-right' });
            dispatch({ type: DELETE_ORDER_RESET })
        }
    }, [error, isDeleted])

    const deleteOrderHandler = (id) => {
        dispatch(deleteOrder(id))
    }

    const list = orders || []
    const revenue = list.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0)
    const count = (word) => list.filter(o => String(o.orderStatus).includes(word)).length
    const rows = statusFilter ? list.filter(o => String(o.orderStatus).includes(statusFilter)) : list

    const columns = [
        {
            key: 'id', label: 'Order ID', sortable: true, sortValue: (o) => o._id,
            render: (o) => <span className="adm-mono adm-strong" title={o._id}>#{o._id.slice(-8)}</span>
        },
        { key: 'date', label: 'Date', sortable: true, sortValue: (o) => new Date(o.createdAt || 0).getTime(), render: (o) => <span className="adm-muted">{formatDate(o.createdAt)}</span> },
        { key: 'items', label: 'Items', sortable: true, sortValue: (o) => o.orderItems.length, render: (o) => o.orderItems.length },
        { key: 'amount', label: 'Amount', sortable: true, sortValue: (o) => Number(o.totalPrice), render: (o) => <span className="adm-price">{money(o.totalPrice)}</span> },
        {
            key: 'status', label: 'Status', sortable: true, sortValue: (o) => o.orderStatus,
            render: (o) => <span className={`adm-pill dot ${statusColor(o.orderStatus)}`}>{o.orderStatus}</span>
        },
        {
            key: 'actions', label: '',
            render: (o) => (
                <div className="adm-actions">
                    <Link to={`/admin/order/${o._id}`} className="adm-icon-btn" title="View / process">
                        <i className="fa fa-eye"></i>
                    </Link>
                    <button className="adm-icon-btn danger" title="Delete" onClick={() => deleteOrderHandler(o._id)}>
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            )
        },
    ]

    return (
        <>
            <MetaData title={'All Orders'} />
            <AdminLayout title="Orders" subtitle={<><b>{list.length}</b> total, proceed to manage them</>}>
                {loading ? <Loader /> : (
                    <>
                        <div className="adm-stats">
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-shopping-basket"></i></div>
                                <div><div className="adm-stat-value">{list.length}</div><div className="adm-stat-label">Orders</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-money"></i></div>
                                <div><div className="adm-stat-value">{money(revenue)}</div><div className="adm-stat-label">Total sales</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-clock-o"></i></div>
                                <div><div className="adm-stat-value">{count('Processing')}</div><div className="adm-stat-label">Processing</div></div>
                            </div>
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-check"></i></div>
                                <div><div className="adm-stat-value">{count('Delivered')}</div><div className="adm-stat-label">Delivered</div></div>
                            </div>
                        </div>

                        <DataTable
                            title="All orders"
                            columns={columns}
                            rows={rows}
                            rowKey={(o) => o._id}
                            searchText={(o) => `${o._id} ${o.orderStatus}`}
                            searchPlaceholder="Search orders..."
                            emptyText="No orders found."
                            filters={
                                <select className="adm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">All status</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            }
                        />
                    </>
                )}
            </AdminLayout>
        </>
    )
}

export default OrdersList
