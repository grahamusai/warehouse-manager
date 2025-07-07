import AddEntryForm from "@/components/add-entry-form"

export default function AddEntryPage() {
  return (
   
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warehouse Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add new entries to your warehouse inventory</p>
        </div>
        <AddEntryForm />
      </div>
    
  )
}
