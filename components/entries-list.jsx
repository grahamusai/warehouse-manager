"use client";

import { useEffect, useState, useMemo } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Package,
  Plane,
  Ship,
  Warehouse,
  Eye,
  Edit,
  Trash2,
  Truck,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusColors = {
  Pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Transit":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const modeIcons = {
  Air: Plane,
  Sea: Ship,
  Road: Truck,
  "Local Storage": Warehouse,
};

export default function EntriesList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dateCreated");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [entryToView, setEntryToView] = useState(null);

  // Function to fetch images from Firebase Storage
  const fetchImagesForEntry = async (entryId) => {
    try {
      const imagesRef = ref(storage, `shipments/${entryId}`);
      const imagesList = await listAll(imagesRef);

      const imageUrls = await Promise.all(
        imagesList.items.map(async (imageRef) => {
          const url = await getDownloadURL(imageRef);
          return url;
        })
      );

      return imageUrls;
    } catch (error) {
      console.error(`Error fetching images for entry ${entryId}:`, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, "shipments"));
        const entriesData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const d = doc.data();
            // Extract from first item in items array if present
            const firstItem =
              Array.isArray(d.items) && d.items.length > 0 ? d.items[0] : {};

            // Fetch images for this entry
            const images = await fetchImagesForEntry(doc.id);

            return {
              id: doc.id,
              senderName: d.senderName || "",
              receiverName: d.receiverName || "",
              origin: d.origin || "",
              destination: d.destination || "",
              mode: d.mode || "",
              poNumber: d.poNumber || "",
              carrierName: d.carrierName || "",
              status: d.status || "Pending",
              trackingNumber: d.trackingNumber || "-",
              arrivalDate: d.arrivalDate || "",
              departureDate: d.departureDate || "",
              // Items fields from the first item
              itemName: firstItem.itemName || "",
              weight: firstItem.weight || 0,
              numberOfPieces: d.items ? d.items.length : 0,
              dimensions: firstItem.dimensions || {
                length: 0,
                width: 0,
                height: 0,
              },
              description: d.description || "",
              // Handle Firestore timestamp properly
              dateCreated:
                d.timestamp && d.timestamp._seconds
                  ? new Date(d.timestamp._seconds * 1000).toISOString()
                  : d.timestamp?.toDate
                  ? d.timestamp.toDate().toISOString()
                  : new Date().toISOString(),
              // Store all items for viewing
              items: d.items || [],
              // Store fetched images
              images: images.map((url) => {
                // If the URL is already a full URL, use it as-is
                if (url.startsWith("http")) return url;
                // Otherwise, construct the proper download URL
                return `https://firebasestorage.googleapis.com/v0/b/warehouse-75d3e.appspot.com/o/${encodeURIComponent(
                  url
                )}?alt=media`;
              }),
            };
          })
        );
        setEntries(entriesData);
      } catch (err) {
        console.error("Error fetching entries:", err);
        setError("Failed to load entries.");
      }
      setLoading(false);
    };
    fetchEntries();
  }, []);

  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter((entry) => {
      const matchesSearch =
        entry.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.itemName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || entry.status === statusFilter;
      const matchesOrigin =
        originFilter === "all" || entry.origin === originFilter;

      return matchesSearch && matchesStatus && matchesOrigin;
    });

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dateCreated":
          return (
            new Date(b.dateCreated).getTime() -
            new Date(a.dateCreated).getTime()
          );
        case "weight":
          return b.weight - a.weight;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [entries, searchTerm, statusFilter, originFilter, sortBy]);

  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "shipments", entryToDelete.id));
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      setDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      console.error("Error deleting entry:", err);
      alert("Failed to delete entry.");
    }
    setDeleting(false);
  };

  const handleEditClick = (entry) => {
    setEntryToEdit(entry);
    setEditForm({ ...entry });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormDimensionsChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [name]: value },
    }));
  };

  const handleSaveEdit = async () => {
    if (!entryToEdit) return;
    setSaving(true);
    try {
      const docRef = doc(db, "shipments", entryToEdit.id);

      // Update the document with the structure matching your JSON
      const updateData = {
        senderName: editForm.senderName,
        receiverName: editForm.receiverName,
        origin: editForm.origin,
        destination: editForm.destination,
        mode: editForm.mode,
        poNumber: editForm.poNumber,
        carrierName: editForm.carrierName,
        arrivalDate: editForm.arrivalDate,
        departureDate: editForm.departureDate,
        items: [
          {
            itemName: editForm.itemName,
            weight: Number(editForm.weight),
            dimensions: {
              length: Number(editForm.dimensions.length),
              width: Number(editForm.dimensions.width),
              height: Number(editForm.dimensions.height),
            },
          },
        ],
      };

      // Only add status and trackingNumber if they exist
      if (editForm.status) updateData.status = editForm.status;
      if (editForm.trackingNumber)
        updateData.trackingNumber = editForm.trackingNumber;
      if (editForm.description) updateData.description = editForm.description;

      await updateDoc(docRef, updateData);

      setEntries((prev) =>
        prev.map((e) => (e.id === entryToEdit.id ? { ...e, ...editForm } : e))
      );
      setEditModalOpen(false);
      setEntryToEdit(null);
    } catch (err) {
      console.error("Error updating entry:", err);
      alert("Failed to update entry.");
    }
    setSaving(false);
  };

  const handleViewClick = (entry) => {
    setEntryToView(entry);
    setViewModalOpen(true);
  };

  const formatDimensions = (dimensions) => {
    if (!dimensions) return "N/A";
    return `${dimensions.length || 0} × ${dimensions.width || 0} × ${
      dimensions.height || 0
    } cm`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get unique origins for filter
  const uniqueOrigins = [
    ...new Set(entries.map((entry) => entry.origin).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error loading entries
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Entry Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Entry Details</DialogTitle>
            <DialogDescription>
              View all details for this entry.
            </DialogDescription>
          </DialogHeader>
          {entryToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">ID:</span> {entryToView.id}
                </div>
                <div>
                  <span className="font-semibold">Sender Name:</span>{" "}
                  {entryToView.senderName}
                </div>
                <div>
                  <span className="font-semibold">Receiver Name:</span>{" "}
                  {entryToView.receiverName}
                </div>
                <div>
                  <span className="font-semibold">Origin:</span>{" "}
                  {entryToView.origin}
                </div>
                <div>
                  <span className="font-semibold">Destination:</span>{" "}
                  {entryToView.destination}
                </div>
                <div>
                  <span className="font-semibold">Mode of Transport:</span>{" "}
                  {entryToView.mode}
                </div>
                <div>
                  <span className="font-semibold">Carrier Name:</span>{" "}
                  {entryToView.carrierName}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  {entryToView.status}
                </div>
                <div>
                  <span className="font-semibold">Arrival Date:</span>{" "}
                  {formatDate(entryToView.arrivalDate)}
                </div>
                <div>
                  <span className="font-semibold">Departure Date:</span>{" "}
                  {formatDate(entryToView.departureDate)}
                </div>
                <div>
                  <span className="font-semibold">PO Number:</span>{" "}
                  {entryToView.poNumber}
                </div>
                <div>
                  <span className="font-semibold">Date Created:</span>{" "}
                  {formatDate(entryToView.dateCreated)}
                </div>
              </div>

              {/* Images Section */}
              {entryToView.images && entryToView.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Images</h4>
                  <div className="flex flex-wrap gap-2">
                    {entryToView.images.map((url, idx) => {
                      // Ensure URL is properly formatted
                      const imageUrl = url.startsWith("http")
                        ? url
                        : `https://firebasestorage.googleapis.com/v0/b/warehouse-75d3e.appspot.com/o/${encodeURIComponent(
                            url
                          )}?alt=media`;

                      return (
                        <a
                          key={idx}
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={imageUrl}
                            alt={`Entry Image ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded border"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder-image.png"; // fallback image
                            }}
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items Section */}
              <div>
                <h4 className="font-semibold mb-2">
                  Items ({entryToView.items.length})
                </h4>
                <div className="space-y-2">
                  {entryToView.items.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded p-3 bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Item Name:</span>{" "}
                          {item.itemName}
                        </div>
                        <div>
                          <span className="font-medium">Weight:</span>{" "}
                          {item.weight} kg
                        </div>
                        <div>
                          <span className="font-medium">Dimensions:</span>{" "}
                          {formatDimensions(item.dimensions)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>
              Edit the details and save changes.
            </DialogDescription>
          </DialogHeader>
          {entryToEdit && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sender Name</Label>
                  <Input
                    name="senderName"
                    value={editForm.senderName || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <Label>Receiver Name</Label>
                  <Input
                    name="receiverName"
                    value={editForm.receiverName || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <Label>Origin</Label>
                  <Input
                    name="origin"
                    value={editForm.origin || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input
                    name="destination"
                    value={editForm.destination || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <Label>Mode of Transport</Label>
                  <Select
                    value={editForm.mode || ""}
                    onValueChange={(val) =>
                      setEditForm((f) => ({ ...f, mode: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Air">Air</SelectItem>
                      <SelectItem value="Sea">Sea</SelectItem>
                      <SelectItem value="Road">Road</SelectItem>
                      <SelectItem value="Local Storage">
                        Local Storage
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Carrier Name</Label>
                  <Input
                    name="carrierName"
                    value={editForm.carrierName || ""}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <Label>Arrival Date</Label>
                  <Input
                    name="arrivalDate"
                    type="date"
                    value={editForm.arrivalDate || ""}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <Label>Departure Date</Label>
                  <Input
                    name="departureDate"
                    type="date"
                    value={editForm.departureDate || ""}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <Label>Item Name</Label>
                  <Input
                    name="itemName"
                    value={editForm.itemName || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    name="weight"
                    type="number"
                    min="0"
                    value={editForm.weight || 0}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Dimensions (cm)</Label>
                  <div className="flex gap-2">
                    <Input
                      name="length"
                      type="number"
                      min="0"
                      placeholder="Length"
                      value={editForm.dimensions?.length || 0}
                      onChange={handleEditFormDimensionsChange}
                      required
                    />
                    <Input
                      name="width"
                      type="number"
                      min="0"
                      placeholder="Width"
                      value={editForm.dimensions?.width || 0}
                      onChange={handleEditFormDimensionsChange}
                      required
                    />
                    <Input
                      name="height"
                      type="number"
                      min="0"
                      placeholder="Height"
                      value={editForm.dimensions?.height || 0}
                      onChange={handleEditFormDimensionsChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editForm.status || "Pending"}
                    onValueChange={(val) =>
                      setEditForm((f) => ({ ...f, status: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PO Number</Label>
                  <Input
                    name="poNumber"
                    value={editForm.poNumber || ""}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Origin
              </label>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All origins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Origins</SelectItem>
                  {uniqueOrigins.map((origin) => (
                    <SelectItem key={origin} value={origin}>
                      {origin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort By
              </label>
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
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Loading entries...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender/Receiver</TableHead>
                    <TableHead>Origin → Destination</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Item Details</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map((entry) => {
                    const ModeIcon = modeIcons[entry.mode];
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              From: {entry.senderName}
                            </div>
                            <div className="text-sm text-gray-600">
                              To: {entry.receiverName}
                            </div>
                            {entry.trackingNumber !== "-" && (
                              <div className="text-xs text-gray-500">
                                Track: {entry.trackingNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {entry.origin}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-sm">{entry.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {ModeIcon && (
                              <ModeIcon className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-sm">{entry.mode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {/* Show first image thumbnail if available */}
                            {entry.images && entry.images.length > 0 && (
                              <div className="relative group">
                                <img
                                  src={entry.images[0]}
                                  alt="Entry Thumbnail"
                                  className="w-12 h-12 object-cover rounded border mb-1 cursor-pointer hover:opacity-75 transition-opacity"
                                  onClick={() =>
                                    window.open(entry.images[0], "_blank")
                                  }
                                />
                                {entry.images.length > 1 && (
                                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {entry.images.length}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="text-sm font-medium">
                              {entry.itemName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.weight} kg
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDimensions(entry.dimensions)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.numberOfPieces} piece(s)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.carrierName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[entry.status] ||
                              statusColors["Pending"]
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="font-medium">Dep:</span>{" "}
                              {formatDate(entry.departureDate)}
                            </div>
                            <div>
                              <span className="font-medium">Arr:</span>{" "}
                              {formatDate(entry.arrivalDate)}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span>{" "}
                              {formatDate(entry.dateCreated)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewClick(entry)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditClick(entry)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(entry)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && !error && filteredAndSortedEntries.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No entries found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No warehouse entries match your current filters.
              </p>
              <Link href="/dash/add-entry">
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
  );
}
