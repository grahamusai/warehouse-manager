// This file would contain chart components if recharts wasn't available
// For now, we'll use a simple fallback for the charts

export const SimpleBarChart = ({ data, title }: { data: any[]; title: string }) => (
  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}</span>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${(item.value / Math.max(...data.map((d) => d.value))) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-white w-8 text-right">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)
