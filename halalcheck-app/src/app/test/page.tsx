'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Test Page</h1>
      <p className="text-lg text-gray-700 mb-4">
        This is a simple test page to check if Next.js is working properly.
      </p>
      <div className="bg-blue-100 p-4 rounded-lg">
        <p className="text-blue-800">
          If you can see this, Next.js is running correctly on port 3005.
        </p>
      </div>
    </div>
  )
}