// src/database/db.js
const DB_KEY = 'saborexpress_db_v2';

const initialData = {
  USUARIOS: [
    { id_usuario: 1, nombre: 'Juan Pérez', correo: 'cliente@demo.com', password_hash: 'hash_1234', telefono: '3121234567', rol: 'CLIENTE' },
    { id_usuario: 2, nombre: 'Chef Carlos', correo: 'cocina@demo.com', password_hash: 'hash_1234', telefono: '3129876543', rol: 'COCINA' },
    { id_usuario: 3, nombre: 'Admin General', correo: 'admin@demo.com', password_hash: 'hash_1234', telefono: '3125550000', rol: 'ADMIN' }
  ],
  CATEGORIAS: [
    { id_categoria: 1, nombre: 'Entradas', orden_visual: 1 },
    { id_categoria: 2, nombre: 'Platos Fuertes', orden_visual: 2 },
    { id_categoria: 3, nombre: 'Bebidas', orden_visual: 3 },
    { id_categoria: 4, nombre: 'Postres', orden_visual: 4 }
  ],
  PRODUCTOS: [
    { id_producto: 1, id_categoria: 1, nombre: 'Guacamole Tradicional', descripcion: 'Aguacate fresco molcajeteado con totopos caseros.', precio: 85.00, tiempo_prep_min: 10, url_imagen: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400', disponible: true },
    { id_producto: 2, id_categoria: 2, nombre: 'Tacos al Pastor', descripcion: 'Carne adobada al trompo con piña, cilantro y cebolla.', precio: 30.00, tiempo_prep_min: 15, url_imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', disponible: true },
    { id_producto: 3, id_categoria: 2, nombre: 'Hamburguesa Artesanal', descripcion: 'Carne de res 200g, queso cheddar, tocino y papas gajo.', precio: 145.00, tiempo_prep_min: 20, url_imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', disponible: true },
    { id_producto: 4, id_categoria: 2, nombre: 'Arrachera a la Parrilla', descripcion: 'Corte suave 250g acompañado de cebollitas y frijoles.', precio: 195.00, tiempo_prep_min: 25, url_imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', disponible: false },
    { id_producto: 5, id_categoria: 3, nombre: 'Limonada Mineral', descripcion: 'Jugo de limón recién exprimido con agua mineral fría.', precio: 38.00, tiempo_prep_min: 5, url_imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', disponible: true },
    { id_producto: 6, id_categoria: 4, nombre: 'Pastel de Tres Leches', descripcion: 'Rebanada esponjosa bañada en tres leches y canela.', precio: 65.00, tiempo_prep_min: 5, url_imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', disponible: true }
  ],
  PEDIDOS: [
    { id_pedido: 101, id_usuario: 1, folio: 'PED-101', modalidad: 'EN_MESA', numero_mesa: 'Mesa 4', subtotal: 148.00, total: 148.00, estado: 'EN_PREPARACION', fecha_hora: new Date().toLocaleString() }
  ],
  DETALLE_PEDIDO: [
    { id_detalle: 1, id_pedido: 101, id_producto: 2, cantidad: 1, precio_unitario: 110.00, notas_especiales: 'Sin cebolla' },
    { id_detalle: 2, id_pedido: 101, id_producto: 5, cantidad: 1, precio_unitario: 38.00, notas_especiales: 'Con poco hielo' }
  ]
};

export const getDB = () => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

export const saveDB = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Autenticación (RF-01, RF-02)
export const loginUser = (correo, password) => {
  const db = getDB();
  return db.USUARIOS.find(u => u.correo.toLowerCase() === correo.toLowerCase()) || null;
};

export const registerCliente = (nombre, correo, telefono, password) => {
  const db = getDB();
  if (db.USUARIOS.some(u => u.correo.toLowerCase() === correo.toLowerCase())) {
    throw new Error('El correo ya está registrado');
  }
  const nuevoId = db.USUARIOS.length > 0 ? Math.max(...db.USUARIOS.map(u => u.id_usuario)) + 1 : 1;
  const nuevo = {
    id_usuario: nuevoId,
    nombre,
    correo,
    telefono,
    password_hash: 'hash_' + password,
    rol: 'CLIENTE'
  };
  db.USUARIOS.push(nuevo);
  saveDB(db);
  return nuevo;
};

// CRUD Productos (RF-03 a RF-05)
export const toggleDisponibilidadProducto = (id_producto) => {
  const db = getDB();
  const prod = db.PRODUCTOS.find(p => p.id_producto === id_producto);
  if (prod) {
    prod.disponible = !prod.disponible;
    saveDB(db);
  }
  return db.PRODUCTOS;
};

export const addProducto = (productoData) => {
  const db = getDB();
  const nuevo = {
    id_producto: Date.now(),
    id_categoria: Number(productoData.id_categoria),
    nombre: productoData.nombre,
    descripcion: productoData.descripcion,
    precio: Number(productoData.precio),
    tiempo_prep_min: Number(productoData.tiempo_prep_min) || 15,
    url_imagen: productoData.url_imagen?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    disponible: true
  };
  db.PRODUCTOS.push(nuevo);
  saveDB(db);
  return nuevo;
};

export const updateProducto = (id_producto, productoData) => {
  const db = getDB();
  const index = db.PRODUCTOS.findIndex(p => p.id_producto === id_producto);
  if (index !== -1) {
    db.PRODUCTOS[index] = {
      ...db.PRODUCTOS[index],
      id_categoria: Number(productoData.id_categoria),
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: Number(productoData.precio),
      tiempo_prep_min: Number(productoData.tiempo_prep_min) || 15,
      url_imagen: productoData.url_imagen?.trim() || db.PRODUCTOS[index].url_imagen
    };
    saveDB(db);
  }
  return db.PRODUCTOS;
};

export const deleteProducto = (id_producto) => {
  const db = getDB();
  db.PRODUCTOS = db.PRODUCTOS.filter(p => p.id_producto !== id_producto);
  saveDB(db);
  return db.PRODUCTOS;
};

// Crear Pedido (RF-09, RN-01, RN-04)
export const crearPedido = ({ id_usuario, modalidad, numero_mesa, carrito }) => {
  if (!carrito || carrito.length === 0) throw new Error('El carrito está vacío');
  if (modalidad === 'EN_MESA' && !numero_mesa.trim()) throw new Error('Ingresa el número de mesa');

  const db = getDB();
  const nextId = db.PEDIDOS.length > 0 ? Math.max(...db.PEDIDOS.map(p => p.id_pedido)) + 1 : 101;
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const nuevoPedido = {
    id_pedido: nextId,
    id_usuario: id_usuario || null,
    folio: `PED-${nextId}`,
    modalidad,
    numero_mesa: modalidad === 'EN_MESA' ? `Mesa ${numero_mesa}` : 'Para llevar',
    subtotal: total,
    total,
    estado: 'RECIBIDO',
    fecha_hora: new Date().toLocaleString()
  };

  db.PEDIDOS.unshift(nuevoPedido);

  carrito.forEach((item, idx) => {
    db.DETALLE_PEDIDO.push({
      id_detalle: Date.now() + idx,
      id_pedido: nextId,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      notas_especiales: item.notas || ''
    });
  });

  saveDB(db);
  return nuevoPedido;
};

// Actualizar estado en Cocina (RF-10, RF-11)
export const actualizarEstadoPedido = (id_pedido, nuevoEstado) => {
  const db = getDB();
  const pedido = db.PEDIDOS.find(p => p.id_pedido === id_pedido);
  if (pedido) {
    pedido.estado = nuevoEstado;
    saveDB(db);
  }
  return db.PEDIDOS;
};

// Cancelar pedido si aún está RECIBIDO (RN-03)
export const cancelarPedido = (id_pedido) => {
  const db = getDB();
  const pedido = db.PEDIDOS.find(p => p.id_pedido === id_pedido);
  if (pedido && pedido.estado === 'RECIBIDO') {
    db.PEDIDOS = db.PEDIDOS.filter(p => p.id_pedido !== id_pedido);
    db.DETALLE_PEDIDO = db.DETALLE_PEDIDO.filter(d => d.id_pedido !== id_pedido);
    saveDB(db);
    return true;
  }
  return false;
};

// Persistencia del Carrito de Compras por Usuario (aún fuera de la app o tras cerrar sesión)
const CART_PREFIX = 'saborexpress_cart_';

export const getCarritoUsuario = (id_usuario) => {
  const key = `${CART_PREFIX}${id_usuario || 'guest'}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveCarritoUsuario = (id_usuario, carrito) => {
  const key = `${CART_PREFIX}${id_usuario || 'guest'}`;
  localStorage.setItem(key, JSON.stringify(carrito));
};