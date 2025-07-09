"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
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

  // Live stats state
  const [liveMetrics, setLiveMetrics] = useState({
    totalEntries: 0,
    totalWeight: 0,
    deliveredOrders: 0,
    avgDeliveryTime: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        setLiveMetrics((m) => ({ ...m, loading: true, error: null }))
        
        console.log("Fetching from 'shipments' collection...")
        const querySnapshot = await getDocs(collection(db, "shipments"))
        
        console.log("Query snapshot size:", querySnapshot.size)
        
        let totalEntries = 0
        let totalWeight = 0
        let deliveredOrders = 0
        let deliveryTimeSum = 0
        let deliveryTimeCount = 0
        let allDocuments = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("Document ID:", doc.id, "Data:", data)
          
          allDocuments.push({
            id: doc.id,
            ...data
          })
          
          totalEntries++
          
          // Check for weight field (could be 'weight', 'totalWeight', etc.)
          const weight = data.weight || data.totalWeight || data.Weight || 0
          if (typeof weight === "number" && weight > 0) {
            totalWeight += weight
          } else if (typeof weight === "string") {
            const parsedWeight = parseFloat(weight)
            if (!isNaN(parsedWeight)) {
              totalWeight += parsedWeight
            }
          }
          
          // Check for status field (could be 'status', 'Status', etc.)
          const status = data.status || data.Status || data.shipmentStatus || ""
          if (status.toLowerCase().includes("delivered")) {
            deliveredOrders++
          }
          
          // Check for delivery time
          const deliveryTime = data.deliveryTime || data.deliveryDays || data.estimatedDeliveryTime || 0
          if (typeof deliveryTime === "number" && deliveryTime > 0) {
            deliveryTimeSum += deliveryTime
            deliveryTimeCount++
          }
        })
        
        setDebugInfo({
          totalDocuments: querySnapshot.size,
          documents: allDocuments,
          fieldsFound: {
            weightFields: allDocuments.map(doc => Object.keys(doc).filter(key => key.toLowerCase().includes('weight'))).flat(),
            statusFields: allDocuments.map(doc => Object.keys(doc).filter(key => key.toLowerCase().includes('status'))).flat(),
            deliveryFields: allDocuments.map(doc => Object.keys(doc).filter(key => key.toLowerCase().includes('delivery'))).flat(),
          }
        })
        
        setLiveMetrics({
          totalEntries,
          totalWeight,
          deliveredOrders,
          avgDeliveryTime: deliveryTimeCount ? (deliveryTimeSum / deliveryTimeCount) : 0,
          loading: false,
          error: null,
        })
        
        console.log("Final metrics:", {
          totalEntries,
          totalWeight,
          deliveredOrders,
          avgDeliveryTime: deliveryTimeCount ? (deliveryTimeSum / deliveryTimeCount) : 0,
        })
        
      } catch (error) {
        console.error("Error fetching stats:", error)
        setLiveMetrics(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }
    
    fetchStats()
  }, [])

  const handleExportReport = () => {
    console.log("Exporting report...")
    alert("Report export functionality would be implemented here!")
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
      {/* Debug Info Card */}
      {/* {debugInfo && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
              <AlertCircle className="w-4 h-4" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Total Documents Found: {debugInfo.totalDocuments}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expected: 3 (Proc-839926, Proc-422245, Proc-147142)
                </p>
              </div>
              
              {debugInfo.documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Document Structure:</p>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugInfo.documents, null, 2)}
                  </pre>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium mb-2">Fields Found:</p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="font-medium">Weight Fields:</p>
                    <p>{debugInfo.fieldsFound.weightFields.join(", ") || "None"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Status Fields:</p>
                    <p>{debugInfo.fieldsFound.statusFields.join(", ") || "None"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Delivery Fields:</p>
                    <p>{debugInfo.fieldsFound.deliveryFields.join(", ") || "None"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

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
              <Select defaultValue="pdf">
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="entries" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Origin Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Origin Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={originDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {originDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
              {statusDistribution.map((status, index) => (
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
              ))}
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
              {topDestinations.map((destination, index) => (
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
                        style={{ width: `${(destination.percentage / 12.5) * 100}%` }}
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carrier Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Carrier Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Carrier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total Shipments</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">On-Time Delivery</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Avg. Delivery Time</th>
                </tr>
              </thead>
              <tbody>
                {carrierPerformance.map((carrier, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{carrier.carrier}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{carrier.totalShipments}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          carrier.onTimeDelivery >= 95
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : carrier.onTimeDelivery >= 90
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {carrier.onTimeDelivery}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{carrier.averageDeliveryTime} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}