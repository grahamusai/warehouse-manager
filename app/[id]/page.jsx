"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { getDownloadURL, ref } from "firebase/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  Plane,
  Ship,
  Warehouse,
  Calendar,
  MapPin,
  Ruler,
  FileText,
  ImageIcon,
  Truck,
  Edit,
  Download,
  Share,
  ArrowLeft,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Transit": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const modeIcons = {
  Air: Plane,
  Sea: Ship,
  "Local Storage": Warehouse,
}

export default function EntryDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageUrls, setImageUrls] = useState([])
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    const fetchEntry = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        setError(null)
        
        const docRef = doc(db, "shipments", params.id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setEntry({ id: docSnap.id, ...data })
          // Fetch image URLs from Firebase Storage if images exist and are not already URLs
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            // If images are objects with url property, use them; otherwise, fetch download URLs
            const urls = await Promise.all(
              data.images.map(async (img) => {
                if (typeof img === "string" && img.startsWith("http")) {
                  return img
                } else if (img && img.url) {
                  return img.url
                } else if (typeof img === "string" && img) {
                  // Assume it's a storage path
                  try {
                    return await getDownloadURL(ref(storage, img))
                  } catch {
                    return "/placeholder.svg"
                  }
                } else {
                  return "/placeholder.svg"
                }
              })
            )
            setImageUrls(urls)
          } else {
            setImageUrls([])
          }
        } else {
          setError("Entry not found")
        }
      } catch (err) {
        console.error("Error fetching entry:", err)
        setError("Failed to load entry details")
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [params.id])

  const ModeIcon = entry ? modeIcons[entry.mode] || Package : Package

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    
    // Handle both Firestore Timestamp and regular date strings
    let date
    if (dateString.toDate) {
      date = dateString.toDate()
    } else {
      date = new Date(dateString)
    }
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A"
    
    // Handle both Firestore Timestamp and regular date strings
    let date
    if (dateString.toDate) {
      date = dateString.toDate()
    } else {
      date = new Date(dateString)
    }
    
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateTotalValue = () => {
    if (!entry?.items) return 0
    return entry.items.reduce((total, item) => total + (item.value || 0), 0)
  }

  const calculateTotalWeight = () => {
    if (!entry?.items) return 0
    return entry.items.reduce((total, item) => total + (item.weight || 0), 0)
  }

  const calculateVolume = () => {
    if (!entry?.dimensions) return "0.00"
    const { length, width, height } = entry.dimensions
    return ((length * width * height) / 1000000).toFixed(2) // Convert cm³ to m³
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading entry details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Entry
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button 
            onClick={() => router.push("/dash/inventory")}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Entries
          </Button>
        </div>
      </div>
    )
  }

  // No entry found
  if (!entry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Entry Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested entry could not be found.
          </p>
          <Button 
            onClick={() => router.push("/dash/inventory")}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Entries
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-20">
      <img src="/images/logo.png" alt="" />

      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entry Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Document ID: {entry.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (entry?.id) {
                const url = `${window.location.origin}/dash/${entry.id}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 1500);
                } catch {
                  window.prompt("Copy this link:", url);
                }
              }
            }}
          >
            <Share className="w-4 h-4 mr-2" />
            {shareCopied ? "Copied!" : "Share"}
          </Button>
          
        </div>
      </div>

      {/* Status and Basic Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <Badge className={statusColors[entry.status || "Pending"]}>{entry.status || "Pending"}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ModeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transport Mode</p>
                <p className="font-medium text-gray-900 dark:text-white">{entry.mode || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Invoice Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{entry.invoiceNumber || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pieces</p>
                <p className="font-medium text-gray-900 dark:text-white">{entry.pieces || "N/A"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Gallery */}
      {imageUrls && imageUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Images ({imageUrls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <Image
                  src={imageUrls[selectedImageIndex] || "/placeholder.svg"}
                  alt={`Entry image ${selectedImageIndex + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {selectedImageIndex + 1} / {imageUrls.length}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? "border-blue-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Image
                      src={url || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Origin and Destination */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Origin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 dark:text-white">{entry.origin || "N/A"}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Departure: {formatDate(entry.departureDate)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 dark:text-white">{entry.destination || "N/A"}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Arrival: {formatDate(entry.arrivalDate)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carrier and Dimensions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Carrier Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{entry.carrierName || "N/A"}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>
                  Transit Time:{" "}
                  {entry.departureDate && entry.arrivalDate
                    ? Math.ceil(
                        (new Date(entry.arrivalDate).getTime() - new Date(entry.departureDate).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : "N/A"}{" "}
                  days
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Dimensions & Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dimensions (L × W × H)</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {entry.dimensions ? (
                    `${entry.dimensions.length} × ${entry.dimensions.width} × ${entry.dimensions.height} ${entry.dimensions.unit || "cm"}`
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{calculateVolume()} m³</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-900 dark:text-white leading-relaxed">
            {entry.description || "No description provided"}
          </p>
        </CardContent>
      </Card>

      {/* Items List */}
      {entry.items && entry.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Items ({entry.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {entry.items.reduce((total, item) => total + (item.quantity || 0), 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Weight</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{calculateTotalWeight()} kg</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${calculateTotalValue().toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Item Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Weight (kg)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Value ($)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{item.name || "N/A"}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.quantity || 0}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.weight || "N/A"}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {item.value ? `$${item.value.toLocaleString()}` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {item.description || "No description"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Entry Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(entry.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(entry.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}