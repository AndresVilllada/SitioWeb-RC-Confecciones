import { HashRouter, Route, Routes } from "react-router-dom";
import { DatosProvider } from "./context/DatosContext";
import { AdminProvider } from "./context/AdminContext";
import Layout from "./components/Layout";
import LayoutAdmin from "./components/LayoutAdmin";
import Inicio from "./pages/Inicio";
import Nosotros from "./pages/Nosotros";
import Catalogo from "./pages/Catalogo";
import Tienda from "./pages/Tienda";
import Cotizaciones from "./pages/Cotizaciones";
import Contacto from "./pages/Contacto";
import Admin from "./pages/admin/Admin";
import NoEncontrada from "./pages/NoEncontrada";

/* Cada módulo es una página (ruta). HashRouter usa direcciones como  #/tienda ,
   que funcionan en cualquier hosting sin configuración extra. */
export default function App() {
  return (
    <DatosProvider>
      <AdminProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Inicio />} />
              <Route path="nosotros" element={<Nosotros />} />
              <Route path="catalogo" element={<Catalogo />} />
              <Route path="tienda" element={<Tienda />} />
              <Route path="cotizaciones" element={<Cotizaciones />} />
              <Route path="contacto" element={<Contacto />} />
              <Route path="*" element={<NoEncontrada />} />
            </Route>
            {/* El acceso y el panel del administrador son una página aparte, sin el menú ni el pie del sitio */}
            <Route path="admin" element={<LayoutAdmin />}>
              <Route index element={<Admin />} />
            </Route>
          </Routes>
        </HashRouter>
      </AdminProvider>
    </DatosProvider>
  );
}
