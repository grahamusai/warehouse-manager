"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Plane, Ship, Warehouse, Truck } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore"

const initialFormData = {
  senderName: "",
  receiverName: "",
  mode: "", 
  origin: "", 
  destination: "", 
  weight: "",
  numberOfPieces: "",
  dimensions: {
    length: "",
    width: "",
    height: "",
  },
  description: "",
  carrierName: "",
  arrivalDate: "", 
  departureDate: "", 
}

export default function AddEntryForm() {
  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field, value) => {
    if (field.startsWith("dimensions.")) {
      const dimensionField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Generate a unique 6-digit number
    const generateUniqueId = () => {
      return Math.floor(100000 + Math.random() * 900000).toString()
    }
    const docId = `Proc-${generateUniqueId()}`

    try {
      // Prepare data for Firestore
      const dataToSend = {
        senderName: formData.senderName,
        receiverName: formData.receiverName,
        mode: formData.mode, // changed from origin
        origin: formData.origin, // new field
        destination: formData.destination, // new field
        weight: parseFloat(formData.weight),
        pieces: parseInt(formData.numberOfPieces, 10),
        dimensions: {
          length: parseFloat(formData.dimensions.length),
          width: parseFloat(formData.dimensions.width),
          height: parseFloat(formData.dimensions.height),
        },
        description: formData.description,
        carrierName: formData.carrierName,
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        timestamp: serverTimestamp(),
      }
      await setDoc(doc(collection(db, "shipments"), docId), dataToSend)
      alert("Entry added successfully!")
      setFormData(initialFormData)
    } catch (error) {
      alert("Failed to add entry: " + error.message)
    }
    setIsSubmitting(false)
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
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Arrival Date */}
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

            {/* Weight and Number of Pieces */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weight (kg) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="Enter weight in kg"
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfPieces" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of Pieces *
                </Label>
                <Input
                  id="numberOfPieces"
                  type="number"
                  min="1"
                  value={formData.numberOfPieces}
                  onChange={(e) => handleInputChange("numberOfPieces", e.target.value)}
                  placeholder="Enter number of pieces"
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dimensions (cm) *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dimensions.length}
                    onChange={(e) => handleInputChange("dimensions.length", e.target.value)}
                    placeholder="Length"
                    required
                    className="w-full"
                  />
                  <Label className="text-xs text-gray-500 dark:text-gray-400 mt-1">Length</Label>
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dimensions.width}
                    onChange={(e) => handleInputChange("dimensions.width", e.target.value)}
                    placeholder="Width"
                    required
                    className="w-full"
                  />
                  <Label className="text-xs text-gray-500 dark:text-gray-400 mt-1">Width</Label>
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dimensions.height}
                    onChange={(e) => handleInputChange("dimensions.height", e.target.value)}
                    placeholder="Height"
                    required
                    className="w-full"
                  />
                  <Label className="text-xs text-gray-500 dark:text-gray-400 mt-1">Height</Label>
                </div>
              </div>
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

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2 bg-[#0071a9]  text-zinc-50  hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Adding Entry...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 ">
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
