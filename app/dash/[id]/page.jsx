import React from 'react'
import { useParams, useRouter } from 'next/navigation'

const page = () => {
    const params = useParams()
    const router = useRouter()
  return (
    <div>page</div>
  )
}

export default page