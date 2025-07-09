"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Plane, Ship, Warehouse, Truck, AlertCircle } from "lucide-react"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const initialFormData = {
  senderName: "",
  receiverName: "",
  mode: "", 
  origin: "", 
  destination: "", 
  carrierName: "",
  arrivalDate: "", 
  departureDate: "", 
  poNumber: "",
  invoiceNumber: "",
  images: [],
  description: "",
  items: [
    {
      itemName: "",
      weight: "",
      dimensions: { length: "", width: "", height: "" },
    },
  ],
}

export default function AddEntryForm() {
  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [error, setError] = useState("")

  const handleInputChange = (field, value, itemIdx = null, dimField = null) => {
    setError("") // Clear any previous errors
    
    if (field === "images") {
      setFormData((prev) => ({
        ...prev,
        images: Array.from(value),
      }))
      return
    }
    
    if (itemIdx !== null) {
      setFormData((prev) => {
        const items = [...prev.items]
        if (dimField) {
          items[itemIdx] = {
            ...items[itemIdx],
            dimensions: {
              ...items[itemIdx].dimensions,
              [dimField]: value,
            },
          }
        } else {
          items[itemIdx] = {
            ...items[itemIdx],
            [field]: value,
          }
        }
        return { ...prev, items }
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { itemName: "", weight: "", dimensions: { length: "", width: "", height: "" } },
      ],
    }))
  }

  const handleRemoveItem = (idx) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  // Improved image upload function with better error handling and parallel uploads
  const uploadImagesAndGetUrls = async (images, docId) => {
    if (!images || images.length === 0) return []
    
    setUploadProgress(`Uploading ${images.length} image(s)...`)
    
    try {
      // Upload all images in parallel for better performance
      const uploadPromises = Array.from(images).map(async (file, index) => {
        // Create a unique filename to avoid conflicts
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const fileName = `${timestamp}_${index}.${fileExtension}`
        
        const storageRef = ref(storage, `shipments/${docId}/${fileName}`)
        
        setUploadProgress(`Uploading image ${index + 1} of ${images.length}...`)
        
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        
        return {
          url,
          fileName: file.name,
          uploadedFileName: fileName,
          size: file.size,
          type: file.type
        }
      })
      
      const uploadedImages = await Promise.all(uploadPromises)
      setUploadProgress("")
      return uploadedImages
      
    } catch (error) {
      console.error("Error uploading images:", error)
      setUploadProgress("")
      throw new Error(`Failed to upload images: ${error.message}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setUploadProgress("")

    // Basic validation
    if (!formData.senderName || !formData.receiverName || !formData.mode || !formData.carrierName) {
      setError("Please fill in all required fields")
      setIsSubmitting(false)
      return
    }

    if (!formData.description.trim()) {
      setError("Please provide a description of the goods")
      setIsSubmitting(false)
      return
    }

    // Generate a unique 6-digit number
    const generateUniqueId = () => {
      return Math.floor(100000 + Math.random() * 900000).toString()
    }
    const docId = `Proc-${generateUniqueId()}`

    try {
      setUploadProgress("Preparing submission...")
      
      // Upload images and get URLs (if any)
      const uploadedImages = await uploadImagesAndGetUrls(formData.images, docId)
      
      setUploadProgress("Saving to database...")
      
      // Prepare data for Firestore
      const dataToSend = {
        senderName: formData.senderName,
        receiverName: formData.receiverName,
        mode: formData.mode,
        origin: formData.origin,
        destination: formData.destination,
        carrierName: formData.carrierName,
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        poNumber: formData.poNumber,
        invoiceNumber: formData.invoiceNumber,
        description: formData.description,
        images: uploadedImages, // Store image metadata including URLs
        items: formData.items.map((item) => ({
          itemName: item.itemName,
          weight: parseFloat(item.weight) || 0,
          dimensions: {
            length: parseFloat(item.dimensions.length) || 0,
            width: parseFloat(item.dimensions.width) || 0,
            height: parseFloat(item.dimensions.height) || 0,
          },
        })),
        timestamp: serverTimestamp(),
      }

      // Save to Firestore
      await setDoc(doc(db, "shipments", docId), dataToSend)
      
      setUploadProgress("")
      alert("Entry added successfully!")
      setFormData(initialFormData)
      
    } catch (error) {
      console.error("Submission error:", error)
      setError(`Failed to add entry: ${error.message}`)
      setUploadProgress("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getModeIcon = (mode) => {
    switch (mode) {
      case "Air":
        return <Plane className="w-4 h-4" />
      case "Sea":
        return <Ship className="w-4 h-4" />
      case "Road":
        return <Truck className="w-4 h-4" />
      case "Local Storage":
        return <Warehouse className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border border-gray-200 dark:border-[#1F1F23]">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <Package className="w-5 h-5" />
            Add New Warehouse Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {uploadProgress && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{uploadProgress}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PO Number and Invoice Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="poNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  PO Number
                </Label>
                <Input
                  id="poNumber"
                  type="text"
                  value={formData.poNumber}
                  onChange={(e) => handleInputChange("poNumber", e.target.value)}
                  placeholder="Enter PO Number"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Number
                </Label>
                <Input
                  id="invoiceNumber"
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                  placeholder="Enter Invoice Number"
                  className="w-full"
                />
              </div>
            </div>

            {/* Sender and Receiver Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="senderName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sender Name *
                </Label>
                <Input
                  id="senderName"
                  type="text"
                  value={formData.senderName}
                  onChange={(e) => handleInputChange("senderName", e.target.value)}
                  placeholder="Enter sender's name"
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiverName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Receiver Name *
                </Label>
                <Input
                  id="receiverName"
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) => handleInputChange("receiverName", e.target.value)}
                  placeholder="Enter receiver's name"
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Mode of Transport and Carrier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mode of Transport *
                </Label>
                <Select value={formData.mode} onValueChange={(value) => handleInputChange("mode", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mode">
                      {formData.mode && (
                        <div className="flex items-center gap-2">
                          {getModeIcon(formData.mode)}
                          <span>{formData.mode}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Air">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4" />
                        <span>Air</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Sea">
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4" />
                        <span>Sea</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Road">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <span>Road</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Local Storage">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4" />
                        <span>Local Storage</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrierName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Carrier Name *
                </Label>
                <Input
                  id="carrierName"
                  type="text"
                  value={formData.carrierName}
                  onChange={(e) => handleInputChange("carrierName", e.target.value)}
                  placeholder="Enter carrier's name"
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Origin and Destination Cities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Origin City *
                </Label>
                <Input
                  id="origin"
                  type="text"
                  value={formData.origin}
                  onChange={(e) => handleInputChange("origin", e.target.value)}
                  placeholder="Enter origin city"
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Destination City *
                </Label>
                <Input
                  id="destination"
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange("destination", e.target.value)}
                  placeholder="Enter destination city"
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Arrival and Departure Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="arrivalDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date of Arrival *
                </Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => handleInputChange("arrivalDate", e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date of Departure
                </Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange("departureDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Items *</Label>
              {formData.items.map((item, idx) => (
                <div key={idx} className="border rounded-md p-4 mb-2 bg-gray-50 dark:bg-[#23232a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Item {idx + 1}</span>
                    {formData.items.length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveItem(idx)}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`itemName-${idx}`}>Item Name *</Label>
                      <Input
                        id={`itemName-${idx}`}
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleInputChange("itemName", e.target.value, idx)}
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`weight-${idx}`}>Weight (kg) *</Label>
                      <Input
                        id={`weight-${idx}`}
                        type="number"
                        step="0.01"
                        value={item.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value, idx)}
                        placeholder="Enter weight"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dimensions (cm) *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.dimensions.length}
                          onChange={(e) => handleInputChange(null, e.target.value, idx, "length")}
                          placeholder="L"
                          required
                          className="w-16"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={item.dimensions.width}
                          onChange={(e) => handleInputChange(null, e.target.value, idx, "width")}
                          placeholder="W"
                          required
                          className="w-16"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={item.dimensions.height}
                          onChange={(e) => handleInputChange(null, e.target.value, idx, "height")}
                          placeholder="H"
                          required
                          className="w-16"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddItem}>
                + Add Another Item
              </Button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description of Goods *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter detailed description of the goods"
                required
                rows={4}
                className="w-full resize-none"
              />
            </div>

            {/* Images Upload */}
            <div className="space-y-2">
              <Label htmlFor="images" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Images (Optional)
              </Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleInputChange("images", e.target.files)}
                className="w-full"
              />
              {formData.images && formData.images.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Selected files ({formData.images.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(formData.images).map((file, idx) => (
                      <span key={idx} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2 bg-[#0071a9] text-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {uploadProgress || "Adding Entry..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Add Entry
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}