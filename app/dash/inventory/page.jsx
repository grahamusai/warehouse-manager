"use client"
import EntriesList from "@/components/entries-list"




export default function Inventory() {
  



 

  return (
    <div className="space-y-6">
      {/* Edit Entry Modal */}
      
      {/* Header */}
       <div>
          <h1 className="text-2xl font-bold text-[#0273ab] ">Warehouse Entries</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all warehouse entries 
          </p>
        </div>
        <EntriesList />

    
    </div>
  )
}
