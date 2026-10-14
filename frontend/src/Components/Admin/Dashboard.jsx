import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import { money } from './adminHelpers'
import axios from 'axios'
import { errMsg } from '../../Utils/helpers';
import 'react-toastify/dist/ReactToastify.css';
import ProductSalesChart from './ProductSalesChart';
import UserSalesChart from './UserSalesChart';
import MonthlySalesChart from './MonthlySalesChart';

const Dashboard = () => {
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalAmount, setTotalAmount] = useState(0)

    let outOfStock = 0;
    products.forEach(product => {
        if (product.stock === 0) {
            outOfStock += 1;
        }
    })

    useEffect(() => {
        const config = { withCredentials: true }
        const api = import.meta.env.VITE_API

        const loadDashboard = async () => {
            const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
                axios.get(`${api}/admin/products`, config),
                axios.get(`${api}/admin/orders`, config),
                axios.get(`${api}/admin/users`, config),
            ])

            if (productsRes.status === 'fulfilled') {
                setProducts(productsRes.value.data.products || [])
            }
            if (ordersRes.status === 'fulfilled') {
                setOrders(ordersRes.value.data.orders || [])
                setTotalAmount(ordersRes.value.data.totalAmount || 0)
            }
            if (usersRes.status === 'fulfilled') {
                setUsers(usersRes.value.data.users || [])
            }

            // show a single toast if anything failed
            const failed = [productsRes, ordersRes, usersRes].find(r => r.status === 'rejected')
            if (failed) {
                errMsg(failed.reason?.response?.data?.message || failed.reason?.message || 'Failed to load dashboard data')
            }
            setLoading(false)
        }

        loadDashboard()
    }, [])

    return (
        <>
            <MetaData title={'Admin Dashboard'} />
            <AdminLayout title="Dashboard" subtitle="A quick look at how the store is doing">
                {loading ? <Loader /> : (
                    <>
                        <div className="adm-stats">
                            <div className="adm-stat">
                                <div className="adm-stat-icon"><i className="fa fa-money"></i></div>
                                <div><div className="adm-stat-value">{money(totalAmount)}</div><div className="adm-stat-label">Total amount</div></div>
                            </div>
                            <Link className="adm-stat" to="/admin/products">
                                <div className="adm-stat-icon"><i className="fa fa-cube"></i></div>
                                <div><div className="adm-stat-value">{products.length}</div><div className="adm-stat-label">Products</div></div>
                            </Link>
                            <Link className="adm-stat" to="/admin/orders">
                                <div className="adm-stat-icon"><i className="fa fa-shopping-basket"></i></div>
                                <div><div className="adm-stat-value">{orders.length}</div><div className="adm-stat-label">Orders</div></div>
                            </Link>
                            <Link className="adm-stat" to="/admin/users">
                                <div className="adm-stat-icon"><i className="fa fa-users"></i></div>
                                <div><div className="adm-stat-value">{users.length}</div><div className="adm-stat-label">Users</div></div>
                            </Link>
                        </div>

                        <div className="adm-charts">
                            <div className="adm-card">
                                <div className="adm-card-head"><h2>Sales by product</h2></div>
                                <div className="adm-card-body"><ProductSalesChart /></div>
                            </div>
                            <div className="adm-card">
                                <div className="adm-card-head"><h2>Sales by user</h2></div>
                                <div className="adm-card-body"><UserSalesChart /></div>
                            </div>
                            <div className="adm-card adm-chart-wide">
                                <div className="adm-card-head"><h2>Monthly sales</h2></div>
                                <div className="adm-card-body"><MonthlySalesChart /></div>
                            </div>
                        </div>
                    </>
                )}
            </AdminLayout>
        </>
    )
}

export default Dashboard