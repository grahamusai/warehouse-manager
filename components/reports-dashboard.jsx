"use client"

import { useEffect, useState, useRef } from "react"
import { db } from "@/lib/firebase"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import autoTable from "jspdf-autotable"
import { collection, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import {
  Package,
  Weight,
  Truck,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChartIcon,
  Activity,
  AlertCircle,
} from "lucide-react"
import {
  monthlyTrends,
  originDistribution,
  statusDistribution,
  topDestinations,
  carrierPerformance,
} from "@/lib/reports-data"

const iconMap = {
  package: Package,
  weight: Weight,
  truck: Truck,
  clock: Clock,
}

export default function ReportsDashboard() {
  const [dateRange, setDateRange] = useState("last-30-days")
  const [reportType, setReportType] = useState("overview")
  const [debugInfo, setDebugInfo] = useState(null)
  const [allDocuments, setAllDocuments] = useState([])
  const [exportFormat, setExportFormat] = useState("pdf")

  // Live stats state
  const [liveMetrics, setLiveMetrics] = useState({
    totalEntries: 0,
    totalWeight: 0,
    deliveredOrders: 0,
    avgDeliveryTime: 0,
    loading: true,
    error: null,
  })
  // Live status distribution state
  const [liveStatusDistribution, setLiveStatusDistribution] = useState([])
  // Live top destinations state
  const [liveTopDestinations, setLiveTopDestinations] = useState([])

  // Helper to generate a color for a status string
  function getStatusColor(status) {
    // Simple hash to color
    let hash = 0
    for (let i = 0; i < status.length; i++) {
      hash = status.charCodeAt(i) + ((hash << 5) - hash)
    }
    // Generate HSL color
    const h = Math.abs(hash) % 360
    return `hsl(${h}, 70%, 50%)`
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        setLiveMetrics((m) => ({ ...m, loading: true, error: null }))
        setLiveStatusDistribution([])
        setLiveTopDestinations([])

        const querySnapshot = await getDocs(collection(db, "shipments"))

        let totalEntries = 0
        let totalWeight = 0
        let deliveredOrders = 0
        let deliveryTimeSum = 0
        let deliveryTimeCount = 0
        let allDocuments = []
        let statusCounts = {}
        let destinationCounts = {}

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          allDocuments.push({ id: doc.id, ...data })
          totalEntries++

          // Weight
          const weight = data.weight || data.totalWeight || data.Weight || 0
          if (typeof weight === "number" && weight > 0) {
            totalWeight += weight
          } else if (typeof weight === "string") {
            const parsedWeight = parseFloat(weight)
            if (!isNaN(parsedWeight)) {
              totalWeight += parsedWeight
            }
          }

          // Status
          const status = data.status || data.Status || data.shipmentStatus || "Unknown"
          const statusKey = status || "Unknown"
          statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1
          if (status.toLowerCase().includes("delivered")) {
            deliveredOrders++
          }

          // Delivery time
          const deliveryTime = data.deliveryTime || data.deliveryDays || data.estimatedDeliveryTime || 0
          if (typeof deliveryTime === "number" && deliveryTime > 0) {
            deliveryTimeSum += deliveryTime
            deliveryTimeCount++
          }

          // Destination (try city, destination, to, or fallback to Unknown)
          const destination = data.city || data.destination || data.to || "Unknown"
          const destKey = destination || "Unknown"
          destinationCounts[destKey] = (destinationCounts[destKey] || 0) + 1
        })

        setDebugInfo({
          totalDocuments: querySnapshot.size,
          documents: allDocuments,
          fieldsFound: {
            weightFields: allDocuments.map(doc => Object.keys(doc).filter(key => key.toLowerCase().includes('weight'))).flat(),
            statusFields: allDocuments.map(doc => Object.keys(doc).filter(key => key.toLowerCase().includes('status'))).flat(),
            deliveryFields: allDocuments.map(doc => Object.keys(doc).filter(key => key.toLowerCase().includes('delivery'))).flat(),
            destinationFields: allDocuments.map(doc => Object.keys(doc).filter(key => ['city','destination','to'].includes(key.toLowerCase()))).flat(),
          }
        })
        setAllDocuments(allDocuments)

        setLiveMetrics({
          totalEntries,
          totalWeight,
          deliveredOrders,
          avgDeliveryTime: deliveryTimeCount ? (deliveryTimeSum / deliveryTimeCount) : 0,
          loading: false,
          error: null,
        })

        // Calculate status distribution
        const statusKeys = Object.keys(statusCounts)
        const totalStatus = statusKeys.reduce((sum, k) => sum + statusCounts[k], 0)
        const liveDist = statusKeys.map((status) => ({
          status,
          count: statusCounts[status],
          percentage: totalStatus > 0 ? Math.round((statusCounts[status] / totalStatus) * 100) : 0,
          color: getStatusColor(status),
        }))
        setLiveStatusDistribution(liveDist)

        // Calculate top destinations
        const destKeys = Object.keys(destinationCounts)
        const totalDest = destKeys.reduce((sum, k) => sum + destinationCounts[k], 0)
        // Sort by count descending, take top 5
        const sortedDest = destKeys
          .map((city) => ({
            city,
            count: destinationCounts[city],
            percentage: totalDest > 0 ? Math.round((destinationCounts[city] / totalDest) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
        setLiveTopDestinations(sortedDest)

      } catch (error) {
        setLiveMetrics(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
        setLiveStatusDistribution([])
        setLiveTopDestinations([])
      }
    }
    fetchStats()
  }, [])


  // Helper to flatten and clean up the data for export
  function getExportData() {
    if (!allDocuments || allDocuments.length === 0) return []
    // Remove fields like __proto__, undefined, and functions
    return allDocuments.map(doc => {
      const clean = {}
      Object.keys(doc).forEach(key => {
        if (typeof doc[key] !== "function" && key !== "__proto__") {
          clean[key] = doc[key]
        }
      })
      return clean
    })
  }

  // Export as Excel
  function exportExcel() {
    const data = getExportData()
    if (data.length === 0) {
      alert("No data to export.")
      return
    }
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Shipments")
    XLSX.writeFile(wb, "shipments-report.xlsx")
  }

  // Export as PDF
  function exportPDF() {
    const data = getExportData()
    if (data.length === 0) {
      alert("No data to export.")
      return
    }
    const doc = new jsPDF({ orientation: "landscape" })
    const columns = Object.keys(data[0] || {})
    const rows = data.map(row => columns.map(col => row[col]))
    doc.text("Shipments Report", 14, 10)
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 16,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 10, right: 10 },
      tableWidth: "auto"
    })
    doc.save("shipments-report.pdf")
  }

  // Export as CSV
  function exportCSV() {
    const data = getExportData()
    if (data.length === 0) {
      alert("No data to export.")
      return
    }
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "shipments-report.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleExportReport = () => {
    if (exportFormat === "pdf") {
      exportPDF()
    } else if (exportFormat === "excel") {
      exportExcel()
    } else if (exportFormat === "csv") {
      exportCSV()
    } else {
      alert("Unknown export format.")
    }
  }

  const MetricCard = ({ metric }) => {
    const IconComponent = iconMap[metric.icon] || Package
    const isPositive = metric.changeType === "increase"
    const isNegative = metric.changeType === "decrease"

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metric.value}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
              <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {isPositive && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
            {isNegative && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
            <span
              className={`text-sm font-medium ${
                isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600"
              }`}
            >
              {isPositive ? "+" : ""}
              {metric.change}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Replace static reportMetrics with liveMetrics
  const reportMetrics = [
    {
      label: "Total Entries",
      value: liveMetrics.loading ? "Loading..." : liveMetrics.error ? "Error" : liveMetrics.totalEntries,
      change: 0,
      changeType: "neutral",
      icon: "package",
    },
    {
      label: "Total Weight (kg)",
      value: liveMetrics.loading ? "Loading..." : liveMetrics.error ? "Error" : liveMetrics.totalWeight.toLocaleString(),
      change: 0,
      changeType: "neutral",
      icon: "weight",
    },
    {
      label: "Delivered Orders",
      value: liveMetrics.loading ? "Loading..." : liveMetrics.error ? "Error" : liveMetrics.deliveredOrders,
      change: 0,
      changeType: "neutral",
      icon: "truck",
    },
    {
      label: "Average Delivery Time",
      value: liveMetrics.loading ? "Loading..." : liveMetrics.error ? "Error" : `${liveMetrics.avgDeliveryTime.toFixed(1)} days`,
      change: 0,
      changeType: "neutral",
      icon: "clock",
    },
  ]

  return (
    <div className="space-y-6">
     

      {/* Error Display */}
      {liveMetrics.error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-medium">Error loading data: {liveMetrics.error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warehouse Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Analytics and insights for your warehouse operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-4 h-4" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                  <SelectItem value="carriers">Carriers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Export Format</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <Download className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="csv">CSV Data</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportMetrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Rest of the dashboard remains the same */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveMetrics.loading ? (
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
              ) : liveStatusDistribution.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400">No status data available.</div>
              ) : (
                liveStatusDistribution.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: status.color }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{status.status}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${status.percentage}%`,
                            backgroundColor: status.color,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {status.percentage}%
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                        {status.count}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Destinations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Top Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveMetrics.loading ? (
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
              ) : liveTopDestinations.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400">No destination data available.</div>
              ) : (
                liveTopDestinations.map((destination, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{destination.city}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${destination.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {destination.percentage}%
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                        {destination.count}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      
    </div>
  )
}