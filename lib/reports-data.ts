export interface ReportMetric {
  label: string
  value: string | number
  change: number
  changeType: "increase" | "decrease" | "neutral"
  icon: string
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  entries: number
  weight: number
  delivered: number
}

export interface StatusDistribution {
  status: string
  count: number
  percentage: number
  color: string
}

export interface CarrierPerformance {
  carrier: string
  totalShipments: number
  onTimeDelivery: number
  averageDeliveryTime: number
  rating: number
}

// Mock data for reports
export const reportMetrics: ReportMetric[] = [
  {
    label: "Total Entries",
    value: 1247,
    change: 12.5,
    changeType: "increase",
    icon: "package",
  },
  {
    label: "Total Weight (kg)",
    value: "15,432",
    change: 8.2,
    changeType: "increase",
    icon: "weight",
  },
  {
    label: "Delivered Orders",
    value: 892,
    change: -2.1,
    changeType: "decrease",
    icon: "truck",
  },
  {
    label: "Average Delivery Time",
    value: "3.2 days",
    change: -5.8,
    changeType: "decrease",
    icon: "clock",
  },
]

export const originDistribution: ChartData[] = [
  { name: "Air", value: 45, color: "#3B82F6" },
  { name: "Sea", value: 35, color: "#10B981" },
  { name: "Road", value: 20, color: "#008080" },
  { name: "Local Storage", value: 20, color: "#F59E0B" },
]

export const monthlyTrends: TimeSeriesData[] = [
  { date: "Jan", entries: 98, weight: 1200, delivered: 85 },
  { date: "Feb", entries: 112, weight: 1350, delivered: 98 },
  { date: "Mar", entries: 125, weight: 1480, delivered: 110 },
  { date: "Apr", entries: 108, weight: 1320, delivered: 95 },
  { date: "May", entries: 142, weight: 1650, delivered: 128 },
  { date: "Jun", entries: 156, weight: 1820, delivered: 142 },
  { date: "Jul", entries: 134, weight: 1590, delivered: 125 },
  { date: "Aug", entries: 148, weight: 1720, delivered: 135 },
  { date: "Sep", entries: 162, weight: 1890, delivered: 148 },
  { date: "Oct", entries: 175, weight: 2010, delivered: 162 },
  { date: "Nov", entries: 189, weight: 2180, delivered: 175 },
  { date: "Dec", entries: 198, weight: 2250, delivered: 185 },
]

export const statusDistribution: StatusDistribution[] = [
  { status: "Delivered", count: 892, percentage: 71.5, color: "#10B981" },
  { status: "In Transit", count: 234, percentage: 18.8, color: "#3B82F6" },
  { status: "Pending", count: 89, percentage: 7.1, color: "#F59E0B" },
  { status: "Delayed", count: 32, percentage: 2.6, color: "#EF4444" },
]

export const carrierPerformance: CarrierPerformance[] = [
  {
    carrier: "Procet Frieght",
    totalShipments: 324,
    onTimeDelivery: 94.2,
    averageDeliveryTime: 2.8,
    rating: 4.8,
  },
  {
    carrier: "DHL Express",
    totalShipments: 298,
    onTimeDelivery: 91.5,
    averageDeliveryTime: 3.1,
    rating: 4.6,
  },
  {
    carrier: "Maersk Line",
    totalShipments: 156,
    onTimeDelivery: 88.7,
    averageDeliveryTime: 12.5,
    rating: 4.3,
  },
  {
    carrier: "COSCO Shipping",
    totalShipments: 142,
    onTimeDelivery: 85.2,
    averageDeliveryTime: 14.2,
    rating: 4.1,
  },
  {
    carrier: "City Logistics",
    totalShipments: 189,
    onTimeDelivery: 96.8,
    averageDeliveryTime: 1.2,
    rating: 4.9,
  },
]

export const topDestinations = [
  { city: "Johannesburg", count: 156, percentage: 12.5 },
  { city: "Cape town", count: 134, percentage: 10.7 },
  { city: "Durban", count: 98, percentage: 7.9 },
  { city: "Nairobi", count: 87, percentage: 7.0 },
  { city: "Harare", count: 76, percentage: 6.1 },
]
