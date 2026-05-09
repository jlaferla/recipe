import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './utils/supabase'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AddRecipe from './pages/AddRecipe'
import RecipeDetail from './pages/RecipeDetail'
import EditRecipe from './pages/EditRecipe'
import Profile from './pages/Profile'
import Login from './pages/Login'

function ProtectedRoute({ session, children }) {
  if (session === undefined) return null // still loading
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*" element={
          <ProtectedRoute session={session}>
            <Navbar session={session} />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddRecipe />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/recipe/:id/edit" element={<EditRecipe />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
