import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import QuienesSomos from "@/pages/QuienesSomos";
import FAQ from "@/pages/FAQ";
import Legales from "@/pages/Legales";
import Precios from "@/pages/Precios";
import Registro from "@/pages/Registro";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CrearCasting from "@/pages/CrearCasting";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quienes-somos" element={<QuienesSomos />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/legales" element={<Legales />} />
              <Route path="/precios" element={<Precios />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/crear-casting" element={<CrearCasting />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
