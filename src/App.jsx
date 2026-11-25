// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  Utensils, ShoppingCart, ClipboardList, User, Search, Plus, Minus,
  Trash2, Clock, CheckCircle2, ChefHat, LogOut, AlertCircle, Store, Edit2, X
} from 'lucide-react';
import {
  getDB, loginUser, registerCliente, crearPedido,
  actualizarEstadoPedido, toggleDisponibilidadProducto,
  addProducto, updateProducto, deleteProducto, cancelarPedido,
  getCarritoUsuario, saveCarritoUsuario
} from './database/db';
import './styles/theme.css';

export default function App() {
  const [db, setDb] = useState(getDB());
  const [usuario, setUsuario] = useState(null);
  const [modoRegistro, setModoRegistro] = useState(false);

  // Estados de navegación
  const [tabCliente, setTabCliente] = useState('MENU');
  const [tabStaff, setTabStaff] = useState('ADMIN_MENU');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Estados de formulario Login/Registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreReg, setNombreReg] = useState('');
  const [telReg, setTelReg] = useState('');

  // Estados de Catálogo y Carrito
  const [categoriaActiva, setCategoriaActiva] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [carritoCargado, setCarritoCargado] = useState(false);
  const [cantidadDetalle, setCantidadDetalle] = useState(1);
  const [notasDetalle, setNotasDetalle] = useState('');

  // Estados de Confirmación de Pedido
  const [modalidad, setModalidad] = useState('EN_MESA');
  const [numeroMesa, setNumeroMesa] = useState('');

  // Estados de Formulario Platillo (Crear / Editar Admin - RF-05)
  const [mostrarFormPlatillo, setMostrarFormPlatillo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formPlatillo, setFormPlatillo] = useState({
    nombre: '',
    id_categoria: 2,
    descripcion: '',
    precio: '',
    tiempo_prep_min: 15,
    url_imagen: ''
  });

  // Notificación flotante
  const [toast, setToast] = useState('');

  // Cargar el carrito guardado del usuario al iniciar sesión
  useEffect(() => {
    if (usuario && usuario.rol === 'CLIENTE') {
      const claveCarrito = usuario.esInvitado ? 'guest' : usuario.id_usuario;
      const guardado = getCarritoUsuario(claveCarrito);
      setCarrito(guardado);
      setCarritoCargado(true);
    } else {
      setCarritoCargado(false);
    }
  }, [usuario]);

  // Guardar automáticamente solo después de haber cargado el carrito del usuario
  useEffect(() => {
    if (usuario && usuario.rol === 'CLIENTE' && carritoCargado) {
      const claveCarrito = usuario.esInvitado ? 'guest' : usuario.id_usuario;
      saveCarritoUsuario(claveCarrito, carrito);
    }
  }, [carrito, usuario, carritoCargado]);
  useEffect(() => {
    const sincronizar = () => setDb(getDB());

    // Detecta cambios hechos en otras pestañas/dispositivos al instante
    window.addEventListener('storage', sincronizar);

    // Verifica actualizaciones cada 2 segundos en la misma sesión
    const intervalo = setInterval(sincronizar, 2000);

    return () => {
      window.removeEventListener('storage', sincronizar);
      clearInterval(intervalo);
    };
  }, []);

  const refrescarDB = () => setDb(getDB());

  const notificar = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const limpiarCamposAuth = () => {
    setEmail('');
    setPassword('');
    setNombreReg('');
    setTelReg('');
  };

  // --- ACCIONES DE AUTENTICACIÓN ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = loginUser(email, password);
    if (!user) {
      notificar('Usuario no encontrado. Verifica tus datos o crea una cuenta.');
      return;
    }
    limpiarCamposAuth();
    setUsuario(user);
    setTabCliente('MENU');
    setTabStaff('ADMIN_MENU');
  };

  const handleAccesoRapido = (rol) => {
    const user = db.USUARIOS.find(u => u.rol === rol);
    limpiarCamposAuth();
    setUsuario(user);
    setTabCliente('MENU');
    setTabStaff('ADMIN_MENU');
  };

  const handleInvitado = () => {
    limpiarCamposAuth();
    setUsuario({ id_usuario: `guest_${Date.now()}`, nombre: 'Comensal Invitado', rol: 'CLIENTE', esInvitado: true });
    setTabCliente('MENU');
  };

  const handleRegistro = (e) => {
    e.preventDefault();
    try {
      const nuevo = registerCliente(nombreReg, email, telReg, password);
      limpiarCamposAuth();
      refrescarDB();
      setUsuario(nuevo);
      setModoRegistro(false);
      notificar('¡Cuenta creada con éxito!');
    } catch (err) {
      notificar(err.message);
    }
  };

  const handleCerrarSesion = () => {
    limpiarCamposAuth();
    setProductoSeleccionado(null);
    setUsuario(null);
  };

  // --- ACCIONES DE CARRITO ---
  const abrirDetalle = (prod) => {
    if (!prod.disponible) return;
    setProductoSeleccionado(prod);
    setCantidadDetalle(1);
    setNotasDetalle('');
  };

  const agregarAlCarrito = () => {
    const item = {
      id_carrito: Date.now(),
      id_producto: productoSeleccionado.id_producto,
      nombre: productoSeleccionado.nombre,
      precio: productoSeleccionado.precio,
      url_imagen: productoSeleccionado.url_imagen,
      cantidad: cantidadDetalle,
      notas: notasDetalle.trim()
    };
    setCarrito([...carrito, item]);
    setProductoSeleccionado(null);
    notificar(`Agregado: ${item.nombre}`);
  };

  const eliminarDelCarrito = (id_carrito) => {
    setCarrito(carrito.filter(i => i.id_carrito !== id_carrito));
  };

  const actualizarCantidadCarrito = (id_carrito, delta) => {
    setCarrito(prev =>
      prev.map(item => {
        if (item.id_carrito === id_carrito) {
          const nuevaCantidad = Math.max(1, item.cantidad + delta);
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      })
    );
  };

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const handleConfirmarPedido = () => {
    try {
      const pedido = crearPedido({
        id_usuario: usuario.id_usuario,
        modalidad,
        numero_mesa: numeroMesa,
        carrito
      });
      setCarrito([]);
      setNumeroMesa('');
      refrescarDB();
      setTabCliente('PEDIDOS');
      notificar(`¡Pedido ${pedido.folio} enviado a cocina!`);
    } catch (err) {
      notificar(err.message);
    }
  };

  // --- ACCIONES ADMIN PLATILLOS (CREAR, EDITAR, ELIMINAR - RF-05) ---
  const abrirCrearPlatillo = () => {
    setEditandoId(null);
    setFormPlatillo({
      nombre: '',
      id_categoria: 2,
      descripcion: '',
      precio: '',
      tiempo_prep_min: 15,
      url_imagen: ''
    });
    setMostrarFormPlatillo(true);
  };

  const abrirEditarPlatillo = (prod) => {
    setEditandoId(prod.id_producto);
    setFormPlatillo({
      nombre: prod.nombre,
      id_categoria: prod.id_categoria,
      descripcion: prod.descripcion || '',
      precio: prod.precio,
      tiempo_prep_min: prod.tiempo_prep_min,
      url_imagen: prod.url_imagen || ''
    });
    setMostrarFormPlatillo(true);
  };

  const handleGuardarPlatillo = (e) => {
    e.preventDefault();
    if (!formPlatillo.nombre.trim() || Number(formPlatillo.precio) <= 0) {
      notificar('Verifica el nombre y un precio mayor a 0');
      return;
    }

    if (editandoId) {
      updateProducto(editandoId, formPlatillo);
      notificar('Platillo actualizado correctamente');
    } else {
      addProducto(formPlatillo);
      notificar('Platillo agregado al catálogo');
    }

    setMostrarFormPlatillo(false);
    setEditandoId(null);
    refrescarDB();
  };

  const handleEliminarPlatillo = (prod) => {
    deleteProducto(prod.id_producto);
    refrescarDB();
    notificar(`Eliminado: ${prod.nombre}`);
  };

  // --- PANTALLA 1: LOGIN / REGISTRO ---
  if (!usuario) {
    return (
      <div className="mobile-shell">
        {toast && <div className="toast">{toast}</div>}
        <div className="content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ background: 'var(--primary)', color: 'white', width: 64, height: 64, borderRadius: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Utensils size={34} />
            </div>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>SaborExpress</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sistema de Pedidos para Restaurante</p>
          </div>

          {!modoRegistro ? (
            <form onSubmit={handleLogin} className="card">
              <div className="input-group">
                <label>Correo electrónico</label>
                <input className="input" type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Contraseña</label>
                <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginBottom: 10 }}>Iniciar sesión</button>
              <button type="button" onClick={handleInvitado} className="btn btn-outline" style={{ marginBottom: 12 }}>Continuar como invitado</button>
              <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                ¿No tienes cuenta?{' '}
                <span onClick={() => { limpiarCamposAuth(); setModoRegistro(true); }} style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Crear cuenta</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegistro} className="card">
              <h3 style={{ marginBottom: 12 }}>Registro de Cliente</h3>
              <div className="input-group">
                <label>Nombre completo</label>
                <input className="input" value={nombreReg} onChange={e => setNombreReg(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Correo electrónico</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input className="input" type="tel" value={telReg} onChange={e => setTelReg(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Contraseña</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginBottom: 8 }}>Registrarme</button>
              <button type="button" onClick={() => { limpiarCamposAuth(); setModoRegistro(false); }} className="btn btn-outline">Volver al inicio</button>
            </form>
          )}

          {/* Botones de acceso directo para Cocina y Admin */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => handleAccesoRapido('COCINA')} className="btn btn-sm btn-secondary" style={{ flex: 1 }}>
              <ChefHat size={16} /> Cocina
            </button>
            <button onClick={() => handleAccesoRapido('ADMIN')} className="btn btn-sm btn-primary" style={{ flex: 1 }}>
              <Store size={16} /> Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FLUJO DEL CLIENTE (COMENSAL) ---
  if (usuario.rol === 'CLIENTE') {
    const productosFiltrados = db.PRODUCTOS.filter(p => {
      const coincideCat = categoriaActiva === 0 || p.id_categoria === categoriaActiva;
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return coincideCat && coincideTexto;
    });

    const misPedidos = db.PEDIDOS.filter(ped => ped.id_usuario === usuario.id_usuario);

    return (
      <div className="mobile-shell">
        {toast && <div className="toast">{toast}</div>}
        <header className="app-header">
          <h1><Utensils size={20} /> SaborExpress</h1>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{usuario.nombre.split(' ')[0]}</span>
        </header>

        <div className="content">
          {/* MODAL DETALLE DE PLATILLO */}
          {productoSeleccionado && (
            <div className="card" style={{ border: '2px solid var(--primary)' }}>
              <img src={productoSeleccionado.url_imagen} alt={productoSeleccionado.nombre} style={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{productoSeleccionado.nombre}</h3>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>${productoSeleccionado.precio.toFixed(2)}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 12px' }}>{productoSeleccionado.descripcion}</p>

              <div className="input-group">
                <label>Notas especiales para cocina (opcional)</label>
                <input className="input" placeholder="Ej. Sin cebolla, salsa aparte..." value={notasDetalle} onChange={e => setNotasDetalle(e.target.value)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 600 }}>Cantidad:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => setCantidadDetalle(Math.max(1, cantidadDetalle - 1))}><Minus size={16} /></button>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cantidadDetalle}</span>
                  <button className="btn btn-sm btn-outline" onClick={() => setCantidadDetalle(cantidadDetalle + 1)}><Plus size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" onClick={() => setProductoSeleccionado(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={agregarAlCarrito}>
                  Agregar (${(productoSeleccionado.precio * cantidadDetalle).toFixed(2)})
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: CATÁLOGO DE PRODUCTOS (RF-03 y RF-04) */}
          {tabCliente === 'MENU' && !productoSeleccionado && (
            <>
              <div className="input-group" style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: 38 }} placeholder="Buscar platillo o bebida..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>

              <div className="chips-row">
                <button className={`chip ${categoriaActiva === 0 ? 'active' : ''}`} onClick={() => setCategoriaActiva(0)}>Todos</button>
                {db.CATEGORIAS.map(cat => (
                  <button key={cat.id_categoria} className={`chip ${categoriaActiva === cat.id_categoria ? 'active' : ''}`} onClick={() => setCategoriaActiva(cat.id_categoria)}>
                    {cat.nombre}
                  </button>
                ))}
              </div>

              {productosFiltrados.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron productos con ese filtro.
                </div>
              ) : (
                productosFiltrados.map(prod => (
                  <div key={prod.id_producto} className="card dish-card">
                    <img src={prod.url_imagen} alt={prod.nombre} className="dish-img" />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.98rem' }}>{prod.nombre}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0' }}>{prod.descripcion}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>${prod.precio.toFixed(2)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                            <Clock size={12} style={{ verticalAlign: 'middle' }} /> {prod.tiempo_prep_min}m
                          </span>
                        </div>
                        {prod.disponible ? (
                          <button className="btn btn-sm btn-primary" onClick={() => abrirDetalle(prod)}>
                            <Plus size={16} /> Agregar
                          </button>
                        ) : (
                          <span className="badge badge-red">Agotado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 2: CARRITO DE COMPRAS */}
          {tabCliente === 'CARRITO' && (
            <>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Mi Carrito de Compras</h2>
              {carrito.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 30 }}>
                  <ShoppingCart size={40} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <p style={{ color: 'var(--text-muted)' }}>Tu carrito está vacío.</p>
                  <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setTabCliente('MENU')}>Explorar Menú</button>
                </div>
              ) : (
                <>
                  {carrito.map(item => (
                    <div key={item.id_carrito} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <h4>{item.nombre}</h4>
                        {item.notas && <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Nota: {item.notas}</p>}
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          ${(item.precio * item.cantidad).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                          (${item.precio.toFixed(2)} c/u)
                        </span>

                        {/* Selector de cantidad (+ / -) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{ padding: '4px 8px' }}
                            onClick={() => actualizarCantidadCarrito(item.id_carrito, -1)}
                            disabled={item.cantidad <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{ padding: '4px 8px' }}
                            onClick={() => actualizarCantidadCarrito(item.id_carrito, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => eliminarDelCarrito(item.id_carrito)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 6 }}
                        title="Eliminar del carrito"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}

                  <div className="card">
                    <h4 style={{ marginBottom: 10 }}>Modalidad de Entrega</h4>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button type="button" className={`btn btn-sm ${modalidad === 'EN_MESA' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setModalidad('EN_MESA')}>En mesa</button>
                      <button type="button" className={`btn btn-sm ${modalidad === 'PARA_LLEVAR' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setModalidad('PARA_LLEVAR')}>Para llevar</button>
                    </div>

                    {modalidad === 'EN_MESA' && (
                      <div className="input-group">
                        <label>Número de mesa</label>
                        <input className="input" type="number" placeholder="Ej. 4" value={numeroMesa} onChange={e => setNumeroMesa(e.target.value)} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                      <span>Total a pagar:</span>
                      <span style={{ color: 'var(--primary)' }}>${totalCarrito.toFixed(2)}</span>
                    </div>
                  </div>

                  <button className="btn btn-secondary" onClick={handleConfirmarPedido}>
                    <CheckCircle2 size={18} /> Confirmar y enviar pedido
                  </button>
                </>
              )}
            </>
          )}

          {/* TAB 3: SEGUIMIENTO DE PEDIDOS EN TIEMPO REAL */}
          {tabCliente === 'PEDIDOS' && (
            <>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Seguimiento de Pedidos</h2>
              {misPedidos.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 30 }}>
                  <ClipboardList size={40} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <p style={{ color: 'var(--text-muted)' }}>Aún no has realizado ningún pedido.</p>
                  <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setTabCliente('MENU')}>Ver Menú</button>
                </div>
              ) : (
                misPedidos.map(ped => {
                  const detalles = db.DETALLE_PEDIDO.filter(d => d.id_pedido === ped.id_pedido);
                  const estados = ['RECIBIDO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];
                  const idxActual = estados.indexOf(ped.estado);

                  return (
                    <div key={ped.id_pedido} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong>{ped.folio} ({ped.numero_mesa})</strong>
                        <span className="badge badge-orange">${ped.total.toFixed(2)}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>{ped.fecha_hora}</p>

                      <div style={{ marginBottom: 12 }}>
                        {[
                          { key: 'RECIBIDO', label: '1. Pedido Recibido' },
                          { key: 'EN_PREPARACION', label: '2. En preparación en cocina' },
                          { key: 'LISTO', label: '3. Listo para entrega / mesa' },
                          { key: 'ENTREGADO', label: '4. Entregado' }
                        ].map((step, i) => (
                          <div key={step.key} className={`stepper-item ${i < idxActual ? 'done' : i === idxActual ? 'active' : ''}`}>
                            <span>{step.label}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: 'var(--bg)', padding: 8, borderRadius: 8, fontSize: '0.85rem' }}>
                        {detalles.map(d => {
                          const p = db.PRODUCTOS.find(prod => prod.id_producto === d.id_producto);
                          return (
                            <div key={d.id_detalle}>
                              • {d.cantidad}x {p ? p.nombre : 'Producto eliminado'} {d.notas_especiales && <em>({d.notas_especiales})</em>}
                            </div>
                          );
                        })}
                      </div>

                      {ped.estado === 'RECIBIDO' && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ marginTop: 10, borderColor: 'var(--danger)', color: 'var(--danger)' }}
                          onClick={() => {
                            cancelarPedido(ped.id_pedido);
                            refrescarDB();
                            notificar('Pedido cancelado');
                          }}
                        >
                          Cancelar pedido
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 4: PERFIL */}
          {tabCliente === 'PERFIL' && (
            <div className="card">
              <h3>Perfil de Usuario</h3>
              <p style={{ margin: '8px 0' }}><strong>Nombre:</strong> {usuario.nombre}</p>
              {usuario.correo && <p style={{ margin: '8px 0' }}><strong>Correo:</strong> {usuario.correo}</p>}
              <p style={{ margin: '8px 0' }}><strong>Rol:</strong> {usuario.rol}</p>
              <button className="btn btn-outline" style={{ marginTop: 14 }} onClick={handleCerrarSesion}>
                <LogOut size={18} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {/* BARRA DE NAVEGACIÓN INFERIOR CLIENTE */}
        <nav className="bottom-nav">
          <button className={`nav-item ${tabCliente === 'MENU' ? 'active' : ''}`} onClick={() => { setTabCliente('MENU'); setProductoSeleccionado(null); }}>
            <Utensils size={20} /> Menú
          </button>
          <button className={`nav-item ${tabCliente === 'CARRITO' ? 'active' : ''}`} onClick={() => setTabCliente('CARRITO')}>
            <ShoppingCart size={20} /> Carrito
            {carrito.length > 0 && <span className="cart-badge">{carrito.length}</span>}
          </button>
          <button className={`nav-item ${tabCliente === 'PEDIDOS' ? 'active' : ''}`} onClick={() => { refrescarDB(); setTabCliente('PEDIDOS'); }}>
            <ClipboardList size={20} /> Mis Pedidos
          </button>
          <button className={`nav-item ${tabCliente === 'PERFIL' ? 'active' : ''}`} onClick={() => setTabCliente('PERFIL')}>
            <User size={20} /> Perfil
          </button>
        </nav>
      </div>
    );
  }

  // --- FLUJO EXCLUSIVO DE COCINA (Gestión y Seguimiento de Pedidos) ---
  if (usuario.rol === 'COCINA') {
    return (
      <div className="mobile-shell">
        {toast && <div className="toast">{toast}</div>}
        <header className="app-header" style={{ background: 'var(--secondary)' }}>
          <h1><ChefHat size={20} /> Panel de Cocina</h1>
          <button onClick={handleCerrarSesion} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </header>

        <div className="content" style={{ paddingBottom: 24 }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Gestión y Seguimiento de Pedidos</h2>
          {db.PEDIDOS.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No hay pedidos registrados en este momento.
            </div>
          ) : (
            db.PEDIDOS.map(ped => {
              const detalles = db.DETALLE_PEDIDO.filter(d => d.id_pedido === ped.id_pedido);
              return (
                <div key={ped.id_pedido} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>{ped.folio} — {ped.numero_mesa}</strong>
                    <span className={`badge ${ped.estado === 'ENTREGADO' ? 'badge-green' : 'badge-orange'}`}>{ped.estado}</span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{ped.fecha_hora}</p>

                  <div style={{ marginBottom: 10 }}>
                    {detalles.map(d => {
                      const prod = db.PRODUCTOS.find(p => p.id_producto === d.id_producto);
                      return (
                        <div key={d.id_detalle} style={{ padding: '4px 0', borderBottom: '1px dashed var(--border)' }}>
                          <strong>{d.cantidad}x {prod ? prod.nombre : 'Producto eliminado'}</strong>
                          {d.notas_especiales && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600 }}>
                              <AlertCircle size={12} style={{ verticalAlign: 'middle' }} /> {d.notas_especiales}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {ped.estado === 'RECIBIDO' && (
                      <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => { actualizarEstadoPedido(ped.id_pedido, 'EN_PREPARACION'); refrescarDB(); notificar('Orden en preparación'); }}>
                        Iniciar Preparación
                      </button>
                    )}
                    {ped.estado === 'EN_PREPARACION' && (
                      <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => { actualizarEstadoPedido(ped.id_pedido, 'LISTO'); refrescarDB(); notificar('Orden lista para entrega'); }}>
                        Marcar como Listo
                      </button>
                    )}
                    {ped.estado === 'LISTO' && (
                      <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => { actualizarEstadoPedido(ped.id_pedido, 'ENTREGADO'); refrescarDB(); notificar('Pedido entregado'); }}>
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- FLUJO EXCLUSIVO DE ADMINISTRADOR ---
  return (
    <div className="mobile-shell">
      {toast && <div className="toast">{toast}</div>}
      <header className="app-header" style={{ background: '#212121' }}>
        <h1><Store size={20} /> Administración</h1>
        <button onClick={handleCerrarSesion} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </header>

      <div className="content">
        {/* VISTA 1: ADMINISTRACIÓN DE CATÁLOGO (ADMIN - RF-05: Crear, Editar, Eliminar, Agotado) */}
        {tabStaff === 'ADMIN_MENU' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.15rem' }}>Gestión de Menú</h2>
              <button className="btn btn-sm btn-primary" onClick={abrirCrearPlatillo}>
                <Plus size={16} /> Nuevo
              </button>
            </div>

            {mostrarFormPlatillo && (
              <div
                className="modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setMostrarFormPlatillo(false);
                }}
              >
                <form className="modal-card" onSubmit={handleGuardarPlatillo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {editandoId ? 'Editar Platillo' : 'Nuevo Platillo'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMostrarFormPlatillo(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="input-group">
                    <label>Nombre del platillo</label>
                    <input className="input" value={formPlatillo.nombre} onChange={e => setFormPlatillo({ ...formPlatillo, nombre: e.target.value })} required />
                  </div>

                  <div className="input-group">
                    <label>Categoría</label>
                    <select className="input" value={formPlatillo.id_categoria} onChange={e => setFormPlatillo({ ...formPlatillo, id_categoria: e.target.value })}>
                      {db.CATEGORIAS.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>Precio ($)</label>
                      <input className="input" type="number" step="0.01" value={formPlatillo.precio} onChange={e => setFormPlatillo({ ...formPlatillo, precio: e.target.value })} required />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>Tiempo prep. (min)</label>
                      <input className="input" type="number" value={formPlatillo.tiempo_prep_min} onChange={e => setFormPlatillo({ ...formPlatillo, tiempo_prep_min: e.target.value })} required />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Descripción breve</label>
                    <input className="input" value={formPlatillo.descripcion} onChange={e => setFormPlatillo({ ...formPlatillo, descripcion: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label>URL de fotografía (opcional)</label>
                    <input className="input" placeholder="https://..." value={formPlatillo.url_imagen} onChange={e => setFormPlatillo({ ...formPlatillo, url_imagen: e.target.value })} />
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setMostrarFormPlatillo(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editandoId ? 'Guardar Cambios' : 'Agregar'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {db.PRODUCTOS.map(prod => (
              <div key={prod.id_producto} className="card">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <img src={prod.url_imagen} alt={prod.nombre} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem' }}>{prod.nombre}</h4>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>${prod.precio.toFixed(2)}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>• {prod.tiempo_prep_min} min</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <button
                    className={`btn btn-sm ${prod.disponible ? 'btn-secondary' : 'btn-outline'}`}
                    onClick={() => {
                      toggleDisponibilidadProducto(prod.id_producto);
                      refrescarDB();
                      notificar(`Estado actualizado: ${prod.nombre}`);
                    }}
                  >
                    {prod.disponible ? 'Disponible' : 'Agotado'}
                  </button>

                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => abrirEditarPlatillo(prod)}
                    title="Editar producto"
                  >
                    <Edit2 size={14} /> Editar
                  </button>

                  <button
                    className="btn btn-sm btn-danger-outline"
                    onClick={() => handleEliminarPlatillo(prod)}
                    title="Eliminar producto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* VISTA 2: REPORTES DE VENTAS (ADMIN - RF-12) */}
        {tabStaff === 'REPORTES' && (() => {
          const pedidosEntregados = db.PEDIDOS.filter(p => p.estado === 'ENTREGADO');
          const pedidosActivos = db.PEDIDOS.filter(p => p.estado !== 'ENTREGADO');

          const totalEntregados = pedidosEntregados.reduce((acc, p) => acc + Number(p.total || 0), 0);
          const totalActivos = pedidosActivos.reduce((acc, p) => acc + Number(p.total || 0), 0);

          return (
            <>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Reporte de Ventas e Historial</h2>

              {/* Tarjeta principal: Solo ventas totales ya realizadas (ENTREGADO) */}
              <div className="card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ventas totales realizadas:</p>
                <h2 style={{ color: 'var(--primary)', fontSize: '1.9rem', margin: '4px 0' }}>${totalEntregados.toFixed(2)}</h2>
                <p style={{ fontSize: '0.85rem' }}>Pedidos entregados: <strong>{pedidosEntregados.length}</strong> de {db.PEDIDOS.length} registrados</p>
              </div>

              {/* Desglose por estado */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div className="card" style={{ flex: 1, marginBottom: 0 }}>
                  <span className="badge badge-green" style={{ marginBottom: 6 }}>Entregados ({pedidosEntregados.length})</span>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>${totalEntregados.toFixed(2)}</h3>
                </div>
                <div className="card" style={{ flex: 1, marginBottom: 0 }}>
                  <span className="badge badge-orange" style={{ marginBottom: 6 }}>Por preparar / activos ({pedidosActivos.length})</span>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>${totalActivos.toFixed(2)}</h3>
                </div>
              </div>

              {/* Historial detallado de pedidos */}
              <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Detalle de Pedidos</h3>
              {db.PEDIDOS.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay pedidos registrados.
                </div>
              ) : (
                db.PEDIDOS.map(ped => (
                  <div key={ped.id_pedido} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{ped.folio}</strong> <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>({ped.numero_mesa})</span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{ped.fecha_hora}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>${Number(ped.total || 0).toFixed(2)}</div>
                      <span className={`badge ${ped.estado === 'ENTREGADO' ? 'badge-green' : 'badge-orange'}`} style={{ marginTop: 4 }}>
                        {ped.estado}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          );
        })()}
        </div>

      {/* BARRA DE NAVEGACIÓN INFERIOR EXCLUSIVA DE ADMINISTRADOR */}
      <nav className="bottom-nav">
        <button className={`nav-item ${tabStaff === 'ADMIN_MENU' ? 'active' : ''}`} onClick={() => setTabStaff('ADMIN_MENU')}>
          <Store size={20} /> Menú
        </button>
        <button
          className={`nav-item ${tabStaff === 'REPORTES' ? 'active' : ''}`}
          onClick={() => {
            refrescarDB();
            setTabStaff('REPORTES');
          }}
        >
          <ClipboardList size={20} /> Reportes
        </button>
      </nav>
    </div>
  );
}