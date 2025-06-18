import React from 'react'
import { useParams } from 'react-router-dom'

const URLDetails = () => {
  const { id } = useParams()
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">URL Analytics</h1>
        <p className="text-gray-600">Detailed analytics for URL ID: {id}</p>
        <p className="text-sm text-gray-500 mt-2">This page will show detailed analytics, click tracking, and form submissions.</p>
      </div>
    </div>
  )
}

export default URLDetails