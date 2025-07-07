"use client"

import { useEffect, useState, useMemo } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Package, Plane, Ship, Warehouse, Eye, Edit, Trash2, Download, Plus } from "lucide-react"
import Link from "next/link"

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Transit": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const originIcons = {
  Air: Plane,
  Sea: Ship,
  "Local Storage": Warehouse,
}

export default function EntriesList() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [originFilter, setOriginFilter] = useState("all")
  const [sortBy, setSortBy] = useState("dateCreated")

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true)
      setError(null)
      try {
        const querySnapshot = await getDocs(collection(db, "shipments"))
        const data = querySnapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            senderName: d.senderName || "",
            receiverName: d.receiverName || "",
            origin: d.origin || "",
            weight: d.weight || 0,
            numberOfPieces: d.pieces || d.numberOfPieces || 0,
            dimensions: d.dimensions || { length: 0, width: 0, height: 0 },
            description: d.description || "",
            carrierName: d.carrierName || "",
            status: d.status || "Pending",
            trackingNumber: d.trackingNumber || "-",
            dateCreated: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : new Date().toISOString(),
          }
        })
        setEntries(data)
      } catch (err) {
        setError("Failed to load entries.")
      }
      setLoading(false)
    }
    fetchEntries()
  }, [])

  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter((entry) => {
      const matchesSearch =
        entry.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.carrierName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || entry.status === statusFilter
      const matchesOrigin = originFilter === "all" || entry.origin === originFilter

      return matchesSearch && matchesStatus && matchesOrigin
    })

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dateCreated":
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        case "weight":
          return b.weight - a.weight
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return filtered
  }, [entries, searchTerm, statusFilter, originFilter, sortBy])

  const handleDeleteEntry = (id) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      // In a real app, this would make an API call
      console.log("Deleting entry:", id)
      alert("Entry deleted successfully!")
    }
  }

  

  const formatDimensions = (dimensions) => {
    return `${dimensions.length} × ${dimensions.width} × ${dimensions.height} cm`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-gray-200"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error loading entries</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
       <div>
          <h1 className="text-2xl font-bold text-[#0273ab] ">Warehouse Entries</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all warehouse entries ({filteredAndSortedEntries.length} total)
          </p>
        </div>
        

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-4 h-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Origin</label>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All origins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Origins</SelectItem>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Sea">Sea</SelectItem>
                  <SelectItem value="Local Storage">Local Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateCreated">Date Created</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading entries...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Pieces</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map((entry) => {
                    const OriginIcon = originIcons[entry.origin]
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{entry.senderName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Track: {entry.trackingNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{entry.receiverName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {OriginIcon && <OriginIcon className="w-4 h-4 text-gray-500" />}
                            <span className="text-sm">{entry.origin}</span>
                          </div>
                        </TableCell>
                        <TableCell>{entry.weight} kg</TableCell>
                        <TableCell>{entry.numberOfPieces}</TableCell>
                        <TableCell className="text-xs">{formatDimensions(entry.dimensions)}</TableCell>
                        <TableCell className="text-sm">{entry.carrierName}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[entry.status] || statusColors["Pending"]}>{entry.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(entry.dateCreated)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && !error && filteredAndSortedEntries.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No entries found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No warehouse entries match your current filters.</p>
              <Link href="/warehouse/add-entry">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Entry
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
