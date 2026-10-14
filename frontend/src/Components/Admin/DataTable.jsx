import React, { useEffect, useMemo, useState } from 'react'

/**
 * columns: [{ key, label, sortable, sortValue(row), render(row), align }]
 * rows: array of objects
 * searchText(row): string used for the search box (omit to hide the search box)
 * filters: extra controls shown beside the search box
 * actions: extra buttons shown after the search box (e.g. "+ Add product")
 */
const DataTable = ({
    title,
    columns,
    rows,
    rowKey = (row) => row._id,
    searchText,
    searchPlaceholder = 'Search...',
    filters,
    actions,
    emptyText = 'Nothing to show yet.',
}) => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState({ key: null, dir: 'asc' })
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q || !searchText) return rows
        return rows.filter(row => searchText(row).toLowerCase().includes(q))
    }, [rows, query, searchText])

    const sorted = useMemo(() => {
        if (!sort.key) return filtered
        const col = columns.find(c => c.key === sort.key)
        if (!col) return filtered
        const get = (row) => (col.sortValue ? col.sortValue(row) : row[col.key])
        const list = [...filtered].sort((a, b) => {
            const x = get(a)
            const y = get(b)
            if (typeof x === 'number' && typeof y === 'number') return x - y
            return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true })
        })
        return sort.dir === 'desc' ? list.reverse() : list
    }, [filtered, sort, columns])

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const current = Math.min(page, totalPages)
    const start = (current - 1) * pageSize
    const visible = sorted.slice(start, start + pageSize)

    // Go back to page 1 when the search or page size changes
    useEffect(() => { setPage(1) }, [query, pageSize])

    const toggleSort = (col) => {
        if (!col.sortable) return
        setSort(prev =>
            prev.key === col.key
                ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key: col.key, dir: 'asc' }
        )
    }

    // Page buttons: first, last, and the pages around the current one
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - current) <= 1) pages.push(i)
        else if (pages[pages.length - 1] !== '…') pages.push('…')
    }

    return (
        <div className="adm-card">
            <div className="adm-card-head">
                <h2>{title}</h2>
                <div className="adm-toolbar">
                    {filters}
                    {searchText && (
                        <div className="adm-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder={searchPlaceholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    )}
                    {actions}
                </div>
            </div>

            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`${col.sortable ? 'sortable' : ''} ${sort.key === col.key ? 'sorted' : ''}`}
                                    style={col.align ? { textAlign: col.align } : undefined}
                                    onClick={() => toggleSort(col)}
                                >
                                    {col.label}
                                    {col.sortable && (
                                        <i
                                            className={`fa sort-icon ${sort.key === col.key
                                                ? (sort.dir === 'asc' ? 'fa-caret-up' : 'fa-caret-down')
                                                : 'fa-sort'}`}
                                            aria-hidden="true"
                                        ></i>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="adm-empty">{emptyText}</td>
                            </tr>
                        ) : visible.map(row => (
                            <tr key={rowKey(row)}>
                                {columns.map(col => (
                                    <td key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="adm-table-foot">
                <div>
                    Show
                    <select
                        className="adm-select"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                        {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    entries
                </div>

                <div>
                    {sorted.length === 0
                        ? 'Showing 0 entries'
                        : `Showing ${start + 1} to ${Math.min(start + pageSize, sorted.length)} of ${sorted.length} entries`}
                </div>

                <div className="adm-pager">
                    <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
                    {pages.map((p, i) => p === '…'
                        ? <span key={`gap-${i}`} className="adm-muted">…</span>
                        : (
                            <button
                                key={p}
                                type="button"
                                className={p === current ? 'current' : ''}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </button>
                        ))}
                    <button type="button" disabled={current === totalPages} onClick={() => setPage(current + 1)}>Next</button>
                </div>
            </div>
        </div>
    )
}

export default DataTable
