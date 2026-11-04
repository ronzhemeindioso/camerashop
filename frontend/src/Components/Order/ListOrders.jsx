import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { peso } from '../../Utils/helpers'
import { useDispatch, useSelector } from 'react-redux'
import { myOrders } from '../../actions/orderActions'
import ReviewModal from './ReviewModal'
import './orders.css'

import { DataGrid } from '@mui/x-data-grid'

// colour of the status chip
const statusClass = (status = '') => {
    if (status.includes('Delivered')) return 'od-chip--green'
    if (status.includes('Shipped')) return 'od-chip--blue'
    if (status.includes('Processing')) return 'od-chip--amber'
    return 'od-chip--red' // Returned, Refunded, Cancelled...
}

const ListOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, orders = [] } = useSelector(state => state.myOrders);
    // the product being reviewed in the pop-up (null = closed)
    const [reviewing, setReviewing] = useState(null)

    useEffect(() => {
        dispatch(myOrders());
    }, [dispatch])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' });
        }
    }, [error])

    // One item  -> open the review pop-up right here.
    // Many items -> open the order so the customer picks which product to review.
    const writeReview = (order) => {
        if (order.orderItems.length === 1) {
            const item = order.orderItems[0]
            setReviewing({ id: item.product, name: item.name, image: item.image })
        } else {
            navigate(`/order/${order._id}`)
        }
    }

    const columns = [
        {
            field: 'id',
            headerName: 'Order ID',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => <span className="od-orderid">{params.value}</span>
        },
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
        },
        {
            field: 'numOfItems',
            headerName: 'Items',
            type: 'number',
            width: 80,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 130,
            renderCell: (params) => <span className="od-amount">{params.value}</span>,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => (
                <span className={`od-chip ${statusClass(params.value)}`}>{params.value}</span>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 270,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="od-actions">
                    <Link to={`/order/${params.id}`} className="od-btn od-btn--ghost" aria-label="View order">
                        View details
                    </Link>
                    {params.row.delivered && (
                        <button type="button" className="od-btn od-btn--solid" onClick={() => writeReview(params.row.order)}>
                            Write a review
                        </button>
                    )}
                </div>
            )
        }
    ];

    const rows = orders.map(order => ({
        id: order._id,
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
        numOfItems: order.orderItems.length,
        amount: peso(order.totalPrice),
        status: order.orderStatus || '',
        delivered: order.orderStatus === 'Delivered',
        order
    }));

    return (
        <>
            <MetaData title={'My Orders'} />
            <div className="od-page">
                <div className="od-head">
                    <h1 className="od-title">My Orders</h1>
                    <p className="od-subtitle">Follow your orders and review the products you have received.</p>
                </div>

                {loading ? <Loader /> : rows.length === 0 ? (
                    <div className="od-card od-empty">
                        <p>You have no orders yet.</p>
                        <Link to="/shop" className="od-btn od-btn--solid">Start shopping</Link>
                    </div>
                ) : (
                    <div className="od-grid">
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(row) => row.id}
                            disableRowSelectionOnClick
                            autoHeight
                            rowHeight={60}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } },
                                sorting: { sortModel: [] }
                            }}
                            pageSizeOptions={[5, 10, 25]}
                        />
                    </div>
                )}
            </div>

            <ReviewModal
                product={reviewing}
                onClose={() => setReviewing(null)}
            />
        </>
    )
}

export default ListOrders
